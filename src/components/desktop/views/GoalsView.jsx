import React, { useState } from 'react';

export default function GoalsView() {
  const [points, setPoints] = useState(380);

  const challengeDays = [
    { day: 'M', mark: '✓', done: true, bg: 'var(--gs)', color: 'var(--gt)', border: 'none' },
    { day: 'T', mark: '✓', done: true, bg: 'var(--gs)', color: 'var(--gt)', border: 'none' },
    { day: 'W', mark: '✓', done: true, bg: 'var(--gs)', color: 'var(--gt)', border: 'none' },
    { day: 'T', mark: '✓', done: true, bg: 'var(--gs)', color: 'var(--gt)', border: 'none' },
    { day: 'F', mark: '·', done: false, bg: 'var(--alt)', color: 'var(--muted)', border: '1px dashed var(--line)' },
    { day: 'S', mark: '·', done: false, bg: 'var(--alt)', color: 'var(--muted)', border: '1px dashed var(--line)' },
    { day: 'S', mark: '·', done: false, bg: 'var(--alt)', color: 'var(--muted)', border: '1px dashed var(--line)' },
  ];

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
          <div className="h" style={{ fontSize: '20px' }}>Goals &amp; Rewards</div>
          <div className="mut" style={{ fontSize: '12px' }}>
            What you and Sakura are working toward, and what you've promised yourselves for getting there
          </div>
        </div>

        <button
          className="btn pri"
          onClick={() => {
            prompt('New goal:');
          }}
        >
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New goal
        </button>
      </header>

      {/* Main Grid */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Left Column: Goals, Weekly Challenge, Achievements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Goals Card */}
          <section className="card" style={{ padding: '18px 20px' }}>
            <div className="h" style={{ fontSize: '15px', marginBottom: '12px' }}>Goals</div>

            {/* Goal 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, flex: 1, fontSize: '14px' }}>40 focus hours together in November</span>
                  <div className="av" style={{ width: '24px', height: '24px', fontSize: '11px', background: 'var(--gs)', color: 'var(--gt)' }}>H</div>
                  <div className="av" style={{ width: '24px', height: '24px', fontSize: '11px', background: 'var(--ps)', color: 'var(--p)', marginLeft: '-12px', border: '2px solid var(--card)' }}>S</div>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--alt)', marginTop: '8px' }}>
                  <div style={{ width: '80%', height: '100%', borderRadius: '4px', background: 'var(--p)' }}></div>
                </div>
                <div className="mut" style={{ fontSize: '12px', marginTop: '4px' }}>
                  31h 54m of 40h · on pace to finish on 24 Nov
                </div>
              </div>
              <div className="h" style={{ fontSize: '20px', width: '52px', textAlign: 'right' }}>80%</div>
            </div>

            {/* Goal 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, flex: 1, fontSize: '14px' }}>Finish the ML course before 15 December</span>
                  <div className="av" style={{ width: '24px', height: '24px', fontSize: '11px', background: 'var(--gs)', color: 'var(--gt)' }}>H</div>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--alt)', marginTop: '8px' }}>
                  <div style={{ width: '64%', height: '100%', borderRadius: '4px', background: 'var(--g)' }}></div>
                </div>
                <div className="mut" style={{ fontSize: '12px', marginTop: '4px' }}>
                  9 of 14 modules · needs 2 modules a week from here
                </div>
              </div>
              <div className="h" style={{ fontSize: '20px', width: '52px', textAlign: 'right' }}>64%</div>
            </div>

            {/* Goal 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, flex: 1, fontSize: '14px' }}>Finish all linear algebra problem sets</span>
                  <span className="chip" style={{ background: 'var(--as)', color: 'var(--a)' }}>Sakura is cheering for this one</span>
                  <div className="av" style={{ width: '24px', height: '24px', fontSize: '11px', background: 'var(--ps)', color: 'var(--p)' }}>S</div>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--alt)', marginTop: '8px' }}>
                  <div style={{ width: '78%', height: '100%', borderRadius: '4px', background: 'var(--p)' }}></div>
                </div>
                <div className="mut" style={{ fontSize: '12px', marginTop: '4px' }}>
                  7 of 9 sets · Sakura's goal, visible to you
                </div>
              </div>
              <div className="h" style={{ fontSize: '20px', width: '52px', textAlign: 'right' }}>78%</div>
            </div>
          </section>

          {/* This Week's Challenge */}
          <section className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lbl" style={{ color: 'var(--a)' }}>This week's challenge · 50 points</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>
                Start your first session before 6 PM on five days
              </div>
              <div className="mut" style={{ fontSize: '12px', marginTop: '2px' }}>
                4 of 5 done · one more tomorrow completes it for both of you
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {challengeDays.map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: c.bg,
                      color: c.color,
                      border: c.border,
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {c.mark}
                  </div>
                  <span className="mut" style={{ fontSize: '11px' }}>{c.day}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Achievements Grid */}
          <section className="card" style={{ padding: '18px 20px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Achievements</div>
              <span className="mut" style={{ fontSize: '12px' }}>4 of 18 earned</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', padding: '10px', borderRadius: '12px', background: 'var(--alt)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--gs)', color: 'var(--gt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>First 10 hours</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', padding: '10px', borderRadius: '12px', background: 'var(--alt)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--as)', color: 'var(--a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10 10 12 7 12 3z" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>7-day streak</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', padding: '10px', borderRadius: '12px', background: 'var(--alt)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--ps)', color: 'var(--p)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>25 sessions together</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', padding: '10px', borderRadius: '12px', background: 'var(--alt)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bs)', color: 'var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h13v11H4zM7 4h13v11" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>100 cards reviewed</div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Reward Jar & Promised Rewards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          {/* Reward Jar */}
          <section className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--a)' }}>
                <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2 0-4-1-4-2.5S10 3 12 7zM12 7c2 0 4-1 4-2.5S14 3 12 7z" />
              </svg>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Reward jar</div>
              <span className="mut" style={{ fontSize: '12px' }}>Earned together</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
              <span className="h" style={{ fontSize: '36px', lineHeight: 1 }}>{points}</span>
              <span className="mut" style={{ fontSize: '13px' }}>of 500 points</span>
            </div>

            <div style={{ height: '10px', borderRadius: '5px', background: 'var(--alt)', marginTop: '10px' }}>
              <div style={{ width: `${(points / 500) * 100}%`, height: '100%', borderRadius: '5px', background: 'var(--a)' }}></div>
            </div>

            <div style={{ marginTop: '10px', fontWeight: 600, fontSize: '14px' }}>Next: Movie night, no laptops</div>
            <div className="mut" style={{ fontSize: '12px' }}>120 points to go — about four shared sessions.</div>

            <div className="mut" style={{ fontSize: '11px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
              10 per focus hour · 25 per shared session · 50 per weekly challenge
            </div>
          </section>

          {/* Rewards List */}
          <section className="card" style={{ padding: '16px 18px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Rewards you've set</div>
              <button
                className="btn"
                onClick={() => {
                  prompt('Set reward name:');
                }}
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '13px' }}>Movie night, no laptops</span>
              <span className="chip" style={{ background: 'var(--as)', color: 'var(--a)' }}>500</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '13px' }}>Dessert place Sakura keeps mentioning</span>
              <span className="chip" style={{ background: 'var(--alt)' }}>800</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '13px' }}>Day trip after finals</span>
              <span className="chip" style={{ background: 'var(--alt)' }}>3,000</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
