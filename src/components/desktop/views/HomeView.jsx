import React from 'react';
import {
  Play,
  Video,
  Sparkles,
  Mail,
  Flame,
  ArrowRight,
  Clock,
  CheckCircle2,
  Shield,
  Calendar as CalendarIcon,
} from 'lucide-react';

export default function HomeView({
  userName = 'Hemant',
  partnerName = 'Sakura',
  streakDays = 12,
  todayFocusedMinutes = 130, // 2h 10m
  dailyGoalMinutes = 240, // 4h
  tasks = [],
  onNavigate,
  onOpenPingModal,
}) {
  const goalPercent = Math.min(100, Math.round((todayFocusedMinutes / dailyGoalMinutes) * 100));
  const focusedHours = Math.floor(todayFocusedMinutes / 60);
  const focusedMins = todayFocusedMinutes % 60;
  const goalHours = Math.floor(dailyGoalMinutes / 60);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = Math.max(tasks.length, 4);

  // Auto-planned schedule items
  const tonightPlan = [
    { time: '6:00 PM', color: '#16A34A', title: 'Deep Work: Statistics Exam Prep', meta: '50m session with Sakura', now: true, opacity: 1 },
    { time: '6:50 PM', color: '#B45309', title: 'Quiet Tea Break & Quiz Swap', meta: '10m break together', now: false, opacity: 0.9 },
    { time: '7:00 PM', color: '#7C3AED', title: 'Machine Learning Problem Set', meta: '50m assignment sprint', now: false, opacity: 0.8 },
    { time: '7:50 PM', color: '#2563EB', title: 'Draft Certification Sheet', meta: '30m summary review', now: false, opacity: 0.7 },
  ];

  // Weekly focus comparison data (You in Green vs Sakura in Purple)
  const weekData = [
    { day: 'Mon', me: '75%', her: '65%', weight: 'normal', color: 'var(--muted)' },
    { day: 'Tue', me: '60%', her: '80%', weight: 'normal', color: 'var(--muted)' },
    { day: 'Wed', me: '90%', her: '85%', weight: 'normal', color: 'var(--muted)' },
    { day: 'Thu', me: '45%', her: '70%', weight: 'normal', color: 'var(--muted)' },
    { day: 'Fri', me: '80%', her: '95%', weight: 'normal', color: 'var(--muted)' },
    { day: 'Sat', me: '68%', her: '72%', weight: 'bold', color: 'var(--fg)' },
    { day: 'Sun', me: '30%', her: '20%', weight: 'normal', color: 'var(--muted)' },
  ];

  return (
    <div className="flex-1 min-h-0 p-6 overflow-y-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
      {/* Main Left Column */}
      <div className="flex flex-col gap-4 min-w-0">
        {/* Today's Goal Ring Banner */}
        <section className="card p-5 px-6 flex items-center gap-6 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
          <div className="flex-1 min-w-0">
            <div className="lbl text-[11px] font-bold tracking-wider uppercase text-[var(--muted)]">
              Today's goal
            </div>
            <div className="h font-['Space_Grotesk'] text-2xl font-bold mt-1 text-[var(--fg)]">
              {focusedHours}h {focusedMins}m focused <span className="text-[var(--muted)] font-medium text-lg">of {goalHours}h</span>
            </div>
            <div className="mut text-xs text-[var(--muted)] mt-1.5 max-w-lg leading-relaxed">
              One more 50-minute session before midnight keeps your {streakDays}-day study streak with {partnerName} alive.
            </div>
            <div className="flex items-center gap-2.5 mt-4">
              <button
                onClick={() => onNavigate('focus')}
                className="btn pri h-9 px-4 rounded-xl bg-[#15803D] text-white font-semibold text-xs flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all"
              >
                <Play size={14} fill="currentColor" />
                Resume focus session
              </button>
              <button
                onClick={() => onNavigate('room')}
                className="btn h-9 px-4 rounded-xl bg-[var(--alt)] text-[var(--fg)] font-semibold text-xs flex items-center gap-2 hover:bg-[var(--line)]/60 active:scale-95 transition-all"
              >
                <Video size={15} />
                Join {partnerName} in the study room
              </button>
            </div>
          </div>

          {/* SVG Circular Dial */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="var(--alt)"
                strokeWidth="10"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="var(--g)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="301.6"
                strokeDashoffset={301.6 - (301.6 * goalPercent) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="font-['Space_Grotesk'] text-2xl font-bold leading-none text-[var(--fg)]">
                {goalPercent}%
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium mt-0.5">of goal</span>
            </div>
          </div>
        </section>

        {/* 4 Metric Chips */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-3.5 px-4 bg-[var(--card)] border border-[var(--line)] rounded-xl">
            <div className="lbl text-[10px] font-bold tracking-wider uppercase text-[var(--muted)]">Tasks today</div>
            <div className="h font-['Space_Grotesk'] text-xl font-bold mt-1 text-[var(--fg)]">
              {completedTasksCount} <span className="mut font-normal text-xs text-[var(--muted)]">of {totalTasksCount} done</span>
            </div>
          </div>

          <div className="card p-3.5 px-4 bg-[var(--card)] border border-[var(--line)] rounded-xl">
            <div className="lbl text-[10px] font-bold tracking-wider uppercase text-[var(--muted)]">Sessions</div>
            <div className="h font-['Space_Grotesk'] text-xl font-bold mt-1 text-[var(--fg)]">
              3 <span className="mut font-normal text-xs text-[var(--muted)]">· 1 together</span>
            </div>
          </div>

          <div className="card p-3.5 px-4 bg-[var(--card)] border border-[var(--line)] rounded-xl">
            <div className="lbl text-[10px] font-bold tracking-wider uppercase text-[var(--muted)]">Shield blocked</div>
            <div className="h font-['Space_Grotesk'] text-xl font-bold mt-1 text-[var(--fg)]">
              7 <span className="mut font-normal text-xs text-[var(--muted)]">distractions</span>
            </div>
          </div>

          <div className="card p-3.5 px-4 bg-[var(--card)] border border-[var(--r)] rounded-xl">
            <div className="lbl text-[10px] font-bold tracking-wider uppercase text-[var(--r)]">Next deadline</div>
            <div className="font-bold text-xs mt-1 text-[var(--fg)] truncate">ML Assignment</div>
            <div className="mut text-[11px] text-[var(--muted)]">Tomorrow, 11:59 PM</div>
          </div>
        </section>

        {/* Middle Two Cards: Tonight's Plan + Weekly Focus */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Tonight's Plan */}
          <div className="card p-4 px-5 flex flex-col min-h-0 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="h font-['Space_Grotesk'] text-sm font-bold flex-1 text-[var(--fg)]">Tonight's plan</div>
              <span className="chip px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--ps)] text-[var(--p)] flex items-center gap-1">
                <Sparkles size={11} />
                Auto-planned
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[var(--line)]">
              {tonightPlan.map((slot, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5" style={{ opacity: slot.opacity }}>
                  <span className="text-xs font-semibold text-[var(--muted)] w-16">{slot.time}</span>
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: slot.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[var(--fg)] truncate">{slot.title}</div>
                    <div className="text-[11px] text-[var(--muted)] truncate">{slot.meta}</div>
                  </div>
                  {slot.now && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gs)] text-[var(--gt)]">
                      Now
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex-1" />
            <button
              onClick={() => onNavigate('calendar')}
              className="font-semibold text-xs text-[var(--gt)] hover:underline text-left mt-3 flex items-center gap-1"
            >
              <span>Open calendar</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Focus This Week Comparison */}
          <div className="card p-4 px-5 flex flex-col min-h-0 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h font-['Space_Grotesk'] text-sm font-bold flex-1 text-[var(--fg)]">Focus this week</div>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span className="w-2 h-2 rounded-xs bg-[var(--g)]" />
                <span>You</span>
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span className="w-2 h-2 rounded-xs bg-[var(--p)]" />
                <span>{partnerName}</span>
              </span>
            </div>
            <div className="mut text-xs text-[var(--muted)] mb-3">
              15h 12m for you · 16h 42m for {partnerName}
            </div>

            {/* Bar Chart */}
            <div className="flex-1 min-h-[140px] flex items-end justify-between gap-2.5 pt-2">
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex items-end gap-1 h-28 w-full justify-center">
                    <div
                      className="w-3 rounded-t-sm bg-[var(--g)] transition-all duration-700"
                      style={{ height: d.me }}
                      title={`You: ${d.me}`}
                    />
                    <div
                      className="w-3 rounded-t-sm bg-[var(--p)] transition-all duration-700"
                      style={{ height: d.her }}
                      title={`${partnerName}: ${d.her}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: d.color, fontWeight: d.weight }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('insights')}
              className="font-semibold text-xs text-[var(--gt)] hover:underline text-left mt-3 flex items-center gap-1"
            >
              <span>See insights</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>

      {/* Right Column: Partner Status + Deadlines + Emails */}
      <div className="flex flex-col gap-4 min-w-0">
        {/* Partner Live Card */}
        <section className="card p-4 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--ps)] text-[var(--p)] flex items-center justify-center font-['Space_Grotesk'] font-bold text-lg shadow-xs">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[var(--fg)]">{partnerName}</div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--gt)] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Focusing now</span>
              </div>
            </div>
            <div className="h font-['Space_Grotesk'] text-lg font-bold text-[var(--p)]">
              32:10
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-[var(--alt)]">
            <div className="mut text-[10px] uppercase font-bold text-[var(--muted)]">Working on</div>
            <div className="font-semibold text-xs text-[var(--fg)] mt-0.5 truncate">
              Review linear algebra notes
            </div>
            <div className="h-1.5 rounded-full bg-[var(--line)] mt-2 overflow-hidden">
              <div className="w-3/4 h-full rounded-full bg-[var(--p)]" />
            </div>
            <div className="mut text-[11px] text-[var(--muted)] mt-1.5">3 of 4 tasks done today</div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={onOpenPingModal}
              className="btn h-8 rounded-xl bg-[var(--alt)] hover:bg-[#7C3AED] hover:text-white text-xs font-semibold justify-center transition-all"
            >
              Nudge
            </button>
            <button
              onClick={() => onNavigate('focus')}
              className="btn h-8 rounded-xl bg-[var(--alt)] hover:bg-[var(--line)] text-xs font-semibold justify-center transition-all"
            >
              Sync timer
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className="btn h-8 rounded-xl bg-[var(--alt)] hover:bg-[var(--line)] text-xs font-semibold justify-center transition-all"
            >
              Message
            </button>
          </div>
        </section>

        {/* Due Soon Deadlines */}
        <section className="card p-4 px-4.5 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
          <div className="flex items-center mb-2">
            <div className="h font-['Space_Grotesk'] text-sm font-bold flex-1 text-[var(--fg)]">Due soon</div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-semibold text-[var(--gt)] hover:underline"
            >
              Planner
            </button>
          </div>

          <div className="flex flex-col divide-y divide-[var(--line)]">
            <div className="flex items-center gap-2.5 py-2">
              <span className="w-2 h-2 rounded-full bg-[var(--r)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--fg)] truncate">ML Assignment submission</div>
                <div className="text-[11px] font-semibold text-[var(--r)]">Tomorrow, 11:59 PM</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 py-2">
              <span className="w-2 h-2 rounded-xs bg-[var(--a)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--fg)] truncate">Stats quiz</div>
                <div className="text-[11px] text-[var(--muted)]">Tue 17 Nov · in 3 days</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 py-2">
              <span className="w-2 h-2 rounded-xs bg-[var(--g)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--fg)] truncate">Final project presentation</div>
                <div className="text-[11px] text-[var(--muted)]">Sat 28 Nov · in 14 days</div>
              </div>
            </div>
          </div>
        </section>

        {/* Email Tracker */}
        <section className="card p-4 px-4.5 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={15} className="text-[var(--b)]" />
            <div className="h font-['Space_Grotesk'] text-sm font-bold flex-1 text-[var(--fg)]">Email tracker</div>
            <span className="chip px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--rs)] text-[var(--r)]">
              1 needs action
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[var(--line)]">
            <div className="py-2">
              <div className="font-semibold text-xs text-[var(--fg)]">Registrar — Course registration</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">Confirm spring semester by Monday</div>
            </div>

            <div className="py-2">
              <div className="font-semibold text-xs text-[var(--fg)]">Prof. Sharma — Extension request</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">Awaiting reply for 2 days · follow-up drafted</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
