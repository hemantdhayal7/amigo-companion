import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Mail, Sparkles, Flame, BookOpen, Play } from 'lucide-react';
import { load, save } from '../utils/store';

export default function Home({ user, profile, partner, partnerPresence, partnerName, partnerInitial }) {
  const [tasks] = useState(() => load('planner_tasks', []));
  const [deadlines] = useState(() => load('planner_deadlines', []));
  const [goals] = useState(() => load('goals', []));
  const [streak] = useState(() => load('streak', { days: 0, freezes: 2 }));
  const [focusLog] = useState(() => load('focus_log', { totalMinutes: 0, sessions: 0 }));
  const [plan, setPlan] = useState(() => load('tonight_plan', [
    { time: '7:00 PM', label: 'Shared revision — Statistics', done: false },
    { time: '8:30 PM', label: 'Practice exam set #4', done: false },
    { time: '9:30 PM', label: 'Review & wind down', done: false },
  ]));

  useEffect(() => { save('tonight_plan', plan); }, [plan]);

  const togglePlan = (i) => setPlan(prev => prev.map((p, j) => j === i ? { ...p, done: !p.done } : p));

  const myName = profile?.displayName || user?.displayName || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayName = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });

  const doneTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const focusHours = Math.floor(focusLog.totalMinutes / 60);
  const focusMins = focusLog.totalMinutes % 60;

  const partnerOnline = partnerPresence?.online;
  const partnerActivity = partnerPresence?.activity || partnerPresence?.status || 'offline';
  const statusText = partnerOnline
    ? (partnerActivity === 'studying' || partnerPresence?.status === 'studying'
      ? `Studying${partnerPresence?.activity ? ' — ' + partnerPresence.activity : ''}`
      : 'Online')
    : 'Offline';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            {greeting}, {myName}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            {dayName} · {totalTasks - doneTasks} tasks remaining · {deadlines.filter(d => d.urgent).length} urgent deadlines
          </p>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--gs)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--gt)' }}>
          <Flame size={16} /> {streak.days}-day streak
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Daily progress */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Today's Progress</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--g)', fontFamily: "'Space Grotesk', sans-serif" }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'var(--g)', width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
              <span><CheckCircle2 size={12} style={{ verticalAlign: -2 }} /> {doneTasks} tasks done</span>
              <span><Clock size={12} style={{ verticalAlign: -2 }} /> {focusHours}h {focusMins}m focused</span>
              <span><BookOpen size={12} style={{ verticalAlign: -2 }} /> {focusLog.sessions} sessions</span>
            </div>
          </div>

          {/* Partner card */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--ps)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--p)' }}>
                {partnerInitial || partnerName?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{partnerName}</div>
                <div style={{ fontSize: 12, color: partnerOnline ? 'var(--g)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: partnerOnline ? 'var(--g)' : 'var(--muted)', display: 'inline-block' }} />
                  {statusText}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Ping', 'Sync', 'Join room'].map(label => (
                <button key={label} style={{
                  padding: '7px 16px', borderRadius: 8, border: '1px solid var(--line)',
                  background: label === 'Ping' ? 'var(--p)' : 'var(--card)',
                  color: label === 'Ping' ? '#fff' : 'var(--fg)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Tonight's plan */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Tonight's Plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => togglePlan(i)}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', width: 60, flexShrink: 0 }}>{item.time}</span>
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, border: '2px solid var(--g)',
                    background: item.done ? 'var(--g)' : 'transparent', transition: 'background 0.2s',
                  }} />
                  <span style={{ fontSize: 13, color: item.done ? 'var(--muted)' : 'var(--fg)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Due soon */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Due Soon</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deadlines.length > 0 ? deadlines.slice(0, 3).map((item, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${item.urgent ? 'var(--r)' : 'var(--line)'}`,
                  background: item.urgent ? 'var(--rs)' : 'var(--alt)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: item.urgent ? 'var(--r)' : 'var(--muted)', marginTop: 2 }}>{item.due}</div>
                </div>
              )) : (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: 12, textAlign: 'center' }}>No upcoming deadlines</div>
              )}
            </div>
          </div>

          {/* Goals summary */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Goals Progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {goals.slice(0, 3).map((g, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--fg)' }}>{g.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: g.color }}>{g.progress}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--alt)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: g.color, width: `${g.progress}%` }} />
                  </div>
                </div>
              ))}
              {goals.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 8 }}>Set your first goal in Goals & Rewards</div>}
            </div>
          </div>

          {/* AI insight */}
          <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--alt)', border: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Sparkles size={16} style={{ color: 'var(--p)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6 }}>
              {doneTasks === totalTasks && totalTasks > 0
                ? 'All tasks done! Great work today. Consider reviewing your goals or starting tomorrow\'s prep.'
                : `You have ${totalTasks - doneTasks} tasks remaining today. ${deadlines.filter(d => d.urgent).length > 0 ? 'Focus on urgent deadlines first.' : 'Keep up the momentum!'}`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
