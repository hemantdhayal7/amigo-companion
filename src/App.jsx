import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import FloatingCompanion from './components/FloatingCompanion';
import ScreenShareModal from './components/ScreenShareModal';
import SosCrisisModal from './components/SosCrisisModal';
import SessionControls from './components/SessionControls';
import DailyTargetModal from './components/DailyTargetModal';
import GoalReminderToast from './components/GoalReminderToast';
import EmojiCustomizerModal from './components/EmojiCustomizerModal';
import ConnectModal from './components/ConnectModal';
import DoubtModal from './components/DoubtModal';
import { sounds } from './utils/audio';
import { PeerCallManager } from './utils/webrtc';
import confetti from 'canvas-confetti';
import { setupHitTestSync, updateInteractiveRegions } from './utils/hitTesting';

const INITIAL_TASKS = [
  { id: '1', text: 'Review Chapter 3 formulas & summary notes', completed: true },
  { id: '2', text: 'Solve 10 practice exam questions', completed: false },
  { id: '3', text: 'Draft certification summary sheet', completed: false },
];

const DEFAULT_EMOJIS = ['🎉', '🥳', '❤️', '🥰', '🔥', '☕', '✨', '👏'];

export default function App() {
  // Read room and server from URL query params (or localStorage / default)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRoom = urlParams?.get('room') || localStorage.getItem('study_room_id') || 'our-study-date';
  const initialSecret = urlParams?.get('secret') || localStorage.getItem('study_room_secret') || 'date2026';
  const initialServer = urlParams?.get('server') || localStorage.getItem('study_server_url') || 'http://localhost:4000';

  const [roomId, setRoomId] = useState(initialRoom);
  const [roomSecret, setRoomSecret] = useState(initialSecret);
  const [serverUrl, setServerUrl] = useState(initialServer);
  const [nickname, setNickname] = useState(() => localStorage.getItem('study_nickname') || 'Learner');
  const [avatar, setAvatar] = useState('🧠');
  const [isConnected, setIsConnected] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isSecured, setIsSecured] = useState(false);

  // Active Ephemeral Doubts (3-hour auto-purge)
  const [doubts, setDoubts] = useState([]);

  // 3 Themes: 'dark' | 'white' | 'blush'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('study_theme') || 'dark';
  });

  // Customizable Quick Reactions
  const [quickEmojis, setQuickEmojis] = useState(() => {
    try {
      const saved = localStorage.getItem('study_quick_emojis');
      return saved ? JSON.parse(saved) : DEFAULT_EMOJIS;
    } catch {
      return DEFAULT_EMOJIS;
    }
  });

  // Real-time Voice and Video Call State
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [localCamStream, setLocalCamStream] = useState(null);
  const [isPeerMicOn, setIsPeerMicOn] = useState(false);
  const [isPeerVideoOn, setIsPeerVideoOn] = useState(false);
  const [remoteCamStream, setRemoteCamStream] = useState(null);
  const [mediaPermissionError, setMediaPermissionError] = useState(null);

  const peerCallManagerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Screen Docking state: 'right' (docked right next to screen) | 'left' | 'free' (floating)
  const [dockPosition, setDockPosition] = useState('right');

  // Target and To-Do list state with LocalStorage persistence
  const [target, setTarget] = useState(() => {
    return localStorage.getItem('study_today_target') || 'Complete exam prep milestone & problem set';
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('study_today_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Calculate progress %
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // 10-Minute Target Hover Check-in state
  const [reminderInterval, setReminderInterval] = useState(10); // minutes
  const [secondsToNextNudge, setSecondsToNextNudge] = useState(10 * 60);
  const [showNudgeToast, setShowNudgeToast] = useState(false);

  const [members, setMembers] = useState([
    { id: 'self', name: 'You', avatar: '🧠', status: 'studying', isSharing: false, target: 'Complete exam prep milestone', progress: 33 },
    { id: 'peer1', name: 'Alex (Study Date)', avatar: '🌸', status: 'studying', isSharing: false, target: 'Finish Chapter 4 Physics & Quiz', progress: 75 },
    { id: 'peer2', name: 'Maya', avatar: '📚', status: 'break', isSharing: false, target: 'Read 2 research papers', progress: 50 },
  ]);

  const [activeModal, setActiveModal] = useState('none'); // 'none' | 'screen' | 'sos' | 'session' | 'target' | 'customizer' | 'connect'
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peerStream, setPeerStream] = useState(null);
  const [peerSharingUser, setPeerSharingUser] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('studying');
  const [sosAlert, setSosAlert] = useState(null);

  // Check if running in Tauri native app or standard browser
  const isTauri = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

  // Browser dragging coordinates fallback
  const [browserPos, setBrowserPos] = useState({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 420) : 100,
    y: typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 560) : 100,
  });

  const handleBrowserDragStart = (e) => {
    if (isTauri) return;

    // Smoothly calculate current position from bounding rect so there is NO jumping
    const containerEl = document.getElementById('amigo-floating-container');
    const rect = containerEl ? containerEl.getBoundingClientRect() : null;

    const currentX = rect ? rect.left : browserPos.x;
    const currentY = rect ? rect.top : browserPos.y;

    if (dockPosition !== 'free') {
      setDockPosition('free');
      setBrowserPos({ x: currentX, y: currentY });
    }

    const startX = e.clientX;
    const startY = e.clientY;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setBrowserPos({
        x: Math.max(10, Math.min(window.innerWidth - 320, currentX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 180, currentY + dy)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleToggleDock = () => {
    setDockPosition((prev) => {
      if (prev === 'right') return 'free';
      if (prev === 'free') return 'left';
      return 'right';
    });
  };

  const socketRef = useRef(null);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('study_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('study_quick_emojis', JSON.stringify(quickEmojis));
  }, [quickEmojis]);

  useEffect(() => {
    localStorage.setItem('study_room_id', roomId);
    localStorage.setItem('study_room_secret', roomSecret);
    localStorage.setItem('study_server_url', serverUrl);
    localStorage.setItem('study_nickname', nickname);

    // Keep URL query params in sync for easy sharing and refresh persistence
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('room', roomId);
        u.searchParams.set('secret', roomSecret);
        u.searchParams.set('server', serverUrl);
        window.history.replaceState(null, '', u.toString());
      } catch {
        // Ignored in non-browser env
      }
    }
  }, [roomId, roomSecret, serverUrl, nickname]);

  useEffect(() => {
    localStorage.setItem('study_today_target', target);
    localStorage.setItem('study_today_tasks', JSON.stringify(tasks));
  }, [target, tasks]);

  // 10-Minute Hover / Nudge Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToNextNudge((prev) => {
        if (prev <= 1) {
          setShowNudgeToast(true);
          sounds.playGentleAlert();
          return reminderInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [reminderInterval]);

  // Set up native hit testing sync so transparent areas let clicks pass through to background apps
  useEffect(() => {
    const cleanup = setupHitTestSync();
    return cleanup;
  }, []);

  useEffect(() => {
    updateInteractiveRegions();
  }, [
    activeModal,
    showNudgeToast,
    sosAlert,
    authError,
    mediaPermissionError,
    dockPosition,
    browserPos,
    doubts.length,
    members.length,
  ]);

  // Connect to signaling server with aggressive auto-reconnect
  useEffect(() => {
    setAuthError(null);
    const socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep retrying automatically on computer reboot / network reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      randomizationFactor: 0.1,
      timeout: 5000,
    });
    socketRef.current = socket;

    // Initialize WebRTC PeerCallManager
    peerCallManagerRef.current = new PeerCallManager({
      socket,
      onRemoteStreamUpdate: (stream) => {
        console.log('[App] Remote media stream updated, tracks:', stream.getTracks().length);
        setRemoteCamStream(new MediaStream(stream.getTracks()));
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
      },
      onPeerMediaStatus: ({ isPeerMicOn: pMic, isPeerVideoOn: pVid }) => {
        setIsPeerMicOn(pMic);
        setIsPeerVideoOn(pVid);
      },
      onError: (errMsg) => {
        setMediaPermissionError(errMsg);
        sounds.playGentleAlert();
      },
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to Amigo 🎉 signaling server at ${serverUrl}`);
      setIsConnected(true);
      setAuthError(null);
      socket.emit('join-room', {
        roomId,
        secret: roomSecret,
        user: { name: nickname, avatar, status: currentStatus, target, tasks, progress },
      });
    });

    socket.on('auth-error', (err) => {
      console.error('[Security Alert] Auth error from server:', err);
      setAuthError(err.message || 'Access denied');
      setIsConnected(false);
      sounds.playGentleAlert();
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('room-synced', (data) => {
      setAuthError(null);
      setIsConnected(true);
      setIsSecured(true);
      if (data.members && data.members.length > 0) {
        setMembers(data.members);
      }
      if (data.doubts) {
        setDoubts(data.doubts);
      }
    });

    socket.on('user-joined', (newUser) => {
      setMembers((prev) => [...prev.filter((m) => m.id !== newUser.id), newUser]);
    });

    socket.on('user-left', ({ userId }) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      if (peerSharingUser && peerSharingUser.id === userId) {
        setPeerSharingUser(null);
        setPeerStream(null);
      }
    });

    socket.on('peer-goal-updated', ({ userId, target: peerTarget, tasks: peerTasks, progress: peerProg }) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, target: peerTarget, tasks: peerTasks, progress: peerProg } : m))
      );
    });

    socket.on('emoji-received', ({ id, emoji, sender, isFountain, direction }) => {
      // Avoid duplicate local spawn if sent by self
      if (sender === nickname || sender === 'You') return;
      spawnFloatingEmoji(id, emoji, sender, isFountain ?? true, direction ?? 'down');
      if (['🎉', '🥳', '✨', '👏', '❤️', '🥰', '🔥', '🥬'].includes(emoji)) {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999999,
        });
      }
    });

    socket.on('peer-screen-status', ({ name, isSharing }) => {
      if (isSharing) {
        setPeerSharingUser(name);
      } else {
        setPeerSharingUser(null);
        setPeerStream(null);
      }
    });

    socket.on('sos-alert-received', (data) => {
      sounds.playGentleAlert();
      setSosAlert(data);
    });

    // Ephemeral Doubts Sync
    socket.on('doubt-created', (newDoubt) => {
      setDoubts((prev) => [newDoubt, ...prev.filter((d) => d.id !== newDoubt.id)]);
      sounds.playPop();
    });

    socket.on('doubt-deleted', ({ doubtId }) => {
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    });

    socket.on('doubt-expired', ({ doubtId }) => {
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    });

    socket.on('doubt-ai-status', ({ doubtId, status, error }) => {
      setDoubts((prev) =>
        prev.map((d) => (d.id === doubtId ? { ...d, aiStatus: status, aiError: error } : d))
      );
    });

    socket.on('doubt-ai-answered', ({ doubtId, answer, status }) => {
      setDoubts((prev) =>
        prev.map((d) => (d.id === doubtId ? { ...d, aiAnswer: answer, aiStatus: status } : d))
      );
      sounds.playCelebration();
    });

    return () => {
      peerCallManagerRef.current?.destroy();
      socket.disconnect();
    };
  }, [serverUrl, roomId, roomSecret, nickname, avatar]);

  // Broadcast goal & progress update to room
  const broadcastGoal = (newTarget, newTasks, newProg) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-goal', {
        target: newTarget,
        tasks: newTasks,
        progress: newProg,
      });
    }
  };

  // Target & Task Handlers
  const handleUpdateTarget = (newTarget) => {
    setTarget(newTarget);
    broadcastGoal(newTarget, tasks, progress);
  };

  const handleAddTask = (text) => {
    const updated = [...tasks, { id: Date.now().toString(), text, completed: false }];
    const newProg = Math.round((updated.filter((t) => t.completed).length / updated.length) * 100);
    setTasks(updated);
    broadcastGoal(target, updated, newProg);
  };

  const handleToggleTask = (taskId) => {
    const taskBefore = tasks.find((t) => t.id === taskId);
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const newProg = Math.round((updated.filter((t) => t.completed).length / updated.length) * 100);
    setTasks(updated);
    broadcastGoal(target, updated, newProg);

    if (taskBefore && !taskBefore.completed) {
      spawnFloatingEmoji(null, '🎉', 'You', true, 'down');
      sounds.playCelebration();
    }
  };

  const handleDeleteTask = (taskId) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    const newProg = updated.length > 0 ? Math.round((updated.filter((t) => t.completed).length / updated.length) * 100) : 0;
    setTasks(updated);
    broadcastGoal(target, updated, newProg);
  };

  // Microphone toggle with real-time WebRTC audio streaming
  const handleToggleMic = async () => {
    try {
      setMediaPermissionError(null);
      if (!peerCallManagerRef.current) return;
      const res = await peerCallManagerRef.current.toggleMic();
      setIsMicOn(res.isMicOn);
      sounds.playPop();
    } catch (err) {
      console.warn('Microphone toggle failed:', err);
    }
  };

  // Video Camera toggle with real-time WebRTC video streaming
  const handleToggleVideo = async () => {
    try {
      setMediaPermissionError(null);
      if (!peerCallManagerRef.current) return;
      const res = await peerCallManagerRef.current.toggleVideo();
      setIsVideoOn(res.isVideoOn);
      setLocalCamStream(res.isVideoOn ? res.stream : null);
      if (res.isVideoOn) {
        sounds.playCelebration();
      } else {
        sounds.playPop();
      }
    } catch (err) {
      console.warn('Camera toggle failed:', err);
    }
  };

  // Emoji customization handlers
  const handleSaveEmojis = (newEmojis) => {
    setQuickEmojis(newEmojis);
  };

  const handleResetEmojiDefaults = () => {
    setQuickEmojis(DEFAULT_EMOJIS);
  };

  // Helper to spawn whole-screen floating emoji cascade
  const spawnFloatingEmoji = (id, emoji, sender, isFountain = true, direction = 'down') => {
    sounds.playPop();
    const count = isFountain ? 8 : 1;
    const baseId = id || `${Date.now()}-${Math.random()}`;
    const newItems = [];

    for (let i = 0; i < count; i++) {
      newItems.push({
        id: `${baseId}-${i}`,
        emoji,
        sender,
        direction: direction || 'down',
        showSender: i === 0,
        x: Math.floor(Math.random() * 80) + 10,
        delay: i * 85,
        duration: 3.2 + Math.random() * 0.8,
        size: i === 0 ? 'text-5xl' : i % 2 === 0 ? 'text-4xl' : 'text-3xl',
      });
    }

    setFloatingEmojis((prev) => [...prev, ...newItems]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => !newItems.some((ni) => ni.id === e.id)));
    }, 4500);
  };

  // Send an emoji to study mates with instant local celebration
  const handleSendEmoji = (emoji, options = {}) => {
    const isFountain = options.isFountain ?? true;
    const direction = options.direction ?? 'down';

    // 1. Instant local visual & audio celebration
    spawnFloatingEmoji(null, emoji, 'You', isFountain, direction);
    sounds.playPop();

    // Trigger instant festive confetti for joyful reactions
    if (['🎉', '🥳', '✨', '👏', '❤️', '🥰', '🔥', '🥬'].includes(emoji)) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        zIndex: 999999,
      });
    }

    // 2. Broadcast to study partner
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-emoji', { emoji, isFountain, direction });
    }
  };

  // Start Screen Share
  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true,
      });

      setLocalStream(stream);
      setIsSharingScreen(true);

      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };

      if (socketRef.current && isConnected) {
        socketRef.current.emit('screen-share-status', { isSharing: true });
      }
    } catch (err) {
      console.warn('Screen share canceled or not permitted:', err);
    }
  };

  // Stop Screen Share
  const handleStopScreenShare = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setIsSharingScreen(false);
    if (socketRef.current && isConnected) {
      socketRef.current.emit('screen-share-status', { isSharing: false });
    }
  };

  // Handle Crisis SOS
  const handleTriggerSos = (note) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('trigger-sos', { note });
    } else {
      setSosAlert({
        senderName: 'You',
        note,
      });
    }
  };

  // Handle Status change
  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-status', { status });
    }
  };

  // Leave Session
  const handleLeaveSession = () => {
    if (isSharingScreen) {
      handleStopScreenShare();
    }
    if (isMicOn && audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      setIsMicOn(false);
    }
    if (isVideoOn && localCamStream) {
      localCamStream.getTracks().forEach((t) => t.stop());
      setIsVideoOn(false);
    }
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-room');
    }
    alert('You have left the study session. Keep up the great work and take care!');
    setActiveModal('none');
  };

  // Ephemeral Doubt & Local AI Handlers (3-Hour Self-Destruct)
  const handleCreateDoubt = ({ image, question }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('create-doubt', { image, question });
    }
  };

  const handleDeleteDoubt = (doubtId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('delete-doubt', { doubtId });
    }
  };

  const handleAskDoubtAi = (doubtId, prompt) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('ask-doubt-ai', { doubtId, prompt });
    }
  };

  const handleAskQuickAi = (prompt) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        return reject(new Error('Signaling server not connected. Connect both devices first.'));
      }
      const reqId = `${Date.now()}-${Math.random()}`;
      const timeout = setTimeout(() => {
        socketRef.current?.off('quick-ai-result', onResult);
        reject(new Error('AI explanation timed out'));
      }, 45000);

      const onResult = (data) => {
        if (data.requestId === reqId) {
          clearTimeout(timeout);
          socketRef.current?.off('quick-ai-result', onResult);
          if (data.success) {
            resolve(data.answer);
          } else {
            reject(new Error(data.error || 'Failed to generate answer'));
          }
        }
      };

      socketRef.current.on('quick-ai-result', onResult);
      socketRef.current.emit('ask-quick-ai', { prompt, requestId: reqId });
    });
  };

  const getContainerStyle = () => {
    if (isTauri) return {};
    if (dockPosition === 'right') {
      return {
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        maxHeight: '96vh',
      };
    }
    if (dockPosition === 'left') {
      return {
        position: 'fixed',
        left: '16px',
        bottom: '16px',
        maxHeight: '96vh',
      };
    }
    return {
      position: 'fixed',
      left: `${browserPos.x}px`,
      top: `${browserPos.y}px`,
    };
  };

  return (
    <div
      className={
        isTauri
          ? "w-full h-full flex flex-col justify-end p-2 select-none relative"
          : "fixed inset-0 pointer-events-none select-none z-50 overflow-hidden"
      }
    >
      {/* Whole-Screen Floating Reaction Shower Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className={`${
              item.direction === 'down' ? 'shower-down-item' : 'floating-emoji-item'
            } flex flex-col items-center`}
            style={{
              left: `${item.x}%`,
              ...(item.direction === 'down' ? { top: '-40px' } : { bottom: '20px' }),
              animationDelay: `${item.delay || 0}ms`,
              animationDuration: `${item.duration || 3.6}s`,
            }}
          >
            <span
              className={`${
                item.size || 'text-4xl'
              } filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] select-none transition-transform`}
            >
              {item.emoji}
            </span>
            {item.showSender && (
              <span className="text-[10px] font-medium bg-black/80 text-white/95 px-2 py-0.5 rounded-full mt-1 border border-white/15 shadow-xl backdrop-blur-md">
                {item.sender}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Floating / Side-Docked Companion Widget */}
      <div
        id="amigo-floating-container"
        className="w-full max-w-sm pointer-events-auto"
        style={getContainerStyle()}
      >
        {/* 10-Minute Target Hover Check-in Toast */}
        {showNudgeToast && (
          <div data-amigo-interactive="true" className="mb-2">
            <GoalReminderToast
              target={target}
              tasks={tasks}
              progress={progress}
              onToggleTask={handleToggleTask}
              onOpenTargetModal={() => {
                setShowNudgeToast(false);
                setActiveModal('target');
              }}
              onSnooze={() => {
                setShowNudgeToast(false);
                setSecondsToNextNudge(reminderInterval * 60);
                sounds.playCelebration();
              }}
              onDismiss={() => setShowNudgeToast(false)}
            />
          </div>
        )}

        {/* Connect 2 Computers Modal */}
        {activeModal === 'connect' && (
          <div data-amigo-interactive="true" className="mb-2">
            <ConnectModal
              roomId={roomId}
              onSaveRoomId={(newRoom) => {
                setRoomId(newRoom);
                sounds.playPop();
              }}
              roomSecret={roomSecret}
              onSaveRoomSecret={(newSecret) => {
                setRoomSecret(newSecret);
                sounds.playPop();
              }}
              serverUrl={serverUrl}
              onSaveServerUrl={(newServer) => {
                setServerUrl(newServer);
                sounds.playPop();
              }}
              nickname={nickname}
              onSaveNickname={(newName) => {
                setNickname(newName);
                sounds.playPop();
              }}
              onClose={() => setActiveModal('none')}
              theme={theme}
              authError={authError}
              isConnected={isConnected}
              membersCount={members.length}
            />
          </div>
        )}

        {/* Emoji Customizer Modal */}
        {activeModal === 'customizer' && (
          <div data-amigo-interactive="true" className="mb-2">
            <EmojiCustomizerModal
              emojis={quickEmojis}
              onSaveEmojis={handleSaveEmojis}
              onResetDefaults={handleResetEmojiDefaults}
              onClose={() => setActiveModal('none')}
              theme={theme}
            />
          </div>
        )}

        {/* Modals rendered directly adjacent to widget */}
        {activeModal === 'target' && (
          <div data-amigo-interactive="true" className="mb-2">
            <DailyTargetModal
              target={target}
              tasks={tasks}
              onUpdateTarget={handleUpdateTarget}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              members={members}
              selfId={socketRef.current?.id || 'self'}
              reminderInterval={reminderInterval}
              onSetReminderInterval={setReminderInterval}
              secondsToNextNudge={secondsToNextNudge}
              onClose={() => setActiveModal('none')}
            />
          </div>
        )}

        {activeModal === 'screen' && (
          <div data-amigo-interactive="true" className="mb-2">
            <ScreenShareModal
              isSharing={isSharingScreen}
              localStream={localStream}
              peerStream={peerStream}
              peerSharingUser={peerSharingUser}
              onStartShare={handleStartScreenShare}
              onStopShare={handleStopScreenShare}
              onClose={() => setActiveModal('none')}
            />
          </div>
        )}

        {activeModal === 'session' && (
          <div data-amigo-interactive="true" className="mb-2">
            <SessionControls
              currentStatus={currentStatus}
              onStatusChange={handleStatusChange}
              onLeaveSession={handleLeaveSession}
              onClose={() => setActiveModal('none')}
            />
          </div>
        )}

        {activeModal === 'sos' && (
          <div data-amigo-interactive="true" className="mb-2">
            <SosCrisisModal
              onTriggerSos={handleTriggerSos}
              onClose={() => setActiveModal('none')}
            />
          </div>
        )}

        {/* The Floating / Side-Docked Companion Widget */}
        <FloatingCompanion
          roomId={roomId}
          roomSecret={roomSecret}
          authError={authError}
          isConnected={isConnected}
          members={members}
          selfUser={{ name: nickname, avatar }}
          isSharingScreen={isSharingScreen}
          target={target}
          progress={progress}
          onOpenTargetModal={() => setActiveModal(activeModal === 'target' ? 'none' : 'target')}
          onOpenConnectModal={() => setActiveModal('connect')}
          onOpenDoubtModal={() => setActiveModal(activeModal === 'doubt' ? 'none' : 'doubt')}
          doubtsCount={doubts.length}
          onSendEmoji={handleSendEmoji}
          floatingEmojis={floatingEmojis}
          quickEmojis={quickEmojis}
          onOpenCustomizer={() => setActiveModal('customizer')}
          onOpenScreenShare={() => setActiveModal(activeModal === 'screen' ? 'none' : 'screen')}
          onOpenSos={() => setActiveModal('sos')}
          onOpenSession={() => setActiveModal(activeModal === 'session' ? 'none' : 'session')}
          onLeaveSession={handleLeaveSession}
          sosAlert={sosAlert}
          onDismissSosAlert={() => setSosAlert(null)}
          onBrowserDragStart={handleBrowserDragStart}
          dockPosition={dockPosition}
          onToggleDock={handleToggleDock}
          theme={theme}
          onSetTheme={setTheme}
          isMicOn={isMicOn}
          isVideoOn={isVideoOn}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          localCamStream={localCamStream}
          isPeerMicOn={isPeerMicOn}
          isPeerVideoOn={isPeerVideoOn}
          remoteCamStream={remoteCamStream}
          mediaPermissionError={mediaPermissionError}
          onDismissMediaError={() => setMediaPermissionError(null)}
        />

        {/* Ephemeral Doubt Hub Modal (3-Hour Self-Destruct & Local Gemma AI) */}
        <DoubtModal
          isOpen={activeModal === 'doubt'}
          onClose={() => setActiveModal('none')}
          theme={theme}
          doubts={doubts}
          onCreateDoubt={handleCreateDoubt}
          onDeleteDoubt={handleDeleteDoubt}
          onAskDoubtAi={handleAskDoubtAi}
          onAskQuickAi={handleAskQuickAi}
          selfName={nickname}
          partnerName={
            members.find((m) => m.id !== 'self' && m.id !== socketRef.current?.id)?.name ||
            'Study Partner'
          }
        />

        {/* Hidden audio element to play remote partner's voice */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );
}
