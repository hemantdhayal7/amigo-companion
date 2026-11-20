import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Mail, Sparkles, ArrowRight, Flame, BookOpen, Users } from 'lucide-react';

const TONIGHT_PLAN = [
  { time: '7:00 PM', label: 'Shared revision — Statistics', done: false },
  { time: '8:30 PM', label: 'Practice exam set #4', done: false },
  { time: '9:30 PM', label: 'Review & wind down', done: false },
];

const DUE_SOON = [
  { label: 'ML Assignment submission', due: 'Tomorrow, 11:59 PM', urgent: true },
  { label: 'Stats quiz', due: 'Tue 17 Nov · 3 days left', urgent: false },
];

export default function Home() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            {greeting}, Hemant
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            Saturday 14 Nov · You have 1h 15m of tasks and 2h free tonight.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '8px 16px', borderRadius: 10, background: 'var(--gs)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--gt)',
          }}>
            <Flame size={16} /> 12-day streak
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Daily progress */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Today's Progress</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--g)', fontFamily: "'Space Grotesk', sans-serif" }}>54%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'var(--g)', width: '54%' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
              <span><CheckCircle2 size={12} style={{ verticalAlign: -2 }} /> 2 tasks done</span>
              <span><Clock size={12} style={{ verticalAlign: -2 }} /> 3h 20m focused</span>
              <span><BookOpen size={12} style={{ verticalAlign: -2 }} /> 2 subjects</span>
            </div>
          </div>

          {/* Partner card */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'var(--ps)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'var(--p)',
              }}>S</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Sakura</div>
                <div style={{ fontSize: 12, color: 'var(--g)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--g)', display: 'inline-block' }} />
                  Studying — Projects & Theory
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
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tonight's plan */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Tonight's Plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TONIGHT_PLAN.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', width: 60, flexShrink: 0 }}>{item.time}</span>
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, border: '2px solid var(--g)',
                    background: item.done ? 'var(--g)' : 'transparent',
                  }} />
                  <span style={{ fontSize: 13, color: 'var(--fg)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Due soon */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Due Soon</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DUE_SOON.map((item, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${item.urgent ? 'var(--r)' : 'var(--line)'}`,
                  background: item.urgent ? 'var(--rs)' : 'var(--alt)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: item.urgent ? 'var(--r)' : 'var(--muted)', marginTop: 2 }}>{item.due}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Email tracker summary */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Mail size={16} style={{ color: 'var(--b)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Email Tracker</span>
              <span style={{ fontSize: 11, color: 'var(--b)', background: 'var(--bs)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, marginLeft: 'auto' }}>3 tracked</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
              {[{ n: 5, l: 'Unread', c: 'var(--fg)' }, { n: 2, l: 'Awaiting', c: 'var(--a)' }, { n: 12, l: 'Resolved', c: 'var(--g)' }].map((s, i) => (
                <div key={i} style={{ padding: '10px 0', borderRadius: 10, background: 'var(--alt)' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: "'Space Grotesk', sans-serif" }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI insight */}
          <div style={{
            padding: 16, borderRadius: 'var(--radius-lg)',
            background: 'var(--alt)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Sparkles size={16} style={{ color: 'var(--p)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6 }}>
              You have 1h 15m of tasks and 2h free tonight. The ML assignment needs about 2h before tomorrow's deadline.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
