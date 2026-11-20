import React, { useState } from 'react';
import { Phone, Video, Hand, Zap, Send, X } from 'lucide-react';

const PRESETS = [
  'Start now?', 'Break in 5', 'Call me when free',
  'Running 10 min late', 'Back to work', 'Proud of you ❤️',
];

const LEVELS = ['Gentle', 'Normal', 'Urgent'];

export default function Ping({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [level, setLevel] = useState('Normal');
  const [custom, setCustom] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => { setSent(false); onClose?.(); }, 2000);
  };

  const message = selected !== null ? PRESETS[selected] : custom;

  if (sent) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>⚡</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--p)', fontFamily: "'Space Grotesk', sans-serif" }}>Ping sent!</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Siddhi will see "{message}" as a {level.toLowerCase()} ping</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
          <Zap size={22} style={{ verticalAlign: -3, color: 'var(--p)', marginRight: 8 }} />
          Quick Ping
        </h1>
        {onClose && (
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)',
            background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Partner status */}
      <div style={{
        padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
        background: 'var(--card)', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: 'var(--ps)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: 'var(--p)',
        }}>S</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Siddhi</div>
          <div style={{ fontSize: 12, color: 'var(--g)' }}>Online · Projects & Theory</div>
        </div>
      </div>

      {/* Call buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { icon: Phone, label: 'Voice call', color: 'var(--g)' },
          { icon: Video, label: 'Video call', color: 'var(--b)' },
          { icon: Hand, label: 'Knock', color: 'var(--a)' },
        ].map(b => (
          <button key={b.label} style={{
            flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--line)',
            background: 'var(--card)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <b.icon size={20} style={{ color: b.color }} />
            <span style={{ fontSize: 11, color: 'var(--fg)', fontWeight: 500 }}>{b.label}</span>
          </button>
        ))}
      </div>

      {/* Preset grid */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 10 }}>Quick ping</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setSelected(i); setCustom(''); }} style={{
            padding: '12px 16px', borderRadius: 10,
            border: selected === i ? '2px solid var(--p)' : '1px solid var(--line)',
            background: selected === i ? 'var(--ps)' : 'var(--card)',
            color: selected === i ? 'var(--p)' : 'var(--fg)',
            fontSize: 13, fontWeight: selected === i ? 600 : 400,
            cursor: 'pointer', textAlign: 'left',
          }}>
            {p}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <input
        value={custom}
        onChange={e => { setCustom(e.target.value); setSelected(null); }}
        placeholder="Or type a custom message..."
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--alt)',
          fontSize: 13, color: 'var(--fg)', outline: 'none', marginBottom: 20,
          boxSizing: 'border-box',
        }}
      />

      {/* How loud */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 10 }}>How loud?</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, background: 'var(--alt)', padding: 3, borderRadius: 10, width: 'fit-content' }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)} style={{
            padding: '6px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: level === l ? 600 : 400,
            background: level === l ? (l === 'Urgent' ? 'var(--r)' : l === 'Normal' ? 'var(--g)' : 'var(--card)') : 'transparent',
            color: level === l ? (l === 'Gentle' ? 'var(--fg)' : '#fff') : 'var(--muted)',
          }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 24 }}>
        {level === 'Gentle' && 'Waits silently until her break'}
        {level === 'Normal' && 'Shows a banner with a soft chime'}
        {level === 'Urgent' && 'Rings for 20s, even through focus · 3/day limit'}
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!message}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: message ? 'var(--p)' : 'var(--alt)',
          color: message ? '#fff' : 'var(--muted)',
          fontSize: 14, fontWeight: 600, cursor: message ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Send size={16} /> Send ping
      </button>
    </div>
  );
}
