import React, { useState } from 'react';

export default function PlannerView({ onNavigate, onStartFocus }) {
  const [filter, setFilter] = useState('today'); // 'today' | 'week'
  const [tasks, setTasks] = useState([
    {
      id: 't1',
      title: 'Solve 10 practice exam questions',
      inFocus: true,
      timeRemaining: '18:24 left',
      subject: 'Statistics',
      est: '45 min est.',
      completed: false,
    },
    {
      id: 't2',
      title: 'Draft certification summary sheet',
      subject: 'Certification',
      est: '30 min est. · planned 8:45 PM',
      completed: false,
    },
    {
      id: 't3',
      title: 'Final project slides — outline',
      isShared: true,
      sharedText: 'She finished 2 of 5 sections',
      completed: false,
    },
  ]);

  const [completedTasks, setCompletedTasks] = useState([
    { id: 'c1', title: 'Review Chapter 3 formulas', duration: '40 min' },
    { id: 'c2', title: 'Watch lecture 12 recording', duration: '55 min' },
  ]);

  const [deadlines, setDeadlines] = useState([
    { id: 'd1', title: 'ML Assignment submission', time: 'Tomorrow, 11:59 PM · 29 hours left', urgent: true },
    { id: 'd2', title: 'Stats quiz', time: 'Tue 17 Nov · 3 days left', prep: '4h prep planned', alert: true },
    { id: 'd3', title: 'Final project presentation', time: 'Sat 28 Nov · 14 days left', shared: true },
  ]);

  const [reminders, setReminders] = useState([
    { id: 'r1', title: 'Submit ML assignment', time: 'Tomorrow, 6:00 PM · also reminds Sakura to check on you', isPurple: true },
    { id: 'r2', title: 'Review study group notes', time: 'Mon 16 Nov, 9:00 AM' },
    { id: 'r3', title: 'Start final project slides', time: 'Wed 18 Nov, 3:00 PM · repeats weekly' },
  ]);

  const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTasks(tasks.filter((t) => t.id !== id));
      setCompletedTasks([...completedTasks, { id: task.id, title: task.title, duration: '25 min' }]);
    }
  };

  const handleMakeTaskFromEmail = (title, subject) => {
    setTasks([
      ...tasks,
      {
        id: `t_${Date.now()}`,
        title,
        subject,
        est: '20 min est.',
        completed: false,
      },
    ]);
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h" style={{ fontSize: '20px' }}>Planner</div>
          <div className="mut" style={{ fontSize: '12px' }}>
            {completedTasks.length} done · {tasks.length} left · 1 deadline tomorrow · 1 email needs action
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 14px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--alt)',
          }}
        >
          <div style={{ width: '110px', height: '6px', borderRadius: '3px', background: 'var(--line)' }}>
            <div style={{ width: '50%', height: '100%', borderRadius: '3px', background: 'var(--g)' }}></div>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--gt)', fontSize: '13px' }}>50%</span>
        </div>

        <button className="btn">
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          </svg>
          Plan my day
        </button>

        <button
          className="btn pri"
          onClick={() => {
            const title = prompt('Enter new task:');
            if (title) {
              setTasks([...tasks, { id: `t_${Date.now()}`, title, subject: 'General', est: '30 min est.', completed: false }]);
            }
          }}
        >
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </header>

      {/* 3 Column Grid */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr) 320px',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Column 1: Tasks */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '28px' }}>
            <div className="h" style={{ fontSize: '15px', flex: 1 }}>Tasks</div>
            <span
              onClick={() => setFilter('today')}
              className="chip"
              style={{
                cursor: 'pointer',
                background: filter === 'today' ? 'var(--gs)' : 'var(--alt)',
                color: filter === 'today' ? 'var(--gt)' : 'inherit',
                fontWeight: filter === 'today' ? 600 : 400,
              }}
            >
              Today
            </span>
            <span
              onClick={() => setFilter('week')}
              className="chip"
              style={{
                cursor: 'pointer',
                background: filter === 'week' ? 'var(--gs)' : 'var(--alt)',
                color: filter === 'week' ? 'var(--gt)' : 'inherit',
                fontWeight: filter === 'week' ? 600 : 400,
              }}
            >
              This week
            </span>
          </div>

          {/* Active Tasks List */}
          {tasks.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                padding: '13px 14px',
                borderRadius: '14px',
                border: t.inFocus ? '1.5px solid var(--g)' : '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  onClick={() => toggleTask(t.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${t.inFocus ? 'var(--g)' : t.isShared ? 'var(--p)' : 'var(--muted)'}`,
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                ></div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {t.inFocus && (
                      <span className="chip" style={{ background: 'var(--gs)', color: 'var(--gt)' }}>
                        In focus · {t.timeRemaining}
                      </span>
                    )}
                    {t.subject && (
                      <span className="chip" style={{ background: 'var(--alt)' }}>
                        {t.subject}
                      </span>
                    )}
                    {t.isShared && (
                      <span className="chip" style={{ background: 'var(--ps)', color: 'var(--p)' }}>
                        Shared with Sakura
                      </span>
                    )}
                    <span className="mut" style={{ fontSize: '12px' }}>
                      {t.est || t.sharedText}
                    </span>
                  </div>
                </div>

                {!t.inFocus && onNavigate && (
                  <button
                    onClick={() => {
                      if (onStartFocus) onStartFocus(t);
                      onNavigate('focus');
                    }}
                    aria-label="Start focus on this task"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: 'var(--gs)',
                      color: 'var(--gt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <svg className="ic" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 5l12 7-12 7z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Completed Today */}
          {completedTasks.length > 0 && (
            <>
              <div className="lbl" style={{ marginTop: '10px' }}>Completed today</div>
              {completedTasks.map((c) => (
                <div key={c.id} className="item">
                  <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gt)' }}>
                    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6" />
                  </svg>
                  <span className="mut" style={{ textDecoration: 'line-through', flex: 1, fontSize: '13px' }}>
                    {c.title}
                  </span>
                  <span className="mut" style={{ fontSize: '12px' }}>{c.duration}</span>
                </div>
              ))}
            </>
          )}

          <div style={{ flex: 1 }}></div>

          {/* AI Helper Banner */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px dashed var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Auto-schedule 2 tasks into tonight</div>
              <div className="mut" style={{ fontSize: '11px' }}>Leaves 30m buffer before your 11 PM cutoff</div>
            </div>
            <button className="btn" style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}>
              Apply
            </button>
          </div>
        </section>

        {/* Column 2: Deadlines & Reminders */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Deadlines Card */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--r)' }}>
                <path d="M12 4 2.5 20h19zM12 10v4M12 17h.01" />
              </svg>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Deadlines</div>
              <button
                className="btn"
                onClick={() => {
                  const title = prompt('Enter deadline title:');
                  if (title) setDeadlines([...deadlines, { id: `d_${Date.now()}`, title, time: 'Next week' }]);
                }}
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deadlines.map((d) => (
                <div
                  key={d.id}
                  className="item"
                  style={{ background: d.urgent ? 'var(--rs)' : 'var(--alt)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{d.title}</div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: d.urgent ? 'var(--r)' : d.alert ? 'var(--a)' : 'inherit',
                      }}
                    >
                      {d.time}
                    </div>
                  </div>
                  {d.urgent && <span className="chip" style={{ background: 'var(--r)', color: '#fff' }}>Urgent</span>}
                  {d.prep && <span className="mut" style={{ fontSize: '12px' }}>{d.prep}</span>}
                  {d.shared && <span className="chip" style={{ background: 'var(--ps)', color: 'var(--p)' }}>Shared</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Reminders Card */}
          <div className="card" style={{ padding: '16px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
                <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />
              </svg>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Reminders</div>
              <button
                className="btn"
                onClick={() => {
                  const title = prompt('Reminder title:');
                  if (title) setReminders([...reminders, { id: `r_${Date.now()}`, title, time: 'Tomorrow 10:00 AM' }]);
                }}
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="item"
                  style={{ background: r.isPurple ? 'var(--ps)' : 'var(--alt)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.title}</div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: r.isPurple ? 'var(--p)' : 'inherit',
                        fontWeight: r.isPurple ? 600 : 400,
                      }}
                    >
                      {r.time}
                    </div>
                  </div>
                  {!r.isPurple && <span className="mut" style={{ fontSize: '12px', cursor: 'pointer' }}>Snooze</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Column 3: Email Tracker */}
        <section className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--b)' }}>
              <path d="M3 6h18v12H3zM3 7l9 6 9-6" />
            </svg>
            <div className="h" style={{ fontSize: '15px', flex: 1 }}>Email tracker</div>
            <span className="chip" style={{ background: 'var(--bs)', color: 'var(--b)' }}>3 tracked</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--alt)', textAlign: 'center' }}>
              <div className="h" style={{ fontSize: '18px', color: 'var(--b)' }}>5</div>
              <div className="mut" style={{ fontSize: '11px' }}>Unread</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--alt)', textAlign: 'center' }}>
              <div className="h" style={{ fontSize: '18px', color: 'var(--a)' }}>2</div>
              <div className="mut" style={{ fontSize: '11px' }}>Awaiting</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--alt)', textAlign: 'center' }}>
              <div className="h" style={{ fontSize: '18px', color: 'var(--gt)' }}>12</div>
              <div className="mut" style={{ fontSize: '11px' }}>Resolved</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            {/* Action Needed Email */}
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--rs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="ell" style={{ fontWeight: 600, flex: 1, fontSize: '13px' }}>
                  Registrar — Course registration
                </span>
                <span className="mut" style={{ fontSize: '11px' }}>5h ago</span>
              </div>
              <div className="mut ell" style={{ fontSize: '12px', marginTop: '2px' }}>
                Action required: confirm spring semester…
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span className="chip" style={{ background: 'var(--r)', color: '#fff' }}>Action needed</span>
                <button
                  onClick={() => handleMakeTaskFromEmail('Confirm spring semester registration', 'Registrar')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gt)',
                    padding: 0,
                  }}
                >
                  Make it a task
                </button>
              </div>
            </div>

            {/* Awaiting Reply Email */}
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="ell" style={{ fontWeight: 600, flex: 1, fontSize: '13px' }}>
                  Prof. Sharma — Assignment extension
                </span>
                <span className="mut" style={{ fontSize: '11px' }}>2d ago</span>
              </div>
              <div className="mut ell" style={{ fontSize: '12px', marginTop: '2px' }}>
                Re: Request for a 2-day extension on ML…
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span className="chip" style={{ background: 'var(--as)', color: 'var(--a)' }}>Awaiting reply</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gt)', cursor: 'pointer' }}>
                  Send follow-up
                </span>
              </div>
            </div>

            {/* Teaching Assistant */}
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="ell" style={{ fontWeight: 600, flex: 1, fontSize: '13px' }}>
                  TA Alex — Office hours moved
                </span>
                <span className="mut" style={{ fontSize: '11px' }}>1d ago</span>
              </div>
              <div className="mut ell" style={{ fontSize: '12px', marginTop: '2px' }}>
                Tomorrow's session moved to 4 PM via Zoom…
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span className="chip" style={{ background: 'var(--line)', color: 'var(--muted)' }}>Archived</span>
                <span className="mut" style={{ fontSize: '12px' }}>Calendar synced</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
