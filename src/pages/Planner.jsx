import React, { useState } from 'react';
import { CheckCircle2, Circle, Play, AlertTriangle, Clock, Mail, Bell, Plus, Sparkles } from 'lucide-react';

const TASKS = [
  { id: 1, text: 'Solve 10 practice exam questions', done: false, subject: 'Statistics', inFocus: true, focusLeft: '18:24', est: '45 min' },
  { id: 2, text: 'Draft certification summary sheet', done: false, subject: 'Certification', est: '30 min', planned: '8:45 PM' },
  { id: 3, text: 'Final project slides — outline', done: false, shared: true, note: 'She finished 2 of 5 sections' },
];

const DONE = [
  { id: 4, text: 'Review Chapter 3 formulas', time: '40 min' },
  { id: 5, text: 'Watch lecture 12 recording', time: '55 min' },
];

const DEADLINES = [
  { label: 'ML Assignment submission', due: 'Tomorrow, 11:59 PM · 29 hours left', urgent: true },
  { label: 'Stats quiz', due: 'Tue 17 Nov · 3 days left', prep: '4h prep planned' },
  { label: 'Final project presentation', due: 'Sat 28 Nov · 14 days left', shared: true },
];

const REMINDERS = [
  { label: 'Submit ML assignment', due: 'Tomorrow, 6:00 PM', note: 'also reminds Sakura to check on you' },
  { label: 'Review study group notes', due: 'Mon 16 Nov, 9:00 AM', snooze: true },
  { label: 'Start final project slides', due: 'Wed 18 Nov, 3:00 PM · repeats weekly', snooze: true },
];

const EMAILS = [
  { from: 'Registrar — Course registration', preview: 'Action required: confirm spring semester...', time: '5h ago', action: true },
  { from: 'Prof. Sharma — Assignment exte...', preview: 'Re: Request for a 2-day extension on ML...', time: '2d ago', awaiting: true },
  { from: 'Study group — Meeting notes', preview: "Shared notes from Thursday's session", time: '1d ago', replied: true },
];

const TABS = ['Tasks', 'Deadlines', 'Reminders', 'Email'];

