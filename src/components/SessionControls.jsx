import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, LogOut, Clock } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function SessionControls({
  currentStatus,
  onStatusChange,
  onLeaveSession,
  onClose,
}) {
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      sounds.playCelebration();
      if (timerMode === 'focus') {
        alert('🎉 Focus session complete! Time to take a healthy 5-minute break.');
      } else {
        alert('⏰ Break is over! Ready to return to focus mode?');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, timerMode]);

  const switchTimerMode = (mode, minutes) => {
    setTimerMode(mode);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-sm w-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm">Study Session & Pomodoro</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/10 transition"
        >
          Close
        </button>
      </div>

      {/* Pomodoro Timer display */}
      <div className="p-3 bg-slate-800/60 rounded-xl border border-white/5 text-center mb-3">
        <div className="flex justify-center gap-1.5 mb-2">
          <button
            onClick={() => switchTimerMode('focus', 25)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
              timerMode === 'focus'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => switchTimerMode('shortBreak', 5)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
              timerMode === 'shortBreak'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5m Break
          </button>
          <button
            onClick={() => switchTimerMode('longBreak', 15)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
              timerMode === 'longBreak'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            15m Rest
          </button>
        </div>

        <div className="text-3xl font-mono font-bold tracking-tight text-white my-1">
          {formatTime(secondsLeft)}
        </div>

        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(timerMode === 'focus' ? 25 * 60 : timerMode === 'shortBreak' ? 5 * 60 : 15 * 60);
            }}
            className="p-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status selector */}
      <div className="mb-3">
        <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
          Your Current Status to Study Mates:
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { id: 'studying', label: '🎧 Deep Focus', icon: BookOpen },
            { id: 'break', label: '☕ Taking Break', icon: Coffee },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusChange(st.id)}
              className={`py-1.5 px-2 rounded-lg text-left border flex items-center gap-1.5 transition ${
                currentStatus === st.id
                  ? 'bg-indigo-900/60 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <st.icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stop / Leave Session Action */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={onLeaveSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          Leave & Stop Study Session
        </button>
      </div>
    </div>
  );
}
