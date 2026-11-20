import React from 'react';
import {
  Home, Clock, ListTodo, CalendarDays, Video, BookOpen, MessageCircle,
  BarChart3, Target, Settings, Zap, Flame,
} from 'lucide-react';
import { load } from '../utils/store';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'focus', label: 'Focus', icon: Clock },
  { id: 'planner', label: 'Planner', icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'room', label: 'Study Room', icon: Video },
  { id: 'notes', label: 'Notes & Cards', icon: BookOpen },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'goals', label: 'Goals & Rewards', icon: Target },
];

export default function Sidebar({
  active, onNavigate, nickname = 'User', platform = 'darwin',
  partnerName = 'Partner', partnerOnline = false, partnerStatus = 'offline',
}) {
  const isMac = platform === 'darwin';
  const streak = load('streak', { days: 0, freezes: 2 });

  return (
    <div style={{
      width: 220, height: '100%', background: 'var(--sidebar)',
      borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, userSelect: 'none',
    }}>
      <div className="drag-region" style={{ padding: isMac ? '38px 16px 12px' : '12px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--g)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13.5 2.25S2 11.5 2 13.5s1.4 3.6 3 5"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--fg)' }}>
          Amigo
        </span>
      </div>

      <nav className="no-drag" style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%',
                textAlign: 'left', fontSize: 13, fontWeight: isActive ? 600 : 400,
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                color: isActive ? 'var(--gt)' : 'var(--muted)',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--alt)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Ping button */}
      <div className="no-drag" style={{ padding: '8px 8px 4px' }}>
        <button
          onClick={() => onNavigate('ping')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%',
            background: 'var(--p)', color: '#fff', fontSize: 13, fontWeight: 600,
          }}
        >
          <Zap size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Ping {partnerName}</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>Ctrl ⇧ P</span>
        </button>
      </div>

      {/* Streak */}
      <div className="no-drag" style={{ padding: '8px 8px', borderTop: '1px solid var(--line)', margin: '4px 8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
          <Flame size={16} style={{ color: '#F59E0B' }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{streak.days}-day streak</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Shared with {partnerName}</div>
          </div>
        </div>
      </div>

      {/* Settings + User */}
      <div className="no-drag" style={{ padding: '4px 8px 12px', borderTop: '1px solid var(--line)', margin: '0 8px' }}>
        <button
          onClick={() => onNavigate('settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%',
            textAlign: 'left', fontSize: 13, background: 'transparent',
            color: active === 'settings' ? 'var(--gt)' : 'var(--muted)',
            fontWeight: active === 'settings' ? 600 : 400,
          }}
        >
          <Settings size={18} strokeWidth={1.5} />
          Settings
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginTop: 2,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'var(--gs)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--g)',
          }}>{nickname.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{nickname}</div>
            <div style={{ fontSize: 10, color: partnerOnline ? 'var(--g)' : 'var(--muted)' }}>
              {partnerOnline
                ? partnerStatus === 'studying' ? `${partnerName} is studying` : `${partnerName} online`
                : `${partnerName} offline`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
