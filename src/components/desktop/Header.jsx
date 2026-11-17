import React, { useState, useEffect } from 'react';
import { Search, Bell, ExternalLink, Moon, Sun } from 'lucide-react';

export default function Header({
  userName = 'Hemant',
  onOpenCommandPalette,
  onOpenCommand,
  onOpenNotifications = () => {},
  onToggleFloatOnTop,
  onFloatTop,
  theme = 'light',
  isDark = false,
  onToggleTheme = () => {},
  notificationCount = 0,
}) {
  const handleOpenCommand = onOpenCommandPalette || onOpenCommand || (() => {});
  const handleFloatTop = onToggleFloatOnTop || onFloatTop || (() => {});
  const currentTheme = theme || (isDark ? 'dark' : 'light');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const datePart = now.toLocaleDateString('en-US', options);
      const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setCurrentTime(`${datePart} · ${timePart}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="h-[68px] flex-shrink-0 flex items-center gap-3.5 px-7 border-b border-[var(--line)] bg-[var(--bg)] select-none">
      <div className="flex-1 min-w-0">
        <div className="h font-['Space_Grotesk'] text-xl font-bold text-[var(--fg)] tracking-tight">
          {greeting}, {userName}
        </div>
        <div className="mut text-xs text-[var(--muted)] font-medium">
          {currentTime || 'Saturday, 15 November · 9:25 PM'}
        </div>
      </div>

      {/* Spotlight Command Search */}
      <button
        onClick={handleOpenCommand}
        className="w-[280px] h-9 px-3 rounded-xl bg-[var(--alt)] text-[var(--muted)] flex items-center gap-2 hover:bg-[var(--line)]/50 transition-all text-xs"
        title="Open command palette (Ctrl K)"
      >
        <Search size={15} />
        <span className="flex-1 text-left font-medium">Search or quick add</span>
        <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--card)] border border-[var(--line)] text-[var(--fg)] shadow-xs">
          Ctrl K
        </span>
      </button>

      {/* Notification Bell */}
      <button
        onClick={onOpenNotifications}
        className="relative w-9 h-9 rounded-xl bg-[var(--alt)] text-[var(--fg)] flex items-center justify-center hover:brightness-95 active:scale-95 transition-all"
        title="Notifications"
      >
        <Bell size={17} />
        {notificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--r)] ring-2 ring-[var(--alt)]" />
        )}
      </button>

      {/* Theme Switcher */}
      <button
        onClick={onToggleTheme}
        className="w-9 h-9 rounded-xl bg-[var(--alt)] text-[var(--fg)] flex items-center justify-center hover:brightness-95 active:scale-95 transition-all"
        title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
      >
        {currentTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Float on Top (Picture-in-Picture Companion Toggle) */}
      <button
        onClick={handleFloatTop}
        className="btn flex items-center gap-2 h-9 px-3.5 rounded-xl bg-[#15803D] text-white font-semibold text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all"
        title="Pop out to floating circular companion widget"
      >
        <ExternalLink size={14} />
        <span>Float on top</span>
      </button>
    </header>
  );
}
