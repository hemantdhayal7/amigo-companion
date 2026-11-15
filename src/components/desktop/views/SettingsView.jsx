import React, { useState } from 'react';

export default function SettingsView({ isDark, onToggleTheme }) {
  const [privacy, setPrivacy] = useState({
    taskTimer: true,
    progressStreak: true,
    calendar: true,
    email: false,
  });

  const [toggles, setToggles] = useState({
    autoNextRound: true,
    focusShield: true,
    keepMiniOnTop: true,
    launchOnStartup: true,
    closeToTray: true,
  });

  const toggleSwitch = (key, stateObj, setObj) => {
    setObj({ ...stateObj, [key]: !stateObj[key] });
  };

  const renderToggle = (active, onClick) => (
    <div
      onClick={onClick}
      role="button"
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '11px',
        background: active ? '#15803D' : 'var(--alt)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: active ? '18px' : '2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      ></div>
    </div>
  );

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
        <div className="av" style={{ width: '40px', height: '40px', fontSize: '17px', background: 'var(--gs)', color: 'var(--gt)', fontWeight: 600 }}>
          H
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h" style={{ fontSize: '20px' }}>Settings</div>
          <div className="mut" style={{ fontSize: '12px' }}>
            Hemant · Amigo 2.0 for desktop · up to date
          </div>
        </div>

        <button className="btn" onClick={() => prompt('Update display name:', 'Hemant')}>
          Edit profile
        </button>
        <button className="btn" style={{ color: 'var(--r)' }} onClick={() => alert('Signed out of session')}>
          Sign out
        </button>
      </header>

      {/* 2x3 Grid */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
          gap: '14px',
          overflowY: 'auto',
        }}
      >
        {/* Section 1: Partner */}
        <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="h" style={{ fontSize: '15px' }}>Partner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 8px' }}>
            <div className="av" style={{ width: '38px', height: '38px', background: 'var(--ps)', color: 'var(--p)', fontWeight: 600 }}>
              S
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Sakura</div>
              <div className="mut" style={{ fontSize: '12px' }}>Linked since 28 September · 47 sessions</div>
            </div>
            <span className="chip" style={{ background: 'var(--gs)', color: 'var(--gt)' }}>Linked</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Your invite code</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px' }}>
              AMIGO-HEM-7X4K
            </span>
            <button className="btn" onClick={() => navigator.clipboard.writeText('AMIGO-HEM-7X4K')} style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}>
              Copy
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Server</span>
            <span className="mut" style={{ fontSize: '12px' }}>amigo-companion.onrender.com</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Connection</span>
            <span style={{ color: 'var(--gt)', fontWeight: 600, fontSize: '12px' }}>Direct P2P / Free Cloudflare TURN · 24 ms</span>
          </div>

          <div style={{ flex: 1 }}></div>
          <button className="btn" style={{ alignSelf: 'flex-start', height: '28px', fontSize: '12px', color: 'var(--muted)' }}>
            Unlink partner
          </button>
        </section>

        {/* Section 2: Privacy */}
        <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
            <div className="h" style={{ fontSize: '15px' }}>What Sakura can see</div>
          </div>
          <div className="mut" style={{ fontSize: '12px', margin: '2px 0 6px' }}>
            You choose, item by item. She sees the same list for you.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Current task and timer</span>
            {renderToggle(privacy.taskTimer, () => toggleSwitch('taskTimer', privacy, setPrivacy))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Daily progress and streak</span>
            {renderToggle(privacy.progressStreak, () => toggleSwitch('progressStreak', privacy, setPrivacy))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Calendar, as free or busy only</span>
            {renderToggle(privacy.calendar, () => toggleSwitch('calendar', privacy, setPrivacy))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Email tracker</span>
            {renderToggle(privacy.email, () => toggleSwitch('email', privacy, setPrivacy))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Screen</span>
            <span className="mut" style={{ fontSize: '12px' }}>Only while you share</span>
          </div>
        </section>

        {/* Section 3: Focus Defaults */}
        <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="h" style={{ fontSize: '15px' }}>Focus defaults</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '6px' }}>
            <span>Session / break</span>
            <span style={{ fontWeight: 600 }}>25 min / 5 min</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Long break</span>
            <span style={{ fontWeight: 600 }}>15 min after 4 rounds</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Daily goal</span>
            <span style={{ fontWeight: 600 }}>4 hours</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Start next round automatically</span>
            {renderToggle(toggles.autoNextRound, () => toggleSwitch('autoNextRound', toggles, setToggles))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Focus shield during sessions</span>
            {renderToggle(toggles.focusShield, () => toggleSwitch('focusShield', toggles, setToggles))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Blocked apps and sites</span>
            <span style={{ fontWeight: 600 }}>6 blocked</span>
          </div>
        </section>

        {/* Section 4: Integrations */}
        <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="h" style={{ fontSize: '15px' }}>Integrations</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '6px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Gmail</div>
              <div className="mut" style={{ fontSize: '11px' }}>Powers the email tracker · read-only</div>
            </div>
            <span className="chip" style={{ background: 'var(--gs)', color: 'var(--gt)' }}>Connected</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Google Calendar</div>
              <div className="mut" style={{ fontSize: '11px' }}>Two-way sync of focus blocks</div>
            </div>
            <span className="chip" style={{ background: 'var(--gs)', color: 'var(--gt)' }}>Connected</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Course portal (LMS)</div>
              <div className="mut" style={{ fontSize: '11px' }}>Import assignment deadlines</div>
            </div>
            <button className="btn" style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}>Connect</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Notion</div>
              <div className="mut" style={{ fontSize: '11px' }}>Bring in existing notes</div>
            </div>
            <button className="btn" style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}>Connect</button>
          </div>
        </section>

        {/* Section 5: Global Shortcuts */}
        <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8" />
            </svg>
            <div className="h" style={{ fontSize: '15px' }}>Global shortcuts</div>
          </div>
          <div className="mut" style={{ fontSize: '12px', margin: '2px 0 6px' }}>
            Work from any app, even when Amigo is in the tray.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Quick add</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl K</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Start or pause focus</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl Shift F</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Ping Sakura</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl Shift P</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Mute or unmute mic</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl Shift M</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Show mini timer</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl Shift T</span>
          </div>
        </section>

        {/* Section 6: Window & Appearance */}
        <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="h" style={{ fontSize: '15px' }}>Window &amp; Appearance</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '6px' }}>
            <span>Dark theme</span>
            {renderToggle(isDark, onToggleTheme)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Keep mini timer on top</span>
            {renderToggle(toggles.keepMiniOnTop, () => toggleSwitch('keepMiniOnTop', toggles, setToggles))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Launch when computer starts</span>
            {renderToggle(toggles.launchOnStartup, () => toggleSwitch('launchOnStartup', toggles, setToggles))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Close to tray instead of quitting</span>
            {renderToggle(toggles.closeToTray, () => toggleSwitch('closeToTray', toggles, setToggles))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Quiet hours</span>
            <span style={{ fontWeight: 600 }}>11 PM – 7 AM</span>
          </div>
        </section>
      </main>
    </div>
  );
}
