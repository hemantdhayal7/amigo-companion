import React, { useState, useRef, useEffect } from 'react';
import {
  ScreenShare,
  HeartHandshake,
  Target,
  Smile,
  Heart,
  Move,
  Mic,
  MicOff,
  Video,
  VideoOff,
  EyeOff,
  Sun,
  Moon,
  Flower2,
  Lock,
  Palette,
  CheckCircle2,
  HelpCircle,
  GripHorizontal,
  ShieldAlert,
  Minimize2,
  Users,
  Plus,
  Sparkles,
  Settings,
  Sliders,
  RotateCcw,
  Maximize2,
  Star,
  Link2,
  Layers,
} from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import CabbageLogo from './CabbageLogo';
import { sounds } from '../utils/audio';
import { setForceInteractive } from '../utils/hitTesting';
import { AVAILABLE_MENU_TOOLS, DEFAULT_MENU_TOOLS, DEFAULT_EMOJIS } from './RingCustomizerModal';

// Helper to generate mathematically exact SVG donut segment path
function describeDonutSegment(cx, cy, rIn, rOut, startAngleDeg, endAngleDeg) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const startRad = toRad(startAngleDeg);
  const endRad = toRad(endAngleDeg);

  const x1 = cx + rOut * Math.cos(startRad);
  const y1 = cy + rOut * Math.sin(startRad);
  const x2 = cx + rOut * Math.cos(endRad);
  const y2 = cy + rOut * Math.sin(endRad);

  const x3 = cx + rIn * Math.cos(endRad);
  const y3 = cy + rIn * Math.sin(endRad);
  const x4 = cx + rIn * Math.cos(startRad);
  const y4 = cy + rIn * Math.sin(startRad);

  const angleDiff = endAngleDeg - startAngleDeg;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

