import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Play, AlertTriangle, Clock, Mail, Bell, Plus, Sparkles, X, Trash2 } from 'lucide-react';
import { load, save, uid, today } from '../utils/store';

const DEFAULT_TASKS = [
  { id: 'dt1', text: 'Solve 10 practice exam questions', done: false, subject: 'Statistics', est: '45 min', createdAt: new Date().toISOString() },
  { id: 'dt2', text: 'Draft certification summary sheet', done: false, subject: 'Certification', est: '30 min', createdAt: new Date().toISOString() },
];

const DEFAULT_DEADLINES = [
  { id: 'dd1', label: 'ML Assignment submission', due: 'Tomorrow, 11:59 PM', urgent: true },
  { id: 'dd2', label: 'Stats quiz', due: 'Tue · 3 days left', prep: '4h prep planned' },
  { id: 'dd3', label: 'Final project presentation', due: 'Sat 28 Nov · 14 days', shared: true },
];

const DEFAULT_REMINDERS = [
  { id: 'dr1', label: 'Submit ML assignment', due: 'Tomorrow, 6:00 PM', snoozed: false },
  { id: 'dr2', label: 'Review study group notes', due: 'Mon, 9:00 AM', snoozed: false },
];

const TABS = ['Tasks', 'Deadlines', 'Reminders', 'Email'];

