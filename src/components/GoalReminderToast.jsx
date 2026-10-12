import React from 'react';
import { Target, CheckCircle2, Circle, Clock, Flame, ChevronRight, X } from 'lucide-react';
import { sounds } from '../utils/audio';
import CabbageLogo from './CabbageLogo';

export default function GoalReminderToast({
  target,
  tasks,
  progress,
  onToggleTask,
  onOpenTargetModal,
  onSnooze,
  onDismiss,
}) {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const nextTask = pendingTasks[0];

  const handleQuickComplete = (taskId) => {
    sounds.playCelebration();
    onToggleTask(taskId);
  };

  return (
    <div className="mb-2 p-3.5 bg-gradient-to-br from-indigo-950/95 to-slate-900/95 border border-indigo-400/40 rounded-3xl shadow-2xl backdrop-blur-xl text-slate-100 animate-bounce-short border-t-indigo-300/60 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CabbageLogo size={24} animated />
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            Amigo's 10-Min Nudge
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/70 px-1.5 py-0.2 rounded border border-amber-500/30">
              {progress}% done
            </span>
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Title */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-indigo-100 line-clamp-1">
          {target ? `"${target}"` : 'Keep up the momentum!'}
        </p>
      </div>

      {/* Quick Next Task Action */}
      {nextTask ? (
        <div className="mb-2.5 p-2 bg-slate-800/70 border border-white/10 rounded-xl flex items-center justify-between gap-2">
          <button
            onClick={() => handleQuickComplete(nextTask.id)}
            className="flex items-center gap-2 text-left flex-1 group"
          >
            <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0 transition" />
            <span className="text-[11px] text-slate-200 group-hover:text-white line-clamp-1 font-medium">
              Next: {nextTask.text}
            </span>
          </button>
          <button
            onClick={() => handleQuickComplete(nextTask.id)}
            className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 transition shrink-0"
          >
            Done ✓
          </button>
        </div>
      ) : (
        <div className="mb-2.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>All current tasks checked off! Amazing work!</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onSnooze}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-semibold shadow transition active:scale-95"
        >
          <Flame className="w-3 h-3 text-amber-300" />
          In Flow (Snooze 10m)
        </button>
        <button
          onClick={onOpenTargetModal}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-medium border border-white/5 transition"
        >
          To-Do List
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
