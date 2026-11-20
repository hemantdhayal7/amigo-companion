import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Sparkles, Clock } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = [9, 10, 11, 12, 13, 14, 15];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

const EVENTS = [
  { day: 5, start: 7, end: 11, label: 'GATE Preparation', color: 'var(--g)', textColor: '#fff' },
  { day: 5, start: 11, end: 16, label: 'Practice & Revision', color: 'var(--bs)', textColor: 'var(--b)' },
  { day: 5, start: 16, end: 19, label: 'IIT Madras Theory', color: 'var(--ps)', textColor: 'var(--p)' },
  { day: 5, start: 19, end: 22, label: 'Shared Study', color: 'var(--rs)', textColor: 'var(--r)' },
  { day: 1, start: 23.99, end: 23.99, label: 'ML Assignment due', color: 'var(--r)', deadline: true },
  { day: 2, start: 14, end: 16, label: 'Stats quiz', color: 'var(--as)', textColor: 'var(--a)' },
];

export default function Calendar() {
  const [selectedDay, setSelectedDay] = useState(5);

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            Calendar
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>Week of Nov 9 — 15</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <ChevronLeft size={16} />
          </button>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: 0, marginBottom: 2 }}>
        <div />
        {DAYS.map((d, i) => (
          <div
            key={d}
            onClick={() => setSelectedDay(i)}
            style={{
              textAlign: 'center', padding: '8px 0', cursor: 'pointer',
              borderRadius: 10, background: selectedDay === i ? 'var(--gs)' : 'transparent',
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{d}</div>
            <div style={{
              fontSize: 18, fontWeight: selectedDay === i ? 700 : 500,
              color: selectedDay === i ? 'var(--gt)' : 'var(--fg)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>{DATES[i]}</div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        <div>
          {HOURS.map(h => (
            <div key={h} style={{ height: 48, fontSize: 10, color: 'var(--muted)', textAlign: 'right', paddingRight: 8, paddingTop: 0 }}>
              {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
            </div>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: 48, borderTop: '1px solid var(--line)' }} />
          ))}
          {/* Events for selected day */}
          {EVENTS.filter(e => e.day === selectedDay && !e.deadline).map((e, i) => (
            <div key={i} style={{
              position: 'absolute', left: 4, right: 4,
              top: (e.start - 7) * 48 + 2, height: (e.end - e.start) * 48 - 4,
              borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600,
              background: e.color, color: e.textColor,
              overflow: 'hidden',
            }}>
              {e.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <div style={{
          padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
          background: 'var(--card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Users size={14} style={{ color: 'var(--p)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Find time together</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            You and Sakura both have 7–10 PM free every evening this week.
          </p>
        </div>
        <div style={{
          padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
          background: 'var(--card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={14} style={{ color: 'var(--a)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Auto-plan</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Fit your 2 remaining tasks into tonight's free blocks automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
