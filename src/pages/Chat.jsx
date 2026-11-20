import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Smile, Mic, Send, Phone, Video } from 'lucide-react';
import { load, save, uid, formatTime } from '../utils/store';

const QUICK_REPLIES = ['On my way!', 'Give me 5 min', 'Sounds good', 'Let\'s take a break', 'Ready when you are', 'Good job today!'];

const DEFAULT_MESSAGES = [
  { id: 'm1', from: 'siddhi', text: 'Hey, did you finish the stats practice set?', time: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: 'm2', from: 'me', text: 'Almost! I have 3 more problems left. The probability section took longer than expected.', time: new Date(Date.now() - 3600000 * 2.9).toISOString() },
  { id: 'm3', from: 'siddhi', text: 'I found a great video that explains Bayes theorem really well, want me to share it?', time: new Date(Date.now() - 3600000 * 2.5).toISOString() },
  { id: 'm4', from: 'me', text: 'Yes please! That would really help', time: new Date(Date.now() - 3600000 * 2.4).toISOString() },
  { id: 'm5', from: 'siddhi', text: 'Sent! Also, want to do a study session tonight? I was thinking 8-10 PM', time: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'm6', from: 'me', text: 'Perfect timing, I need to review chapter 5 too. See you at 8!', time: new Date(Date.now() - 3600000 * 1.8).toISOString() },
];

export default function Chat() {
  const [messages, setMessages] = useState(() => load('chat_messages', DEFAULT_MESSAGES));
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => { save('chat_messages', messages); }, [messages]);
  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages]);

  const sendMessage = (text) => {
    if (!text?.trim()) return;
    setMessages(prev => [...prev, { id: uid(), from: 'me', text: text.trim(), time: new Date().toISOString() }]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ps)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--p)' }}>S</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>Siddhi</div>
          <div style={{ fontSize: 11, color: 'var(--g)' }}>Online · Studying</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Phone size={16} /></button>
          <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Video size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => {
          const isMe = m.from === 'me';
          const showTime = i === 0 || new Date(m.time).getTime() - new Date(messages[i - 1].time).getTime() > 600000;
          return (
            <React.Fragment key={m.id}>
              {showTime && (
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', margin: '8px 0' }}>
                  {formatTime(m.time)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: 14,
                  borderBottomRightRadius: isMe ? 4 : 14,
                  borderBottomLeftRadius: isMe ? 14 : 4,
                  background: isMe ? 'var(--g)' : 'var(--card)',
                  color: isMe ? '#fff' : 'var(--fg)',
                  fontSize: 13, lineHeight: 1.5,
                  border: isMe ? 'none' : '1px solid var(--line)',
                }}>
                  {m.text}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Quick replies */}
      <div style={{ padding: '8px 24px 0', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {QUICK_REPLIES.map(r => (
          <button key={r} onClick={() => sendMessage(r)} style={{
            padding: '5px 12px', borderRadius: 20, border: '1px solid var(--line)',
            background: 'var(--card)', fontSize: 11, color: 'var(--fg)', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gs)'; e.currentTarget.style.borderColor = 'var(--g)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card)' }}>
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}><Paperclip size={18} /></button>
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}><Smile size={18} /></button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Message Siddhi..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--fg)', padding: '4px 0' }}
          />
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}><Mic size={18} /></button>
          <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: input.trim() ? 'var(--g)' : 'var(--alt)',
            color: input.trim() ? '#fff' : 'var(--muted)',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
