import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PenTool,
  ExternalLink,
  PhoneOff,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

export default function StudyRoomView({
  userName = 'Hemant',
  partnerName = 'Sakura',
  isMicOn = false,
  isVideoOn = false,
  onToggleMic = () => {},
  onToggleVideo = () => {},
  localCamStream,
  remoteCamStream,
  isPeerMicOn = false,
  isPeerVideoOn = false,
  isSharingScreen = false,
  onToggleScreenShare = () => {},
  onSendEmoji = () => {},
  onToggleFloatOnTop = () => {},
  onFloatTop,
  onLeaveRoom = () => {},
  tasks = [],
  onToggleTask = () => {},
  timerSeconds = 18 * 60 + 24,
}) {
  const handleFloatTop = onToggleFloatOnTop || onFloatTop || (() => {});
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'chat' | 'board'
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [recentCheer, setRecentCheer] = useState({ emoji: '💖', text: `${partnerName} cheered you on` });
  const [isQuietMode, setIsQuietMode] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && localCamStream) {
      localVideoRef.current.srcObject = localCamStream;
    }
  }, [localCamStream, isVideoOn]);

  // Attach remote partner stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteCamStream) {
      remoteVideoRef.current.srcObject = remoteCamStream;
    }
  }, [remoteCamStream, isPeerVideoOn]);

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reactionEmojis = ['💖', '✨', '🌸', '☕'];

  const handleQuickReaction = (emoji) => {
    if (onSendEmoji) onSendEmoji(emoji);
    setRecentCheer({ emoji, text: `You sent ${emoji} to ${partnerName}` });
    setTimeout(() => {
      setRecentCheer({ emoji: '💖', text: `${partnerName} cheered you on` });
    }, 4000);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg)] select-none">
      {/* Room Header */}
      <header className="h-14 flex-shrink-0 flex items-center gap-3 px-6 border-b border-[var(--line)]">
        <div className="h font-['Space_Grotesk'] text-base font-bold text-[var(--fg)]">
          Study Room
        </div>
        <span className="chip px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--rs)] text-[var(--r)] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--r)] animate-pulse" />
          Live · 12:34
        </span>
        <button
          onClick={() => setIsQuietMode(!isQuietMode)}
          className="chip px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--ps)] text-[var(--p)] flex items-center gap-1.5 hover:brightness-95 transition-all"
        >
          <MicOff size={11} />
          {isQuietMode ? 'Quiet mode · mics open at the break' : 'Open mic active'}
        </button>

        <div className="flex-1" />

        <span className="mut text-xs text-[var(--muted)] hidden sm:inline">
          Peer-to-peer · encrypted · 720p
        </span>

        {/* Float on Top / Pop-out button */}
        <button
          onClick={handleFloatTop}
          className="btn h-8 px-3 rounded-xl bg-[var(--alt)] hover:bg-[var(--line)] text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          title="Minimize call to floating circular companion"
        >
          <ExternalLink size={13} />
          <span>Float on top</span>
        </button>
      </header>

      {/* Main Room Body */}
      <div className="flex-1 min-h-0 p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
        {/* Left Column: Video Arena + Call Controls */}
        <section className="flex flex-col gap-3.5 min-w-0">
          {/* Main Video View (Partner) */}
          <div className="flex-1 min-h-[360px] relative rounded-3xl bg-[var(--card)] border border-[var(--line)] flex items-center justify-center overflow-hidden shadow-xs">
            {isPeerVideoOn && remoteCamStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-3xl bg-[var(--ps)] text-[var(--p)] flex items-center justify-center font-['Space_Grotesk'] text-5xl font-bold shadow-md">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div className="mut text-xs text-[var(--muted)] font-medium">
                  {partnerName}'s camera is off
                </div>
              </div>
            )}

            {/* Top-Left: Real-time Cheering Toast */}
            {recentCheer && (
              <div className="absolute left-4 top-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-medium shadow-md">
                <span className="text-base">{recentCheer.emoji}</span>
                <span>{recentCheer.text}</span>
              </div>
            )}

            {/* Bottom-Left: Partner Task Badge */}
            <div className="absolute left-4 bottom-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs shadow-md">
              <span className="font-semibold text-emerald-400">{partnerName}</span>
              <span className="text-white/80 text-[11px]">Review linear algebra notes · 3 of 4</span>
            </div>

            {/* Bottom-Right: You PiP Camera */}
            <div className="absolute right-4 bottom-4 w-44 h-28 rounded-2xl bg-[var(--alt)] border border-white/20 shadow-xl overflow-hidden flex items-center justify-center">
              {isVideoOn && localCamStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[var(--gs)] text-[var(--gt)] flex items-center justify-center font-['Space_Grotesk'] font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute left-2.5 bottom-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                You
              </span>
            </div>
          </div>

          {/* Interactive Call Controls Bar */}
          <div className="flex items-center gap-2.5 select-none">
            {/* Mic Toggle */}
            <button
              onClick={onToggleMic}
              className={`ctl w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isMicOn
                  ? 'bg-[var(--rs)] text-[var(--r)] hover:brightness-95'
                  : 'bg-[var(--alt)] text-[var(--fg)] hover:bg-[var(--line)]'
              }`}
              title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={onToggleVideo}
              className={`ctl w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isVideoOn
                  ? 'bg-[var(--rs)] text-[var(--r)] hover:brightness-95'
                  : 'bg-[var(--alt)] text-[var(--fg)] hover:bg-[var(--line)]'
              }`}
              title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Screen Share */}
            <button
              onClick={onToggleScreenShare}
              className={`ctl w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isSharingScreen
                  ? 'bg-[var(--gs)] text-[var(--gt)]'
                  : 'bg-[var(--alt)] text-[var(--fg)] hover:bg-[var(--line)]'
              }`}
              title="Share screen"
            >
              <Monitor size={20} />
            </button>

            {/* Whiteboard / Notes */}
            <button
              className="ctl w-12 h-12 rounded-full bg-[var(--alt)] text-[var(--fg)] hover:bg-[var(--line)] flex items-center justify-center transition-all"
              title="Shared whiteboard"
            >
              <PenTool size={19} />
            </button>

            {/* One-Tap Emoji Reaction Pod */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--card)] border border-[var(--line)] shadow-xs ml-2">
              {reactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  className="w-9 h-9 rounded-full hover:bg-[var(--alt)] active:scale-125 transition-all flex items-center justify-center text-lg"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Leave Room Button */}
            <button
              onClick={onLeaveRoom}
              className="btn h-11 px-5 rounded-full bg-[#DC2626] text-white font-semibold text-xs flex items-center gap-2 hover:bg-[#B91C1C] active:scale-95 shadow-sm transition-all"
            >
              <PhoneOff size={16} />
              <span>Leave room</span>
            </button>
          </div>
        </section>

        {/* Right Column: Shared Timer + Split Tasks + Quiz */}
        <aside className="flex flex-col gap-3 min-w-0">
          {/* Shared Pomodoro Timer Card */}
          <div className="card p-4 bg-[var(--card)] border border-[var(--line)] rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="flex-1 min-w-0">
              <div className="lbl text-[10px] font-bold uppercase tracking-wider text-[var(--gt)]">
                Shared timer · round 2 of 4
              </div>
              <div className="h font-['Space_Grotesk'] text-3xl font-bold text-[var(--fg)] tabular-nums mt-0.5">
                {formatTimer(timerSeconds)}
              </div>
              <div className="mut text-xs text-[var(--muted)]">Break together at 6:43 PM</div>
            </div>
            <button
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className="btn h-9 px-3 rounded-xl bg-[var(--alt)] hover:bg-[var(--line)] text-xs font-semibold"
            >
              {isTimerPaused ? 'Resume' : 'Pause for both'}
            </button>
          </div>

          {/* Tabbed Panel: Tasks / Chat / Board */}
          <div className="card flex-1 min-h-[320px] p-4 flex flex-col bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
            {/* Segmented Tab Headers */}
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--alt)] mb-3">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                  activeTab === 'tasks' ? 'bg-[var(--card)] text-[var(--fg)] shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                  activeTab === 'chat' ? 'bg-[var(--card)] text-[var(--fg)] shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                Chat · 2 held
              </button>
              <button
                onClick={() => setActiveTab('board')}
                className={`flex-1 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                  activeTab === 'board' ? 'bg-[var(--card)] text-[var(--fg)] shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                Board
              </button>
            </div>

            {/* Tab: Tasks Split */}
            {activeTab === 'tasks' && (
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                {/* You Section */}
                <div className="lbl text-[10px] font-bold uppercase text-[var(--muted)]">You</div>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask && onToggleTask(task.id)}
                    className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed ? 'bg-[var(--g)] border-[var(--g)] text-white' : 'border-[var(--muted)] group-hover:border-[var(--g)]'
                      }`}
                    >
                      {task.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                    </div>
                    <span className={`flex-1 text-xs font-medium truncate ${task.completed ? 'line-through text-[var(--muted)]' : 'text-[var(--fg)]'}`}>
                      {task.text}
                    </span>
                  </div>
                ))}

                {/* Sakura Section */}
                <div className="lbl text-[10px] font-bold uppercase text-[var(--muted)] mt-2">
                  {partnerName}
                </div>
                <div className="flex items-center gap-2.5 py-1.5">
                  <span className="w-4 h-4 rounded-full border-2 border-[var(--p)] flex-shrink-0" />
                  <span className="flex-1 text-xs font-medium text-[var(--fg)] truncate">
                    Review linear algebra notes
                  </span>
                  <span className="mut text-[11px] text-[var(--muted)]">32 min</span>
                </div>
                <div className="flex items-center gap-2.5 py-1.5 opacity-60">
                  <span className="w-4 h-4 rounded-full bg-[var(--p)] flex-shrink-0 flex items-center justify-center text-white">
                    <CheckCircle2 size={10} strokeWidth={3} />
                  </span>
                  <span className="flex-1 text-xs font-medium text-[var(--muted)] line-through truncate">
                    Eigenvalue problem set
                  </span>
                </div>

                <div className="flex-1" />

                {/* Break Quiz from Sakura Held Card */}
                <div className="p-3 rounded-xl bg-[var(--ps)] border border-purple-500/20 mt-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-[var(--p)]" />
                    <span className="font-bold text-xs text-[var(--p)]">Break quiz from {partnerName}</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--fg)] mt-1.5">
                    What does high variance in a model usually indicate?
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">
                    Opens at the break so it doesn't interrupt your focus.
                  </div>
                  <button className="btn h-7 px-3 rounded-lg text-xs font-semibold bg-[var(--card)] hover:brightness-95 text-[var(--fg)] mt-2 shadow-xs">
                    Answer at break
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Chat */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                <div className="text-xs text-[var(--muted)] text-center py-2">
                  Quiet mode active · messages deliver silently during focus
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--alt)] self-start max-w-[85%] text-xs">
                  <span className="font-bold text-[var(--p)] block">{partnerName}</span>
                  Remember to review question 4 before the session ends!
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--gs)] text-[var(--gt)] self-end max-w-[85%] text-xs font-medium">
                  Got it, just finishing question 3 now ✨
                </div>
              </div>
            )}

            {/* Tab: Board */}
            {activeTab === 'board' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Sparkles size={24} className="text-[var(--g)] mb-2" />
                <div className="font-bold text-xs">Collaborative Scratchpad</div>
                <div className="text-[11px] text-[var(--muted)] mt-1">
                  Share formulas and scratch notes in real-time
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
