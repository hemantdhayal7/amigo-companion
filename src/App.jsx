import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import FloatingCompanion from './components/FloatingCompanion';
import ScreenShareModal from './components/ScreenShareModal';
import SosCrisisModal from './components/SosCrisisModal';
import SessionControls from './components/SessionControls';
import DailyTargetModal from './components/DailyTargetModal';
import GoalReminderToast from './components/GoalReminderToast';
import EmojiCustomizerModal, { RingCustomizerModal, DEFAULT_MENU_TOOLS } from './components/RingCustomizerModal';
import ConnectModal from './components/ConnectModal';
import DoubtModal from './components/DoubtModal';
import CabbageLogo from './components/CabbageLogo';
import { sounds } from './utils/audio';
import { PeerCallManager } from './utils/webrtc';
import confetti from 'canvas-confetti';
import { setupHitTestSync, updateInteractiveRegions, showAppWindow, hideAppWindow, resizeWindowForScreenshare } from './utils/hitTesting';
import { parseInviteOrServerLink } from './utils/linkParser';

const INITIAL_TASKS = [
  { id: '1', text: 'Review Chapter 3 formulas & summary notes', completed: true },
  { id: '2', text: 'Solve 10 practice exam questions', completed: false },
  { id: '3', text: 'Draft certification summary sheet', completed: false },
];

const DEFAULT_EMOJIS = ['🎉', '🥳', '❤️', '🥰', '🔥', '☕', '✨', '👏'];

