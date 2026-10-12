import React, { useRef, useEffect } from 'react';
import { ScreenShare, MonitorX, Eye, AlertCircle } from 'lucide-react';

export default function ScreenShareModal({
  isSharing,
  localStream,
  peerStream,
  peerSharingUser,
  onStartShare,
  onStopShare,
  onClose,
}) {
  const localVideoRef = useRef(null);
  const peerVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (peerVideoRef.current && peerStream) {
      peerVideoRef.current.srcObject = peerStream;
    }
  }, [peerStream]);

  return (
    <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-sm w-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <ScreenShare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm">Study Screen Share</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/10 transition"
        >
          Close
        </button>
      </div>

      {/* Peer Sharing Banner */}
      {peerSharingUser && (
        <div className="mb-3 p-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-200">
              <strong className="text-indigo-300">{peerSharingUser}</strong> is sharing screen
            </span>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-900/60 px-1.5 py-0.5 rounded">
            LIVE
          </span>
        </div>
      )}

      {/* Video Preview (Local or Peer) */}
      <div className="relative aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/10 mb-3 flex items-center justify-center">
        {isSharing && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        ) : peerStream ? (
          <video
            ref={peerVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-4">
            <Eye className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
            <p className="text-xs text-slate-400">
              No active screen stream. Click below to share your study window or notes with your group.
            </p>
          </div>
        )}

        {isSharing && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
            You are sharing
          </div>
        )}
      </div>

      {/* Share Action Buttons */}
      <div className="flex gap-2">
        {!isSharing ? (
          <button
            onClick={onStartShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition"
          >
            <ScreenShare className="w-4 h-4" />
            Share Your Screen
          </button>
        ) : (
          <button
            onClick={onStopShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition"
          >
            <MonitorX className="w-4 h-4" />
            Stop Sharing
          </button>
        )}
      </div>
      <p className="text-[10px] text-slate-400 text-center mt-2">
        Streams work cross-platform on macOS and Linux study pods.
      </p>
    </div>
  );
}
