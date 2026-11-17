import React from 'react';
import {
  Home,
  Clock,
  CheckSquare,
  Calendar,
  Video,
  BookOpen,
  MessageSquare,
  BarChart2,
  Trophy,
  Sliders,
  Zap,
  Flame,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, badge: null },
  { id: 'focus', label: 'Focus', icon: Clock, badge: null },
  { id: 'planner', label: 'Planner', icon: CheckSquare, badge: '2' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, badge: null },
  { id: 'room', label: 'Study Room', icon: Video, badge: null, isLive: true },
  { id: 'notes', label: 'Notes & Cards', icon: BookOpen, badge: null },
  { id: 'chat', label: 'Chat', icon: MessageSquare, badge: '3' },
  { id: 'insights', label: 'Insights', icon: BarChart2, badge: null },
  { id: 'goals', label: 'Goals & Rewards', icon: Trophy, badge: null },
];

export default function Sidebar({
  activeTab = 'home',
  activeView,
  onSelectTab,
  onNavigate,
  compact = false,
  onOpenPingModal,
  onQuickPing,
  streakDays = 12,
  userName = 'Hemant',
  partnerName = 'Sakura',
  isPartnerOnline = true,
  isCallActive = false,
}) {
  const currentTab = activeTab || activeView || 'home';
  const handleSelectTab = onSelectTab || onNavigate || (() => {});
  const handleOpenPing = onOpenPingModal || onQuickPing || (() => {});
  if (compact) {
    return (
      <nav
        aria-label="Main navigation"
        className="w-16 flex-shrink-0 flex flex-col items-center gap-1 py-4 bg-[var(--card)] border-r border-[var(--line)] select-none transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-xl bg-[#15803D] text-white flex items-center justify-center mb-3 shadow-sm">
          <span className="text-base">🥬</span>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[var(--gs)] text-[var(--gt)] font-semibold shadow-sm'
                  : 'text-[var(--muted)] hover:bg-[var(--alt)] hover:text-[var(--fg)]'
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
            </button>
          );
        })}

        <div className="flex-1" />

        <button
          onClick={onOpenPingModal}
          title={`Ping ${partnerName} (Ctrl Shift P)`}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#7C3AED] text-white shadow-sm hover:brightness-110 active:scale-95 transition-all mb-1"
        >
          <Zap size={18} fill="currentColor" />
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          title="Settings"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-[var(--gs)] text-[var(--gt)]'
              : 'text-[var(--muted)] hover:bg-[var(--alt)] hover:text-[var(--fg)]'
          }`}
        >
          <Sliders size={18} />
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main navigation"
      className="w-56 flex-shrink-0 flex flex-col gap-1 p-3 pb-3.5 bg-[var(--card)] border-r border-[var(--line)] select-none transition-all duration-200"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-3">
        <div className="w-8 h-8 rounded-xl bg-[#15803D] text-white flex items-center justify-center shadow-sm">
          <span className="text-base">🥬</span>
        </div>
        <div className="flex flex-col">
          <span className="font-['Space_Grotesk'] text-lg font-bold leading-tight tracking-tight">Amigo</span>
          <span className="text-[10px] text-[var(--muted)] font-medium">Study Date Suite</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex items-center gap-2.5 h-[38px] px-2.5 rounded-xl font-medium text-[13px] transition-all ${
                isActive
                  ? 'bg-[var(--gs)] text-[var(--gt)] font-semibold shadow-sm'
                  : 'text-[var(--muted)] hover:bg-[var(--alt)] hover:text-[var(--fg)]'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.isLive && isCallActive && (
                <span className="w-2 h-2 rounded-full bg-[var(--r)] animate-pulse" />
              )}
              {item.badge && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#15803D] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Ping Partner Action */}
      <button
        onClick={handleOpenPing}
        className="flex items-center gap-2 h-10 px-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-[13px] shadow-sm hover:brightness-110 active:scale-[0.98] transition-all mb-2"
      >
        <Zap size={16} fill="currentColor" />
        <span className="flex-1 text-left">Ping {partnerName}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20">
          Ctrl ⇧ P
        </span>
      </button>

      {/* Shared Streak Card */}
      <button
        onClick={() => handleSelectTab('goals')}
        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--as)] text-[var(--fg)] text-left hover:brightness-95 transition-all mb-2 border border-amber-500/20"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-[var(--a)]">
          <Flame size={18} fill="currentColor" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[13px] leading-tight text-[var(--a)]">{streakDays}-day streak</div>
          <div className="text-[11px] text-[var(--muted)] truncate">Shared with {partnerName}</div>
        </div>
      </button>

      {/* Settings Tab Link */}
      <button
        onClick={() => handleSelectTab('settings')}
        className={`flex items-center gap-2.5 h-[36px] px-2.5 rounded-xl font-medium text-[13px] transition-all ${
          currentTab === 'settings'
            ? 'bg-[var(--gs)] text-[var(--gt)] font-semibold'
            : 'text-[var(--muted)] hover:bg-[var(--alt)] hover:text-[var(--fg)]'
        }`}
      >
        <Sliders size={18} />
        <span>Settings</span>
      </button>

      {/* User Status Bar */}
      <div className="flex items-center gap-2.5 pt-2.5 mt-1 border-t border-[var(--line)] px-1">
        <div className="w-8 h-8 rounded-xl bg-[var(--gs)] text-[var(--gt)] flex items-center justify-center font-['Space_Grotesk'] font-bold text-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-xs text-[var(--fg)] truncate">{userName}</div>
          <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>Connected · 24 ms</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
