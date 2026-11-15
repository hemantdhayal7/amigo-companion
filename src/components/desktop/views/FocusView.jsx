import React, { useState, useEffect } from 'react';

export default function FocusView({ onFloatTop, partnerState = {}, onSendReaction }) {
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' | 'deep' | 'short' | 'long'
  const [isRunning, setIsRunning] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(18 * 60 + 24); // 18:24
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [currentTask, setCurrentTask] = useState('Solve 10 practice exam questions');
  const [taskDone, setTaskDone] = useState(false);
  const [shieldActive, setShieldActive] = useState(true);
  const [cheerFeedback, setCheerFeedback] = useState(null);

  const [sounds, setSounds] = useState([
    { name: 'Rain', val: '40%', pct: 40 },
    { name: 'Lo-Fi', val: '65%', pct: 65 },
    { name: 'Coffee', val: '0%', pct: 0 },
    { name: 'Forest', val: '20%', pct: 20 },
  ]);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setTotalSeconds(25 * 60);
      setSecondsLeft(25 * 60);
    } else if (newMode === 'deep') {
      setTotalSeconds(50 * 60);
      setSecondsLeft(50 * 60);
    } else if (newMode === 'short') {
      setTotalSeconds(5 * 60);
      setSecondsLeft(5 * 60);
    } else if (newMode === 'long') {
      setTotalSeconds(15 * 60);
      setSecondsLeft(15 * 60);
    }
    setIsRunning(true);
  };

  const addFiveMin = () => {
    setSecondsLeft((prev) => prev + 300);
    setTotalSeconds((prev) => Math.max(prev, secondsLeft + 300));
  };

  const triggerCheer = (emoji) => {
    if (onSendReaction) onSendReaction(emoji);
    setCheerFeedback(`Sent ${emoji} to Sakura`);
    setTimeout(() => setCheerFeedback(null), 2000);
  };

  // 2 * Math.PI * 134 ≈ 841.9
  const radius = 134;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const dashOffset = circumference * (1 - progressRatio);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header
        style={{
          height: '68px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '0 28px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h" style={{ fontSize: '20px' }}>Focus</div>
          <div className="mut" style={{ fontSize: '12px' }}>Round 2 of 4 · break at 6:43 PM</div>
        </div>

        <span
          className="chip"
          style={{
            background: 'var(--ps)',
            color: 'var(--p)',
            height: '30px',
            padding: '0 12px',
            boxSizing: 'border-box',
          }}
        >
          <svg className="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
          Timer synced with Sakura
        </span>

        {onFloatTop && (
          <button className="btn" onClick={onFloatTop} aria-label="Pop out mini timer">
            <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 5h16v14H4zM12 12h6v5h-6z" />
            </svg>
            Mini timer
          </button>
        )}
      </header>

      {/* Main Focus Area */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '22px 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '18px',
          overflowY: 'auto',
        }}
      >
        {/* Left: Timer Card */}
        <section
          className="card"
          style={{
            padding: '22px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 0,
          }}
        >
          {/* Mode pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              borderRadius: '12px',
              background: 'var(--alt)',
            }}
          >
            {[
              { id: 'pomodoro', label: 'Pomodoro (25m)' },
              { id: 'deep', label: 'Deep work (50m)' },
              { id: 'short', label: 'Short break (5m)' },
              { id: 'long', label: 'Long break (15m)' },
            ].map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '9px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'var(--card)' : 'transparent',
                    color: active ? 'var(--fg)' : 'var(--muted)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Big Circular Ring */}
          <div style={{ position: 'relative', width: '300px', height: '300px', marginTop: '22px' }}>
            <svg viewBox="0 0 300 300" width="300" height="300" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="150" cy="150" r={radius} fill="none" stroke="var(--alt)" strokeWidth="14" />
              <circle
                cx="150"
                cy="150"
                r={radius}
                fill="none"
                stroke="var(--g)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="lbl" style={{ color: 'var(--gt)', marginBottom: '4px' }}>
                {isRunning ? 'FOCUSING' : 'PAUSED'}
              </div>
              <div
                className="h"
                style={{
                  fontSize: '68px',
                  lineHeight: 1.05,
                  letterSpacing: '-2px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(secondsLeft)}
              </div>
              <div className="mut" style={{ fontSize: '13px', marginTop: '4px' }}>
                of {formatTime(totalSeconds)}
              </div>
            </div>
          </div>

          {/* Current Working Task */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div className="mut" style={{ fontSize: '12px' }}>Working on</div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                textDecoration: taskDone ? 'line-through' : 'none',
                color: taskDone ? 'var(--muted)' : 'var(--fg)',
              }}
            >
              {currentTask}
            </div>
          </div>

          {/* Round progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
            <span style={{ width: '44px', height: '6px', borderRadius: '3px', background: 'var(--g)' }}></span>
            <span style={{ width: '44px', height: '6px', borderRadius: '3px', background: 'var(--g)', opacity: 0.55 }}></span>
            <span style={{ width: '44px', height: '6px', borderRadius: '3px', background: 'var(--line)' }}></span>
            <span style={{ width: '44px', height: '6px', borderRadius: '3px', background: 'var(--line)' }}></span>
            <span className="mut" style={{ fontSize: '12px', marginLeft: '6px' }}>Long break after round 4</span>
          </div>

          <div style={{ flex: 1 }}></div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="btn"
              onClick={() => setIsRunning(!isRunning)}
              style={{ height: '46px', padding: '0 22px', fontSize: '14px' }}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              className="btn pri"
              onClick={() => setTaskDone(!taskDone)}
              style={{ height: '46px', padding: '0 24px', fontSize: '14px' }}
            >
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12l5 5 9-10" />
              </svg>
              {taskDone ? 'Task completed' : 'Mark task done'}
            </button>
            <button
              className="btn"
              onClick={addFiveMin}
              style={{ height: '46px', fontSize: '14px' }}
            >
              +5 min
            </button>
            <button
              className="btn"
              onClick={() => handleModeChange('short')}
              aria-label="Skip to break"
              style={{ height: '46px', width: '46px', padding: 0, justifyContent: 'center' }}
            >
              <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 5l10 7-10 7zM19 5v14" />
              </svg>
            </button>
          </div>
        </section>

        {/* Right column: Together, Soundscape, Shield */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Together Card */}
          <section className="card" style={{ padding: '16px 18px' }}>
            <div className="h" style={{ fontSize: '15px', marginBottom: '10px' }}>Together</div>
            
            {/* You */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="av" style={{ width: '34px', height: '34px', background: 'var(--gs)', color: 'var(--gt)', fontWeight: 600 }}>
                H
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>You</span>
                  <span className="mut" style={{ fontSize: '12px' }}>2 of 4 tasks</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--alt)', marginTop: '5px' }}>
                  <div style={{ width: '50%', height: '100%', borderRadius: '3px', background: 'var(--g)' }}></div>
                </div>
              </div>
            </div>

            {/* Sakura */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <div className="av" style={{ width: '34px', height: '34px', background: 'var(--ps)', color: 'var(--p)', fontWeight: 600 }}>
                S
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Sakura</span>
                  <span className="mut" style={{ fontSize: '12px' }}>3 of 4 tasks</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--alt)', marginTop: '5px' }}>
                  <div style={{ width: '75%', height: '100%', borderRadius: '3px', background: 'var(--p)' }}></div>
                </div>
              </div>
            </div>

            <div className="mut" style={{ fontSize: '12px', marginTop: '12px' }}>
              {cheerFeedback ? (
                <span style={{ color: 'var(--gt)', fontWeight: 600 }}>{cheerFeedback}</span>
              ) : (
                'Send a quiet cheer — it shows on her timer without a sound.'
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {['💖', '✨', '🌸', '☕', '🫂'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerCheer(emoji)}
                  aria-label={`Send ${emoji}`}
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--alt)',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>

          {/* Soundscape Card */}
          <section className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v2M8 8v8M12 5v14M16 9v6M20 11v2" />
              </svg>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Soundscape</div>
              <span className="mut" style={{ fontSize: '12px' }}>Fades out at breaks</span>
            </div>

            {sounds.map((s, idx) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '30px' }}>
                <span style={{ width: '74px', fontWeight: 500, fontSize: '13px' }}>{s.name}</span>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newPct = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
                    setSounds((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], pct: newPct, val: `${newPct}%` };
                      return next;
                    });
                  }}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: 'var(--alt)',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: `${s.pct}%`,
                      height: '100%',
                      borderRadius: '3px',
                      background: 'var(--g)',
                    }}
                  ></div>
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: `calc(${s.pct}% - 7px)`,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'var(--card)',
                      border: '2px solid var(--g)',
                      boxSizing: 'border-box',
                    }}
                  ></div>
                </div>
                <span className="mut" style={{ width: '32px', textAlign: 'right', fontSize: '12px' }}>
                  {s.val}
                </span>
              </div>
            ))}
          </section>

          {/* Focus Shield */}
          <section className="card" style={{ padding: '16px 18px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gt)' }}>
                <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
              </svg>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Focus shield</div>
              <div
                onClick={() => setShieldActive(!shieldActive)}
                role="button"
                aria-label={shieldActive ? 'On' : 'Off'}
                style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '11px',
                  background: shieldActive ? '#15803D' : 'var(--alt)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: shieldActive ? '18px' : '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                ></div>
              </div>
            </div>

            <div className="mut" style={{ fontSize: '12px', marginTop: '6px' }}>
              Blocks distracting apps and sites until the break. Unblocking takes a 20-second pause.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {['YouTube', 'Instagram', 'Reddit', 'Discord', '+2 more'].map((app) => (
                <span key={app} className="chip" style={{ background: 'var(--alt)' }}>
                  {app}
                </span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '12px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--alt)' }}>
                <div className="mut" style={{ fontSize: '11px' }}>Shield time</div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>42 min left</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--alt)' }}>
                <div className="mut" style={{ fontSize: '11px' }}>Blocked today</div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>8 attempts</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