export default function Planner() {
  const [tab, setTab] = useState('Tasks');
  const [tasks, setTasks] = useState(() => load('planner_tasks', DEFAULT_TASKS));
  const [deadlines, setDeadlines] = useState(() => load('planner_deadlines', DEFAULT_DEADLINES));
  const [reminders, setReminders] = useState(() => load('planner_reminders', DEFAULT_REMINDERS));
  const [newTask, setNewTask] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newReminder, setNewReminder] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);

  useEffect(() => { save('planner_tasks', tasks); }, [tasks]);
  useEffect(() => { save('planner_deadlines', deadlines); }, [deadlines]);
  useEffect(() => { save('planner_reminders', reminders); }, [reminders]);

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : null } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: uid(), text: newTask.trim(), done: false, createdAt: new Date().toISOString() }]);
    setNewTask('');
    setShowAddTask(false);
  };
  const addDeadline = () => {
    if (!newDeadline.trim()) return;
    setDeadlines(prev => [...prev, { id: uid(), label: newDeadline.trim(), due: 'Set date...', urgent: false }]);
    setNewDeadline('');
    setShowAddDeadline(false);
  };
  const deleteDeadline = (id) => setDeadlines(prev => prev.filter(d => d.id !== id));
  const addReminder = () => {
    if (!newReminder.trim()) return;
    setReminders(prev => [...prev, { id: uid(), label: newReminder.trim(), due: 'Set time...', snoozed: false }]);
    setNewReminder('');
    setShowAddReminder(false);
  };
  const deleteReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id));
  const snoozeReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, snoozed: !r.snoozed } : r));

  const activeTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);
  const pct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>Planner</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            {doneTasks.length} done · {activeTasks.length} left · {deadlines.filter(d => d.urgent).length} urgent
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ height: 8, width: 100, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: 'var(--g)', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g)' }}>{pct}%</span>
          <button onClick={() => setShowAddTask(true)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} /> Add task
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 280px', gap: 20 }}>
        {/* Tasks column */}
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--alt)', padding: 3, borderRadius: 10, width: 'fit-content' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: tab === t ? 600 : 400,
                background: tab === t ? 'var(--card)' : 'transparent',
                color: tab === t ? 'var(--fg)' : 'var(--muted)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t} {t === 'Tasks' && `(${activeTasks.length})`}
              </button>
            ))}
          </div>

          {tab === 'Tasks' && (
            <div>
              {showAddTask && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input value={newTask} onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="What do you need to do?" autoFocus
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--g)', background: 'var(--card)', fontSize: 13, color: 'var(--fg)', outline: 'none' }}
                  />
                  <button onClick={addTask} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                  <button onClick={() => { setShowAddTask(false); setNewTask(''); }} style={{ padding: '8px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              {activeTasks.length === 0 && !showAddTask && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  All done for today! Add a new task to keep going.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeTasks.map(t => (
                  <div key={t.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--card)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <button onClick={() => toggleTask(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginTop: 1, color: 'var(--line)' }}>
                        <Circle size={18} />
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{t.text}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {t.subject && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted)', background: 'var(--alt)', padding: '2px 8px', borderRadius: 6 }}>{t.subject}</span>}
                          {t.est && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t.est} est.</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteTask(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)', opacity: 0.5 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {doneTasks.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Completed ({doneTasks.length})
                  </div>
                  {doneTasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <button onClick={() => toggleTask(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--g)' }}>
                        <CheckCircle2 size={16} />
                      </button>
                      <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', flex: 1 }}>{t.text}</span>
                      <button onClick={() => deleteTask(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)', opacity: 0.4 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'Deadlines' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deadlines.map(d => (
                <div key={d.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius)', border: `1px solid ${d.urgent ? 'var(--r)' : 'var(--line)'}`, background: 'var(--card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{d.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {d.urgent && <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: 'var(--r)', padding: '2px 8px', borderRadius: 6 }}>Urgent</span>}
                      <button onClick={() => deleteDeadline(d.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)', opacity: 0.5 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: d.urgent ? 'var(--r)' : 'var(--muted)', marginTop: 4 }}>{d.due}</div>
                </div>
              ))}
              {showAddDeadline ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDeadline()}
                    placeholder="Deadline name..." autoFocus
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--a)', background: 'var(--card)', fontSize: 13, color: 'var(--fg)', outline: 'none' }} />
                  <button onClick={addDeadline} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--a)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                </div>
              ) : (
                <button onClick={() => setShowAddDeadline(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  <Plus size={14} /> Add deadline
                </button>
              )}
            </div>
          )}

          {tab === 'Reminders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reminders.map(r => (
                <div key={r.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: r.snoozed ? 0.5 : 1 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--a)', marginTop: 2 }}>{r.due}{r.snoozed ? ' · Snoozed' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => snoozeReminder(r.id)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
                      {r.snoozed ? 'Unsnooze' : 'Snooze'}
                    </button>
                    <button onClick={() => deleteReminder(r.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {showAddReminder ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newReminder} onChange={e => setNewReminder(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReminder()}
                    placeholder="Remind me to..." autoFocus
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--b)', background: 'var(--card)', fontSize: 13, color: 'var(--fg)', outline: 'none' }} />
                  <button onClick={addReminder} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--b)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                </div>
              ) : (
                <button onClick={() => setShowAddReminder(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  <Bell size={14} /> Add reminder
                </button>
              )}
            </div>
          )}

          {tab === 'Email' && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13, borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--card)' }}>
              Connect Gmail in Settings to track emails here.
            </div>
          )}
        </div>

        {/* Deadlines sidebar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: 'var(--a)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Deadlines</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--a)', fontWeight: 600 }}>{deadlines.filter(d => d.urgent).length} urgent</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deadlines.slice(0, 4).map(d => (
              <div key={d.id} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${d.urgent ? 'var(--r)' : 'var(--line)'}`, background: 'var(--card)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{d.label}</div>
                <div style={{ fontSize: 11, color: d.urgent ? 'var(--r)' : 'var(--muted)', marginTop: 2 }}>{d.due}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 12 }}>
            <Bell size={14} style={{ color: 'var(--muted)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Reminders</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reminders.filter(r => !r.snoozed).slice(0, 3).map(r => (
              <div key={r.id} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--a)', marginTop: 2 }}>{r.due}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats column */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 12 }}>Today's Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { n: activeTasks.length, l: 'Active', c: 'var(--b)' },
              { n: doneTasks.length, l: 'Done', c: 'var(--g)' },
              { n: deadlines.length, l: 'Deadlines', c: 'var(--a)' },
              { n: reminders.filter(r => !r.snoozed).length, l: 'Reminders', c: 'var(--p)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 0', borderRadius: 10, background: 'var(--alt)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: "'Space Grotesk', sans-serif" }}>{s.n}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderRadius: 'var(--radius)', background: 'var(--card)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 8 }}>Progress</div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: 'var(--g)', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{pct}% of tasks complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}
