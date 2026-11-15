import React, { useState } from 'react';

export default function ChatView({ onNavigate, socket, roomId }) {
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'sakura',
      text: 'Stats quiz is Tuesday. Want to do a timed mock tonight?',
      time: '3:12 PM',
    },
    {
      id: 'm2',
      sender: 'you',
      text: 'Yes. Study room at 7?',
      time: '3:14 PM',
    },
    {
      id: 'm3',
      sender: 'invite',
      title: 'Study room · today, 7:00 PM',
      subtitle: '90 minutes · timed mock, then review',
      status: 'Sakura accepted',
      note: 'Added to both calendars',
    },
    {
      id: 'm4',
      sender: 'task',
      title: 'Final project slides — outline',
      progress: '40%',
      progressText: 'She finished 2 of 5 sections',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [quietDelivery, setQuietDelivery] = useState(true);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'you',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);

    // Send via socket if connected
    if (socket && socket.connected) {
      socket.emit('chat-message', {
        roomId,
        text: inputText,
        sender: 'Hemant',
        timestamp: Date.now(),
      });
    }

    setInputText('');
  };

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
        <div className="av" style={{ width: '40px', height: '40px', fontSize: '17px', background: 'var(--ps)', color: 'var(--p)' }}>
          S
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h" style={{ fontSize: '18px' }}>Sakura</div>
          <div style={{ fontSize: '12px', color: 'var(--p)', fontWeight: 600 }}>
            Focusing · on a break at 6:43 PM
          </div>
        </div>

        <button
          className="btn"
          onClick={() => {
            if (socket) socket.emit('nudge-partner', { roomId });
            alert('Nudge sent to Sakura 🌸');
          }}
        >
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 3 5 13h6l-1 8 8-10h-6z" />
          </svg>
          Nudge
        </button>

        <button
          className="btn pri"
          onClick={() => onNavigate && onNavigate('study-room')}
        >
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM16 10.5l5-3v9l-5-3" />
          </svg>
          Open study room
        </button>
      </header>

      {/* Main chat layout */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: '16px',
        }}
      >
        {/* Chat Thread */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          {/* Quiet Delivery Notice */}
          {quietDelivery && (
            <div
              style={{
                margin: '14px 16px 0',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--ps)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />
              </svg>
              <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
                <strong style={{ color: 'var(--p)' }}>Quiet delivery is on.</strong> Sakura is mid-session, so new messages reach her at the break in 18 minutes.
              </div>
              <button
                className="btn"
                onClick={() => setQuietDelivery(false)}
                style={{ height: '28px', padding: '0 10px', fontSize: '12px', background: 'var(--card)' }}
              >
                Send now anyway
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div style={{ flex: 1, minHeight: 0, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            <div className="mut" style={{ alignSelf: 'center', fontSize: '11px', fontWeight: 600 }}>
              Today
            </div>

            {messages.map((m) => {
              if (m.sender === 'sakura') {
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: '80%' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '16px 16px 16px 4px',
                        background: 'var(--alt)',
                        color: 'var(--fg)',
                        fontSize: '13px',
                      }}
                    >
                      {m.text}
                    </div>
                    <div className="mut" style={{ fontSize: '11px', marginTop: '2px', marginLeft: '4px' }}>
                      {m.time}
                    </div>
                  </div>
                );
              }

              if (m.sender === 'you') {
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-end', maxWidth: '80%' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '16px 16px 4px 16px',
                        background: 'var(--gs)',
                        color: 'var(--gt)',
                        fontWeight: 500,
                        fontSize: '13px',
                      }}
                    >
                      {m.text}
                    </div>
                    <div className="mut" style={{ fontSize: '11px', marginTop: '2px', alignSelf: 'flex-end', marginRight: '4px' }}>
                      {m.time}
                    </div>
                  </div>
                );
              }

              if (m.sender === 'invite') {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'flex-end',
                      width: '320px',
                      padding: '12px 14px',
                      borderRadius: '16px 4px 16px 16px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                    }}
                  >
                    <div className="lbl" style={{ color: 'var(--p)' }}>Session invite</div>
                    <div style={{ fontWeight: 700, marginTop: '2px', fontSize: '14px' }}>{m.title}</div>
                    <div className="mut" style={{ fontSize: '12px' }}>{m.subtitle}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span className="chip" style={{ background: 'var(--gs)', color: 'var(--gt)' }}>
                        {m.status}
                      </span>
                      <span className="mut" style={{ fontSize: '12px' }}>{m.note}</span>
                    </div>
                  </div>
                );
              }

              if (m.sender === 'task') {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'flex-start',
                      width: '320px',
                      padding: '12px 14px',
                      borderRadius: '4px 16px 16px 16px',
                      background: 'var(--alt)',
                    }}
                  >
                    <div className="lbl">Shared task</div>
                    <div style={{ fontWeight: 700, marginTop: '2px', fontSize: '14px' }}>{m.title}</div>
                    <div style={{ height: '5px', borderRadius: '3px', background: 'var(--line)', marginTop: '8px' }}>
                      <div style={{ width: m.progress, height: '100%', borderRadius: '3px', background: 'var(--p)' }}></div>
                    </div>
                    <div className="mut" style={{ fontSize: '11px', marginTop: '4px' }}>{m.progressText}</div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Chat Input Bar */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              aria-label="Add attachment"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 11l-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7" />
              </svg>
            </button>

            <input
              type="text"
              placeholder="Message Sakura"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              style={{
                flex: 1,
                minWidth: 0,
                height: '36px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--fg)',
                fontSize: '13px',
              }}
            />

            <button
              onClick={handleSendMessage}
              aria-label="Send"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#15803D',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </section>

        {/* Aside / Right Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Pinned Card */}
          <section className="card" style={{ padding: '16px' }}>
            <div className="h" style={{ fontSize: '15px' }}>Pinned</div>
            <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '12px', background: 'var(--alt)' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Plan for Tuesday's quiz</div>
              <div className="mut" style={{ fontSize: '12px', marginTop: '2px' }}>
                Mock tonight · weak spots Sunday · light review Monday
              </div>
            </div>
          </section>

          {/* Shared Files */}
          <section className="card" style={{ padding: '16px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Shared</div>
              <span className="mut" style={{ fontSize: '12px' }}>14 items</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--rs)', color: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                  PDF
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>stats-formulas.pdf</div>
                  <div className="mut" style={{ fontSize: '11px' }}>Sakura · yesterday</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--as)', color: 'var(--a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                  NB
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Linear Algebra Notes</div>
                  <div className="mut" style={{ fontSize: '11px' }}>Shared notebook · 8 cards</div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
