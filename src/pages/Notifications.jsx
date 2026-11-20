import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, Moon, Zap, Clock } from 'lucide-react';
import { load, save } from '../utils/store';

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
  { label: 'Pings from partner', key: 'pings' },
  { label: 'Calls & knocks', key: 'calls' },
  { label: 'Chat messages', key: 'chat' },
  { label: 'Deadline alerts', key: 'deadlines' },
  { label: 'Focus reminders', key: 'focus' },
  { label: 'Email tracker', key: 'email' },
  { label: 'Goal milestones', key: 'goals' },
  { label: 'Streak warnings', key: 'streak' },
];

const DEFAULT_MATRIX = {};
NOTIF_TYPES.forEach(t => {
  DEFAULT_MATRIX[t.key] = {
    banner: true, sound: true,
    phone: t.key === 'pings' || t.key === 'calls' || t.key === 'deadlines',
    email: t.key === 'deadlines',
  };
});

const DEFAULT_ALERTS = ['24h before', '1h before'];

export default function Notifications() {
  const [matrix, setMatrix] = useState(() => load('notif_matrix', DEFAULT_MATRIX));
  const [pingSettings, setPingSettings] = useState(() => load('notif_pings', { gentle: true, normal: true, urgent: true }));
  const [quietTimes, setQuietTimes] = useState(() => load('notif_quiet', { start: '22:00', end: '07:00' }));
  const [deadlineAlerts, setDeadlineAlerts] = useState(() => load('notif_deadline_alerts', DEFAULT_ALERTS));

  useEffect(() => { save('notif_matrix', matrix); }, [matrix]);
  useEffect(() => { save('notif_pings', pingSettings); }, [pingSettings]);
  useEffect(() => { save('notif_quiet', quietTimes); }, [quietTimes]);
  useEffect(() => { save('notif_deadline_alerts', deadlineAlerts); }, [deadlineAlerts]);

  const toggle = (key, col) => {
    setMatrix(prev => ({
      ...prev,
      [key]: { ...prev[key], [col]: !prev[key][col] },
    }));
  };

  const toggleAlert = (label) => {
    setDeadlineAlerts(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
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
                    <Toggle on={matrix[t.key]?.[col] || false} onChange={() => toggle(t.key, col)} />
                  </div>
                ))}
              </div>
            ))}

            {/* Deadline alerts */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 8 }}>Deadline alerts</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['24h before', '6h before', '1h before', 'At deadline'].map(t => (
                  <button key={t} onClick={() => toggleAlert(t)} style={{
                    padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)',
                    background: deadlineAlerts.includes(t) ? 'var(--gs)' : 'var(--card)',
                    color: deadlineAlerts.includes(t) ? 'var(--gt)' : 'var(--muted)',
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
                <Toggle on={pingSettings.gentle} onChange={v => setPingSettings(prev => ({ ...prev, gentle: v }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--fg)' }}>Normal pings</span>
                <Toggle on={pingSettings.normal} onChange={v => setPingSettings(prev => ({ ...prev, normal: v }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--fg)' }}>Urgent pings</span>
                <Toggle on={pingSettings.urgent} onChange={v => setPingSettings(prev => ({ ...prev, urgent: v }))} />
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
                <input type="time" value={quietTimes.start} onChange={e => setQuietTimes(prev => ({ ...prev, start: e.target.value }))} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)',
                  background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none',
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>To</div>
                <input type="time" value={quietTimes.end} onChange={e => setQuietTimes(prev => ({ ...prev, end: e.target.value }))} style={{
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
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>Partner pinged you</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Break in 5 · Normal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
