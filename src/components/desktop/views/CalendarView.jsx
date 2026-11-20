import React, { useState } from 'react';

export default function CalendarView() {
  const [viewMode, setViewMode] = useState('7days'); // '7days' | 'month' | 'agenda'

  const days = [
    { dow: 'SAT', num: '14', isToday: true, bg: 'var(--g)', color: '#fff', hasDue: false },
    { dow: 'SUN', num: '15', hasDue: true, due: 'ML Due 11:59p' },
    { dow: 'MON', num: '16', hasDue: false },
    { dow: 'TUE', num: '17', hasDue: true, due: 'Stats Quiz' },
    { dow: 'WED', num: '18', hasDue: false },
    { dow: 'THU', num: '19', hasDue: false },
    { dow: 'FRI', num: '20', hasDue: false },
  ];

  const hours = [
    '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM',
  ];

  const events = [
    {
      title: 'Practice questions',
      time: '6:00 – 6:45 PM',
      colIndex: 0,
      startHour: 10, // 6 PM is index 10 from 8 AM
      durationHours: 0.8,
      bg: 'var(--gs)',
      color: 'var(--gt)',
      border: '1px solid var(--g)',
    },
    {
      title: 'Study Room with Sakura',
      time: '6:15 – 7:30 PM',
      colIndex: 0,
      startHour: 10.25,
      durationHours: 1.25,
      bg: 'var(--ps)',
      color: 'var(--p)',
      border: '1px solid var(--p)',
    },
    {
      title: 'ML Final Polish',
      time: '2:00 – 4:00 PM',
      colIndex: 1,
      startHour: 6,
      durationHours: 2,
      bg: 'var(--rs)',
      color: 'var(--r)',
      border: '1px solid var(--r)',
    },
    {
      title: 'Stats Quiz Review',
      time: '10:00 – 11:30 AM',
      colIndex: 3,
      startHour: 2,
      durationHours: 1.5,
      bg: 'var(--as)',
      color: 'var(--a)',
      border: '1px solid var(--a)',
    },
    {
      title: 'Shared Session: Slides',
      time: '6:00 – 8:00 PM',
      colIndex: 5,
      startHour: 10,
      durationHours: 2,
      bg: 'var(--ps)',
      color: 'var(--p)',
      border: '1px dashed var(--p)',
    },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header
        style={{
          height: '68px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 28px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h" style={{ fontSize: '20px' }}>Calendar</div>
          <div className="mut" style={{ fontSize: '12px' }}>
            14 – 20 November · your blocks and Sakura's shared sessions
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: 'var(--alt)' }}>
          <button
            onClick={() => setViewMode('7days')}
            style={{
              height: '28px',
              padding: '0 12px',
              borderRadius: '8px',
              background: viewMode === '7days' ? 'var(--card)' : 'transparent',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              color: viewMode === '7days' ? 'var(--fg)' : 'var(--muted)',
              boxShadow: viewMode === '7days' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Next 7 days
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              height: '28px',
              padding: '0 12px',
              borderRadius: '8px',
              background: viewMode === 'month' ? 'var(--card)' : 'transparent',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              color: viewMode === 'month' ? 'var(--fg)' : 'var(--muted)',
              boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            style={{
              height: '28px',
              padding: '0 12px',
              borderRadius: '8px',
              background: viewMode === 'agenda' ? 'var(--card)' : 'transparent',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              color: viewMode === 'agenda' ? 'var(--fg)' : 'var(--muted)',
              boxShadow: viewMode === 'agenda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Agenda
          </button>
        </div>

        <button
          className="btn pri"
          onClick={() => {
            prompt('New study block:');
          }}
        >
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New block
        </button>
      </header>

      {/* Main Grid: Weekly Schedule + Sidebar */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 290px',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Left: Schedule Table */}
        <section className="card" style={{ padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Days Header */}
          <div style={{ display: 'flex', paddingLeft: '48px' }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center', paddingBottom: '6px' }}>
                <div className="mut" style={{ fontSize: '11px', fontWeight: 600 }}>{d.dow}</div>
                <div
                  className="h"
                  style={{
                    width: '30px',
                    height: '30px',
                    margin: '2px auto 0',
                    borderRadius: '50%',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: d.bg || 'transparent',
                    color: d.color || 'inherit',
                  }}
                >
                  {d.num}
                </div>
              </div>
            ))}
          </div>

          {/* Due Deadlines Row */}
          <div style={{ display: 'flex', paddingLeft: '48px', height: '26px', borderBottom: '1px solid var(--line)' }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, padding: '0 3px' }}>
                {d.hasDue && (
                  <div
                    className="ell"
                    style={{
                      height: '20px',
                      lineHeight: '20px',
                      padding: '0 6px',
                      borderRadius: '6px',
                      background: 'var(--r)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    {d.due}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hours Grid */}
          <div style={{ position: 'relative', height: `${hours.length * 36}px`, marginTop: '8px' }}>
            {hours.map((hr, idx) => (
              <div
                key={hr}
                style={{
                  height: '36px',
                  boxSizing: 'border-box',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                }}
              >
                <span className="mut" style={{ width: '48px', fontSize: '11px', paddingTop: '2px' }}>
                  {hr}
                </span>
                <div style={{ flex: 1, display: 'flex' }}>
                  {days.map((_, col) => (
                    <div
                      key={col}
                      style={{
                        flex: 1,
                        borderRight: col < 6 ? '1px dashed var(--line)' : 'none',
                        opacity: 0.4,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}

            {/* Event Overlays */}
            {events.map((ev, idx) => {
              const colWidthPercent = 100 / 7;
              const left = `calc(48px + ${ev.colIndex * colWidthPercent}% + 2px)`;
              const width = `calc(${colWidthPercent}% - 4px)`;
              const top = `${ev.startHour * 36}px`;
              const height = `${ev.durationHours * 36}px`;

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left,
                    width,
                    top,
                    height,
                    boxSizing: 'border-box',
                    padding: '4px 6px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: ev.bg,
                    color: ev.color,
                    border: ev.border,
                    fontSize: '11px',
                    lineHeight: 1.25,
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.85 }}>{ev.time}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Sidebar: Find Time Together, Countdown, Calendars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Find Time Together */}
          <section className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
                <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6" />
              </svg>
              <div className="h" style={{ fontSize: '15px' }}>Find time together</div>
            </div>
            <div className="mut" style={{ fontSize: '12px', marginTop: '6px' }}>
              Amigo compares both calendars and suggests the next slot you are both free.
            </div>
            <div style={{ marginTop: '10px', padding: '12px', borderRadius: '12px', border: '1px dashed var(--p)' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Thursday, 6:00 – 8:00 PM</div>
              <div className="mut" style={{ fontSize: '12px' }}>Both free · 2 days before nothing else is due</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="btn pri" style={{ height: '32px', fontSize: '12px' }}>Invite Sakura</button>
                <button className="btn" style={{ height: '32px', fontSize: '12px' }}>Other times</button>
              </div>
            </div>
          </section>

          {/* Countdown */}
          <section className="card" style={{ padding: '16px' }}>
            <div className="h" style={{ fontSize: '15px', marginBottom: '8px' }}>Countdown</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
              <div className="h" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--rs)', color: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                1
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>ML Assignment</div>
                <div className="mut" style={{ fontSize: '12px' }}>day left · 2h of work remaining</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
              <div className="h" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--as)', color: 'var(--a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                3
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Stats quiz</div>
                <div className="mut" style={{ fontSize: '12px' }}>days left · 4h of prep planned</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 0', borderTop: '1px solid var(--line)' }}>
              <div className="h" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--gs)', color: 'var(--gt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                14
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Final project presentation</div>
                <div className="mut" style={{ fontSize: '12px' }}>days left · shared with Sakura</div>
              </div>
            </div>
          </section>

          {/* Connected Calendars */}
          <section className="card" style={{ padding: '16px' }}>
            <div className="h" style={{ fontSize: '15px', marginBottom: '8px' }}>Connected calendars</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--g)' }}></span>
              <span>Google Calendar (Hemant)</span>
              <span className="mut" style={{ marginLeft: 'auto', fontSize: '11px' }}>Synced</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--p)' }}></span>
              <span>Sakura's Shared Busy Times</span>
              <span className="mut" style={{ marginLeft: 'auto', fontSize: '11px' }}>Live</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
