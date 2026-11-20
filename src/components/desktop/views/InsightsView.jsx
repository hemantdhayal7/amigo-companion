import React, { useState } from 'react';

export default function InsightsView() {
  const [period, setPeriod] = useState('week'); // 'week' | 'month' | 'semester'

  const weekData = [
    { day: 'Mon', label: '2.5h', meH: '110px', herH: '90px' },
    { day: 'Tue', label: '3.8h', meH: '160px', herH: '140px' },
    { day: 'Wed', label: '1.9h', meH: '80px', herH: '120px' },
    { day: 'Thu', label: '4.2h', meH: '175px', herH: '160px' },
    { day: 'Fri', label: '3.0h', meH: '130px', herH: '150px' },
    { day: 'Sat', label: '2.8h', meH: '120px', herH: '130px' },
    { day: 'Sun', label: 'Today', meH: '95px', herH: '85px' },
  ];

  const subjects = [
    { name: 'Machine Learning', time: '6h 15m (41%)', pct: '41%', color: 'var(--g)' },
    { name: 'Statistics', time: '4h 30m (30%)', pct: '30%', color: 'var(--p)' },
    { name: 'Linear Algebra', time: '2h 12m (15%)', pct: '15%', color: 'var(--a)' },
    { name: 'Certification prep', time: '2h 15m (14%)', pct: '14%', color: 'var(--b)' },
  ];

  // Generate 26 weeks x 7 days heatmap cells
  const heatmapWeeks = 26;
  const heatmapDays = 7;
  const cells = [];
  for (let w = 0; w < heatmapWeeks; w++) {
    for (let d = 0; d < heatmapDays; d++) {
      const active = (w * 7 + d) % 3 !== 0;
      const intensity = ((w + d) % 4) * 0.25 + 0.25;
      cells.push({
        id: `${w}-${d}`,
        bg: active ? 'var(--g)' : 'var(--alt)',
        opacity: active ? intensity : 0.4,
      });
    }
  }

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
          <div className="h" style={{ fontSize: '20px' }}>Insights</div>
          <div className="mut" style={{ fontSize: '12px' }}>
            Week of 9 – 15 November · compared with last week
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: 'var(--alt)' }}>
          {['week', 'month', 'semester'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                height: '28px',
                padding: '0 12px',
                borderRadius: '8px',
                background: period === p ? 'var(--card)' : 'transparent',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                color: period === p ? 'var(--fg)' : 'var(--muted)',
                boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <button className="btn" onClick={() => alert('Insights report generated')}>
          Export report
        </button>
      </header>

      {/* Main Insights Content */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
        }}
      >
        {/* Metric Cards Row */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="lbl">Focus time</div>
            <div className="h" style={{ fontSize: '24px', marginTop: '2px' }}>15h 12m</div>
            <div style={{ fontSize: '12px', color: 'var(--gt)', fontWeight: 600 }}>2h 05m more than last week</div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="lbl">Sessions</div>
            <div className="h" style={{ fontSize: '24px', marginTop: '2px' }}>23</div>
            <div className="mut" style={{ fontSize: '12px' }}>40 min average · 9 with Sakura</div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="lbl">Tasks completed</div>
            <div className="h" style={{ fontSize: '24px', marginTop: '2px' }}>31</div>
            <div className="mut" style={{ fontSize: '12px' }}>86% of what you planned</div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="lbl">Best focus window</div>
            <div className="h" style={{ fontSize: '24px', marginTop: '2px' }}>6 – 9 PM</div>
            <div className="mut" style={{ fontSize: '12px' }}>Longest unbroken sessions</div>
          </div>
        </section>

        {/* Charts Middle Row */}
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '14px' }}>
          {/* Comparative Bar Chart */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Daily focus hours</div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }} className="mut">
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--g)' }}></span>You
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }} className="mut">
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--p)' }}></span>Sakura
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }} className="mut">
                <span style={{ width: '12px', borderTop: '2px dashed var(--muted)' }}></span>4h goal
              </span>
            </div>

            <div style={{ height: '220px', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '14px', padding: '0 6px', marginTop: '10px' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '160px', borderTop: '2px dashed var(--line)' }}></div>
              {weekData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '175px' }}>
                    <div style={{ width: '20px', height: d.meH, borderRadius: '5px 5px 2px 2px', background: 'var(--g)' }}></div>
                    <div style={{ width: '20px', height: d.herH, borderRadius: '5px 5px 2px 2px', background: 'var(--p)' }}></div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{d.day}</div>
                  <div className="mut" style={{ fontSize: '11px', marginTop: '-4px' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="h" style={{ fontSize: '15px' }}>Where the time went</div>
            {subjects.map((s) => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</span>
                  <span className="mut" style={{ fontSize: '12px' }}>{s.time}</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--alt)', marginTop: '5px' }}>
                  <div style={{ width: s.pct, height: '100%', borderRadius: '4px', background: s.color }}></div>
                </div>
              </div>
            ))}
            <div style={{ flex: 1 }}></div>
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--as)', fontSize: '12px' }}>
              <strong style={{ color: 'var(--a)' }}>Linear Algebra is behind plan.</strong> You planned 4h and logged 2h 12m. Sakura has it as her strongest subject this week.
            </div>
          </div>
        </section>

        {/* Heatmap Section */}
        <section className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div className="h" style={{ fontSize: '15px', flex: 1 }}>Consistency · last 26 weeks</div>
            <span className="mut" style={{ fontSize: '12px' }}>132 active days · longest streak 19</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridTemplateRows: 'repeat(7, 14px)',
              gap: '4px',
              justifyContent: 'start',
              overflowX: 'auto',
              paddingBottom: '6px',
            }}
          >
            {cells.map((c) => (
              <div
                key={c.id}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: c.bg,
                  opacity: c.opacity,
                }}
              ></div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
