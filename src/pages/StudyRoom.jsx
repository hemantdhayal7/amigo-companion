import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageCircle, PhoneOff, Clock, CheckCircle2, Circle } from 'lucide-react';

const ROOM_TASKS = [
  { text: 'Practice exam questions', done: false },
  { text: 'Review formulas', done: true },
  { text: 'Draft summary sheet', done: false },
];

export default function StudyRoom() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [tasks, setTasks] = useState(ROOM_TASKS);

  return (
    <div style={{
      height: '100%', background: '#0F0F14', color: '#E5E7EB',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Study Room</h2>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>2 people · 1h 23m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          }}>
            <Clock size={12} style={{ color: '#16A34A' }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>18:24</span>
            <span style={{ color: '#9CA3AF', fontSize: 10 }}>/ 25:00 · R2</span>
          </div>
        </div>
      </div>

      {/* Video stage */}
      <div style={{ flex: 1, display: 'flex', padding: 20, gap: 16 }}>
        {/* Main video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Partner video */}
          <div style={{
            flex: 1, borderRadius: 16, background: '#1A1A24',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, background: 'rgba(124,58,237,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#7C3AED',
            }}>S</div>
            <div style={{
              position: 'absolute', bottom: 12, left: 12, padding: '4px 10px',
              borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#16A34A' }} />
              Sakura
            </div>
            {/* PiP self-view */}
            <div style={{
              position: 'absolute', bottom: 12, right: 12, width: 120, height: 80,
              borderRadius: 10, background: '#24242E', border: '2px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#16A34A',
              }}>H</div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Shared timer */}
          <div style={{
            padding: 16, borderRadius: 12, background: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 8 }}>Shared Pomodoro</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700 }}>18:24</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Round 2 of 4 · Break at 6:43 PM</div>
            </div>
          </div>

          {/* Shared tasks */}
          <div style={{
            padding: 16, borderRadius: 12, background: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.08)', flex: 1, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 10 }}>Session Tasks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setTasks(prev => prev.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: t.done ? '#16A34A' : '#4B5563' }}
                  >
                    {t.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </button>
                  <span style={{
                    fontSize: 12, color: t.done ? '#6B7280' : '#E5E7EB',
                    textDecoration: t.done ? 'line-through' : 'none',
                  }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={() => setMicOn(!micOn)} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: micOn ? 'rgba(255,255,255,0.08)' : 'var(--r)',
          color: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button onClick={() => setCamOn(!camOn)} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: camOn ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.08)',
          color: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', color: '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Monitor size={18} />
        </button>
        <button style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', color: '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageCircle size={18} />
        </button>
        <div style={{ width: 20 }} />
        <button style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'var(--r)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