export default function App() {
  // Read room and server from URL query params (or localStorage / default)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const rawServer = urlParams?.get('server') || localStorage.getItem('study_server_url') || 'http://localhost:4000';
  const parsedServerLink = parseInviteOrServerLink(rawServer);

  const initialServer = parsedServerLink?.serverUrl || 'http://localhost:4000';
  const initialRoom = urlParams?.get('room') || parsedServerLink?.roomId || localStorage.getItem('study_room_id') || 'our-study-date';
  const initialSecret = urlParams?.get('secret') || parsedServerLink?.roomSecret || localStorage.getItem('study_room_secret') || 'date2026';

  const [roomId, setRoomId] = useState(initialRoom);
  const [roomSecret, setRoomSecret] = useState(initialSecret);
  const [serverUrl, setServerUrl] = useState(initialServer);
  const [deviceId] = useState(() => {
    let id = typeof window !== 'undefined' ? localStorage.getItem('study_device_id') : null;
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10);
      if (typeof window !== 'undefined') localStorage.setItem('study_device_id', id);
    }
    return id;
  });
  const [nickname, setNickname] = useState(() => localStorage.getItem('study_nickname') || 'Learner');
  const [avatar, setAvatar] = useState('🧠');
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
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

  // Customizable Menu Ring Slots (8 sectors)
  const [menuTools, setMenuTools] = useState(() => {
    try {
      const saved = localStorage.getItem('study_menu_tools');
      return saved ? JSON.parse(saved) : DEFAULT_MENU_TOOLS;
    } catch {
      return DEFAULT_MENU_TOOLS;
    }
  });

  // One ring at a time: 'menu' | 'emoji' | 'none'
  const [ringMode, setRingMode] = useState(() => {
    return localStorage.getItem('study_ring_mode') || 'menu';
  });

  // Resizable Circle scale: 0.7 to 1.6
  const [companionScale, setCompanionScale] = useState(() => {
    try {
      const saved = localStorage.getItem('study_companion_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [customizerTab, setCustomizerTab] = useState('emojis'); // 'emojis' | 'menu'

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
  const hasAutoStartedVideoRef = useRef(false);

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

  const [members, setMembers] = useState(() => [
    { id: 'self', name: nickname || 'You', avatar: avatar || '🧠', status: 'studying', isSharing: false, target, tasks, progress },
  ]);

  const [activeModal, setActiveModal] = useState('none'); // 'none' | 'screen' | 'sos' | 'session' | 'target' | 'customizer' | 'connect'
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peerStream, setPeerStream] = useState(null);
  const [peerSharingUser, setPeerSharingUser] = useState(null);
  const [screenViewMode, setScreenViewMode] = useState('theater'); // 'compact' | 'theater' | 'fullscreen' | 'minimized'
  const [currentStatus, setCurrentStatus] = useState('studying');
  const [sosAlert, setSosAlert] = useState(null);

  // Display Mode: Always kept on screen! No auto-hiding after 5 seconds.
  const [displayMode, setDisplayMode] = useState('pinned');
  const isKeepOnScreen = true;

  // Active call or screen share state: keeps companion on screen continuously
  const isCallActive = Boolean(
    isVideoOn ||
    isPeerVideoOn ||
    isMicOn ||
    isPeerMicOn ||
    isSharingScreen ||
    peerSharingUser ||
    peerStream ||
    remoteCamStream
  );

  const [popoutEvent, setPopoutEvent] = useState(null);
  const [isPopoutVisible, setIsPopoutVisible] = useState(true);

  const triggerAutoPopout = useCallback((eventData) => {
    setPopoutEvent({
      ...eventData,
      id: Date.now(),
    });
    setIsPopoutVisible(true);
    showAppWindow();
  }, []);

  // Ensure Amigo always stays on screen and never auto-hides
  useEffect(() => {
    localStorage.setItem('amigo_display_mode', 'pinned');
    setIsPopoutVisible(true);
    showAppWindow();
  }, []);

  // Check if running in Tauri / Electron native floating app or standard browser
  const isTauri =
    typeof window !== 'undefined' &&
    Boolean(
      window.__TAURI_INTERNALS__ ||
      window.__TAURI__ ||
      window.__IS_DESKTOP__ ||
      navigator.userAgent.includes('Electron')
    );

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
          setTimeout(() => {
            setShowNudgeToast(true);
            sounds.playGentleAlert();
            triggerAutoPopout({
              title: '10-Min Target Check-in ⏰',
              detail: 'How is your goal progressing?',
              icon: '🎯',
            });
          }, 0);
          return reminderInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [reminderInterval, triggerAutoPopout]);

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

  // Unlock browser audio autoplay policy on any user interaction gesture
  useEffect(() => {
    const unlockAudio = () => {
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
        remoteAudioRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Connect to signaling server with aggressive auto-reconnect
  useEffect(() => {
    setAuthError(null);
    const socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep retrying automatically on computer reboot / network reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      randomizationFactor: 0.1,
      timeout: 8000,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true',
      },
    });
    socketRef.current = socket;

    // Initialize WebRTC PeerCallManager
    peerCallManagerRef.current = new PeerCallManager({
      socket,
      onRemoteStreamUpdate: (stream) => {
        const videoTracks = stream.getVideoTracks().filter((t) => t.readyState === 'live');
        const audioTracks = stream.getAudioTracks().filter((t) => t.readyState === 'live');
        console.log('[App] Remote media stream updated — videoTracks:', videoTracks.length, 'audioTracks:', audioTracks.length);

        // Separate Video-Only stream for <video> elements so GStreamer/WebKitGTK/Chromium never stalls waiting for muted audio sync
        setRemoteCamStream((prevStream) => {
          if (!prevStream && videoTracks.length === 0) return null;
          if (!prevStream) {
            const fresh = new MediaStream(videoTracks);
            setPeerStream(fresh);
            return fresh;
          }
          const prevTrackIds = prevStream.getVideoTracks().map((t) => t.id).sort().join(',');
          const newTrackIds = videoTracks.map((t) => t.id).sort().join(',');
          if (prevTrackIds === newTrackIds) {
            return prevStream;
          }
          const fresh = new MediaStream(videoTracks);
          setPeerStream(fresh);
          return fresh;
        });

        // Separate Audio-Only stream for <audio> element so remote voice plays immediately even when camera is off
        if (remoteAudioRef.current) {
          if (audioTracks.length > 0) {
            const currentAudioStream = remoteAudioRef.current.srcObject;
            const currentTrackId = currentAudioStream?.getAudioTracks()[0]?.id;
            if (currentTrackId !== audioTracks[0].id) {
              remoteAudioRef.current.srcObject = new MediaStream(audioTracks);
              remoteAudioRef.current.play().catch(() => {});
            }
          } else {
            remoteAudioRef.current.srcObject = null;
          }
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
      setSocketId(socket.id);
      setAuthError(null);
      // Pre-fetch dynamic TURN relay credentials from server
      socket.emit('get-ice-servers', (resp) => {
        if (resp?.iceServers && peerCallManagerRef.current) {
          peerCallManagerRef.current.updateIceServers(resp.iceServers);
        }
      });
      fetch(`${serverUrl}/api/webrtc/ice-servers`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.iceServers && peerCallManagerRef.current) {
            peerCallManagerRef.current.updateIceServers(data.iceServers);
          }
        })
        .catch(() => {});
      socket.emit('join-room', {
        roomId,
        secret: roomSecret,
        user: {
          deviceId,
          name: nickname,
          avatar,
          status: currentStatus,
          target,
          tasks,
          progress,
          isMicOn: Boolean(peerCallManagerRef.current?.isMicOn),
          isVideoOn: Boolean(peerCallManagerRef.current?.isVideoOn),
        },
      });
    });

    socket.on('auth-error', (err) => {
      console.error('[Security Alert] Auth error from server:', err);
      setAuthError(err.message || 'Access denied');
      setIsConnected(false);
      setSocketId(null);
      setMembers([{ id: 'self', name: nickname, avatar, status: 'studying', isSharing: false, target, tasks, progress }]);
      sounds.playGentleAlert();
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setSocketId(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      setSocketId(null);
      setMembers([{ id: 'self', name: nickname, avatar, status: 'studying', isSharing: false, target, tasks, progress }]);
    });

    socket.on('room-synced', (data) => {
      setAuthError(null);
      setIsConnected(true);
      setIsSecured(true);
      if (data.self?.id) {
        setSocketId(data.self.id);
      }
      if (data.iceServers && peerCallManagerRef.current) {
        peerCallManagerRef.current.updateIceServers(data.iceServers);
      }
      if (data.members && data.members.length > 0) {
        setMembers(data.members);
        const partner = data.members.find((m) => m.id !== socket.id);
        if (partner && peerCallManagerRef.current) {
          console.log('[App] Existing partner found in room-synced, initiating call to:', partner.id);
          peerCallManagerRef.current.setTargetPeerId(partner.id);
          peerCallManagerRef.current.initiateCallTo(partner.id).catch(console.warn);
          setIsPeerVideoOn(Boolean(partner.isVideoOn));
          setIsPeerMicOn(Boolean(partner.isMicOn));
        }
      }
      if (data.doubts) {
        setDoubts(data.doubts);
      }
    });

    socket.on('user-joined', (newUser) => {
      setMembers((prev) => [...prev.filter((m) => m.id !== newUser.id), newUser]);
      triggerAutoPopout({
        title: `${newUser.name} joined!`,
        detail: 'Study buddy is online',
        icon: newUser.avatar || '🌸',
      });
      if (peerCallManagerRef.current) {
        console.log('[App] Partner joined room, initiating WebRTC connection to:', newUser.id);
        peerCallManagerRef.current.initiateCallTo(newUser.id).catch(console.warn);
        peerCallManagerRef.current.broadcastMediaStatus();
      }
    });

    socket.on('user-left', ({ userId }) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      if (peerSharingUser && peerSharingUser.id === userId) {
        setPeerSharingUser(null);
        setPeerStream(null);
      }
      if (peerCallManagerRef.current) {
        console.log('[App] Partner left room, resetting WebRTC peer connection');
        peerCallManagerRef.current.resetPeerConnection();
      }
      setIsPeerMicOn(false);
      setIsPeerVideoOn(false);
      setRemoteCamStream(null);
      triggerAutoPopout({
        title: 'Study buddy left',
        detail: 'Disconnected from study date',
        icon: '👋',
      });
    });

    socket.on('peer-goal-updated', ({ userId, target: peerTarget, tasks: peerTasks, progress: peerProg }) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, target: peerTarget, tasks: peerTasks, progress: peerProg } : m))
      );
      triggerAutoPopout({
        title: 'Goal Progress Updated! 🎯',
        detail: `${peerTarget || 'Milestone'} (${peerProg}%)`,
        icon: '🎯',
      });
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
      triggerAutoPopout({
        title: `${sender} reacted!`,
        detail: `${emoji} reaction received`,
        icon: emoji,
      });
    });

    socket.on('peer-screen-status', ({ name, isSharing }) => {
      if (isSharing) {
        setPeerSharingUser(name);
        setActiveModal('screen');
        setScreenViewMode('theater');
        resizeWindowForScreenshare('theater');
        sounds.playCelebration();
        triggerAutoPopout({
          title: `${name} is sharing screen! 🖥️`,
          detail: 'Screen share opened in Theater mode',
          icon: '🖥️',
        });
      } else {
        setPeerSharingUser(null);
        setPeerStream(null);
        setActiveModal((prev) => (prev === 'screen' ? 'none' : prev));
        resizeWindowForScreenshare('compact');
      }
    });

    socket.on('sos-alert-received', (data) => {
      sounds.playGentleAlert();
      setSosAlert(data);
      triggerAutoPopout({
        title: `SOS from ${data.senderName || 'Peer'}! 🚨`,
        detail: data.note || 'Urgent lifeline check-in',
        icon: '🚨',
      });
    });

    // Ephemeral Doubts Sync
    socket.on('doubt-created', (newDoubt) => {
      setDoubts((prev) => [newDoubt, ...prev.filter((d) => d.id !== newDoubt.id)]);
      sounds.playPop();
      triggerAutoPopout({
        title: 'New Doubt Asked 💡',
        detail: newDoubt.question,
        icon: '💡',
      });
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
      triggerAutoPopout({
        title: 'Task Checked Off! 🎉',
        detail: `Progress: ${newProg}% complete`,
        icon: '✅',
      });
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

  // Auto-start local camera once connected so both users can see each other immediately
  useEffect(() => {
    if (!isConnected) {
      hasAutoStartedVideoRef.current = false;
      return;
    }

    if (!hasAutoStartedVideoRef.current && !isVideoOn) {
      hasAutoStartedVideoRef.current = true;
      console.log('[App] Auto-starting camera for face-to-face study session...');
      handleToggleVideo().catch((err) => {
        console.warn('[App] Auto-start video error:', err);
      });
    }
  }, [isConnected]);

  // When partner's video stream is detected, ensure our camera is active if not already
  useEffect(() => {
    if (isPeerVideoOn && !isVideoOn && !hasAutoStartedVideoRef.current) {
      hasAutoStartedVideoRef.current = true;
      handleToggleVideo().catch((err) => {
        console.warn('[App] Partner video detected, auto-starting local camera:', err);
      });
    }
  }, [isPeerVideoOn, isVideoOn]);

  // Emoji & Ring customization handlers
  const handleSaveEmojis = (newEmojis) => {
    setQuickEmojis(newEmojis);
    try {
      localStorage.setItem('study_quick_emojis', JSON.stringify(newEmojis));
    } catch {}
  };

  const handleSaveMenuTools = (newTools) => {
    setMenuTools(newTools);
    try {
      localStorage.setItem('study_menu_tools', JSON.stringify(newTools));
    } catch {}
  };

  const handleChangeRingMode = (mode) => {
    setRingMode(mode);
    try {
      localStorage.setItem('study_ring_mode', mode);
    } catch {}
  };

  const handleChangeScale = (newScale) => {
    const clamped = Math.max(0.7, Math.min(1.6, Number(newScale.toFixed(2))));
    setCompanionScale(clamped);
    try {
      localStorage.setItem('study_companion_scale', clamped.toString());
    } catch {}
  };

  const handleResetDefaults = () => {
    setQuickEmojis(DEFAULT_EMOJIS);
    setMenuTools(DEFAULT_MENU_TOOLS);
    setCompanionScale(1.0);
    setRingMode('menu');
    try {
      localStorage.setItem('study_quick_emojis', JSON.stringify(DEFAULT_EMOJIS));
      localStorage.setItem('study_menu_tools', JSON.stringify(DEFAULT_MENU_TOOLS));
      localStorage.setItem('study_companion_scale', '1');
      localStorage.setItem('study_ring_mode', 'menu');
    } catch {}
  };

  const handleWatchScreen = () => {
    setActiveModal('screen');
    setScreenViewMode('theater');
    resizeWindowForScreenshare('theater');
    sounds.playPop();
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
      let stream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
      }

      setLocalStream(stream);
      setIsSharingScreen(true);
      setActiveModal('screen');
      setScreenViewMode('theater');
      resizeWindowForScreenshare('theater');

      // Pipe through WebRTC to partner!
      if (peerCallManagerRef.current) {
        await peerCallManagerRef.current.startScreenShare(stream);
      }

      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share canceled or not permitted:', err);
    }
  };

  // Stop Screen Share
  const handleStopScreenShare = async () => {
    if (peerCallManagerRef.current) {
      await peerCallManagerRef.current.stopScreenShare();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setIsSharingScreen(false);
    if (!peerSharingUser) {
      setActiveModal((prev) => (prev === 'screen' ? 'none' : prev));
    }
    resizeWindowForScreenshare('compact');
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
          ? "w-full h-full flex flex-col justify-end items-center p-2 select-none relative"
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

      {/* Discrete Top Menu Bar Pill (Shown when Amigo is tucked into Menu Mode) */}
      {!isPopoutVisible && !isKeepOnScreen && !isCallActive && (
        <div
          data-amigo-interactive="true"
          onClick={() => {
            setIsPopoutVisible(true);
            triggerAutoPopout({
              title: 'Amigo Opened',
              detail: 'Click to interact with dial',
              icon: '🥬',
            });
          }}
          className="fixed top-4 right-6 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-white/20 shadow-2xl backdrop-blur-2xl cursor-pointer hover:border-emerald-400 hover:scale-105 transition-all text-xs font-semibold select-none group"
          title="Amigo in Menu Mode (Click to open or wait for updates)"
        >
          <CabbageLogo size={18} animated />
          <span className="font-extrabold tracking-tight text-emerald-400 text-[11px]">AMIGO</span>
          <span className="text-[9px] text-white/60 font-mono">| ⏱️ Menu Mode</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono font-bold">
            {progress}%
          </span>
        </div>
      )}

      {/* Floating / Side-Docked Companion Widget */}
      <div
        id="amigo-floating-container"
        className={`w-full mx-auto pointer-events-auto transition-all duration-300 flex flex-col items-center ${
          activeModal === 'screen' && (screenViewMode === 'theater' || screenViewMode === 'fullscreen')
            ? 'max-w-6xl px-4'
            : 'max-w-[360px]'
        } ${
          !isPopoutVisible && !isKeepOnScreen && !isCallActive
            ? 'opacity-0 pointer-events-none scale-95 select-none'
            : 'opacity-100 scale-100'
        }`}
        style={
          activeModal === 'screen' && (screenViewMode === 'theater' || screenViewMode === 'fullscreen')
            ? { position: 'relative' }
            : getContainerStyle()
        }
      >
        {/* Peer Screen Sharing Notification Banner (1-Click to view) */}
        {peerSharingUser && activeModal !== 'screen' && (
          <div data-amigo-interactive="true" className="w-full mb-2.5">
            <button
              onClick={() => {
                setActiveModal('screen');
                setScreenViewMode('theater');
                resizeWindowForScreenshare('theater');
              }}
              className="w-full py-2.5 px-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xl shadow-indigo-600/30 border border-indigo-400/40 animate-pulse transition active:scale-95"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>🖥️ {peerSharingUser} is sharing screen</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1">
                View Screen ⤢
              </span>
            </button>
          </div>
        )}
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
                const parsed = parseInviteOrServerLink(newServer);
                const cleanServer = parsed?.serverUrl || newServer.trim().replace(/\/+$/, '');
                setServerUrl(cleanServer);
                if (parsed?.roomId) setRoomId(parsed.roomId);
                if (parsed?.roomSecret) setRoomSecret(parsed.roomSecret);
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

        {/* Ring & Menu Customizer Modal */}
        {activeModal === 'customizer' && (
          <div data-amigo-interactive="true" className="mb-2">
            <RingCustomizerModal
              initialTab={customizerTab}
              emojis={quickEmojis}
              menuTools={menuTools}
              onSaveEmojis={handleSaveEmojis}
              onSaveMenuTools={handleSaveMenuTools}
              onResetDefaults={handleResetDefaults}
              onSendEmoji={handleSendEmoji}
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
          <div data-amigo-interactive="true" className="w-full mb-2">
            <ScreenShareModal
              isSharing={isSharingScreen}
              localStream={localStream}
              peerStream={peerStream}
              remoteCamStream={remoteCamStream}
              peerSharingUser={peerSharingUser}
              onStartShare={handleStartScreenShare}
              onStopShare={handleStopScreenShare}
              onClose={() => {
                setActiveModal('none');
                resizeWindowForScreenshare('compact');
              }}
              viewMode={screenViewMode}
              onChangeViewMode={(mode) => setScreenViewMode(mode)}
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
          selfUser={{ id: socketId || socketRef.current?.id || 'self', name: nickname, avatar }}
          isSharingScreen={isSharingScreen}
          peerSharingUser={peerSharingUser}
          target={target}
          progress={progress}
          onOpenTargetModal={() => setActiveModal(activeModal === 'target' ? 'none' : 'target')}
          onOpenConnectModal={() => setActiveModal('connect')}
          onOpenDoubtModal={() => setActiveModal(activeModal === 'doubt' ? 'none' : 'doubt')}
          doubtsCount={doubts.length}
          onSendEmoji={handleSendEmoji}
          floatingEmojis={floatingEmojis}
          quickEmojis={quickEmojis}
          menuTools={menuTools}
          ringMode={ringMode}
          onChangeRingMode={handleChangeRingMode}
          companionScale={companionScale}
          onChangeScale={handleChangeScale}
          onOpenCustomizer={(tab) => {
            setCustomizerTab(tab || 'emojis');
            setActiveModal('customizer');
          }}
          onOpenScreenShare={() => {
            if (activeModal === 'screen') {
              setActiveModal('none');
              resizeWindowForScreenshare('compact');
            } else {
              setActiveModal('screen');
              setScreenViewMode('theater');
              resizeWindowForScreenshare('theater');
            }
          }}
          onWatchScreen={handleWatchScreen}
          onOpenSession={() => setActiveModal(activeModal === 'session' ? 'none' : 'session')}
          onLeaveSession={handleLeaveSession}
          sosAlert={sosAlert}
          onDismissSosAlert={() => setSosAlert(null)}
          onBrowserDragStart={handleBrowserDragStart}
          dockPosition={dockPosition}
          onToggleDock={handleToggleDock}
          theme={theme}
          onSetTheme={setTheme}
          onResetDefaults={handleResetDefaults}
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
          displayMode={displayMode}
          popoutEvent={popoutEvent}
          isCallActive={isCallActive}
          onHideToTray={hideAppWindow}
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

        {/* Off-screen audio element to play remote partner's voice without being suspended by WebKit display:none */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{
            position: 'fixed',
            top: -9999,
            left: -9999,
            width: 1,
            height: 1,
            opacity: 0.01,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
