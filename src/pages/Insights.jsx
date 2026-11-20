import React from 'react';
import { TrendingUp, Clock, BookOpen, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const DAILY_HOURS = [
  { day: 'Mon', h: 4.5 }, { day: 'Tue', h: 5.2 }, { day: 'Wed', h: 3.8 },
  { day: 'Thu', h: 6.1 }, { day: 'Fri', h: 4.0 }, { day: 'Sat', h: 5.5 }, { day: 'Sun', h: 0 },
];
const maxH = Math.max(...DAILY_HOURS.map(d => d.h));

const SUBJECTS = [
  { name: 'Statistics', hours: 5.2, pct: 34, color: 'var(--b)' },
  { name: 'GATE Prep', hours: 4.8, pct: 32, color: 'var(--g)' },
  { name: 'ML & AI', hours: 3.1, pct: 20, color: 'var(--p)' },
  { name: 'Certification', hours: 2.1, pct: 14, color: 'var(--a)' },
];

const KPIS = [
  { label: 'Weekly total', value: '15h 12m', sub: '+2h from last week', up: true, color: 'var(--g)' },
  { label: 'Avg / day', value: '4h 20m', sub: 'Target: 5h', up: false, color: 'var(--b)' },
  { label: 'Longest session', value: '2h 10m', sub: 'Thursday deep work', up: true, color: 'var(--p)' },
  { label: 'Focus rate', value: '87%', sub: '3% improvement', up: true, color: 'var(--a)' },
];

export default function Insights() {
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
            {DAILY_HOURS.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{d.h > 0 ? `${d.h}h` : ''}</span>
                <div style={{
                  width: '100%', borderRadius: 6,
                  height: d.h > 0 ? (d.h / maxH) * 100 : 4,
                  background: d.day === 'Sat' ? 'var(--g)' : 'var(--bs)',
                  transition: 'height 0.3s',
                }} />
                <span style={{
                  fontSize: 10, fontWeight: d.day === 'Sat' ? 600 : 400,
                  color: d.day === 'Sat' ? 'var(--fg)' : 'var(--muted)',
                }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject breakdown */}
        <div style={{
          padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
          background: 'var(--card)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 16 }}>Subject Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SUBJECTS.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.hours}h · {s.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: s.color, width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
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
                <li>Maintained 12-day streak</li>
                <li>Finished all Statistics practice sets</li>
                <li>Sakura & you synced 5 sessions</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--a)', marginBottom: 8 }}>Could improve</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--fg2)', lineHeight: 1.8 }}>
                <li>Sunday had no focus time</li>
                <li>ML subject falling behind target</li>
                <li>Average session length dropping</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--b)', marginBottom: 8 }}>Next week goals</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--fg2)', lineHeight: 1.8 }}>
                <li>Hit 5h daily average</li>
                <li>Complete ML Chapter 8</li>
                <li>Submit final project outline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