export default function Planner() {
  const [tab, setTab] = useState('Tasks');
  const [tasks, setTasks] = useState(TASKS);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            Planner
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            2 done · 2 left · 1 deadline tomorrow · 1 email needs action
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            height: 8, width: 100, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden',
            alignSelf: 'center',
          }}>
            <div style={{ height: '100%', width: '50%', borderRadius: 4, background: 'var(--g)' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g)' }}>50%</span>
          <button style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--card)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={14} /> Plan my day
          </button>
          <button style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 280px', gap: 20 }}>
        {/* Tasks column */}
        <div>
          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--alt)', padding: 3, borderRadius: 10, width: 'fit-content' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: tab === t ? 600 : 400,
                background: tab === t ? 'var(--card)' : 'transparent',
                color: tab === t ? 'var(--fg)' : 'var(--muted)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'Tasks' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10 }}>Today</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map(t => (
                  <div key={t.id} style={{
                    padding: '14px 16px', borderRadius: 'var(--radius)',
                    border: t.inFocus ? '2px solid var(--g)' : '1px solid var(--line)',
                    background: 'var(--card)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <button onClick={() => toggleTask(t.id)} style={{
                        border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginTop: 1,
                        color: t.done ? 'var(--g)' : 'var(--line)',
                      }}>
                        {t.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', textDecoration: t.done ? 'line-through' : 'none' }}>
                          {t.text}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {t.inFocus && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--gt)', background: 'var(--gs)', padding: '2px 8px', borderRadius: 6 }}>
                              In focus · {t.focusLeft} left
                            </span>
                          )}
                          {t.subject && (
                            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted)', background: 'var(--alt)', padding: '2px 8px', borderRadius: 6 }}>
                              {t.subject}
                            </span>
                          )}
                          {t.est && (
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t.est} est.</span>
                          )}
                          {t.planned && (
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>· planned {t.planned}</span>
                          )}
                          {t.shared && (
                            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--p)', background: 'var(--ps)', padding: '2px 8px', borderRadius: 6 }}>
                              Shared with Sakura
                            </span>
                          )}
                        </div>
                        {t.note && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{t.note}</div>}
                      </div>
                      {t.planned && !t.inFocus && (
                        <button style={{
                          width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line)',
                          background: 'var(--card)', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'var(--g)',
                        }}>
                          <Play size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Completed Today
              </div>
              {DONE.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--g)' }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', flex: 1 }}>{t.text}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t.time}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'Deadlines' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEADLINES.map((d, i) => (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius)',
                  border: `1px solid ${d.urgent ? 'var(--r)' : 'var(--line)'}`,
                  background: 'var(--card)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{d.label}</div>
                    {d.urgent && <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: 'var(--r)', padding: '2px 8px', borderRadius: 6 }}>Urgent</span>}
                    {d.shared && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--b)', background: 'var(--bs)', padding: '2px 8px', borderRadius: 6 }}>Shared</span>}
                  </div>
                  <div style={{ fontSize: 12, color: d.urgent ? 'var(--r)' : 'var(--muted)', marginTop: 4 }}>{d.due}</div>
                  {d.prep && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{d.prep}</div>}
                </div>
              ))}
            </div>
          )}

          {tab === 'Reminders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REMINDERS.map((r, i) => (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--line)', background: 'var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--a)', marginTop: 2 }}>{r.due}</div>
                    {r.note && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{r.note}</div>}
                  </div>
                  {r.snooze && (
                    <button style={{
                      padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)',
                      background: 'var(--card)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer',
                    }}>Snooze</button>
                  )}
                </div>
              ))}
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                borderRadius: 10, border: '1px dashed var(--line)', background: 'transparent',
                color: 'var(--muted)', fontSize: 12, cursor: 'pointer', width: '100%', justifyContent: 'center',
              }}>
                <Bell size={14} /> Add reminder
              </button>
            </div>
          )}

          {tab === 'Email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EMAILS.map((e, i) => (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--line)', background: 'var(--card)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{e.from}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{e.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{e.preview}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {e.action && <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: 'var(--r)', padding: '2px 8px', borderRadius: 6 }}>Action needed</span>}
                    {e.action && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--b)', cursor: 'pointer' }}>Make it a task</span>}
                    {e.awaiting && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--a)', background: 'var(--as)', padding: '2px 8px', borderRadius: 6 }}>Awaiting reply</span>}
                    {e.awaiting && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--b)', cursor: 'pointer' }}>Send follow-up</span>}
                    {e.replied && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--g)', background: 'var(--gs)', padding: '2px 8px', borderRadius: 6 }}>Replied</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deadlines column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: 'var(--a)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Deadlines</span>
            </div>
            <button style={{ fontSize: 11, color: 'var(--b)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEADLINES.map((d, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${d.urgent ? 'var(--r)' : 'var(--line)'}`,
                background: 'var(--card)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{d.label}</div>
                <div style={{ fontSize: 11, color: d.urgent ? 'var(--r)' : 'var(--muted)', marginTop: 2 }}>{d.due}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 12 }}>
            <Bell size={14} style={{ color: 'var(--muted)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Reminders</span>
            <button style={{ fontSize: 11, color: 'var(--b)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, marginLeft: 'auto' }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REMINDERS.map((r, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 10,
                border: '1px solid var(--line)', background: 'var(--card)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--a)', marginTop: 2 }}>{r.due}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Email tracker column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Mail size={14} style={{ color: 'var(--b)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Email tracker</span>
            <span style={{ fontSize: 10, color: 'var(--b)', background: 'var(--bs)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, marginLeft: 'auto' }}>3 tracked</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14, textAlign: 'center' }}>
            {[{ n: 5, l: 'Unread', c: 'var(--fg)' }, { n: 2, l: 'Awaiting', c: 'var(--a)' }, { n: 12, l: 'Resolved', c: 'var(--g)' }].map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderRadius: 10, background: 'var(--alt)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.c, fontFamily: "'Space Grotesk', sans-serif" }}>{s.n}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EMAILS.map((e, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>{e.from}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{e.preview}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {e.action && <span style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: 'var(--r)', padding: '2px 6px', borderRadius: 4 }}>Action needed</span>}
                  {e.action && <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--b)', cursor: 'pointer' }}>Make it a task</span>}
                  {e.awaiting && <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--a)', background: 'var(--as)', padding: '2px 6px', borderRadius: 4 }}>Awaiting reply</span>}
                  {e.replied && <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--g)', background: 'var(--gs)', padding: '2px 6px', borderRadius: 4 }}>Replied</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
