import React, { useState } from 'react';
import { Bell, BellOff, Volume2, Moon, Zap, Clock } from 'lucide-react';

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
      background: on ? 'var(--g)' : 'var(--alt)', position: 'relative', transition: 'background 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 8, background: '#fff',
        position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

const NOTIF_TYPES = [
  { label: 'Pings from Sakura', key: 'pings' },
  { label: 'Calls & knocks', key: 'calls' },
  { label: 'Chat messages', key: 'chat' },
  { label: 'Deadline alerts', key: 'deadlines' },
  { label: 'Focus reminders', key: 'focus' },
  { label: 'Email tracker', key: 'email' },
  { label: 'Goal milestones', key: 'goals' },
  { label: 'Streak warnings', key: 'streak' },
];

export default function Notifications() {
  const [matrix, setMatrix] = useState(() => {
    const m = {};
    NOTIF_TYPES.forEach(t => { m[t.key] = { banner: true, sound: true, phone: t.key === 'pings' || t.key === 'calls' || t.key === 'deadlines', email: t.key === 'deadlines' }; });
    return m;
  });

  const [pingGentle, setPingGentle] = useState(true);
  const [pingNormal, setPingNormal] = useState(true);
  const [pingUrgent, setPingUrgent] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');

  const toggle = (key, col) => {
    setMatrix(prev => ({
      ...prev,
      [key]: { ...prev[key], [col]: !prev[key][col] },
    }));
  };

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto', maxWidth: 900 }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: '0 0 24px' }}>
        Notification Settings
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Left: matrix */}
        <div>
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 16 }}>What notifies you</div>

            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: 4, marginBottom: 8, padding: '0 0 8px', borderBottom: '1px solid var(--line)' }}>
              <div />
              {['Banner', 'Sound', 'Phone', 'Email'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {NOTIF_TYPES.map(t => (
              <div key={t.key} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: 4,
                padding: '10px 0', borderBottom: '1px solid var(--line)', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: 'var(--fg)' }}>{t.label}</span>
                {['banner', 'sound', 'phone', 'email'].map(col => (
                  <div key={col} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Toggle on={matrix[t.key][col]} onChange={() => toggle(t.key, col)} />
                  </div>
                ))}
              </div>
            ))}

            {/* Deadline alerts */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 8 }}>Deadline alerts</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['24h before', '6h before', '1h before', 'At deadline'].map(t => (
                  <button key={t} style={{
                    padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)',
                    background: t === '24h before' || t === '1h before' ? 'var(--gs)' : 'var(--card)',
                    color: t === '24h before' || t === '1h before' ? 'var(--gt)' : 'var(--muted)',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ping settings */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Zap size={16} style={{ color: 'var(--p)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Ping settings</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--fg)' }}>Gentle pings</span>
                <Toggle on={pingGentle} onChange={setPingGentle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--fg)' }}>Normal pings</span>
                <Toggle on={pingNormal} onChange={setPingNormal} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--fg)' }}>Urgent pings</span>
                <Toggle on={pingUrgent} onChange={setPingUrgent} />
              </div>
              <div style={{ padding: '8px 0', borderTop: '1px solid var(--line)', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg)' }}>Urgent daily limit</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--r)' }}>3 per day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quiet times */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Moon size={16} style={{ color: 'var(--b)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Quiet times</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>From</div>
                <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)',
                  background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none',
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>To</div>
                <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)',
                  background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none',
                }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
              All notifications except urgent pings are silenced during quiet hours.
            </div>
          </div>

          {/* Preview */}
          <div style={{
            padding: 16, borderRadius: 'var(--radius)', background: 'var(--alt)',
            border: '1px solid var(--line)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Banner preview</div>
            <div style={{
              padding: '10px 14px', borderRadius: 10, background: 'var(--card)',
              border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--ps)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--p)',
              }}>S</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>Sakura pinged you</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Break in 5 · Normal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
