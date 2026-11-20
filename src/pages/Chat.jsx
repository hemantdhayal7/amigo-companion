import React, { useState } from 'react';
import { Send, Mic, Paperclip, SmilePlus } from 'lucide-react';

const MESSAGES = [
  { from: 'them', text: 'Hey, did you finish the stats practice set?', time: '5:12 PM' },
  { from: 'me', text: 'Almost! 7 out of 10 done. The probability ones are tricky 😅', time: '5:14 PM' },
  { from: 'them', text: 'I found a great video that explains Bayes theorem really well, want me to share it?', time: '5:15 PM' },
  { from: 'me', text: 'Yes please! I keep mixing up prior and posterior', time: '5:16 PM' },
  { from: 'them', type: 'session', text: 'Sakura invited you to a study session', detail: 'Stats Revision · 7:00 PM tonight · 1.5h planned', time: '5:20 PM' },
  { from: 'them', type: 'voice', duration: '0:42', time: '5:22 PM' },
  { from: 'me', text: "Perfect, I'll join at 7. Let me finish this set first 💪", time: '5:24 PM' },
  { from: 'system', text: '2 messages held during your focus session · delivered now', time: '6:30 PM' },
];

export default function Chat() {
  const [input, setInput] = useState('');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--ps)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'var(--p)',
        }}>S</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Sakura</div>
          <div style={{ fontSize: 11, color: 'var(--g)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--g)', display: 'inline-block' }} />
            Online · Projects & Theory
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MESSAGES.map((m, i) => {
          if (m.from === 'system') {
            return (
              <div key={i} style={{
                textAlign: 'center', padding: '8px 14px', borderRadius: 10,
                background: 'var(--as)', fontSize: 11, color: 'var(--a)', fontWeight: 500,
                alignSelf: 'center',
              }}>
                {m.text}
              </div>
            );
          }

          const isMe = m.from === 'me';

          if (m.type === 'session') {
            return (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 'var(--radius)',
                border: '1px solid var(--line)', background: 'var(--card)',
                maxWidth: 340,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>{m.text}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>{m.detail}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none',
                    background: 'var(--g)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>Accept</button>
                  <button style={{
                    padding: '6px 16px', borderRadius: 8, border: '1px solid var(--line)',
                    background: 'var(--card)', color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
                  }}>Maybe later</button>
                </div>
              </div>
            );
          }

          if (m.type === 'voice') {
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 14, background: isMe ? 'var(--gs)' : 'var(--alt)',
                maxWidth: 240, alignSelf: isMe ? 'flex-end' : 'flex-start',
              }}>
                <button style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none',
                  background: 'var(--g)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>▶</button>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {Array.from({ length: 24 }, (_, j) => (
                      <div key={j} style={{
                        width: 2, height: 4 + Math.random() * 12, borderRadius: 1,
                        background: 'var(--g)', opacity: 0.5 + Math.random() * 0.5,
                      }} />
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{m.duration}</span>
              </div>
            );
          }

          return (
            <div key={i} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
            }}>
              <div style={{
                padding: '10px 14px', borderRadius: 14,
                background: isMe ? 'var(--g)' : 'var(--alt)',
                color: isMe ? '#fff' : 'var(--fg)',
                fontSize: 13, lineHeight: 1.5,
                borderBottomRightRadius: isMe ? 4 : 14,
                borderBottomLeftRadius: isMe ? 14 : 4,
              }}>
                {m.text}
              </div>
              <div style={{
                fontSize: 10, color: 'var(--muted)', marginTop: 3,
                textAlign: isMe ? 'right' : 'left', padding: '0 4px',
              }}>
                {m.time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick replies */}
      <div style={{ padding: '0 24px 8px', display: 'flex', gap: 6 }}>
        {['On my way!', 'Give me 5 min', 'Sounds good 👍'].map(r => (
          <button key={r} style={{
            padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)',
            background: 'var(--card)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer',
          }}>{r}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 24px 16px', borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
          <Paperclip size={18} />
        </button>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', padding: '8px 14px',
          borderRadius: 12, background: 'var(--alt)', border: '1px solid var(--line)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message Sakura..."
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, color: 'var(--fg)',
            }}
          />
          <SmilePlus size={16} style={{ color: 'var(--muted)', cursor: 'pointer' }} />
        </div>
        <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
          <Mic size={18} />
        </button>
        <button style={{
          width: 36, height: 36, borderRadius: 10, border: 'none',
          background: 'var(--g)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