export default function FloatingCompanion({
  roomId,
  roomSecret,
  authError,
  isConnected,
  members,
  selfUser,
  isSharingScreen,
  peerSharingUser = null,
  target,
  progress,
  onOpenTargetModal,
  onSendEmoji,
  floatingEmojis,
  quickEmojis = DEFAULT_EMOJIS,
  menuTools = DEFAULT_MENU_TOOLS,
  ringMode = 'menu', // 'menu' | 'emoji' | 'none'
  onChangeRingMode = () => {},
  companionScale = 1.0,
  onChangeScale = () => {},
  onOpenCustomizer,
  onOpenScreenShare,
  onWatchScreen,
  onOpenSos,
  onOpenSession,
  onLeaveSession,
  sosAlert,
  onDismissSosAlert,
  onBrowserDragStart,
  dockPosition,
  onToggleDock,
  onOpenConnectModal,
  // Doubt Hub & Local AI props
  onOpenDoubtModal = () => {},
  doubtsCount = 0,
  // Theme props
  theme = 'dark',
  onSetTheme,
  onResetDefaults = () => {},
  // Mic & Video props
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  localCamStream,
  isPeerMicOn = false,
  isPeerVideoOn = false,
  remoteCamStream = null,
  mediaPermissionError = null,
  onDismissMediaError = () => {},
  displayMode = 'autopop',
  onToggleDisplayMode = () => {},
  popoutEvent = null,
  popoutCountdown = 5,
  isCallActive = false,
  onPinToScreen = () => {},
  onHideToTray = () => {},
  onMouseEnter = () => {},
  onMouseLeave = () => {},
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCabbageBouncing, setIsCabbageBouncing] = useState(false);
  const [isOptionsDrawerOpen, setIsOptionsDrawerOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const localVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const dualLocalVideoRef = useRef(null);
  const dualRemoteVideoRef = useRef(null);

  const [faceToFaceMode, setFaceToFaceMode] = useState(false);
  const [isSwappedVideo, setIsSwappedVideo] = useState(false);

  const hasRemoteVideo = Boolean(
    remoteCamStream &&
    remoteCamStream.getVideoTracks &&
    remoteCamStream.getVideoTracks().some((t) => t.readyState === 'live')
  );

  const isPartnerPresenting = Boolean(peerSharingUser);

  const showRemote = Boolean(
    !isPartnerPresenting &&
    (isPeerVideoOn || hasRemoteVideo) &&
    remoteCamStream &&
    remoteCamStream.getVideoTracks &&
    remoteCamStream.getVideoTracks().length > 0
  );

  // Synchronize dual face-to-face video elements
  useEffect(() => {
    if (dualLocalVideoRef.current && localCamStream) {
      if (dualLocalVideoRef.current.srcObject !== localCamStream) {
        dualLocalVideoRef.current.srcObject = localCamStream;
      }
      if (isVideoOn) {
        dualLocalVideoRef.current.play().catch(() => {});
      }
    }
  }, [localCamStream, isVideoOn, faceToFaceMode]);

  useEffect(() => {
    if (dualRemoteVideoRef.current && remoteCamStream) {
      if (dualRemoteVideoRef.current.srcObject !== remoteCamStream) {
        dualRemoteVideoRef.current.srcObject = remoteCamStream;
      }
      if (isPeerVideoOn || hasRemoteVideo) {
        dualRemoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [remoteCamStream, isPeerVideoOn, hasRemoteVideo, faceToFaceMode]);

  // Attach local webcam stream
  useEffect(() => {
    if (localVideoRef.current && localCamStream) {
      localVideoRef.current.muted = true;
      localVideoRef.current.playsInline = true;
      if (localVideoRef.current.srcObject !== localCamStream) {
        localVideoRef.current.srcObject = localCamStream;
      }
      if (isVideoOn) {
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [localCamStream, isVideoOn, showRemote, isSwappedVideo]);

  // Attach pip video stream
  useEffect(() => {
    if (pipVideoRef.current) {
      pipVideoRef.current.muted = true;
      pipVideoRef.current.playsInline = true;
      const pipStream = isSwappedVideo ? remoteCamStream : localCamStream;
      if (pipStream && pipVideoRef.current.srcObject !== pipStream) {
        pipVideoRef.current.srcObject = pipStream;
      }
      pipVideoRef.current.play().catch(() => {});
    }
  }, [localCamStream, remoteCamStream, isSwappedVideo, showRemote, isVideoOn]);

  // Attach remote partner's webcam stream and guarantee instant playback resumption
  useEffect(() => {
    if (remoteVideoRef.current && remoteCamStream) {
      remoteVideoRef.current.muted = true;
      remoteVideoRef.current.playsInline = true;
      if (remoteVideoRef.current.srcObject !== remoteCamStream) {
        remoteVideoRef.current.srcObject = remoteCamStream;
      }
      if (isPeerVideoOn || hasRemoteVideo) {
        remoteVideoRef.current.play().catch((err) => {
          console.debug('[FloatingCompanion] Remote video play postponed:', err);
        });
      }
    }
  }, [remoteCamStream, isPeerVideoOn, hasRemoteVideo, showRemote, isSwappedVideo]);

  // Selected date partner: find the real connected peer in the room (no mock Alex and accurately filter local user)
  const selfId = selfUser?.id;
  const selfName = selfUser?.name?.trim()?.toLowerCase();
  const realPartner =
    members.length > 1
      ? members.find(
          (m) =>
            m.id !== 'self' &&
            (!selfId || m.id !== selfId) &&
            (!selfName || m.name?.trim()?.toLowerCase() !== selfName) &&
            m.id !== 'peer1' &&
            m.id !== 'peer2'
        ) ||
        members.find(
          (m) =>
            m.id !== 'self' &&
            (!selfId || m.id !== selfId) &&
            (!selfName || m.name?.trim()?.toLowerCase() !== selfName)
        ) ||
        members.find((m) => m.id !== 'self' && (!selfId || m.id !== selfId))
      : null;
  const datePartner = realPartner || {
    id: 'waiting',
    name: isConnected ? 'Waiting for partner...' : 'Connecting to server...',
    avatar: isConnected ? '⏳' : '📡',
    status: isConnected ? 'waiting' : 'offline',
    target: isConnected ? `Share Room #${roomId} to connect` : 'Connecting to signaling server...',
    progress: 0,
    isWaiting: true,
  };

  const duoProgress = realPartner
    ? Math.round(((progress || 0) + (datePartner.progress || 0)) / 2)
    : progress || 0;

  // Celebration bounce & celebration emoji shower
  const handleCabbageClick = () => {
    setIsCabbageBouncing(true);
    sounds.playCelebration();
    onSendEmoji('🎉', { isFountain: true, direction: 'down' });
    setTimeout(() => setIsCabbageBouncing(false), 600);
  };

  // Right 1-click on Mascot / Center Hub: Amigo celebration bounce & falling celebration emoji rain!
  const handleCenterHubContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleCabbageClick();
    setFeedbackToast('🎉 Amigo Celebrate!');
    setTimeout(() => setFeedbackToast(null), 1600);
  };

  // Interaction gestures on Center Hub / Live Cam:
  // - Left 1 Click  -> Open / Close All Options Circle & Top Menu Bar
  // - Double Click  -> Open / Close Outer Emoji Circle (and ensures middle circle is open)
  // - 4 Taps        -> Vanish all circles & menu bar into pure minimalist camera orb
  const handleCenterHubClick = (e) => {
    e.stopPropagation();
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      const count = clickCountRef.current;
      clickCountRef.current = 0;

      if (count === 1) {
        // Single Click: Cycle between Menu, Emoji, and System rings (1 ring at a time!)
        sounds.playPop();
        let nextMode;
        if (ringMode === 'menu') {
          nextMode = 'emoji';
          setFeedbackToast('🌟 Emoji Reactions Ring');
        } else if (ringMode === 'emoji') {
          nextMode = 'system';
          setFeedbackToast('⚙️ System & Passwords Ring');
        } else if (ringMode === 'system') {
          nextMode = 'menu';
          setFeedbackToast('📋 Menu Tools Ring');
        } else {
          nextMode = 'menu';
          setFeedbackToast('📋 Menu Tools Ring');
        }
        onChangeRingMode(nextMode);
        setTimeout(() => setFeedbackToast(null), 1800);
      } else if (count === 2) {
        // Double Click (2 Taps): Direct toggle between Menu Tools and System
        sounds.playPop();
        const nextMode = ringMode === 'system' ? 'menu' : 'system';
        onChangeRingMode(nextMode);
        setFeedbackToast(nextMode === 'system' ? '⚙️ System & Passwords Ring' : '📋 Menu Tools Ring');
        setTimeout(() => setFeedbackToast(null), 1800);
      } else if (count >= 3) {
        // 3+ Taps: Vanish into pure minimalist camera orb or restore
        sounds.playCelebration();
        const nextMode = ringMode === 'none' ? 'menu' : 'none';
        onChangeRingMode(nextMode);
        setFeedbackToast(nextMode === 'none' ? '🪄 Pure Minimalist Cam Orb' : '✨ Ring Restored');
        setTimeout(() => setFeedbackToast(null), 1800);
      }
    }, 280);
  };

  // Dedicated Drag Button / Handle pointer handler (100% reliable across Linux X11/Wayland and desktop)
  const handleDragButtonMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    e.preventDefault();
    e.stopPropagation();
    setForceInteractive(true);

    if (typeof window !== 'undefined' && window.electronAPI) {
      if (window.electronAPI.startDrag) {
        window.electronAPI.startDrag();
      }

      const targetEl = e.currentTarget || e.target;
      const pointerId = e.pointerId;
      const hasPointerCapture = targetEl && typeof targetEl.setPointerCapture === 'function' && pointerId !== undefined;
      if (hasPointerCapture) {
        try {
          targetEl.setPointerCapture(pointerId);
        } catch {}
      }

      let lastScreenX = e.screenX;
      let lastScreenY = e.screenY;

      const onPointerMove = (moveEvt) => {
        const dx = moveEvt.screenX - lastScreenX;
        const dy = moveEvt.screenY - lastScreenY;
        if (dx !== 0 || dy !== 0) {
          lastScreenX = moveEvt.screenX;
          lastScreenY = moveEvt.screenY;
          if (window.electronAPI.dragMove) {
            window.electronAPI.dragMove(dx, dy);
          } else if (window.electronAPI.moveWindow) {
            window.electronAPI.moveWindow(dx, dy);
          }
        }
      };

      const onPointerUp = (upEvt) => {
        if (hasPointerCapture && upEvt && upEvt.pointerId !== undefined) {
          try {
            targetEl.releasePointerCapture(upEvt.pointerId);
          } catch {}
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        if (window.electronAPI.endDrag) {
          window.electronAPI.endDrag();
        }
        setForceInteractive(false);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerUp, { passive: true });
      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('mouseup', onPointerUp, { passive: true });
      return;
    }

    if (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__)) {
      try {
        const appWindow = getCurrentWindow();
        appWindow.startDragging();
        return;
      } catch (err) {
        console.warn('Tauri startDragging fallback:', err);
      }
    }

    if (onBrowserDragStart) {
      onBrowserDragStart(e);
    }
  };

  // Ambient drag handler - no-op so buttons and dials never accidentally drag
  const handleDragMouseDown = () => {};

  // Theme styling helpers
  const isWhite = theme === 'white';
  const isBlush = theme === 'blush';

  const isSystemRingOpen = ringMode === 'system';
  const isMenuRingOpen = ringMode === 'menu';
  const isEmojiRingOpen = ringMode === 'emoji';
  const isRingOpen = ringMode !== 'none';

  // Dynamic widget outer diameter: exactly 248px for a single ring, 116px for pure cam orb
  const dialDiameter = isRingOpen ? 248 : 116;

  // 8 Options in the Ring (45 degrees each)
  const dividerAngles = [-112.5, -67.5, -22.5, 22.5, 67.5, 112.5, 157.5, 202.5];

  // Dynamically build 8 sectors from menuTools
  const currentMenuTools = Array.isArray(menuTools) && menuTools.length === 8 ? menuTools : DEFAULT_MENU_TOOLS;

  const optionsSectors = currentMenuTools.map((toolId, idx) => {
    const angle = -90 + idx * 45;
    const start = -112.5 + idx * 45;
    const end = -67.5 + idx * 45;

    switch (toolId) {
      case 'drag':
        return {
          id: 'drag',
          label: 'DRAG',
          icon: <GripHorizontal className="w-3.5 h-3.5" />,
          angle,
          start,
          end,
          tooltip: 'Hold & Drag to move Amigo',
          onClick: onToggleDock,
          onMouseDown: handleDragButtonMouseDown,
          onPointerDown: handleDragButtonMouseDown,
          active: false,
          isDrag: true,
        };
      case 'mic':
        return {
          id: 'mic',
          label: 'MIC',
          icon: isMicOn ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <MicOff className="w-3.5 h-3.5 opacity-75" />
          ),
          angle,
          start,
          end,
          tooltip: isMicOn ? 'Microphone Live (Click to Mute)' : 'Microphone Muted (Click to Unmute)',
          onClick: onToggleMic,
          active: isMicOn,
          activeColor: 'emerald',
          extraBadge: isPeerMicOn && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
          ),
        };
      case 'cam':
        return {
          id: 'cam',
          label: 'CAM',
          icon: isVideoOn ? (
            <Video className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <VideoOff className="w-3.5 h-3.5 opacity-75" />
          ),
          angle,
          start,
          end,
          tooltip: isVideoOn ? 'Camera Active (Click to Turn Off)' : 'Camera Off (Click to Turn On)',
          onClick: onToggleVideo,
          active: isVideoOn,
          activeColor: 'rose',
        };
      case 'share': {
        const isPartnerPresenting = Boolean(peerSharingUser);
        return {
          id: 'share',
          label: isPartnerPresenting ? 'WATCH' : 'SHARE',
          icon: (
            <ScreenShare
              className={`w-3.5 h-3.5 ${
                isPartnerPresenting ? 'text-cyan-400 animate-pulse' : isSharingScreen ? 'text-cyan-400' : ''
              }`}
            />
          ),
          angle,
          start,
          end,
          tooltip: isPartnerPresenting
            ? `${peerSharingUser} is presenting! Click to Watch Screen`
            : isSharingScreen
            ? 'Screen Share Active (Click to Manage)'
            : 'Share Screen with partner',
          onClick: isPartnerPresenting ? (onWatchScreen || onOpenScreenShare) : onOpenScreenShare,
          active: isSharingScreen || isPartnerPresenting,
          activeColor: 'cyan',
          extraBadge: isPartnerPresenting && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
          ),
        };
      }
      case 'emoji':
        return {
          id: 'emoji',
          label: 'EMOJI',
          icon: <Smile className="w-3.5 h-3.5 text-amber-400" />,
          angle,
          start,
          end,
          tooltip: 'Switch to Emoji Reactions Ring',
          onClick: () => onChangeRingMode('emoji'),
          active: ringMode === 'emoji',
        };
      case 'sos':
        return {
          id: 'sos',
          label: 'SOS',
          icon: <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />,
          angle,
          start,
          end,
          tooltip: 'Caring SOS Check-in & Lifelines',
          onClick: onOpenSos,
          active: Boolean(sosAlert),
          activeColor: 'rose',
        };
      case 'doubt':
        return {
          id: 'doubt',
          label: 'DOUBT',
          icon: <HelpCircle className={`w-3.5 h-3.5 ${doubtsCount > 0 ? 'text-amber-400' : ''}`} />,
          angle,
          start,
          end,
          tooltip: 'Ephemeral Doubt Hub & Local AI (3h Auto-Purge)',
          onClick: onOpenDoubtModal,
          active: doubtsCount > 0,
          activeColor: 'amber',
          extraBadge: doubtsCount > 0 && (
            <span className="min-w-[13px] h-[13px] px-0.5 rounded-full bg-amber-500 border border-white text-white font-mono text-[7px] font-bold flex items-center justify-center shadow-md animate-pulse absolute -top-1 -right-1">
              {doubtsCount}
            </span>
          ),
        };
      case 'target':
        return {
          id: 'target',
          label: `${progress}%`,
          icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
          angle,
          start,
          end,
          tooltip: `Daily Targets & Tasks (${progress}% completed)`,
          onClick: onOpenTargetModal,
          active: progress === 100,
          activeColor: 'emerald',
        };
      case 'dual':
        return {
          id: 'dual',
          label: 'DUAL',
          icon: <Users className="w-3.5 h-3.5 text-indigo-400" />,
          angle,
          start,
          end,
          tooltip: 'Side-by-side Dual Face-to-Face Video Cards',
          onClick: () => setFaceToFaceMode((prev) => !prev),
          active: faceToFaceMode,
          activeColor: 'indigo',
        };
      case 'theme':
        return {
          id: 'theme',
          label: 'THEME',
          icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
          angle,
          start,
          end,
          tooltip: 'Cycle Dial Theme (Dark -> White -> Blush)',
          onClick: () => onSetTheme(theme === 'dark' ? 'white' : theme === 'white' ? 'blush' : 'dark'),
          active: false,
        };
      case 'options':
        return {
          id: 'options',
          label: 'OPTS',
          icon: <Settings className="w-3.5 h-3.5 text-blue-400" />,
          angle,
          start,
          end,
          tooltip: 'Open Options & Customizer Drawer',
          onClick: () => setIsOptionsDrawerOpen((prev) => !prev),
          active: isOptionsDrawerOpen,
          activeColor: 'blue',
        };
      case 'vanish':
        return {
          id: 'vanish',
          label: 'ORB',
          icon: <EyeOff className="w-3.5 h-3.5 text-purple-400" />,
          angle,
          start,
          end,
          tooltip: 'Vanish rings into pure Camera Orb',
          onClick: () => onChangeRingMode('none'),
          active: ringMode === 'none',
        };
      case 'connect':
        return {
          id: 'connect',
          label: 'URL',
          icon: <Link2 className="w-3.5 h-3.5 text-emerald-400" />,
          angle,
          start,
          end,
          tooltip: 'Paste Local Server URL or Change Room',
          onClick: onOpenConnectModal,
          active: false,
        };
      default: {
        const toolMeta = AVAILABLE_MENU_TOOLS[toolId] || { label: toolId?.toUpperCase() || 'TOOL' };
        return {
          id: toolId,
          label: toolMeta.label,
          icon: <Settings className="w-3.5 h-3.5" />,
          angle,
          start,
          end,
          tooltip: toolMeta.name || toolMeta.label,
          onClick: () => setIsOptionsDrawerOpen(true),
          active: false,
        };
      }
    }
  });

  // Ring 3: The Dedicated Outer Fixed System Ring (8 Permanent Controls)
  const systemRingSectors = [
    {
      id: 'fixed-drag',
      label: 'DRAG',
      icon: <GripHorizontal className="w-3.5 h-3.5 text-emerald-400" />,
      angle: -90,
      start: -112.5,
      end: -67.5,
      tooltip: 'Hold & Drag Amigo anywhere on screen',
      onClick: onToggleDock,
      onMouseDown: handleDragButtonMouseDown,
      onPointerDown: handleDragButtonMouseDown,
      active: false,
      isDrag: true,
    },
    {
      id: 'fixed-opts',
      label: 'OPTS',
      icon: <Settings className="w-3.5 h-3.5 text-cyan-400" />,
      angle: -45,
      start: -67.5,
      end: -22.5,
      tooltip: 'Amigo Options, Circle Resizer & Settings Drawer',
      onClick: () => setIsOptionsDrawerOpen((prev) => !prev),
      active: isOptionsDrawerOpen,
      activeColor: 'cyan',
    },
    {
      id: 'fixed-display',
      label: 'DISPLAY',
      icon: (
        <Maximize2
          className={`w-3.5 h-3.5 ${
            isPartnerPresenting ? 'text-cyan-400 animate-pulse' : isSharingScreen ? 'text-indigo-400' : 'text-indigo-300'
          }`}
        />
      ),
      angle: 0,
      start: -22.5,
      end: 22.5,
      tooltip: isPartnerPresenting
        ? `${peerSharingUser} is presenting! Click to Watch on Big Display`
        : 'Open Screen Share on Big Display',
      onClick: isPartnerPresenting ? (onWatchScreen || onOpenScreenShare) : onOpenScreenShare,
      active: Boolean(isPartnerPresenting || isSharingScreen),
      activeColor: 'cyan',
      extraBadge: isPartnerPresenting && (
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
      ),
    },
    {
      id: 'sys-tools',
      label: 'TOOLS',
      icon: <Sliders className="w-3.5 h-3.5 text-indigo-400" />,
      angle: 45,
      start: 22.5,
      end: 67.5,
      tooltip: 'Switch to Menu Tools Ring',
      onClick: () => {
        sounds.playPop();
        onChangeRingMode('menu');
        setFeedbackToast('📋 Menu Tools Ring');
        setTimeout(() => setFeedbackToast(null), 1800);
      },
      active: false,
    },
    {
      id: 'fixed-url',
      label: 'URL/PASS',
      icon: <Link2 className="w-3.5 h-3.5 text-emerald-400" />,
      angle: 90,
      start: 67.5,
      end: 112.5,
      tooltip: 'Paste Server URL, Room Code & Passwords',
      onClick: onOpenConnectModal,
      active: false,
    },
    {
      id: 'fixed-theme',
      label: 'THEME',
      icon: <Palette className="w-3.5 h-3.5 text-pink-400" />,
      angle: 135,
      start: 112.5,
      end: 157.5,
      tooltip: `Cycle Theme: ${theme.toUpperCase()} (Click to change)`,
      onClick: () => {
        sounds.playPop();
        onSetTheme(theme === 'dark' ? 'white' : theme === 'white' ? 'blush' : 'dark');
      },
      active: false,
    },
    {
      id: 'sys-emoji',
      label: 'EMOJI',
      icon: <Smile className="w-3.5 h-3.5 text-amber-400" />,
      angle: 180,
      start: 157.5,
      end: 202.5,
      tooltip: 'Switch to Emoji Reactions Ring',
      onClick: () => {
        sounds.playPop();
        onChangeRingMode('emoji');
        setFeedbackToast('🌟 Emoji Reactions Ring');
        setTimeout(() => setFeedbackToast(null), 1800);
      },
      active: false,
    },
    {
      id: 'fixed-amigo',
      label: 'AMIGO',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-300" />,
      angle: 225,
      start: 202.5,
      end: 247.5,
      tooltip: 'Amigo Celebrate! Bounce & Confetti rain',
      onClick: handleCabbageClick,
      active: isCabbageBouncing,
      activeColor: 'amber',
    },
  ];

  // Emojis for the Emoji Reaction Ring
  const emojiList = quickEmojis && quickEmojis.length > 0 ? quickEmojis : DEFAULT_EMOJIS;

  return (
    <div className="select-none transition-all duration-300 w-full flex flex-col justify-end items-center">
      {/* Active SOS Urgent Banner */}
      {sosAlert && (
        <div data-amigo-interactive="true" className="mb-2 p-3 bg-rose-600/95 border border-rose-300/40 rounded-3xl shadow-2xl text-white backdrop-blur-xl animate-bounce-short flex items-center justify-between gap-3 max-w-sm w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Check on {sosAlert.senderName}</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-normal">Just now</span>
              </div>
              <p className="text-[11px] text-rose-100">{sosAlert.note}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSos}
              className="px-2.5 py-1 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl shadow transition"
            >
              Open Help
            </button>
            <button
              onClick={onDismissSosAlert}
              className="text-white/80 hover:text-white text-xs px-1.5 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Security Auth Error Alert Banner */}
      {authError && (
        <div data-amigo-interactive="true" className="mb-2 p-2.5 bg-rose-600/95 border border-rose-300/40 rounded-3xl shadow-2xl text-white backdrop-blur-xl flex items-center justify-between gap-2 text-xs animate-shake max-w-sm w-full">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
            <div>
              <strong className="block text-[11px]">Security Access Blocked</strong>
              <span className="text-[10px] text-rose-100 leading-tight">{authError}</span>
            </div>
          </div>
          <button
            onClick={onOpenConnectModal}
            className="px-2 py-1 bg-white text-rose-700 hover:bg-rose-50 text-[10px] font-bold rounded-xl shadow shrink-0 transition"
          >
            Fix Passcode
          </button>
        </div>
      )}

      {/* Media Permission Alert Banner */}
      {mediaPermissionError && (
        <div data-amigo-interactive="true" className="mb-2 p-3 bg-amber-600/95 border border-amber-300/40 rounded-3xl shadow-2xl text-white backdrop-blur-xl flex items-start justify-between gap-2 text-xs animate-shake max-w-sm w-full">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-white mt-0.5" />
            <div>
              <strong className="block text-[11px]">Camera / Microphone Notice</strong>
              <span className="text-[10px] text-amber-100 leading-tight block mt-0.5">
                {mediaPermissionError}
              </span>
            </div>
          </div>
          <button
            onClick={onDismissMediaError}
            className="text-white/80 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🟢 CIRCULAR FORMAT: Collapsed Mini Cabbage Orb (Bubble Mode)    */}
      {/* ============================================================== */}
      {isCollapsed ? (
        <div
          data-amigo-interactive="true"
          data-tauri-drag-region
          onMouseDown={handleDragMouseDown}
          className={`relative group cursor-pointer animate-scaleIn select-none ${
            dockPosition === 'free' ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onClick={() => setIsCollapsed(false)}
          title="Click to open Amigo Dial"
        >
          {/* Mini Outer Circular Progress Ring */}
          <div
            className="w-20 h-20 rounded-full relative flex items-center justify-center p-1 shadow-2xl border border-white/20 backdrop-blur-2xl cursor-pointer"
            onClick={() => setIsCollapsed(false)}
          >
            {/* Mini Drag Pill Indicator */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDragButtonMouseDown(e);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleDragButtonMouseDown(e);
              }}
              className="app-drag-pill absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-mono text-[8px] font-bold flex items-center gap-0.5 shadow-md z-30 cursor-grab active:cursor-grabbing border border-white/20 hover:border-emerald-400"
              title="Hold & Drag to move mini orb"
            >
              <GripHorizontal className="w-2.5 h-2.5 text-emerald-400" />
              <span>DRAG</span>
            </div>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={isWhite ? 'rgba(0,0,0,0.06)' : isBlush ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.08)'}
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={isBlush ? '#f43f5e' : '#10b981'}
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 - (duoProgress / 100) * 2 * Math.PI * 42}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Cute Cabbage Mascot in Mini Bubble */}
            <div className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center bg-black/10 dark:bg-white/5 backdrop-blur-md">
              <CabbageLogo size={46} animated />
            </div>

            {/* Duo Progress Percentage Heart Pill */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-md flex items-center gap-0.5 border border-white/40">
              <Heart className="w-2 h-2 fill-white" />
              <span>{duoProgress}%</span>
            </div>

            {/* Live Partner Connection Indicator Dot */}
            <span className="absolute top-0 right-1 flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-white dark:border-slate-900 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>

            {/* Active Doubts Indicator on Mini Orb */}
            {doubtsCount > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
                {doubtsCount}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 🔘 3-TIER CONCENTRIC CIRCULAR RADIAL DIAL                      */
        /* 1: CENTER = BIG CAMERA CIRCLE                                  */
        /* 2: MIDDLE = SMALL OPTIONS CIRCLE                               */
        /* 3: OUTER  = EMOJI ORBIT CIRCLE                                 */
        <div
          data-amigo-interactive="true"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="group/dial flex flex-col items-center select-none relative animate-scaleIn"
        >
          {/* Active Call Banner: Kept continuously on screen for voice/video/screen sharing */}
          {isCallActive && (
            <div className="mb-2 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-400/30 text-[8.5px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md animate-fadeIn z-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE CALL ACTIVE (KEEPING ON SCREEN)</span>
            </div>
          )}

          {/* Gesture Feedback Floating Pill */}
          {feedbackToast && (
            <div className="absolute -top-8 px-3 py-1 rounded-full bg-slate-900/90 text-white font-mono text-[9px] font-bold shadow-2xl border border-white/20 animate-scaleIn z-50 flex items-center gap-1.5 backdrop-blur-2xl">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400 animate-spin-slow" />
              <span>{feedbackToast}</span>
            </div>
          )}

          {/* Subtle Hover Drag Handle when Top Bar is Vanished */}
          {/* ============================================================ */}
          {/* 1. SCREEN SHARE PRESENTING BANNER (1-CLICK WATCH)            */}
          {/* ============================================================ */}
          {peerSharingUser && (
            <div
              data-amigo-interactive="true"
              className="mb-2 p-2 bg-gradient-to-r from-cyan-950/95 to-indigo-950/95 border border-cyan-400/80 rounded-3xl shadow-2xl text-white backdrop-blur-xl flex items-center justify-between gap-3 max-w-sm w-full animate-bounce-short z-50"
            >
              <div className="flex items-center gap-2 pl-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-400/40">
                  <ScreenShare className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold truncate flex items-center gap-1.5">
                    <span>{peerSharingUser}</span>
                    <span className="text-[8px] bg-cyan-500/30 text-cyan-200 px-1 rounded uppercase font-mono">Presenting</span>
                  </div>
                  <p className="text-[9px] text-cyan-200/70 truncate">Screen is actively being shared</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onWatchScreen && onWatchScreen()}
                className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[10px] font-extrabold rounded-full shadow-lg transition cursor-pointer shrink-0 flex items-center gap-1"
              >
                <span>WATCH SCREEN</span>
                <Maximize2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}



          {/* ============================================================ */}
          {/* 3. ELEGANT OPTIONS DRAWER (SETTINGS, SCALE & CUSTOMIZERS)     */}
          {/* ============================================================ */}
          {isOptionsDrawerOpen && (
            <div
              data-amigo-interactive="true"
              className={`mb-2 w-full max-w-[340px] p-3.5 rounded-3xl shadow-2xl backdrop-blur-2xl border transition-all animate-scaleIn select-none z-50 ${
                isWhite
                  ? 'bg-white/95 border-white shadow-slate-300/50 text-slate-800'
                  : isBlush
                  ? 'bg-rose-950/95 border-rose-300/30 shadow-rose-950/50 text-white'
                  : 'bg-slate-900/95 border-white/15 shadow-black/80 text-white'
              }`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <CabbageLogo size={16} animated />
                  <span className="font-extrabold text-[11px] tracking-wider">AMIGO CONTROLS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOptionsDrawerOpen(false)}
                  className="p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-white/10 transition cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* 1. Amigo Room Code & Status */}
              <div className="mb-2.5 p-2 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono opacity-70">Room Code</div>
                  <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                    <span>#{roomId}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsDrawerOpen(false);
                    onOpenConnectModal();
                  }}
                  className="py-1 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-500/30"
                >
                  <Link2 className="w-3 h-3 text-emerald-400" />
                  <span>Paste Server URL / Room</span>
                </button>
              </div>

              {/* 2. Resizable Circle (Companion Size) */}
              <div className="mb-2.5 p-2.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-[10px] mb-1.5 font-mono">
                  <span className="font-bold flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-cyan-400" />
                    <span>Circle Size ({Math.round(companionScale * 100)}%)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeScale(1.0)}
                    className="text-[9px] opacity-60 hover:opacity-100 underline cursor-pointer"
                  >
                    Reset 100%
                  </button>
                </div>
                {/* Presets */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {[
                    { label: 'S (80%)', scale: 0.8 },
                    { label: 'M (100%)', scale: 1.0 },
                    { label: 'L (125%)', scale: 1.25 },
                    { label: 'XL (150%)', scale: 1.5 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onChangeScale(preset.scale)}
                      className={`py-1 rounded-lg text-[9px] font-mono font-bold transition cursor-pointer border ${
                        Math.abs(companionScale - preset.scale) < 0.05
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-sm'
                          : 'bg-white/5 hover:bg-white/15 border-white/10 opacity-75'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {/* Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono opacity-60">70%</span>
                  <input
                    type="range"
                    min="0.7"
                    max="1.6"
                    step="0.05"
                    value={companionScale}
                    onChange={(e) => onChangeScale(parseFloat(e.target.value))}
                    className="grow accent-cyan-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] font-mono opacity-60">160%</span>
                </div>
              </div>

              {/* 2.5. Active Ring (1 Ring At A Time) */}
              <div className="mb-2.5 p-2 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10">
                <div className="text-[9px] font-mono font-bold opacity-70 mb-1.5 uppercase tracking-wide">
                  Active Ring (1 Ring At A Time)
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      onChangeRingMode('menu');
                      setFeedbackToast('📋 Menu Tools Ring');
                      setTimeout(() => setFeedbackToast(null), 1800);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                      ringMode === 'menu'
                        ? 'bg-indigo-600 text-white border-indigo-400 font-extrabold shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 opacity-70 text-slate-300'
                    }`}
                  >
                    <Sliders className="w-2.5 h-2.5" />
                    <span>Tools</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      onChangeRingMode('system');
                      setFeedbackToast('⚙️ System & Passwords Ring');
                      setTimeout(() => setFeedbackToast(null), 1800);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                      ringMode === 'system'
                        ? 'bg-emerald-600 text-white border-emerald-400 font-extrabold shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 opacity-70 text-slate-300'
                    }`}
                  >
                    <Settings className="w-2.5 h-2.5" />
                    <span>System</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      onChangeRingMode('emoji');
                      setFeedbackToast('🌟 Emoji Reactions Ring');
                      setTimeout(() => setFeedbackToast(null), 1800);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                      ringMode === 'emoji'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 opacity-70 text-slate-300'
                    }`}
                  >
                    <Smile className="w-2.5 h-2.5" />
                    <span>Emoji</span>
                  </button>
                </div>
              </div>

              {/* 3. Both Rings Customizers */}
              <div className="mb-2.5 p-2 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10">
                <div className="text-[9px] font-mono font-bold opacity-70 mb-1.5 uppercase tracking-wide">
                  Customize Rings
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsDrawerOpen(false);
                      onOpenCustomizer('emojis');
                    }}
                    className="py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Palette className="w-3 h-3 text-amber-400" />
                    <span>Emojis Ring</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsDrawerOpen(false);
                      onOpenCustomizer('menu');
                    }}
                    className="py-1.5 px-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Settings className="w-3 h-3 text-indigo-400" />
                    <span>Menu Ring</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetDefaults && onResetDefaults();
                    setFeedbackToast('↺ Rings Reset to Default');
                    setTimeout(() => setFeedbackToast(null), 1800);
                  }}
                  className="w-full py-0.5 text-[8.5px] font-mono opacity-60 hover:opacity-100 flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Rings to Defaults</span>
                </button>
              </div>

              {/* 4. Theme Selection */}
              <div className="mb-2.5 flex items-center justify-between p-2 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono font-bold opacity-70">Theme</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSetTheme('white')}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      isWhite ? 'bg-white text-slate-900 shadow-sm' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Sun className="w-2.5 h-2.5 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetTheme('dark')}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      !isWhite && !isBlush ? 'bg-slate-800 text-white shadow-sm' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Moon className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetTheme('blush')}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      isBlush ? 'bg-rose-300 text-rose-950 shadow-sm' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Flower2 className="w-2.5 h-2.5 text-rose-500" />
                    <span>Blush</span>
                  </button>
                </div>
              </div>

              {/* 5. Window Controls: Hide to Tray & Dock */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[9.5px]">
                <button
                  type="button"
                  onClick={() => onHideToTray()}
                  className="flex items-center gap-1 py-1 px-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-rose-400 transition cursor-pointer"
                  title="Hide to system tray"
                >
                  <EyeOff className="w-2.5 h-2.5" />
                  <span>Hide to Tray</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleDock && onToggleDock()}
                  className="flex items-center gap-1 py-1 px-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 transition cursor-pointer"
                >
                  <Move className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Dock: {dockPosition}</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. DYNAMIC CIRCULAR RADIAL DIAL (EXACTLY 1 RING AT A TIME)   */}
          {/* CENTER: CAM/MASCOT HUB (116px)                               */}
          {/* RING: EITHER MENU TOOLS, SYSTEM/PASSWORDS, OR EMOJIS (248px) */}
          {/* ============================================================ */}
          <div
            style={{
              width: `${dialDiameter}px`,
              height: `${dialDiameter}px`,
              transform: `scale(${companionScale})`,
              transformOrigin: 'center center',
            }}
            className={`relative rounded-full shrink-0 flex items-center justify-center transition-all duration-300 ease-out ${
              isRingOpen
                ? isWhite
                  ? 'radial-dial-white'
                  : isBlush
                  ? 'radial-dial-blush'
                  : 'radial-dial-dark'
                : ''
            }`}
          >
            {/* SVG Background Layer: Geometry, Wedges, Moats & Progress Ring */}
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] pointer-events-none"
              viewBox="0 0 340 340"
            >
              <defs>
                <linearGradient id="moatHaloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isBlush ? '#fb7185' : '#34d399'} />
                  <stop offset="100%" stopColor={isBlush ? '#f43f5e' : '#10b981'} />
                </linearGradient>
              </defs>

              {/* Outer Rim Border of the Single Ring at r=119 */}
              {isRingOpen && (
                <g className="transition-all duration-300 pointer-events-none">
                  <circle
                    cx="170"
                    cy="170"
                    r="119"
                    stroke={isWhite ? 'rgba(15, 23, 42, 0.1)' : isBlush ? 'rgba(159, 18, 57, 0.12)' : 'rgba(0, 0, 0, 0.7)'}
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <circle
                    cx="170"
                    cy="170"
                    r="120"
                    stroke={isWhite ? 'rgba(255, 255, 255, 0.95)' : isBlush ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth="1"
                    fill="none"
                  />
                </g>
              )}

              {/* MODE 1: SYSTEM & PASSWORDS RING (r=66 to 118, width=52) */}
              <g
                className={`transition-all duration-300 ${
                  isSystemRingOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ transformOrigin: '170px 170px' }}
              >
                {systemRingSectors.map((sec) => {
                  const pathD = describeDonutSegment(170, 170, 66, 118, sec.start, sec.end);
                  return (
                    <path
                      key={sec.id}
                      d={pathD}
                      className={`sector-wedge cursor-pointer transition-colors pointer-events-auto ${sec.isDrag ? 'app-drag-pill' : ''}`}
                      fill={sec.active ? (isWhite ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.28)') : 'transparent'}
                      onClick={(e) => {
                        if (sec.isDrag) {
                          e.stopPropagation();
                        } else {
                          sec.onClick && sec.onClick(e);
                        }
                      }}
                      onMouseDown={(e) => {
                        if (sec.isDrag) {
                          handleDragButtonMouseDown(e);
                        } else {
                          e.stopPropagation();
                        }
                      }}
                      onPointerDown={(e) => {
                        if (sec.isDrag) {
                          handleDragButtonMouseDown(e);
                        }
                      }}
                    >
                      <title>{sec.tooltip}</title>
                    </path>
                  );
                })}

                {/* Hairline Radial Dividers for System Ring */}
                {dividerAngles.map((ang, idx) => {
                  const toRad = (deg) => (deg * Math.PI) / 180;
                  const x1 = 170 + 66 * Math.cos(toRad(ang));
                  const y1 = 170 + 66 * Math.sin(toRad(ang));
                  const x2 = 170 + 118 * Math.cos(toRad(ang));
                  const y2 = 170 + 118 * Math.sin(toRad(ang));
                  return (
                    <g key={`div-sys-${idx}`} className="pointer-events-none">
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isWhite ? 'rgba(15, 23, 42, 0.08)' : isBlush ? 'rgba(159, 18, 57, 0.1)' : 'rgba(0, 0, 0, 0.65)'}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isWhite ? 'rgba(255, 255, 255, 0.95)' : isBlush ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)'}
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </g>

              {/* MODE 2: MENU TOOLS RING (r=66 to 118, width=52) */}
              <g
                className={`transition-all duration-300 ${
                  isMenuRingOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ transformOrigin: '170px 170px' }}
              >
                {optionsSectors.map((sec) => {
                  const pathD = describeDonutSegment(170, 170, 66, 118, sec.start, sec.end);
                  return (
                    <path
                      key={sec.id}
                      d={pathD}
                      className={`sector-wedge cursor-pointer transition-colors pointer-events-auto ${sec.id === 'drag' ? 'app-drag-pill' : ''}`}
                      fill={sec.active ? (isWhite ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.25)') : 'transparent'}
                      onClick={(e) => {
                        if (sec.id === 'drag') {
                          e.stopPropagation();
                        } else {
                          sec.onClick && sec.onClick(e);
                        }
                      }}
                      onMouseDown={(e) => {
                        if (sec.id === 'drag') {
                          handleDragButtonMouseDown(e);
                        } else {
                          e.stopPropagation();
                        }
                      }}
                      onPointerDown={(e) => {
                        if (sec.id === 'drag') {
                          handleDragButtonMouseDown(e);
                        }
                      }}
                    >
                      <title>{sec.tooltip}</title>
                    </path>
                  );
                })}

                {/* Hairline Radial Dividers for Menu Ring */}
                {dividerAngles.map((ang, idx) => {
                  const toRad = (deg) => (deg * Math.PI) / 180;
                  const x1 = 170 + 66 * Math.cos(toRad(ang));
                  const y1 = 170 + 66 * Math.sin(toRad(ang));
                  const x2 = 170 + 118 * Math.cos(toRad(ang));
                  const y2 = 170 + 118 * Math.sin(toRad(ang));
                  return (
                    <g key={`div-menu-${idx}`} className="pointer-events-none">
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isWhite ? 'rgba(15, 23, 42, 0.08)' : isBlush ? 'rgba(159, 18, 57, 0.1)' : 'rgba(0, 0, 0, 0.65)'}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isWhite ? 'rgba(255, 255, 255, 0.95)' : isBlush ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)'}
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </g>

              {/* MODE 3: EMOJI RING SVG TRACK (r=92, width=52) */}
              <g
                className={`transition-all duration-300 ${
                  isEmojiRingOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ transformOrigin: '170px 170px' }}
              >
                <circle
                  cx="170"
                  cy="170"
                  r="92"
                  stroke={isWhite ? 'rgba(255, 255, 255, 0.45)' : isBlush ? 'rgba(254, 205, 211, 0.35)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth="52"
                  fill="none"
                />
              </g>

              {/* RECESSED MOAT BETWEEN CENTER HUB & SINGLE RING (r=62, width=5) */}
              <circle
                cx="170"
                cy="170"
                r="62"
                stroke={isWhite ? 'rgba(215, 228, 248, 0.75)' : isBlush ? 'rgba(254, 205, 211, 0.75)' : 'rgba(10, 15, 25, 0.95)'}
                strokeWidth="5"
                fill="none"
                className="pointer-events-none"
              />

              {/* Active Duo Progress Halo Ring in Moat */}
              <circle
                cx="170"
                cy="170"
                r="62"
                stroke="url(#moatHaloGrad)"
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 62}
                strokeDashoffset={2 * Math.PI * 62 - (duoProgress / 100) * 2 * Math.PI * 62}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 170 170)"
                className="transition-all duration-700 ease-out pointer-events-none"
              />
            </svg>

            {/* ============================================================ */}
            {/* HTML OVERLAY: SYSTEM & PASSWORDS RING (WHEN ringMode === 'system') */}
            {/* ============================================================ */}
            <div
              className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
                isSystemRingOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              {systemRingSectors.map((sec) => {
                const toRad = (deg) => (deg * Math.PI) / 180;
                const posX = 92 * Math.cos(toRad(sec.angle));
                const posY = 92 * Math.sin(toRad(sec.angle));

                return (
                  <button
                    key={`sys-${sec.id}`}
                    type="button"
                    onMouseDown={(e) => {
                      if (sec.isDrag) {
                        handleDragButtonMouseDown(e);
                      } else {
                        e.stopPropagation();
                      }
                    }}
                    onPointerDown={(e) => {
                      if (sec.isDrag) {
                        handleDragButtonMouseDown(e);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sec.isDrag) {
                        // Drag button release - do not toggle dock
                      } else {
                        sec.onClick && sec.onClick(e);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${posX}px)`,
                      top: `calc(50% + ${posY}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`pointer-events-auto flex flex-col items-center justify-center text-center select-none z-30 transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                      sec.isDrag ? 'cursor-grab active:cursor-grabbing app-drag-pill' : 'tauri-no-drag'
                    }`}
                    title={sec.tooltip}
                  >
                    <div
                      className={`relative flex items-center justify-center transition-transform duration-200 ${
                        isWhite ? 'embossed-icon-white' : isBlush ? 'embossed-icon-blush' : 'embossed-icon-dark'
                      }`}
                    >
                      {sec.icon}
                      {sec.extraBadge}
                    </div>
                    <span
                      className={`text-[6.5px] font-mono font-extrabold tracking-tight uppercase leading-none mt-0.5 ${
                        isWhite ? 'text-slate-700' : isBlush ? 'text-rose-950' : 'text-slate-200'
                      }`}
                    >
                      {sec.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ============================================================ */}
            {/* HTML OVERLAY: MENU TOOLS RING (WHEN ringMode === 'menu')     */}
            {/* ============================================================ */}
            <div
              className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
                isMenuRingOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              {optionsSectors.map((sec) => {
                const toRad = (deg) => (deg * Math.PI) / 180;
                const posX = 92 * Math.cos(toRad(sec.angle));
                const posY = 92 * Math.sin(toRad(sec.angle));

                return (
                  <button
                    key={`opt-${sec.id}`}
                    type="button"
                    onMouseDown={(e) => {
                      if (sec.id === 'drag') {
                        handleDragButtonMouseDown(e);
                      } else {
                        e.stopPropagation();
                      }
                    }}
                    onPointerDown={(e) => {
                      if (sec.id === 'drag') {
                        handleDragButtonMouseDown(e);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sec.id === 'drag') {
                        // Drag button release - do not toggle dock
                      } else {
                        sec.onClick && sec.onClick(e);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${posX}px)`,
                      top: `calc(50% + ${posY}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`pointer-events-auto flex flex-col items-center justify-center text-center select-none z-30 transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                      sec.id === 'drag' ? 'cursor-grab active:cursor-grabbing app-drag-pill' : 'tauri-no-drag'
                    }`}
                    title={sec.tooltip}
                  >
                    <div
                      className={`relative flex items-center justify-center transition-transform duration-200 ${
                        isWhite ? 'embossed-icon-white' : isBlush ? 'embossed-icon-blush' : 'embossed-icon-dark'
                      }`}
                    >
                      {sec.icon}
                      {sec.extraBadge}
                    </div>
                    <span
                      className={`text-[6.5px] font-mono font-extrabold tracking-tight uppercase leading-none mt-0.5 ${
                        isWhite ? 'text-slate-600' : isBlush ? 'text-rose-900' : 'text-slate-300'
                      }`}
                    >
                      {sec.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ============================================================ */}
            {/* HTML OVERLAY: EMOJI REACTIONS RING (WHEN ringMode === 'emoji')*/}
            {/* ============================================================ */}
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                isEmojiRingOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
              }`}
            >
              {emojiList.map((emoji, idx) => {
                const angles = [-90, -45, 0, 45, 90, 135, 180, 225];
                const angle = angles[idx % angles.length];
                const toRad = (deg) => (deg * Math.PI) / 180;
                const posX = 92 * Math.cos(toRad(angle));
                const posY = 92 * Math.sin(toRad(angle));

                return (
                  <button
                    key={`emoji-${idx}`}
                    data-tauri-drag-region="false"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playPop();
                      onSendEmoji(emoji);
                    }}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${posX}px)`,
                      top: `calc(50% + ${posY}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`emoji-pod-btn tauri-no-drag w-8 h-8 rounded-full flex items-center justify-center text-base hover:scale-130 active:scale-90 transition-all duration-200 cursor-pointer shadow-md select-none z-30 ${
                      isWhite ? 'emoji-pod-white' : isBlush ? 'emoji-pod-blush' : 'emoji-pod-dark'
                    }`}
                    title={`Send instant reaction: ${emoji}`}
                  >
                    <span className="leading-none pointer-events-none">{emoji}</span>
                  </button>
                );
              })}

              {/* Quick Switcher Button inside Emoji Ring: Return to Tools */}
              <button
                type="button"
                data-tauri-drag-region="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playPop();
                  onChangeRingMode('menu');
                  setFeedbackToast('📋 Menu Tools Ring');
                  setTimeout(() => setFeedbackToast(null), 1800);
                }}
                className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-mono text-[7px] font-bold border border-white/20 shadow-md hover:border-emerald-400 z-40 transition tauri-no-drag cursor-pointer"
                title="Return to Menu Tools Ring"
              >
                📋 TOOLS
              </button>

              {/* Quick Switcher Button inside Emoji Ring: Go to System */}
              <button
                type="button"
                data-tauri-drag-region="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playPop();
                  onChangeRingMode('system');
                  setFeedbackToast('⚙️ System & Passwords Ring');
                  setTimeout(() => setFeedbackToast(null), 1800);
                }}
                className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-mono text-[7px] font-bold border border-white/20 shadow-md hover:border-cyan-400 z-40 transition tauri-no-drag cursor-pointer"
                title="Go to System & Passwords Ring"
              >
                ⚙️ SYSTEM
              </button>
            </div>

            {/* ============================================================ */}
            {/* RING 1: CENTER HUB (116px DIAMETER)                          */}
            {/* ============================================================ */}
            <div
              data-tauri-drag-region="false"
              onMouseDown={(e) => {
                if (e.button === 2) {
                  e.stopPropagation();
                  handleCenterHubContextMenu(e);
                } else {
                  e.stopPropagation();
                }
              }}
              onContextMenu={handleCenterHubContextMenu}
              onClick={handleCenterHubClick}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[116px] h-[116px] rounded-full flex flex-col items-center justify-center text-center select-none overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] z-20 shadow-xl tauri-no-drag ${
                isWhite ? 'radial-hub-white' : isBlush ? 'radial-hub-blush' : 'radial-hub-dark'
              }`}
              title="Live Cam & Mascot Hub (Left click: Toggle Ring | 2x: Emojis | Right click: Celebrate | 3x: Vanish Orb)"
            >
              {/* MODE A: LIVE VIDEO COCKPIT (EXPANDED CRISP FEED) */}
              {isVideoOn || showRemote ? (
                <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-black">
                  {(() => {
                    const hasBoth = Boolean(showRemote && isVideoOn && localCamStream);
                    const mainIsRemote = hasBoth ? !isSwappedVideo : Boolean(showRemote);

                    return (
                      <>
                        {/* MAIN VIDEO FEED (Remote partner or Local webcam) */}
                        {mainIsRemote ? (
                          hasRemoteVideo ? (
                            <video
                              ref={(el) => {
                                remoteVideoRef.current = el;
                                if (el && remoteCamStream) {
                                  el.muted = true;
                                  el.playsInline = true;
                                  if (el.srcObject !== remoteCamStream) {
                                    el.srcObject = remoteCamStream;
                                  }
                                  el.play().catch(() => {});
                                }
                              }}
                              autoPlay
                              playsInline
                              muted
                              onLoadedMetadata={(e) => {
                                e.target.muted = true;
                                e.target.play().catch(() => {});
                              }}
                              onCanPlay={(e) => {
                                e.target.muted = true;
                                e.target.play().catch(() => {});
                              }}
                              className="w-full h-full object-cover scale-105 pointer-events-none"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center bg-slate-950 text-white w-full h-full p-2 pointer-events-none">
                              <CabbageLogo size={28} animated />
                              <span className="text-[7.5px] font-mono font-bold mt-1 text-emerald-400 animate-pulse">
                                {isPeerVideoOn ? 'Connecting Cam...' : 'Camera Off'}
                              </span>
                            </div>
                          )
                        ) : (
                          <video
                            ref={(el) => {
                              localVideoRef.current = el;
                              if (el) {
                                el.muted = true;
                                el.playsInline = true;
                                if (localCamStream && el.srcObject !== localCamStream) {
                                  el.srcObject = localCamStream;
                                  el.play().catch(() => {});
                                }
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            onLoadedMetadata={(e) => {
                              e.target.muted = true;
                              e.target.play().catch(() => {});
                            }}
                            onCanPlay={(e) => {
                              e.target.muted = true;
                              e.target.play().catch(() => {});
                            }}
                            className="w-full h-full object-cover mirror scale-105 pointer-events-none"
                          />
                        )}

                        {/* PiP FLOATING BUBBLE (Clickable to Swap Feeds) */}
                        {hasBoth && (
                          <div
                            data-tauri-drag-region="false"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playPop();
                              setIsSwappedVideo((prev) => !prev);
                            }}
                            className="absolute bottom-2 right-2 w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-400 shadow-xl bg-black z-30 cursor-pointer hover:scale-115 active:scale-95 transition-all tauri-no-drag"
                            title={`Click to show ${mainIsRemote ? 'You' : datePartner.name} in main circle`}
                          >
                            {mainIsRemote ? (
                              <video
                                ref={(el) => {
                                  pipVideoRef.current = el;
                                  if (el && localCamStream) {
                                    if (el.srcObject !== localCamStream) {
                                      el.srcObject = localCamStream;
                                    }
                                    el.play().catch(() => {});
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                                className="w-full h-full object-cover mirror pointer-events-none"
                              />
                            ) : (
                              <video
                                ref={(el) => {
                                  pipVideoRef.current = el;
                                  if (el && remoteCamStream) {
                                    if (el.srcObject !== remoteCamStream) {
                                      el.srcObject = remoteCamStream;
                                    }
                                    el.play().catch(() => {});
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            )}
                            <div className="absolute inset-0 bg-emerald-500/10 hover:bg-transparent pointer-events-none transition-colors" />
                          </div>
                        )}

                        {/* Live Identity Badge - Safely Positioned & Visible */}
                        <div className="absolute top-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white font-mono text-[7.5px] font-bold flex items-center gap-1 z-20 border border-emerald-400/40 shadow-md pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="truncate max-w-[70px]">{mainIsRemote ? datePartner.name.split(' ')[0] : 'YOU'}</span>
                        </div>

                        {/* Gesture Hint Subtitle */}
                        <div className="absolute bottom-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white/90 font-mono text-[6.5px] z-20 border border-white/20 pointer-events-none">
                          {hasBoth ? 'TAP PIP TO SWAP' : 'AMIGO LIVE'}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* MODE B: BIG CUTE BOUNCING CABBAGE MASCOT HUB */
                <div className="flex flex-col items-center justify-center w-full h-full relative p-2 pointer-events-none">
                  <div
                    className={`transition-transform duration-300 ${
                      isCabbageBouncing ? 'animate-bounce scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <CabbageLogo size={44} animated />
                  </div>

                  {/* Partner First Name Badge - Prominent & Never Hidden! */}
                  <div className={`mt-1 px-2.5 py-0.5 rounded-full ${realPartner ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-400' : 'bg-amber-500/15 border-amber-400/40 text-amber-300'} border text-[8px] font-mono font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${realPartner ? (isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-amber-400 animate-pulse'}`} />
                    <span className="truncate max-w-[80px]">{realPartner ? datePartner.name.split(' ')[0] : (isConnected ? 'WAITING' : 'OFFLINE')}</span>
                  </div>

                  {/* Duo Synergy Heart Pill */}
                  <div className="mt-0.5 px-2 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-[7.5px] font-mono font-bold flex items-center gap-1 opacity-90">
                    <Heart className="w-2 h-2 text-rose-500 fill-rose-500" />
                    <span>{duoProgress}% {realPartner ? 'DUO' : 'GOAL'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. DUAL FACE-TO-FACE VIDEO CARD GRID (SIDE-BY-SIDE)          */}
          {/* ============================================================ */}
          {faceToFaceMode && (
            <div
              data-tauri-drag-region="false"
              className={`mt-2.5 w-full max-w-[380px] p-2.5 rounded-3xl shadow-2xl backdrop-blur-2xl border transition-all animate-scaleIn select-none z-30 tauri-no-drag ${
                isWhite
                  ? 'bg-white/95 border-white shadow-slate-300/50'
                  : isBlush
                  ? 'bg-rose-950/90 border-rose-300/30 shadow-rose-950/50 text-white'
                  : 'bg-slate-900/95 border-white/15 shadow-black/70 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1 text-[10px] font-mono font-bold opacity-80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>FACE-TO-FACE STUDY DUO</span>
                </div>
                <button
                  type="button"
                  data-tauri-drag-region="false"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFaceToFaceMode(false);
                  }}
                  className="text-[9px] hover:text-rose-400 cursor-pointer tauri-no-drag"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Partner's Card */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/15 flex items-center justify-center shadow-inner">
                  {showRemote ? (
                    <video
                      ref={(el) => {
                        dualRemoteVideoRef.current = el;
                        if (el && remoteCamStream) {
                          if (el.srcObject !== remoteCamStream) {
                            el.srcObject = remoteCamStream;
                          }
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <CabbageLogo size={28} animated />
                      <span className="text-[8px] font-mono mt-1 opacity-75 text-cyan-300 font-bold">
                        {isPartnerPresenting ? 'Screen on Big Display' : isPeerVideoOn ? 'Connecting...' : 'Camera Off'}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[8px] font-mono text-white pointer-events-none">
                    <span className="truncate max-w-[85px]">{datePartner.name}</span>
                    <span className="flex items-center gap-1">
                      {isPeerMicOn ? (
                        <Mic className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <MicOff className="w-2.5 h-2.5 text-slate-400" />
                      )}
                      {showRemote && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                    </span>
                  </div>
                </div>

                {/* 2. Your Local Card */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/15 flex items-center justify-center shadow-inner">
                  {isVideoOn && localCamStream ? (
                    <video
                      ref={(el) => {
                        dualLocalVideoRef.current = el;
                        if (el && localCamStream) {
                          if (el.srcObject !== localCamStream) {
                            el.srcObject = localCamStream;
                          }
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <VideoOff className="w-6 h-6 opacity-40 mb-1" />
                      <button
                        type="button"
                        data-tauri-drag-region="false"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVideo && onToggleVideo();
                        }}
                        className="text-[8px] font-mono font-bold text-emerald-400 underline hover:text-emerald-300 cursor-pointer tauri-no-drag"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[8px] font-mono text-white pointer-events-none">
                    <span className="truncate max-w-[85px]">{selfUser?.name || 'You'} (You)</span>
                    <span className="flex items-center gap-1">
                      {isMicOn ? (
                        <Mic className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <MicOff className="w-2.5 h-2.5 text-slate-400" />
                      )}
                      {isVideoOn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
