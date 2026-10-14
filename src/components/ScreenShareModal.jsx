import React, { useRef, useEffect, useState } from 'react';
import {
  ScreenShare,
  MonitorX,
  Maximize2,
  Minimize2,
  Tv,
  Minus,
  X,
  Scan,
  Eye,
  Check,
  Music,
  Music2,
  Headphones,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { resizeWindowForScreenshare, isTauri } from '../utils/hitTesting';

export default function ScreenShareModal({
  isSharing,
  localStream,
  peerStream,
  remoteCamStream,
  peerSharingUser,
  onStartShare,
  onStopShare,
  onClose,
  viewMode: controlledViewMode,
  onChangeViewMode,
  isSharingMusic = false,
  peerSharingMusic = false,
  musicVolume = 0.85,
  micVolume = 1.0,
  musicShareError = null,
  onStartMusicShare = () => {},
  onStopMusicShare = () => {},
  onChangeMusicVolume = () => {},
  onChangeMicVolume = () => {},
  onDismissMusicError = () => {},
}) {
  const [internalViewMode, setInternalViewMode] = useState('theater'); // 'compact', 'theater', 'fullscreen', 'minimized'
  const [fitMode, setFitMode] = useState('contain'); // 'contain' (whole screen visible) or 'cover' (fill box)
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const currentMode = controlledViewMode || internalViewMode;

  const handleSetMode = (mode) => {
    if (onChangeViewMode) {
      onChangeViewMode(mode);
    } else {
      setInternalViewMode(mode);
    }

    // Call native Tauri window resizer
    if (mode === 'fullscreen') {
      resizeWindowForScreenshare('fullscreen');
      if (!isTauri() && containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else if (mode === 'theater') {
      resizeWindowForScreenshare('theater');
      if (!isTauri() && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else if (mode === 'compact' || mode === 'minimized') {
      resizeWindowForScreenshare('compact');
      if (!isTauri() && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const isLocalPresenting = Boolean(isSharing && localStream);
  const isRemotePresenting = Boolean(peerSharingUser);

  // Determine which stream to display:
  // If remote partner is sharing, show remote screen. If local user is sharing, show local screen preview.
  let activeStream = null;
  let isDisplayingPeer = false;

  if (isRemotePresenting) {
    activeStream = peerStream || remoteCamStream;
    isDisplayingPeer = true;
  } else if (isLocalPresenting) {
    activeStream = localStream;
    isDisplayingPeer = false;
  } else {
    activeStream = peerStream || remoteCamStream || localStream;
    isDisplayingPeer = Boolean(peerSharingUser);
  }

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    if (activeStream) {
      if (video.srcObject !== activeStream) {
        video.srcObject = activeStream;
      }

      const tryPlay = () => {
        if (!video) return;
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.debug('[ScreenShareModal] Video play retry needed:', err);
              setTimeout(() => {
                if (video && activeStream) {
                  video.muted = true;
                  video.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }, 300);
            });
        }
      };

      tryPlay();

      // Listen for track unmute / active frames
      const tracks = activeStream.getVideoTracks();
      const onTrackUnmute = () => {
        tryPlay();
      };
      tracks.forEach((t) => t.addEventListener('unmute', onTrackUnmute));

      return () => {
        tracks.forEach((t) => t.removeEventListener('unmute', onTrackUnmute));
      };
    } else {
      video.srcObject = null;
      setIsPlaying(false);
    }
  }, [activeStream]);

  // Initial trigger for theater mode when opened
  useEffect(() => {
    if (currentMode === 'theater') {
      resizeWindowForScreenshare('theater');
    }
    return () => {
      // Restore compact window upon closing
      resizeWindowForScreenshare('compact');
    };
  }, []);

  // 1. MINIMIZED FLOATING PILL
  if (currentMode === 'minimized') {
    return (
      <div className="bg-slate-900/95 border border-indigo-500/50 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-slate-100 w-full max-w-md mx-auto animate-in fade-in duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {peerSharingUser
                ? `${peerSharingUser}'s Screen`
                : isSharing
                ? 'Your Screen Shared'
                : 'Study Screen Share'}
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">LIVE Stream active</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleSetMode('theater')}
            title="Expand to Theater View (🗖)"
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm transition active:scale-95"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Expand</span>
          </button>
          <button
            onClick={() => handleSetMode('fullscreen')}
            title="Full Screen View (⤢)"
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close Viewer"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. EXPANDED VIEWER (Compact, Theater, or Fullscreen)
  const isLarge = currentMode === 'theater' || currentMode === 'fullscreen';

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col transition-all duration-300 ${
        currentMode === 'fullscreen'
          ? 'fixed inset-2 z-[99999] w-[calc(100vw-16px)] h-[calc(100vh-16px)] p-4'
          : currentMode === 'theater'
          ? 'w-full max-w-5xl h-[80vh] p-4 mx-auto'
          : 'w-full max-w-sm p-3.5 mx-auto'
      }`}
    >
      {/* Header Bar with Window Size Controls */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ScreenShare className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="truncate">
            <h3 className="font-semibold text-xs sm:text-sm truncate">
              {peerSharingUser ? `${peerSharingUser}'s Screen` : 'Study Screen Share'}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>1080p Low-Latency WebRTC</span>
            </div>
          </div>
        </div>

        {/* Resizing & Mode Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Fit Toggle (Contain vs Cover) */}
          <button
            onClick={() => setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'))}
            title={
              fitMode === 'contain'
                ? 'Currently: Whole Screen Fitted (Click to Fill / Zoom)'
                : 'Currently: Filled (Click to Fit Whole Screen)'
            }
            className={`px-2 py-1 text-[11px] rounded-lg border font-medium flex items-center gap-1 transition ${
              fitMode === 'contain'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Scan className="w-3 h-3" />
            <span className="hidden sm:inline">
              {fitMode === 'contain' ? 'Whole Screen' : 'Fill'}
            </span>
          </button>

          {/* Normal Mode */}
          <button
            onClick={() => handleSetMode('compact')}
            title="Compact Companion Mode (🗕 420px)"
            className={`p-1.5 rounded-lg border text-xs transition ${
              currentMode === 'compact'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Theater Mode */}
          <button
            onClick={() => handleSetMode('theater')}
            title="Theater Wide Mode (🗖 Large Study Canvas)"
            className={`p-1.5 rounded-lg border text-xs transition ${
              currentMode === 'theater'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Mode */}
          <button
            onClick={() => handleSetMode('fullscreen')}
            title="Fullscreen Mode (⤢ Fill Whole Display)"
            className={`p-1.5 rounded-lg border text-xs transition ${
              currentMode === 'fullscreen'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Minimize into Floating Pill */}
          <button
            onClick={() => handleSetMode('minimized')}
            title="Minimize to Floating Bar (—)"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close Screen Share"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600/30 transition ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Music Audio Share Error / Tip Banner */}
      {musicShareError && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[11px] leading-tight">{musicShareError}</p>
            <p className="text-[10px] text-amber-300/80 mt-1">
              💡 <strong>Pro Tip:</strong> Click <em>'Share YouTube Music'</em> below, choose the <em>Chrome Tab</em> with YouTube Music, and make sure the <em>'Share tab audio'</em> box at bottom-left is checked!
            </p>
          </div>
          {onDismissMusicError && (
            <button onClick={onDismissMusicError} className="p-1 hover:text-white text-amber-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Video Stream Container */}
      <div
        className={`relative bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center grow ${
          isLarge ? 'min-h-[300px]' : 'aspect-video'
        }`}
      >
        {activeStream ? (
          <>
            <video
              ref={videoRef}
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
                setIsPlaying(true);
              }}
              onPlaying={() => setIsPlaying(true)}
              onWaiting={() => setIsPlaying(false)}
              className={`w-full h-full ${
                fitMode === 'contain' ? 'object-contain' : 'object-cover'
              } transition-all duration-200`}
            />
            {!isPlaying && isDisplayingPeer && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white z-10 pointer-events-none p-4">
                <span className="relative flex h-4 w-4 mb-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-semibold text-cyan-300">Receiving Screen Stream...</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Connecting peer WebRTC feed</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-6 max-w-sm">
            <Eye className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-60" />
            <h4 className="text-sm font-semibold text-slate-300 mb-1">
              No Active Screen Stream
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When your partner shares their screen, it will appear here automatically in full scale.
              You can also share your study notes, code, or YouTube Music below.
            </p>
          </div>
        )}

        {/* Top Floating Stream Badge */}
        {activeStream && (
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10 pointer-events-none">
            {isDisplayingPeer ? (
              <div className="bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{peerSharingUser || 'Partner'}'s Screen</span>
              </div>
            ) : isSharing ? (
              <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
                <span>You are sharing your screen</span>
              </div>
            ) : null}

            {(isSharingMusic || localStream?.getAudioTracks()?.length > 0) && (
              <div className="bg-violet-950/90 border border-violet-500/50 text-violet-200 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                <Music className="w-3 h-3 text-violet-400 animate-pulse" />
                <span>Stereo Music Audio Active</span>
              </div>
            )}
            {peerSharingMusic && (
              <div className="bg-violet-950/90 border border-violet-500/50 text-violet-200 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                <Music className="w-3 h-3 text-violet-400 animate-pulse" />
                <span>Partner Playing Music</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Floating Hint in Large View */}
        {isLarge && activeStream && (
          <div className="absolute bottom-3 right-3 text-[10px] text-white/70 bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10 pointer-events-none">
            {fitMode === 'contain' ? 'Showing 100% of screen (No cropping)' : 'Filled container'}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 shrink-0 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Share Screen Button */}
          {!isSharing ? (
            <button
              onClick={onStartShare}
              className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
            >
              <ScreenShare className="w-4 h-4" />
              <span>Share Screen</span>
            </button>
          ) : (
            <button
              onClick={onStopShare}
              className="flex items-center gap-1.5 py-2 px-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-rose-600/30 active:scale-95 transition cursor-pointer"
            >
              <MonitorX className="w-4 h-4" />
              <span>Stop Screen</span>
            </button>
          )}

          {/* 2. Share YouTube Music Button */}
          {!isSharingMusic ? (
            <button
              onClick={onStartMusicShare}
              title="Share YouTube Music / Tab Audio in HD stereo while keeping your camera on"
              className="flex items-center gap-1.5 py-2 px-3.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-violet-600/30 active:scale-95 transition cursor-pointer"
            >
              <Music className="w-4 h-4" />
              <span>Share YouTube Music</span>
            </button>
          ) : (
            <button
              onClick={onStopMusicShare}
              title="Stop sharing YouTube Music"
              className="flex items-center gap-1.5 py-2 px-3.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-rose-600/30 active:scale-95 transition cursor-pointer"
            >
              <Music2 className="w-4 h-4" />
              <span>Stop Music</span>
            </button>
          )}

          {/* 3. Live Volume Slider when Music is streaming */}
          {(isSharingMusic || isSharing && localStream?.getAudioTracks()?.length > 0) && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
              <Headphones className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-medium text-slate-300">Music Vol:</span>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={musicVolume}
                onChange={(e) => onChangeMusicVolume(parseFloat(e.target.value))}
                className="w-16 accent-violet-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 w-7">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          )}

          {isSharing && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Screen live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="hidden sm:inline">Tip: Pick 'Chrome Tab' & tick 'Share tab audio' for music</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}
