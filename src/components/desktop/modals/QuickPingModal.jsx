import React, { useState, useEffect } from 'react';

export default function QuickPingModal({ isOpen, onClose, onSendPing, onNavigate }) {
  const [loudness, setLoudness] = useState('quiet'); // 'quiet' | 'gentle' | 'urgent'
  const [selectedPreset, setSelectedPreset] = useState('tea');
  const [customText, setCustomText] = useState('');

  const presets = [
    {
      id: 'tea',
      title: 'Tea or coffee break?',
      sub: '5-minute stretch together',
      icon: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z',
    },
    {
      id: 'focus',
      title: 'Ready for the next round?',
      sub: 'Starting a 25-minute Pomodoro',
      icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    },
    {
      id: 'stuck',
      title: 'Stuck on something',
      sub: 'Need your eyes for 2 minutes',
      icon: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
    },
    {
      id: 'cheer',
      title: 'Proud of you — keep going!',
      sub: 'Silent cheer on her timer',
      icon: 'M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10 10 12 7 12 3z',
    },
    {
      id: 'room',
      title: 'Study room is open',
      sub: 'Jump into video when ready',
      icon: 'M3 7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM16 10.5l5-3v9l-5-3',
    },
    {
      id: 'done',
      title: 'Calling it a night',
      sub: 'Finished my planned tasks',
      icon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if (e.key === 'Enter' && isOpen) handleSend();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedPreset, customText, loudness]);

  if (!isOpen) return null;

  const handleSend = () => {
    const preset = presets.find((p) => p.id === selectedPreset);
    const message = customText.trim() || (preset ? preset.title : 'Ping!');
    if (onSendPing) {
      onSendPing({ message, loudness, presetId: selectedPreset });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '64px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(12, 10, 9, 0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-label="Ping Sakura"
        className="card"
        style={{
          position: 'relative',
          width: '920px',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          zIndex: 10,
          background: 'var(--card)',
          border: '1px solid var(--line)',
        }}
      >
        {/* Left Column: Form Controls */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              height: '64px',
              padding: '0 18px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div
              className="av"
              style={{
                width: '36px',
                height: '36px',
                background: '#7C3AED',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3 5 13h6l-1 8 8-10h-6z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h" style={{ fontSize: '17px' }}>Ping Sakura</div>
              <div className="mut" style={{ fontSize: '12px' }}>One tap. She gets it the way you choose.</div>
            </div>
            <span className="chip" style={{ background: 'var(--ps)', color: 'var(--p)' }}>
              In focus · 14 min left
            </span>
            <span
              onClick={onClose}
              className="kbd"
              style={{ cursor: 'pointer', fontFamily: 'monospace', background: 'var(--alt)', padding: '3px 7px', borderRadius: '4px', fontSize: '11px' }}
            >
              Esc
            </span>
          </div>

          <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Call Buttons */}
            <div>
              <div className="lbl" style={{ marginBottom: '8px' }}>Call</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                <button
                  className="btn"
                  onClick={() => {
                    if (onNavigate) onNavigate('study-room');
                    onClose();
                  }}
                  style={{ height: '44px', justifyContent: 'center' }}
                >
                  <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </svg>
                  Voice call
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    if (onNavigate) onNavigate('study-room');
                    onClose();
                  }}
                  style={{ height: '44px', justifyContent: 'center' }}
                >
                  <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM16 10.5l5-3v9l-5-3" />
                  </svg>
                  Video call
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    if (onNavigate) onNavigate('study-room');
                    onClose();
                  }}
                  style={{ height: '44px', justifyContent: 'center' }}
                >
                  <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01" />
                  </svg>
                  Knock on room
                </button>
              </div>
            </div>

            {/* Quick Ping Presets */}
            <div>
              <div className="lbl" style={{ marginBottom: '8px' }}>Quick pings</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                {presets.map((it) => {
                  const isPicked = selectedPreset === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setSelectedPreset(it.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: isPicked ? '1.5px solid var(--p)' : '1px solid var(--line)',
                        background: isPicked ? 'var(--ps)' : 'var(--card)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)', flexShrink: 0 }}>
                        <path d={it.icon} />
                      </svg>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '13px', color: 'var(--fg)' }}>{it.title}</strong>
                        <span className="mut" style={{ fontSize: '11px' }}>{it.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom message input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  height: '42px',
                  padding: '0 12px',
                  marginTop: '8px',
                  borderRadius: '12px',
                  background: 'var(--alt)',
                }}
              >
                <input
                  type="text"
                  placeholder="Or type a custom note to Sakura..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'var(--fg)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Loudness Switcher */}
            <div>
              <div className="lbl" style={{ marginBottom: '8px' }}>How loud</div>
              <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px', background: 'var(--alt)' }}>
                {[
                  { id: 'quiet', name: 'Wait for break', sub: 'Delivered at 6:43 PM' },
                  { id: 'gentle', name: 'Quiet banner', sub: 'Shows gently on screen' },
                  { id: 'urgent', name: 'Sound nudge', sub: 'Play chime + vibrate' },
                ].map((lv) => {
                  const isPicked = loudness === lv.id;
                  return (
                    <button
                      key={lv.id}
                      onClick={() => setLoudness(lv.id)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: isPicked ? 'var(--card)' : 'transparent',
                        boxShadow: isPicked ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '12px', color: 'var(--fg)' }}>{lv.name}</strong>
                      <span className="mut" style={{ fontSize: '11px' }}>{lv.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              height: '60px',
              padding: '0 18px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <span className="mut" style={{ flex: 1, fontSize: '12px' }}>
              {loudness === 'quiet'
                ? 'Held until her 6:43 PM break — zero distraction'
                : 'Will appear immediately on Sakura’s display'}
            </span>
            <button
              className="btn"
              onClick={handleSend}
              style={{
                height: '40px',
                padding: '0 20px',
                background: '#7C3AED',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12l16-8-6 16-3-6z" />
              </svg>
              Send ping
              <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}>↵</span>
            </button>
          </div>
        </div>

        {/* Right Preview Pane: What Sakura Gets */}
        <aside
          style={{
            width: '330px',
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '18px',
            background: 'var(--alt)',
            borderLeft: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div className="lbl">What Sakura gets</div>
          
          <div className="card" style={{ padding: '14px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div className="av" style={{ width: '24px', height: '24px', fontSize: '11px', background: 'var(--gs)', color: 'var(--gt)', fontWeight: 600 }}>
                H
              </div>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Hemant</span>
              <span className="mut" style={{ fontSize: '11px', marginLeft: 'auto' }}>just now</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fg)' }}>
              {customText.trim() || presets.find((p) => p.id === selectedPreset)?.title}
            </div>
            <div className="mut" style={{ fontSize: '12px', marginTop: '4px' }}>
              {presets.find((p) => p.id === selectedPreset)?.sub}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginTop: '8px' }}>
            Sakura is running Amigo Desktop and the companion overlay. Her status is currently marked as{' '}
            <strong style={{ color: 'var(--p)' }}>Focusing</strong>.
          </div>
        </aside>
      </div>
    </div>
  );
}
