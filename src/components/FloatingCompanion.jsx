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
} from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import CabbageLogo from './CabbageLogo';
import { sounds } from '../utils/audio';
import { setForceInteractive } from '../utils/hitTesting';

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
  target,
  progress,
  onOpenTargetModal,
  onSendEmoji,
  floatingEmojis,
  quickEmojis = ['🎉', '🥳', '❤️', '🥰', '🔥', '☕', '✨', '👏'],
  onOpenCustomizer,
  onOpenScreenShare,
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

  // Dynamic concentric ring expansion states:
  // Default: Clean camera orb mode (top bar vanished)
  // 2 taps on Cam = toggle Emoji Circle
  // 3 taps on Cam = toggle All Options Circle & Top Bar
  // 4 taps on Cam = vanish into pure minimalist camera orb
  const [isEmojiCircleOpen, setIsEmojiCircleOpen] = useState(false);
  const [isOptionsCircleOpen, setIsOptionsCircleOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const localVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local webcam stream
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localCamStream || null;
      if (localCamStream && isVideoOn) {
        localVideoRef.current.play().catch(() => {});
      }
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = localCamStream || null;
      if (localCamStream && isVideoOn) {
        pipVideoRef.current.play().catch(() => {});
      }
    }
  }, [localCamStream, isVideoOn, isPeerVideoOn]);

  // Attach remote partner's webcam stream and guarantee instant playback resumption
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteCamStream || null;
      if (remoteCamStream && isPeerVideoOn) {
        remoteVideoRef.current.play().catch((err) => {
          console.debug('[FloatingCompanion] Remote video play postponed:', err);
        });
      }
    }
  }, [remoteCamStream, isPeerVideoOn]);

  // Selected date partner
  const datePartner = members.find((m) => m.id !== 'self' && m.id !== selfUser?.id) || {
    id: 'partner1',
    name: 'Alex (Study Date)',
    avatar: '🌸',
    status: 'studying',
    target: 'Finish Chapter 4 Physics & Quiz',
    progress: 75,
  };

  const duoProgress = Math.round(((progress || 0) + (datePartner.progress || 0)) / 2);

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
        // Left 1 Click: Open / Close All Options Circle & Top Menu Bar!
        setIsOptionsCircleOpen((prev) => {
          const next = !prev;
          if (next) {
            sounds.playCelebration();
            setFeedbackToast('🎛️ Options & Menu Bar Opened');
          } else {
            sounds.playPop();
            // When options close, also close emoji ring so no ring is left floating empty
            setIsEmojiCircleOpen(false);
            setFeedbackToast('🪄 Options & Bar Closed');
          }
          setTimeout(() => setFeedbackToast(null), 1800);
          return next;
        });
      } else if (count === 2) {
        // Double Click (2 Taps): Open / Close Outer Emoji Circle
        setIsEmojiCircleOpen((prev) => {
          const next = !prev;
          sounds.playPop();
          if (next) {
            // When emoji ring opens, make sure middle options ring is also open so no circle is missing!
            setIsOptionsCircleOpen(true);
            setFeedbackToast('✨ Emoji Reactions Ring Opened');
          } else {
            setFeedbackToast('✨ Emoji Reactions Ring Closed');
          }
          setTimeout(() => setFeedbackToast(null), 1800);
          return next;
        });
      } else if (count === 3) {
        // 3 Taps: Fallback toggle for options and bar
        setIsOptionsCircleOpen((prev) => !prev);
      } else if (count >= 4) {
        // 4 Taps: Vanish remaining option, bar, and emoji circles into pure camera orb mode!
        if (isOptionsCircleOpen || isEmojiCircleOpen) {
          setIsOptionsCircleOpen(false);
          setIsEmojiCircleOpen(false);
          sounds.playCelebration();
          setFeedbackToast('🪄 Vanished into Pure Cam Orb');
        } else {
          setIsOptionsCircleOpen(true);
          setIsEmojiCircleOpen(true);
          sounds.playCelebration();
          setFeedbackToast('🪄 All Circles & Bar Restored!');
        }
        setTimeout(() => setFeedbackToast(null), 2000);
      }
    }, 280);
  };

  // Dedicated Drag Button / Handle mousedown handler (100% reliable)
  const handleDragButtonMouseDown = async (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    setForceInteractive(true);

    if (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__)) {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.startDragging();
        return;
      } catch (err) {
        console.warn('Tauri startDragging fallback:', err);
      }
    }

    if (onBrowserDragStart) {
      onBrowserDragStart(e);
    }
  };

  // Ambient drag handler for general widget background
  const handleDragMouseDown = async (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, select, textarea, a, video, .sector-wedge, .emoji-pod-btn')) return;
    setForceInteractive(true);

    if (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__)) {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.startDragging();
        return;
      } catch (err) {
        console.warn('Tauri startDragging failed:', err);
      }
    }

    if (onBrowserDragStart) {
      onBrowserDragStart(e);
    }
  };

  // Theme styling helpers
  const isWhite = theme === 'white';
  const isBlush = theme === 'blush';

  // Dynamic widget outer diameter based on which concentric circles are open
  const dialDiameter = isEmojiCircleOpen ? 348 : isOptionsCircleOpen ? 246 : 144;

  // 8 Options in the Small Middle Circle (45 degrees each)
  const dividerAngles = [-112.5, -67.5, -22.5, 22.5, 67.5, 112.5, 157.5, 202.5];

  const optionsSectors = [
    {
      id: 'drag',
      label: 'DRAG',
      icon: <GripHorizontal className="w-3.5 h-3.5" />,
      angle: -90,
      start: -112.5,
      end: -67.5,
      tooltip: 'Hold & Drag to move Amigo',
      onClick: onToggleDock,
      onMouseDown: handleDragButtonMouseDown,
      active: false,
    },
    {
      id: 'mic',
      label: 'MIC',
      icon: isMicOn ? (
        <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
      ) : (
        <MicOff className="w-3.5 h-3.5 opacity-75" />
      ),
      angle: -45,
      start: -67.5,
      end: -22.5,
      tooltip: isMicOn ? 'Microphone Live (Click to Mute)' : 'Microphone Muted (Click to Unmute)',
      onClick: onToggleMic,
      active: isMicOn,
      activeColor: 'emerald',
      extraBadge: isPeerMicOn && (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
      ),
    },
    {
      id: 'cam',
      label: 'CAM',
      icon: isVideoOn ? (
        <Video className="w-3.5 h-3.5 text-rose-400" />
      ) : (
        <VideoOff className="w-3.5 h-3.5 opacity-75" />
      ),
      angle: 0,
      start: -22.5,
      end: 22.5,
      tooltip: isVideoOn ? 'Camera Active (Click to Turn Off)' : 'Camera Off (Click to Turn On)',
      onClick: onToggleVideo,
      active: isVideoOn,
      activeColor: 'rose',
    },
    {
      id: 'share',
      label: 'SHARE',
      icon: <ScreenShare className={`w-3.5 h-3.5 ${isSharingScreen ? 'text-cyan-400' : ''}`} />,
      angle: 45,
      start: 22.5,
      end: 67.5,
      tooltip: 'Share Screen with partner',
      onClick: onOpenScreenShare,
      active: isSharingScreen,
      activeColor: 'cyan',
    },
    {
      id: 'palette',
      label: 'EMOJI',
      icon: <Palette className="w-3.5 h-3.5" />,
      angle: 90,
      start: 67.5,
      end: 112.5,
      tooltip: 'Customize Emojis on outer ring',
      onClick: onOpenCustomizer,
      active: false,
    },
    {
      id: 'sos',
      label: 'SOS',
      icon: <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />,
      angle: 135,
      start: 112.5,
      end: 157.5,
      tooltip: 'Caring SOS Check-in & Lifelines',
      onClick: onOpenSos,
      active: false,
    },
    {
      id: 'doubt',
      label: 'DOUBT',
      icon: <HelpCircle className={`w-3.5 h-3.5 ${doubtsCount > 0 ? 'text-amber-400' : ''}`} />,
      angle: 180,
      start: 157.5,
      end: 202.5,
      tooltip: 'Ephemeral Doubt Hub & Local AI (3h Auto-Purge)',
      onClick: onOpenDoubtModal,
      active: doubtsCount > 0,
      activeColor: 'amber',
      extraBadge: doubtsCount > 0 && (
        <span className="min-w-[13px] h-[13px] px-0.5 rounded-full bg-amber-500 border border-white text-white font-mono text-[7px] font-bold flex items-center justify-center shadow-md animate-pulse absolute -top-1 -right-1">
          {doubtsCount}
        </span>
      ),
    },
    {
      id: 'target',
      label: `${progress}%`,
      icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
      angle: 225,
      start: 202.5,
      end: 247.5,
      tooltip: `Daily Targets & Tasks (${progress}% completed)`,
      onClick: onOpenTargetModal,
      active: progress === 100,
      activeColor: 'emerald',
    },
  ];

  // Emojis for the Outermost Circle
  const emojiList = quickEmojis && quickEmojis.length > 0 ? quickEmojis : ['🎉', '🥳', '❤️', '🥰', '🔥', '☕', '✨', '👏'];

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
              data-tauri-drag-region
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDragButtonMouseDown(e);
              }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-mono text-[8px] font-bold flex items-center gap-0.5 shadow-md z-30 cursor-grab active:cursor-grabbing border border-white/20 hover:border-emerald-400"
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
          {!isOptionsCircleOpen && (
            <div
              data-tauri-drag-region
              onMouseDown={handleDragButtonMouseDown}
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/90 text-white font-mono text-[8px] font-bold flex items-center gap-1 shadow-md z-40 cursor-grab active:cursor-grabbing border border-white/20 hover:border-emerald-400 opacity-0 group-hover/dial:opacity-100 transition-opacity duration-200 select-none"
              title="Hold & Drag to move Amigo"
            >
              <GripHorizontal className="w-2.5 h-2.5 text-emerald-400 pointer-events-none" />
              <span className="pointer-events-none">DRAG</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. TOP FLOATING GLASS PILL (APPEARS ONLY WHEN OPTIONS ARE OPEN) */}
          {/* ============================================================ */}
          {isOptionsCircleOpen && (
            <div
              data-tauri-drag-region
              onMouseDown={handleDragButtonMouseDown}
              className={`mb-2 w-full max-w-[340px] px-3 py-1.5 rounded-full flex items-center justify-between gap-1.5 shadow-lg backdrop-blur-2xl border transition-all cursor-grab active:cursor-grabbing text-[10px] select-none animate-fadeIn ${
                isWhite
                  ? 'bg-white/90 border-white/95 text-slate-700 shadow-slate-300/40'
                  : isBlush
                  ? 'bg-rose-100/90 border-rose-200 text-rose-950 shadow-rose-300/30'
                  : 'bg-slate-900/90 border-white/10 text-slate-200 shadow-black/50'
              }`}
            >
              {/* Left: Mascot & Room Code */}
              <button
                data-tauri-drag-region="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenConnectModal();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition tauri-no-drag shrink-0 ${
                  authError
                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse'
                    : isConnected
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                }`}
                title="Room Code & Passcode Security (Click to Change)"
              >
                <CabbageLogo size={14} animated />
                <span className="font-extrabold tracking-tight text-[10px]">AMIGO</span>
                <span className="text-[8px] font-mono opacity-65 max-w-[55px] truncate">#{roomId}</span>
              </button>

              {/* Center: Dedicated Drag Handle */}
              <div
                data-tauri-drag-region
                onMouseDown={handleDragButtonMouseDown}
                className="flex items-center gap-1 font-mono text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-emerald-500 hover:bg-emerald-500/20 border border-black/5 dark:border-white/10 cursor-grab active:cursor-grabbing transition shrink-0 select-none shadow-xs"
                title="Hold & Drag to move Amigo"
              >
                <GripHorizontal className="w-2.5 h-2.5 pointer-events-none" />
                <span className="pointer-events-none">DRAG</span>
              </div>

              {/* Center Right: Hide to Tray button */}
              <button
                data-tauri-drag-region="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onHideToTray();
                }}
                className="flex items-center gap-1 font-mono text-[8px] font-extrabold px-2 py-0.5 rounded-full border transition shrink-0 select-none shadow-xs tauri-no-drag bg-black/5 dark:bg-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-black/5 dark:border-white/10"
                title="Hide Amigo into Menu Bar / System Tray (Click Menu Bar icon to restore)"
              >
                <EyeOff className="w-2.5 h-2.5" />
                <span>HIDE</span>
              </button>

              {/* Right: Theme Switcher & Collapse Capsule */}
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-black/5 dark:bg-white/10 shrink-0 border border-black/5 dark:border-white/10">
                <button
                  data-tauri-drag-region="false"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetTheme('white');
                  }}
                  className={`p-0.5 rounded-full transition tauri-no-drag ${
                    isWhite ? 'text-amber-500 bg-white shadow-xs scale-105' : 'opacity-40 hover:opacity-100'
                  }`}
                  title="White Frosted Dial Theme"
                >
                  <Sun className="w-3 h-3 pointer-events-none" />
                </button>
                <button
                  data-tauri-drag-region="false"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetTheme('dark');
                  }}
                  className={`p-0.5 rounded-full transition tauri-no-drag ${
                    !isWhite && !isBlush ? 'text-indigo-400 bg-slate-800 shadow-xs scale-105' : 'opacity-40 hover:opacity-100'
                  }`}
                  title="Dark Obsidian Dial Theme"
                >
                  <Moon className="w-3 h-3 pointer-events-none" />
                </button>
                <button
                  data-tauri-drag-region="false"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetTheme('blush');
                  }}
                  className={`p-0.5 rounded-full transition tauri-no-drag ${
                    isBlush ? 'text-rose-500 bg-rose-200/60 shadow-xs scale-105' : 'opacity-40 hover:opacity-100'
                  }`}
                  title="Blush Pink Quartz Dial Theme"
                >
                  <Flower2 className="w-3 h-3 pointer-events-none" />
                </button>
                <div className="w-[1px] h-2.5 bg-black/10 dark:bg-white/15 mx-0.5" />
                <button
                  data-tauri-drag-region="false"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(true);
                  }}
                  className="p-0.5 rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition tauri-no-drag"
                  title="Collapse into Mini Puck"
                >
                  <Minimize2 className="w-3 h-3 pointer-events-none" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. DYNAMIC CONCENTRIC CIRCULAR WIDGET (EXPANDS & CONTRACTS)  */}
          {/* ============================================================ */}
          <div
            data-tauri-drag-region
            onMouseDown={handleDragMouseDown}
            style={{ width: `${dialDiameter}px`, height: `${dialDiameter}px` }}
            className={`relative rounded-full shrink-0 flex items-center justify-center transition-all duration-400 ease-out ${
              isEmojiCircleOpen
                ? isWhite
                  ? 'radial-dial-white'
                  : isBlush
                  ? 'radial-dial-blush'
                  : 'radial-dial-dark'
                : isOptionsCircleOpen
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
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] pointer-events-none"
              viewBox="0 0 350 350"
            >
              <defs>
                <linearGradient id="moatHaloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isBlush ? '#fb7185' : '#34d399'} />
                  <stop offset="100%" stopColor={isBlush ? '#f43f5e' : '#10b981'} />
                </linearGradient>
              </defs>

              {/* TIER 3: OUTER EMOJI RING BACKGROUND TRACK (r=122 to 170) */}
              <g
                className={`transition-all duration-300 ${
                  isEmojiCircleOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ transformOrigin: '175px 175px' }}
              >
                <circle
                  cx="175"
                  cy="175"
                  r="146"
                  stroke={isWhite ? 'rgba(255, 255, 255, 0.4)' : isBlush ? 'rgba(254, 205, 211, 0.35)' : 'rgba(255, 255, 255, 0.05)'}
                  strokeWidth="48"
                  fill="none"
                />
                {/* Separator Groove between Emoji & Options Ring (r=120) */}
                <circle
                  cx="175"
                  cy="175"
                  r="120"
                  stroke={isWhite ? 'rgba(15, 23, 42, 0.07)' : isBlush ? 'rgba(159, 18, 57, 0.08)' : 'rgba(0, 0, 0, 0.6)'}
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="175"
                  cy="175"
                  r="121"
                  stroke={isWhite ? 'rgba(255, 255, 255, 0.9)' : isBlush ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth="1"
                  fill="none"
                />
              </g>

              {/* TIER 2: MIDDLE OPTIONS RING WEDGES (r=75 to 118, width=43) */}
              <g
                className={`transition-all duration-300 ${
                  isOptionsCircleOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ transformOrigin: '175px 175px' }}
              >
                {optionsSectors.map((sec) => {
                  const pathD = describeDonutSegment(175, 175, 75, 118, sec.start, sec.end);
                  return (
                    <path
                      key={sec.id}
                      d={pathD}
                      className="sector-wedge cursor-pointer transition-colors pointer-events-auto"
                      fill={sec.active ? (isWhite ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.25)') : 'transparent'}
                      onClick={(e) => {
                        if (sec.id === 'drag') {
                          onToggleDock && onToggleDock();
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
                      data-tauri-drag-region={sec.id === 'drag' ? "true" : "false"}
                    >
                      <title>{sec.tooltip}</title>
                    </path>
                  );
                })}

                {/* Hairline Radial Dividers for Options Ring (r=75 to 118) */}
                {dividerAngles.map((ang, idx) => {
                  const toRad = (deg) => (deg * Math.PI) / 180;
                  const x1 = 175 + 75 * Math.cos(toRad(ang));
                  const y1 = 175 + 75 * Math.sin(toRad(ang));
                  const x2 = 175 + 118 * Math.cos(toRad(ang));
                  const y2 = 175 + 118 * Math.sin(toRad(ang));
                  return (
                    <g key={`divider-${idx}`} className="pointer-events-none">
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

              {/* RECESSED MOAT BETWEEN OPTIONS RING & BIG CAMERA HUB (r=70, width=10) */}
              <circle
                cx="175"
                cy="175"
                r="70"
                stroke={isWhite ? 'rgba(215, 228, 248, 0.75)' : isBlush ? 'rgba(254, 205, 211, 0.75)' : 'rgba(10, 15, 25, 0.95)'}
                strokeWidth="10"
                fill="none"
                className="pointer-events-none"
              />

              {/* Active Duo Progress Halo Ring in Moat */}
              <circle
                cx="175"
                cy="175"
                r="70"
                stroke="url(#moatHaloGrad)"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 - (duoProgress / 100) * 2 * Math.PI * 70}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 175 175)"
                className="transition-all duration-700 ease-out pointer-events-none"
              />
            </svg>

            {/* ============================================================ */}
            {/* TIER 3: OUTER EMOJI ORBIT CIRCLE (TOGGLED BY 2 TAPS ON CAM)  */}
            {/* ============================================================ */}
            <div
              className={`absolute inset-0 transition-all duration-400 ${
                isEmojiCircleOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
              }`}
            >
              {emojiList.map((emoji, idx) => {
                const totalItems = emojiList.length + 1; // Emojis + Palette button
                const toRad = (deg) => (deg * Math.PI) / 180;
                const angle = -90 + (idx + 0.5) * (360 / totalItems);
                const posX = 146 * Math.cos(toRad(angle));
                const posY = 146 * Math.sin(toRad(angle));

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
                    className={`emoji-pod-btn tauri-no-drag w-8 h-8 rounded-full flex items-center justify-center text-base hover:scale-130 active:scale-90 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md select-none z-30 ${
                      isWhite ? 'emoji-pod-white' : isBlush ? 'emoji-pod-blush' : 'emoji-pod-dark'
                    }`}
                    title={`Send reaction: ${emoji}`}
                  >
                    <span className="leading-none pointer-events-none">{emoji}</span>
                  </button>
                );
              })}

              {/* Extra Emoji Customizer Quick Button on Outer Orbit */}
              {(() => {
                const totalItems = emojiList.length + 1;
                const toRad = (deg) => (deg * Math.PI) / 180;
                const angle = -90 + (emojiList.length + 0.5) * (360 / totalItems);
                const posX = 146 * Math.cos(toRad(angle));
                const posY = 146 * Math.sin(toRad(angle));
                return (
                  <button
                    data-tauri-drag-region="false"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCustomizer();
                    }}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${posX}px)`,
                      top: `calc(50% + ${posY}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`emoji-pod-btn tauri-no-drag w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer shadow-sm z-30 ${
                      isWhite ? 'emoji-pod-white' : isBlush ? 'emoji-pod-blush' : 'emoji-pod-dark'
                    }`}
                    title="Customize Reaction Emojis"
                  >
                    <Plus className="w-3.5 h-3.5 pointer-events-none" />
                  </button>
                );
              })()}
            </div>

            {/* ============================================================ */}
            {/* TIER 2: MIDDLE OPTIONS RING ICONS (TOGGLED BY 3 TAPS ON CAM) */}
            {/* ============================================================ */}
            <div
              className={`absolute inset-0 transition-all duration-400 pointer-events-none ${
                isOptionsCircleOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              {optionsSectors.map((sec) => {
                const toRad = (deg) => (deg * Math.PI) / 180;
                const posX = 96.5 * Math.cos(toRad(sec.angle));
                const posY = 96.5 * Math.sin(toRad(sec.angle));

                return (
                  <div
                    key={`opt-${sec.id}`}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${posX}px)`,
                      top: `calc(50% + ${posY}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="pointer-events-none flex flex-col items-center justify-center text-center select-none z-20"
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
                  </div>
                );
              })}
            </div>

            {/* ============================================================ */}
            {/* TIER 1: CENTER = BIG CAMERA CIRCLE HUB (130px DIAMETER)       */}
            {/* Interactive Portal:                                           */}
            {/* Left 1 Click  = Open / Close All Options Circle & Menu Bar    */}
            {/* Double Click  = Open / Close Outer Emoji Reactions Circle     */}
            {/* Right 1 Click = Amigo Mascot celebration bounce & shower      */}
            {/* 4 Taps        = Vanish circles into pure camera orb           */}
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
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center text-center select-none overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] z-30 shadow-xl tauri-no-drag ${
                isWhite ? 'radial-hub-white' : isBlush ? 'radial-hub-blush' : 'radial-hub-dark'
              }`}
              title="Live Cam & Mascot Hub (Left click: Options & Menu | 2x: Emojis | Right click: Celebrate | 4x: Vanish)"
            >
              {/* MODE A: LIVE VIDEO COCKPIT (EXPANDED CRISP FEED) */}
              {isVideoOn || isPeerVideoOn ? (
                <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-black">
                  {/* Remote Partner Video */}
                  {isPeerVideoOn && remoteCamStream ? (
                    <video
                      ref={(el) => {
                        remoteVideoRef.current = el;
                        if (el && remoteCamStream && el.srcObject !== remoteCamStream) {
                          el.srcObject = remoteCamStream;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => {
                        e.target.play().catch(() => {});
                      }}
                      onCanPlay={(e) => {
                        e.target.play().catch(() => {});
                      }}
                      className="w-full h-full object-cover scale-105 pointer-events-none"
                    />
                  ) : (
                    /* Local Video */
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => {
                        e.target.play().catch(() => {});
                      }}
                      className="w-full h-full object-cover mirror scale-105 pointer-events-none"
                    />
                  )}

                  {/* PiP Local Floating Bubble */}
                  {isPeerVideoOn && isVideoOn && localCamStream && (
                    <div className="absolute bottom-1.5 right-1.5 w-10 h-10 rounded-full overflow-hidden border border-emerald-400 shadow-md bg-black z-20 pointer-events-none">
                      <video
                        ref={pipVideoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={(e) => {
                          e.target.play().catch(() => {});
                        }}
                        className="w-full h-full object-cover mirror scale-105 pointer-events-none"
                      />
                    </div>
                  )}

                  {/* Live Status Chip */}
                  <div className="absolute top-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[7.5px] flex items-center gap-1 z-20 border border-white/20 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE</span>
                  </div>

                  {/* Gesture Hint Subtitle */}
                  <div className="absolute bottom-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 font-mono text-[6.5px] z-20 pointer-events-none">
                    1x: OPTS • 2x: EMOJI • 4x: VANISH
                  </div>
                </div>
              ) : (
                /* MODE B: BIG CUTE BOUNCING CABBAGE MASCOT HUB */
                <div className="flex flex-col items-center justify-center w-full h-full relative p-2 pointer-events-none">
                  <div
                    className={`transition-transform duration-300 ${
                      isCabbageBouncing ? 'animate-bounce scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <CabbageLogo size={52} animated />
                  </div>

                  {/* Duo Synergy Heart Pill */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-mono font-bold flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                    <span>{duoProgress}%</span>
                  </div>

                  {/* Partner First Name Subtitle */}
                  <span className="text-[7.5px] font-mono tracking-wider opacity-50 uppercase mt-0.5">
                    {datePartner.name.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
