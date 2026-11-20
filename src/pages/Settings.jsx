import React, { useState, useEffect } from 'react';
import { User, Bell, Eye, Clock, Link2, Palette, Zap, Moon, Sun, Monitor, ChevronRight } from 'lucide-react';
import { load, save } from '../utils/store';

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
      background: on ? 'var(--g)' : 'var(--alt)', position: 'relative', transition: 'background 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 8, background: '#fff',
        position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function SettingRow({ icon: Icon, iconColor, label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      {Icon && <Icon size={16} style={{ color: iconColor || 'var(--muted)', flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Settings({ onNavigate }) {
  const [settings, setSettings] = useState(() => load('settings', {
    focusShield: true,
    quietDelivery: true,
    showFocusStatus: true,
    showTaskProgress: true,
    showTimer: false,
    theme: 'dark',
    dailyGoal: 5,
    focusMode: 'pomodoro',
    focusDuration: 25,
  }));

  useEffect(() => { save('settings', settings); }, [settings]);

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const setTheme = (theme) => {
    update('theme', theme);
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto', maxWidth: 700 }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: '0 0 24px' }}>Settings</h1>

      {/* Profile */}
      <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gs)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--g)' }}>H</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>Hemant</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>GATE · IIT Madras · {settings.dailyGoal}h daily goal</div>
        </div>
      </div>

      {/* Partner */}
      <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--ps)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--p)' }}>S</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>Linked with Siddhi</div>
          <div style={{ fontSize: 12, color: 'var(--g)' }}>Connected · 24 ms latency</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Notifications & Pings */}
        <div style={{ padding: '4px 20px 8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Notifications & Pings</div>
          <SettingRow icon={Bell} iconColor="var(--a)" label="Notification settings" desc="Banners, sounds, phone alerts">
            <button onClick={() => onNavigate?.('notifications')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}><ChevronRight size={16} /></button>
          </SettingRow>
          <SettingRow icon={Zap} iconColor="var(--p)" label="Ping Siddhi shortcut" desc="Ctrl ⇧ P">
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Change</span>
          </SettingRow>
          <SettingRow label="Quiet delivery" desc="Hold messages during focus sessions">
            <Toggle on={settings.quietDelivery} onChange={v => update('quietDelivery', v)} />
          </SettingRow>
        </div>

        {/* What Siddhi can see */}
        <div style={{ padding: '4px 20px 8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>What Siddhi can see</div>
          <SettingRow icon={Eye} label="Your focus status" desc="Online, studying, on break">
            <Toggle on={settings.showFocusStatus} onChange={v => update('showFocusStatus', v)} />
          </SettingRow>
          <SettingRow label="Your task progress" desc="Daily completion percentage">
            <Toggle on={settings.showTaskProgress} onChange={v => update('showTaskProgress', v)} />
          </SettingRow>
          <SettingRow label="Your timer" desc="Current session time and mode">
            <Toggle on={settings.showTimer} onChange={v => update('showTimer', v)} />
          </SettingRow>
        </div>

        {/* Focus defaults */}
        <div style={{ padding: '4px 20px 8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Focus defaults</div>
          <SettingRow icon={Clock} label="Default mode" desc={`${settings.focusMode === 'pomodoro' ? 'Pomodoro' : settings.focusMode === 'deep' ? 'Deep Work' : 'Sprint'} · ${settings.focusDuration} min`}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ k: 'pomodoro', l: '25m' }, { k: 'deep', l: '50m' }, { k: 'sprint', l: '15m' }].map(m => (
                <button key={m.k} onClick={() => { update('focusMode', m.k); update('focusDuration', m.k === 'pomodoro' ? 25 : m.k === 'deep' ? 50 : 15); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--line)',
                  background: settings.focusMode === m.k ? 'var(--gs)' : 'var(--card)',
                  color: settings.focusMode === m.k ? 'var(--gt)' : 'var(--muted)',
                  fontSize: 11, cursor: 'pointer',
                }}>{m.l}</button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Focus Shield" desc="Block distracting sites during focus">
            <Toggle on={settings.focusShield} onChange={v => update('focusShield', v)} />
          </SettingRow>
        </div>

        {/* Appearance */}
        <div style={{ padding: '4px 20px 8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Appearance</div>
          <SettingRow icon={Palette} label="Theme">
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ icon: Sun, label: 'Light', k: 'light' }, { icon: Moon, label: 'Dark', k: 'dark' }, { icon: Monitor, label: 'System', k: 'system' }].map(t => (
                <button key={t.k} onClick={() => setTheme(t.k)} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--line)',
                  background: settings.theme === t.k ? 'var(--gs)' : 'var(--card)',
                  color: settings.theme === t.k ? 'var(--gt)' : 'var(--muted)',
                  fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* Integrations */}
        <div style={{ padding: '4px 20px 8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Integrations</div>
          <SettingRow icon={Link2} label="Google Calendar" desc="Syncing events">
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--g)' }}>Connected</span>
          </SettingRow>
          <SettingRow label="Gmail" desc="Email tracking">
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--g)' }}>Connected</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
