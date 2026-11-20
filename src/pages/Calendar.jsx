import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, Sparkles, Clock, Plus, Trash2 } from 'lucide-react';
import { uid } from '../utils/store';
import { useSyncData } from '../hooks/useSyncData';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_EVENTS = [
  { id: 'e1', date: new Date().toISOString().slice(0, 10), start: 7, end: 11, label: 'GATE Preparation', color: 'var(--g)', textColor: '#fff' },
  { id: 'e2', date: new Date().toISOString().slice(0, 10), start: 11, end: 16, label: 'Practice & Revision', color: 'var(--bs)', textColor: 'var(--b)' },
  { id: 'e3', date: new Date().toISOString().slice(0, 10), start: 16, end: 19, label: 'IIT Madras Theory', color: 'var(--ps)', textColor: 'var(--p)' },
  { id: 'e4', date: new Date().toISOString().slice(0, 10), start: 19, end: 22, label: 'Shared Study', color: 'var(--rs)', textColor: 'var(--r)' },
];

export default function Calendar({ user }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, saveEvents] = useSyncData(user, 'calendar_events', DEFAULT_EVENTS);
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => (new Date().getDay() + 6) % 7);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newStart, setNewStart] = useState(9);
  const [newEnd, setNewEnd] = useState(10);

  const weekDates = getWeekDates(weekOffset);
  const selectedDate = weekDates[selectedDayIdx];
  const selectedISO = selectedDate.toISOString().slice(0, 10);
  const dayEvents = events.filter(e => e.date === selectedISO);

  const monthLabel = weekDates[0].toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' — ' + weekDates[6].toLocaleDateString([], { month: 'short', day: 'numeric' });

  const addEvent = () => {
    if (!newLabel.trim() || newEnd <= newStart) return;
    const colors = [
      { color: 'var(--g)', textColor: '#fff' },
      { color: 'var(--bs)', textColor: 'var(--b)' },
      { color: 'var(--ps)', textColor: 'var(--p)' },
      { color: 'var(--as)', textColor: 'var(--a)' },
    ];
    const c = colors[events.length % colors.length];
    saveEvents(prev => [...prev, { id: uid(), date: selectedISO, start: newStart, end: newEnd, label: newLabel.trim(), ...c }]);
    setNewLabel('');
    setShowAdd(false);
  };

  const deleteEvent = (id) => saveEvents(prev => prev.filter(e => e.id !== id));

  const isToday = selectedISO === new Date().toISOString().slice(0, 10);

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            Calendar
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>Week of {monthLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Plus size={14} /> Add event
          </button>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeekOffset(0)} style={{ padding: '0 10px', height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>Today</button>
          <button onClick={() => setWeekOffset(w => w + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--g)', background: 'var(--card)', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Event name</div>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Study session..."
              autoFocus style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ width: 80 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Start</div>
            <select value={newStart} onChange={e => setNewStart(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none' }}>
              {HOURS.map(h => <option key={h} value={h}>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</option>)}
            </select>
          </div>
          <div style={{ width: 80 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>End</div>
            <select value={newEnd} onChange={e => setNewEnd(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 6px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none' }}>
              {HOURS.map(h => <option key={h} value={h}>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</option>)}
            </select>
          </div>
          <button onClick={addEvent} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: 0, marginBottom: 2 }}>
        <div />
        {DAYS.map((d, i) => {
          const wd = weekDates[i];
          const isSel = selectedDayIdx === i;
          const isTodayDate = wd.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
          return (
            <div key={d} onClick={() => setSelectedDayIdx(i)} style={{
              textAlign: 'center', padding: '8px 0', cursor: 'pointer',
              borderRadius: 10, background: isSel ? 'var(--gs)' : 'transparent',
            }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{d}</div>
              <div style={{
                fontSize: 18, fontWeight: isSel ? 700 : 500,
                color: isSel ? 'var(--gt)' : isTodayDate ? 'var(--g)' : 'var(--fg)',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>{wd.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
        <div>
          {HOURS.map(h => (
            <div key={h} style={{ height: 48, fontSize: 10, color: 'var(--muted)', textAlign: 'right', paddingRight: 8 }}>
              {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
            </div>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: 48, borderTop: '1px solid var(--line)' }} />
          ))}
          {dayEvents.map(e => (
            <div key={e.id} style={{
              position: 'absolute', left: 4, right: 4,
              top: (e.start - 7) * 48 + 2, height: (e.end - e.start) * 48 - 4,
              borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600,
              background: e.color, color: e.textColor,
              overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <span>{e.label}</span>
              <button onClick={() => deleteEvent(e.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: e.textColor, opacity: 0.6, padding: 0, flexShrink: 0 }}>
                <Trash2 size={12} />
              </button>
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
            You both have 7–10 PM free every evening this week.
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
            {dayEvents.length === 0 ? 'No events today. Add study blocks to stay on track.' : `${dayEvents.length} events scheduled for ${isToday ? 'today' : selectedDate.toLocaleDateString([], { weekday: 'long' })}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
