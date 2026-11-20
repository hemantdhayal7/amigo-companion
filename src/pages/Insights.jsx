import React from 'react';
import { TrendingUp, Clock, BookOpen, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { today } from '../utils/store';
import { useSyncData } from '../hooks/useSyncData';

export default function Insights({ user }) {
  const [focusLog] = useSyncData(user, 'focus_log', { totalMinutes: 0, sessions: 0, longestMin: 0, breaks: 0, daily: {} });
  const [tasks] = useSyncData(user, 'planner_tasks', []);
  const [goals] = useSyncData(user, 'goals', []);
  const [streak] = useSyncData(user, 'streak', { days: 12, freezes: 2 });
  const [reviewStats] = useSyncData(user, 'review_stats', { reviewed: 0, correct: 0 });

  const daily = focusLog.daily || {};
  const now = new Date();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    weekDays.push({ day: d.toLocaleDateString([], { weekday: 'short' }), h: (daily[iso] || 0) / 60, iso });
  }
  const maxH = Math.max(...weekDays.map(d => d.h), 1);
  const weeklyTotal = weekDays.reduce((s, d) => s + d.h, 0);
  const avgDaily = weeklyTotal / 7;
  const todayISO = today();
  const todayDay = weekDays.find(d => d.iso === todayISO)?.day || '';

  const doneTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const goalAvg = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  const KPIS = [
    { label: 'Weekly total', value: `${Math.floor(weeklyTotal)}h ${Math.round((weeklyTotal % 1) * 60)}m`, sub: `${focusLog.sessions} sessions total`, up: weeklyTotal > 0, color: 'var(--g)' },
    { label: 'Avg / day', value: `${Math.floor(avgDaily)}h ${Math.round((avgDaily % 1) * 60)}m`, sub: 'Target: 5h', up: avgDaily >= 5, color: 'var(--b)' },
    { label: 'Task completion', value: `${completionRate}%`, sub: `${doneTasks}/${totalTasks} tasks done`, up: completionRate > 50, color: 'var(--p)' },
    { label: 'Goal progress', value: `${goalAvg}%`, sub: `${goals.length} active goals`, up: goalAvg > 50, color: 'var(--a)' },
  ];

  const subjects = goals.map(g => ({
    name: g.label,
    pct: g.progress,
    color: g.color || 'var(--g)',
  }));

  const wellDone = [];
  const improve = [];
  const nextWeek = [];

  if (streak.days > 7) wellDone.push(`Maintained ${streak.days}-day streak`);
  if (doneTasks > 0) wellDone.push(`Completed ${doneTasks} tasks`);
  if (focusLog.sessions > 0) wellDone.push(`${focusLog.sessions} focus sessions`);
  if (wellDone.length === 0) wellDone.push('Start tracking to see progress');

  if (weekDays.some(d => d.h === 0)) improve.push(`${weekDays.filter(d => d.h === 0).length} days with no focus time`);
  if (avgDaily < 5) improve.push('Daily average below 5h target');
  if (reviewStats.reviewed > 0 && reviewStats.correct / reviewStats.reviewed < 0.7) improve.push('Flashcard accuracy below 70%');
  if (improve.length === 0) improve.push('Great work — keep it up!');

  nextWeek.push('Hit 5h daily average');
  if (goals.length > 0) nextWeek.push(`Push ${goals[0]?.label} past ${goals[0]?.progress + 10}%`);
  nextWeek.push('Review all due flashcards');

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: '0 0 24px' }}>
        Insights
      </h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {KPIS.map((k, i) => (
          <div key={i} style={{
            padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "'Space Grotesk', sans-serif" }}>
              {k.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11 }}>
              {k.up ? <ArrowUpRight size={12} style={{ color: 'var(--g)' }} /> : <ArrowDownRight size={12} style={{ color: 'var(--a)' }} />}
              <span style={{ color: 'var(--muted)' }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Daily focus chart */}
        <div style={{
          padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
          background: 'var(--card)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 20 }}>Daily Focus Hours</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{d.h > 0 ? `${d.h.toFixed(1)}h` : ''}</span>
                <div style={{
                  width: '100%', borderRadius: 6,
                  height: d.h > 0 ? (d.h / maxH) * 100 : 4,
                  background: d.day === todayDay ? 'var(--g)' : 'var(--bs)',
                  transition: 'height 0.3s',
                }} />
                <span style={{
                  fontSize: 10, fontWeight: d.day === todayDay ? 600 : 400,
                  color: d.day === todayDay ? 'var(--fg)' : 'var(--muted)',
                }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject / Goals breakdown */}
        <div style={{
          padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
          background: 'var(--card)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 16 }}>Goals Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {subjects.length > 0 ? subjects.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: s.color, width: `${s.pct}%` }} />
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: 12, textAlign: 'center' }}>Set goals to see breakdown</div>
            )}
          </div>
        </div>

        {/* Weekly review */}
        <div style={{
          padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
          background: 'var(--card)', gridColumn: '1 / -1',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Weekly Review</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g)', marginBottom: 8 }}>What went well</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--fg2)', lineHeight: 1.8 }}>
                {wellDone.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--a)', marginBottom: 8 }}>Could improve</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--fg2)', lineHeight: 1.8 }}>
                {improve.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--b)', marginBottom: 8 }}>Next week goals</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--fg2)', lineHeight: 1.8 }}>
                {nextWeek.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
