import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  X,
  Hourglass,
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  User,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VisionOSFocusCockpit({
  isOpen,
  onClose,
  target = 'Complete exam prep milestone & problem set',
  tasks = [],
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTarget,
  onAssignTaskToPeer,
  members = [],
  peerFocusTimer = null,
  onSyncFocusTimer = () => {},
  deadline = '11:30 PM',
  onSwitchToClassic,
}) {
  // Navigation Tabs: 'my-tasks' | 'peer-tasks' | 'dual-orbit'
  const [activeTab, setActiveTab] = useState('my-tasks');

  // Local Stopwatch for active session
  const [seconds, setSeconds] = useState(39 * 60 + 5); // default matches 39:05 from screenshot
  const [isRunning, setIsRunning] = useState(true);
  const [sessionCount, setSessionCount] = useState(2);

  // Peer Stopwatch state (Siddhi's timer)
  const peer = members.find((m) => m.id !== 'self') || null;
  const peerName = peer?.name || peerFocusTimer?.name || 'Siddhi';
  const isPeerLive = Boolean(peer);
  const peerTasks = peer?.tasks || [];
  const peerTarget = peer?.target || peerFocusTimer?.activeTask || 'Drafting Chapter 4 Summary Notes';
  const [peerSeconds, setPeerSeconds] = useState(() => peerFocusTimer?.seconds || 24 * 60 + 18);
  const [isPeerRunning, setIsPeerRunning] = useState(() => peerFocusTimer?.isRunning ?? true);

  // Sync incoming peer timer
  useEffect(() => {
    if (peerFocusTimer) {
      if (typeof peerFocusTimer.seconds === 'number') setPeerSeconds(peerFocusTimer.seconds);
      if (typeof peerFocusTimer.isRunning === 'boolean') setIsPeerRunning(peerFocusTimer.isRunning);
    }
  }, [peerFocusTimer]);

  // Peer timer ticking simulation if peer is running
  useEffect(() => {
    let peerInterval = null;
    if (isPeerRunning && isPeerLive) {
      peerInterval = setInterval(() => {
        setPeerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(peerInterval);
  }, [isPeerRunning, isPeerLive]);

  // Editing Active Objective State
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [editObjectiveText, setEditObjectiveText] = useState(target);

  // Editing Subtask State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');

  // Add Subtask State
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [assignee, setAssignee] = useState('self'); // 'self' | 'peer'

  // Dragging state for spatial floating window
  const [position, setPosition] = useState({ x: 60, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 60, initialY: 60 });

  // Broadcast timer changes to peer whenever state changes or every 3 seconds
  useEffect(() => {
    onSyncFocusTimer(seconds, isRunning, target);
  }, [isRunning, target]);

  useEffect(() => {
    let syncInterval = null;
    if (isRunning) {
      syncInterval = setInterval(() => {
        onSyncFocusTimer(seconds, isRunning, target);
      }, 3000);
    }
    return () => clearInterval(syncInterval);
  }, [isRunning, seconds, target]);

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

  // Subtask counts
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = Math.max(tasks.length, 1);
  const progressPct = Math.round((completedCount / totalCount) * 100);

  // Peer Subtask counts
  const peerCompletedCount = peerTasks.filter((t) => t.completed).length;
  const peerTotalCount = Math.max(peerTasks.length, 1);
  const peerProgressPct = Math.round((peerCompletedCount / peerTotalCount) * 100);

  // SVG Ring Calculations
  const strokeRadius = 56;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = circumference - (circumference * progressPct) / 100;

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('form')) return;
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
        y: Math.max(10, Math.min(window.innerHeight - 520, dragRef.current.initialY + dy)),
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

  // Handle Objective Save
  const handleSaveObjective = (e) => {
    e.preventDefault();
    if (editObjectiveText.trim() && onUpdateTarget) {
      onUpdateTarget(editObjectiveText.trim());
      setIsEditingObjective(false);
    }
  };

  // Handle Subtask Add
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;

    if (assignee === 'peer' && onAssignTaskToPeer) {
      onAssignTaskToPeer(newSubtaskText.trim(), '20m');
    } else if (onAddTask) {
      onAddTask(newSubtaskText.trim(), '25m');
    }

    setNewSubtaskText('');
    setShowAddInput(false);
  };

  // Handle Subtask Edit Save
  const handleSaveTaskEdit = (taskId) => {
    if (!editTaskText.trim()) return;
    if (onEditTask) {
      onEditTask(taskId, editTaskText.trim());
    }
    setEditingTaskId(null);
    setEditTaskText('');
  };

  const handleCompleteAndNext = () => {
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
        width: '740px',
        maxWidth: '96vw',
      }}
    >
      {/* Main Glass Studio Container */}
      <div
        onMouseDown={handleMouseDown}
        className="relative rounded-[32px] p-6 shadow-2xl transition-all cursor-grab active:cursor-grabbing border border-white/15"
        style={{
          background: 'rgba(16, 18, 27, 0.82)',
          backdropFilter: 'blur(45px) saturate(190%)',
          WebkitBackdropFilter: 'blur(45px) saturate(190%)',
          boxShadow: '0 30px 80px -10px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Top Header Bar with Clean Spacing (Zero Overlap) */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 gap-3">
          {/* Left: Branding & Peer Live Tag */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest uppercase text-sky-400">
              FOCUS COCKPIT
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10.5px] font-semibold text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>{peerName} Live</span>
            </div>
          </div>

          {/* Center Tabs: My Tasks vs Peer Tasks vs Dual Orbit */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'my-tasks'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('peer-tasks')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'peer-tasks'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>{peerName}'s Tasks</span>
              {peerTasks.length > 0 && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                  {peerTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dual-orbit')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dual-orbit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Dual Timers
            </button>
          </div>

          {/* Right: Classic View & Close (Properly Spaced) */}
          <div className="flex items-center gap-2">
            {onSwitchToClassic && (
              <button
                onClick={onSwitchToClassic}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition"
                title="Switch back to standard modal"
              >
                Classic View
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
              title="Close Focus Studio"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Studio Grid: Left Focus Chrono & Right Task Deck */}
        <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-6 items-stretch">
          
          {/* =========================================================
              LEFT COLUMN: FOCUS CHRONO & DEADLINE
          ========================================================== */}
          <div className="flex flex-col justify-between items-center text-center">
            
            {/* Circular Stopwatch Dial */}
            <div className="relative my-2 flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={strokeRadius}
                  className="stroke-white/10 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={strokeRadius}
                  className="fill-none transition-all duration-700 ease-out"
                  stroke="url(#vision-dial-gradient-v2)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="vision-dial-gradient-v2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside Dial: Live Digits & Session */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                  {activeTab === 'peer-tasks' ? `${peerName}'s Time` : 'TIME SPENT'}
                </span>
                <span className="text-3xl font-black tracking-tight text-white font-mono my-0.5">
                  {activeTab === 'peer-tasks' ? formatTime(peerSeconds) : formatTime(seconds)}
                </span>
                <span className="text-xs font-semibold text-sky-400">
                  Session #{sessionCount}
                </span>
              </div>
            </div>

            {/* Stopwatch Control Buttons */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                  isRunning
                    ? 'bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {isRunning ? <Pause size={13} /> : <Play size={13} />}
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
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Mutual Peer Live Telemetry Pill */}
            <div
              className="w-full rounded-2xl p-2.5 border border-purple-500/20 text-left mb-3"
              style={{ background: 'rgba(192, 132, 252, 0.06)' }}
            >
              <div className="flex items-center justify-between text-[10px] font-semibold text-purple-300 mb-1">
                <span>⏱️ {peerName}'s Focus Timer</span>
                <span className="font-mono">{formatTime(peerSeconds)}</span>
              </div>
              <div className="text-[11px] text-white/80 truncate">
                {isPeerRunning ? '▶ Focusing:' : '⏸ Paused:'} {peerTarget}
              </div>
            </div>

            {/* Bottom: Today's Deadline Box */}
            <div
              className="w-full rounded-2xl p-3 border border-white/10 text-center"
              style={{ background: 'rgba(255, 255, 255, 0.035)' }}
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
              RIGHT COLUMN: TASK DECK & EDITABLE GOALS
          ========================================================== */}
          <div className="flex flex-col justify-between pl-0 md:pl-3 md:border-l md:border-white/10">
            
            {/* Header: Active Objective & Completion Ratio */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {activeTab === 'peer-tasks' ? `${peerName}'s Core Target` : 'Active Objective'}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                    High Priority
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/60 font-mono">
                  {activeTab === 'peer-tasks'
                    ? `${peerCompletedCount}/${peerTotalCount} Done`
                    : `${completedCount}/${totalCount} Done`}
                </span>
              </div>

              {/* Editable Active Objective Card */}
              <div
                className="rounded-2xl p-3.5 border border-white/10 mb-4 transition relative group"
                style={{ background: 'rgba(255, 255, 255, 0.045)' }}
              >
                {isEditingObjective ? (
                  <form onSubmit={handleSaveObjective} className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editObjectiveText}
                      onChange={(e) => setEditObjectiveText(e.target.value)}
                      placeholder="Enter active objective title..."
                      autoFocus
                      className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingObjective(false)}
                        className="px-2.5 py-1 rounded-lg text-xs text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Check size={12} />
                        <span>Save Goal</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[14.5px] font-bold text-white tracking-tight">
                        {activeTab === 'peer-tasks' ? peerTarget : target}
                      </div>
                      {activeTab === 'my-tasks' && (
                        <button
                          onClick={() => {
                            setEditObjectiveText(target);
                            setIsEditingObjective(true);
                          }}
                          className="opacity-70 group-hover:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition"
                          title="Edit Active Objective"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-white/50 mt-1 flex items-center gap-2 font-mono">
                      <span>⏱ {formatTime(activeTab === 'peer-tasks' ? peerSeconds : seconds)} recorded</span>
                      <span>•</span>
                      <span>Est: 1h 15m</span>
                    </div>
                  </>
                )}
              </div>

              {/* Subtasks Section Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] uppercase font-bold tracking-wider text-white/40">
                  {activeTab === 'peer-tasks' ? `${peerName}'s Checklist` : 'SUBTASKS & UP NEXT'}
                </span>
                <span className="text-[11px] text-sky-400 font-medium">
                  {activeTab === 'peer-tasks' ? 'Synced with Siddhi' : 'Click to toggle'}
                </span>
              </div>

              {/* Subtask List (With Edit and Delete support) */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(activeTab === 'peer-tasks' ? peerTasks : tasks).map((task, idx) => {
                  const isDone = task.completed;
                  const currentList = activeTab === 'peer-tasks' ? peerTasks : tasks;
                  const isCurrent = !isDone && idx === currentList.findIndex((t) => !t.completed);

                  if (editingTaskId === task.id) {
                    return (
                      <div key={task.id} className="p-2 rounded-xl bg-white/10 border border-sky-400/40 flex items-center gap-2">
                        <input
                          type="text"
                          value={editTaskText}
                          onChange={(e) => setEditTaskText(e.target.value)}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-black/40 text-xs text-white border border-white/20 focus:outline-none focus:border-sky-400"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTaskEdit(task.id)}
                          className="p-1 rounded-lg bg-sky-500 text-white hover:bg-sky-400"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="p-1 rounded-lg text-white/50 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={task.id || idx}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isDone
                          ? 'bg-white/[0.02] border-white/5 text-white/40'
                          : isCurrent
                          ? 'bg-sky-500/10 border-sky-400/30 text-white shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div
                        onClick={() => onToggleTask && onToggleTask(task.id)}
                        className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer"
                      >
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

                      {/* Right Tags & Edit/Delete Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {/* Hover Action Buttons */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(task.id);
                            setEditTaskText(task.text);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/15 text-white/50 hover:text-white transition"
                          title="Edit Task"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteTask) onDeleteTask(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition"
                          title="Delete Task"
                        >
                          <Trash2 size={12} />
                        </button>

                        {/* Status Tag */}
                        <span
                          className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md font-mono ${
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
                    </div>
                  );
                })}
              </div>

              {/* Inline Add Subtask Input Form with Assignee Selector */}
              {showAddInput ? (
                <form onSubmit={handleAddSubmit} className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/15 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Create Task For:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAssignee('self')}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition ${
                          assignee === 'self' ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        👤 Me
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignee('peer')}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition ${
                          assignee === 'peer' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {peerName}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      placeholder={assignee === 'peer' ? `Add a task for ${peerName}...` : "Enter next subtask..."}
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      className={`px-3 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1 ${
                        assignee === 'peer' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-sky-500 hover:bg-sky-400'
                      }`}
                    >
                      {assignee === 'peer' ? <Send size={12} /> : <Plus size={12} />}
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddInput(false)}
                      className="p-1.5 rounded-xl text-white/40 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </form>
              ) : null}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setAssignee(activeTab === 'peer-tasks' ? 'peer' : 'self');
                  setShowAddInput(true);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition"
              >
                <Plus size={13} />
                <span>{activeTab === 'peer-tasks' ? `Add Task for ${peerName}` : 'Add Subtask'}</span>
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
