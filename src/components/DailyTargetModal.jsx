import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, Plus, Trash2, Users, Bell, Sparkles, X } from 'lucide-react';
import { sounds } from '../utils/audio';
import CabbageLogo from './CabbageLogo';

export default function DailyTargetModal({
  target,
  tasks,
  onUpdateTarget,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  members,
  selfId,
  reminderInterval,
  onSetReminderInterval,
  secondsToNextNudge,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('my-target'); // 'my-target' | 'peers'
  const [newTargetInput, setNewTargetInput] = useState(target);
  const [isEditingTarget, setIsEditingTarget] = useState(!target);
  const [newTaskText, setNewTaskText] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleSaveTarget = (e) => {
    e.preventDefault();
    if (newTargetInput.trim()) {
      onUpdateTarget(newTargetInput.trim());
      setIsEditingTarget(false);
      sounds.playPop();
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim());
      setNewTaskText('');
      sounds.playPop();
    }
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl max-w-sm w-full text-slate-100 flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center p-0.5">
            <CabbageLogo size={24} animated />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Amigo 🎉 Daily Targets</h3>
            <p className="text-[10px] text-slate-400">Live accountability with study mates</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-800/80 rounded-xl mb-3 text-xs">
        <button
          onClick={() => setActiveTab('my-target')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition ${
            activeTab === 'my-target'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          My Goal & Checklist
        </button>
        <button
          onClick={() => setActiveTab('peers')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition ${
            activeTab === 'peers'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Mates' Goals ({members.length})
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto pr-1 flex-1 space-y-3">
        {activeTab === 'my-target' ? (
          <>
            {/* Today's Main Target Input / Card */}
            <div className="p-3 bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Today's Core Target
                </span>
                {!isEditingTarget && target && (
                  <button
                    onClick={() => {
                      setNewTargetInput(target);
                      setIsEditingTarget(true);
                    }}
                    className="text-[10px] text-indigo-300 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingTarget ? (
                <form onSubmit={handleSaveTarget} className="space-y-2">
                  <input
                    type="text"
                    value={newTargetInput}
                    onChange={(e) => setNewTargetInput(e.target.value)}
                    placeholder="e.g. Finish 15 LeetCode problems & Chapter 4"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    {target && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTarget(false)}
                        className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
                    >
                      Save Target
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs font-semibold text-white leading-relaxed">
                  {target || 'No target set yet. Click Edit to define today\'s mission!'}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="p-3 bg-slate-800/50 border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">To-Do Completion</span>
                <span className="font-mono font-bold text-indigo-300">
                  {completedCount}/{tasks.length} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progressPercent === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Add Task Input */}
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a step to today's target..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow active:scale-95 transition"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Tasks Checklist */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-center text-[11px] text-slate-500 py-3">
                  No to-do tasks added yet. Add bite-sized steps above!
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-white/5 transition group"
                  >
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0 hover:text-indigo-400" />
                      )}
                      <span
                        className={`text-xs ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {task.text}
                      </span>
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 10-Minute Hover / Nudge Setting */}
            <div className="p-2.5 bg-slate-800/30 border border-indigo-500/20 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-slate-200">10-Min Target Hover Nudge</div>
                  <div className="text-[10px] text-slate-400">
                    Next check-in in: <span className="text-amber-300 font-mono font-bold">{formatCountdown(secondsToNextNudge)}</span>
                  </div>
                </div>
              </div>
              <select
                value={reminderInterval}
                onChange={(e) => onSetReminderInterval(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs px-2 py-1 focus:outline-none"
              >
                <option value={5}>Every 5m</option>
                <option value={10}>Every 10m</option>
                <option value={15}>Every 15m</option>
                <option value={20}>Every 20m</option>
              </select>
            </div>
          </>
        ) : (
          /* Mates' Goals Tab */
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 bg-slate-800/50 p-2 rounded-xl border border-white/5">
              See what your study group is aiming for today. Cheer each other on!
            </p>
            {members.map((member) => (
              <div
                key={member.id}
                className="p-3 bg-slate-800/60 rounded-2xl border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{member.avatar || '🎓'}</span>
                    <span className="font-semibold text-xs text-white">
                      {member.name} {member.id === selfId ? '(You)' : ''}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {member.progress || 0}% Done
                  </span>
                </div>
                <div className="text-xs text-slate-300 pl-7">
                  {member.target ? (
                    <span className="italic">"{member.target}"</span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">No target posted yet</span>
                  )}
                </div>
                {/* Mini progress bar */}
                <div className="w-full h-1.5 bg-slate-700/80 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${member.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
