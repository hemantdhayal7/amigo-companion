import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Coffee, Shield, Volume2 } from 'lucide-react';

const MODES = [
  { id: 'pomodoro', label: 'Pomodoro', duration: 25 * 60, breakDur: 5 * 60 },
  { id: 'deep', label: 'Deep work', duration: 50 * 60, breakDur: 10 * 60 },
  { id: 'sprint', label: 'Sprint', duration: 15 * 60, breakDur: 3 * 60 },
];

export default function Focus() {
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);

  const currentMode = MODES.find(m => m.id === mode);
  const total = isBreak ? currentMode.breakDur : currentMode.duration;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (!isBreak) {
              setIsBreak(true);
              return currentMode.breakDur;
            } else {
              setIsBreak(false);
              setRound(r => r + 1);
              return currentMode.duration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, isBreak, currentMode]);

  const switchMode = (id) => {
    const m = MODES.find(x => x.id === id);
    setMode(id);
    setTimeLeft(m.duration);
    setRunning(false);
    setIsBreak(false);
    setRound(1);
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const progress = 1 - timeLeft / total;
  const circumference = 2 * Math.PI * 120;

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: '0 0 24px' }}>
        Focus
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, maxWidth: 900 }}>
        {/* Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Mode pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32, background: 'var(--alt)', padding: 4, borderRadius: 10 }}>
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: mode === m.id ? 600 : 400,
                  background: mode === m.id ? 'var(--card)' : 'transparent',
                  color: mode === m.id ? 'var(--fg)' : 'var(--muted)',
                  boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Circle timer */}
          <div style={{ position: 'relative', width: 260, height: 260, marginBottom: 24 }}>
            <svg width="260" height="260" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r="120" fill="none" stroke="var(--alt)" strokeWidth="6" />
              <circle
                cx="130" cy="130" r="120" fill="none"
                stroke={isBreak ? 'var(--b)' : 'var(--g)'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                transform="rotate(-90 130 130)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {isBreak ? 'Break' : currentMode.label}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 56, fontWeight: 700,
                color: 'var(--fg)', lineHeight: 1,
              }}>
                {mins}:{secs}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                Round {round} of 4
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setTimeLeft(total); setRunning(false); }} style={{
              width: 40, height: 40, borderRadius: 10, border: '1px solid var(--line)',
              background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)',
            }}>
              <RotateCcw size={16} />
            </button>
            <button onClick={() => setRunning(!running)} style={{
              width: 56, height: 56, borderRadius: 14, border: 'none',
              background: running ? 'var(--a)' : 'var(--g)', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            }}>
              {running ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />}
            </button>
            <button onClick={() => { setTimeLeft(0); }} style={{
              width: 40, height: 40, borderRadius: 10, border: '1px solid var(--line)',
              background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)',
            }}>
              <SkipForward size={16} />
            </button>
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            {isBreak ? 'Take a break — you earned it' : `Break at ~${new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Partner sync */}
          <div style={{
            padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, background: 'var(--ps)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--p)',
              }}>S</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Sakura</div>
                <div style={{ fontSize: 11, color: 'var(--g)' }}>Also focusing · 18:42 left</div>
              </div>
            </div>
            <div style={{ fontSize: 20, textAlign: 'center', padding: 8 }}>💪 You got this!</div>
          </div>

          {/* Soundscape */}
          <div style={{
            padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Volume2 size={14} style={{ color: 'var(--muted)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Soundscape</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Rain', 'Lo-fi', 'Forest', 'Cafe', 'White noise', 'Silent'].map(s => (
                <button key={s} style={{
                  padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)',
                  background: s === 'Lo-fi' ? 'var(--gs)' : 'var(--card)',
                  color: s === 'Lo-fi' ? 'var(--gt)' : 'var(--muted)',
                  fontSize: 11, fontWeight: s === 'Lo-fi' ? 600 : 400, cursor: 'pointer',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Focus shield */}
          <div style={{
            padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={14} style={{ color: 'var(--a)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Focus Shield</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--g)', fontWeight: 600 }}>Active</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              Blocking distracting sites · Holding non-urgent pings until your break
            </p>
          </div>

          {/* Today's stats */}
          <div style={{
            padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 10 }}>Today</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Focus time', value: '3h 20m' },
                { label: 'Sessions', value: '6' },
                { label: 'Longest streak', value: '50 min' },
                { label: 'Breaks taken', value: '5' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
