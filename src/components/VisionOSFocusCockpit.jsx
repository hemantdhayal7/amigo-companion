import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, Plus, X, Hourglass, Sparkles, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VisionOSFocusCockpit({
  isOpen,
  onClose,
  target = 'Solve 15 LeetCode DP Problems',
  tasks = [],
  onToggleTask,
  onAddTask,
  members = [],
  deadline = '11:30 PM',
  onSwitchToClassic,
}) {
  // Local Stopwatch for active session
  const [seconds, setSeconds] = useState(38 * 60 + 45); // default matches 38:45
  const [isRunning, setIsRunning] = useState(true);
  const [sessionCount, setSessionCount] = useState(2);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  // Dragging state for spatial floating window
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 80, initialY: 80 });

  // Ticking stopwatch
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Format MM:SS or HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => (n < 10 ? '0' : '') + n;
    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Find peer (Siddhi)
  const peer = members.find((m) => m.id !== 'self') || null;
  const peerName = peer?.name || 'Siddhi';
  const isPeerLive = Boolean(peer);
  const peerTask = peer?.target || 'Drafting Chapter 4 Summary Notes';

  // Subtask counts
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = Math.max(tasks.length, 1);
  const progressPct = Math.round((completedCount / totalCount) * 100);

  // SVG Ring Progress Calculations
  // Radius = 56, Circumference = 2 * PI * 56 ≈ 351.86
  const strokeRadius = 56;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = circumference - (circumference * progressPct) / 100;

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 720, dragRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 500, dragRef.current.initialY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    if (onAddTask) {
      onAddTask(newSubtaskText.trim(), '25m');
    }
    setNewSubtaskText('');
    setShowAddInput(false);
  };

  const handleCompleteAndNext = () => {
    // Subtle Apple-style confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00d2ff', '#7928ca', '#ff0080', '#30d158'],
      });
    } catch {
      // fallback
    }

    // Toggle the first pending task if available
    const firstPending = tasks.find((t) => !t.completed);
    if (firstPending && onToggleTask) {
      onToggleTask(firstPending.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '680px',
        maxWidth: '95vw',
      }}
    >
      {/* Top Tagline Indicator */}
      <div className="text-center mb-2 pointer-events-none">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-400/80 bg-sky-950/40 px-3 py-1 rounded-full border border-sky-400/20 backdrop-blur-md shadow-lg">
           Direction 2: VisionOS Floating Glass Studio
        </span>
      </div>

      {/* Main Glass Studio Container */}
      <div
        onMouseDown={handleMouseDown}
        className="relative rounded-[32px] p-6 shadow-2xl transition-all cursor-grab active:cursor-grabbing"
        style={{
          background: 'rgba(16, 18, 27, 0.78)',
          backdropFilter: 'blur(45px) saturate(190%)',
          WebkitBackdropFilter: 'blur(45px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 80px -10px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Top Actions: Switch to Classic & Close Button */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          {onSwitchToClassic && (
            <button
              onClick={onSwitchToClassic}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10.5px] font-medium text-white/60 hover:text-white transition"
              title="Switch to Classic Modal"
            >
              Classic View
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
            title="Close Focus Studio"
          >
            <X size={15} />
          </button>
        </div>

        {/* Studio Grid: Left Cockpit & Right Task Deck */}
        <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] gap-6 items-stretch">
          
          {/* =========================================================
              LEFT COLUMN: FOCUS COCKPIT
          ========================================================== */}
          <div className="flex flex-col justify-between items-center text-center">
            
            {/* Top Cockpit Header & Peer Presence */}
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-sky-400">
                FOCUS COCKPIT
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10.5px] font-semibold text-emerald-400 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span>{peerName} Live</span>
              </div>
            </div>

            {/* Circular Stopwatch Dial */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={strokeRadius}
                  className="stroke-white/10 fill-none"
                  strokeWidth="8"
                />
                {/* Progress Glowing Fill */}
                <circle
                  cx="70"
                  cy="70"
                  r={strokeRadius}
                  className="fill-none transition-all duration-700 ease-out"
                  stroke="url(#vision-dial-gradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="vision-dial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside Dial Typography */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                  TIME SPENT
                </span>
                <span className="text-2xl font-extrabold tracking-tight text-white font-mono my-0.5">
                  {formatTime(seconds)}
                </span>
                <span className="text-[11px] font-medium text-sky-400">
                  Session #{sessionCount}
                </span>
              </div>
            </div>

            {/* Mini Stopwatch Controls */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[11px] font-medium flex items-center gap-1.5 transition"
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
                <span>{isRunning ? 'Pause' : 'Resume'}</span>
              </button>
              <button
                onClick={() => {
                  setSeconds(0);
                  setSessionCount((prev) => prev + 1);
                }}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white transition"
                title="Reset Session Timer"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Bottom: Today's Deadline Box */}
            <div
              className="w-full rounded-2xl p-3 border border-white/10 text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.035)',
              }}
            >
              <div className="text-[9.5px] uppercase font-bold tracking-wider text-white/40">
                TODAY'S DEADLINE
              </div>
              <div className="text-base font-extrabold text-white tracking-tight mt-0.5 font-mono">
                {deadline}
              </div>
              <div className="text-[11px] font-medium text-amber-400/90 flex items-center justify-center gap-1 mt-1">
                <Hourglass size={11} />
                <span>2 Hours 45 Mins Left</span>
              </div>
            </div>

          </div>

          {/* =========================================================
              RIGHT COLUMN: OBJECTIVE & SUBTASK DECK
          ========================================================== */}
          <div className="flex flex-col justify-between pl-0 md:pl-3 md:border-l md:border-white/10">
            
            {/* Header: Active Objective & Completion Ratio */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">Active Objective</span>
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                    High Priority
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/50 font-mono">
                  {completedCount}/{totalCount} Done
                </span>
              </div>

              {/* Highlighted Active Goal Card */}
              <div
                className="rounded-2xl p-3.5 border border-white/10 mb-4 transition"
                style={{
                  background: 'rgba(255, 255, 255, 0.045)',
                }}
              >
                <div className="text-[14.5px] font-bold text-white tracking-tight">
                  {target}
                </div>
                <div className="text-xs text-white/50 mt-1 flex items-center gap-2 font-mono">
                  <span>⏱ {formatTime(seconds)} recorded</span>
                  <span>•</span>
                  <span>Est: 1h 15m</span>
                </div>
              </div>

              {/* Subtasks Section Header */}
              <div className="text-[10.5px] uppercase font-bold tracking-wider text-white/40 mb-2">
                SUBTASKS & UP NEXT
              </div>

              {/* Subtask List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task, idx) => {
                  const isDone = task.completed;
                  const isCurrent = !isDone && idx === tasks.findIndex((t) => !t.completed);

                  return (
                    <div
                      key={task.id || idx}
                      onClick={() => onToggleTask && onToggleTask(task.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isDone
                          ? 'bg-white/[0.02] border-white/5 text-white/40'
                          : isCurrent
                          ? 'bg-sky-500/10 border-sky-400/30 text-white shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'border-2 border-sky-400'
                              : 'border border-white/30'
                          }`}
                        >
                          {isDone ? <Check size={11} strokeWidth={3} /> : null}
                        </div>
                        <span
                          className={`text-xs font-medium truncate ${
                            isDone ? 'line-through text-white/35' : ''
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 font-mono ${
                          isDone
                            ? 'text-emerald-400/80 bg-emerald-500/10'
                            : isCurrent
                            ? 'text-sky-300 bg-sky-500/20 border border-sky-400/30'
                            : 'text-white/40'
                        }`}
                      >
                        {isDone ? 'Done (20m)' : isCurrent ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Inline Add Subtask Input Form */}
              {showAddInput ? (
                <form onSubmit={handleAddSubmit} className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    placeholder="Enter next subtask..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddInput(false)}
                    className="p-1.5 rounded-xl text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : null}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowAddInput(true)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition"
              >
                <Plus size={13} />
                <span>Add Subtask</span>
              </button>

              <button
                onClick={handleCompleteAndNext}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)',
                }}
              >
                <span>Complete & Next</span>
                <ChevronRight size={14} />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
