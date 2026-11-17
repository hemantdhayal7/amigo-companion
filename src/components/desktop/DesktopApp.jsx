import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import HomeView from './views/HomeView';
import StudyRoomView from './views/StudyRoomView';
import FocusView from './views/FocusView';
import PlannerView from './views/PlannerView';
import CalendarView from './views/CalendarView';
import NotesView from './views/NotesView';
import ChatView from './views/ChatView';
import GoalsView from './views/GoalsView';
import InsightsView from './views/InsightsView';
import SettingsView from './views/SettingsView';
import CommandPalette from './modals/CommandPalette';
import QuickPingModal from './modals/QuickPingModal';

export default function DesktopApp({
  onFloatTop,
  remoteStream,
  localStream,
  partnerState = {},
  partnerStatus = 'connected',
  callState = {},
  toggleMic,
  toggleCamera,
  toggleScreen,
  onSendReaction,
  socket,
  roomId = 'default-study-room',
}) {
  const [activeView, setActiveView] = useState('home');
  const [isDark, setIsDark] = useState(true);
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickPingOpen, setIsQuickPingOpen] = useState(false);
  const [pingBanner, setPingBanner] = useState(null);

  // Global Keyboard shortcuts: Ctrl+K / Cmd+K and Ctrl+Shift+P / Cmd+Shift+P
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+Shift+P or Cmd+Shift+P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsQuickPingOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const handleSendPing = ({ message, loudness }) => {
    if (socket && socket.connected) {
      socket.emit('ping-partner', { roomId, message, loudness, from: 'Hemant' });
    }
    setPingBanner(`Sent to Sakura: "${message}"`);
    setTimeout(() => setPingBanner(null), 3500);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView
            onNavigate={setActiveView}
            partnerState={partnerState}
            onFloatTop={onFloatTop}
            onOpenPingModal={() => setIsQuickPingOpen(true)}
          />
        );
      case 'room':
      case 'study-room':
        return (
          <StudyRoomView
            userName="Hemant"
            partnerName={partnerState?.name || 'Sakura'}
            isMicOn={callState?.isMicOn}
            isVideoOn={callState?.isVideoOn}
            onToggleMic={toggleMic}
            onToggleVideo={toggleCamera}
            localCamStream={localStream}
            remoteCamStream={remoteStream}
            isPeerMicOn={partnerState?.isMicOn}
            isPeerVideoOn={partnerState?.isVideoOn}
            isSharingScreen={callState?.isScreenSharing}
            onToggleScreenShare={toggleScreen}
            onSendEmoji={onSendReaction}
            onToggleFloatOnTop={onFloatTop}
            onFloatTop={onFloatTop}
            onLeaveRoom={onFloatTop}
          />
        );
      case 'focus':
        return (
          <FocusView
            onFloatTop={onFloatTop}
            partnerState={partnerState}
            onSendReaction={onSendReaction}
          />
        );
      case 'planner':
        return (
          <PlannerView
            onNavigate={setActiveView}
            onStartFocus={(task) => {
              setActiveView('focus');
            }}
          />
        );
      case 'calendar':
        return <CalendarView />;
      case 'notes':
        return <NotesView />;
      case 'chat':
        return (
          <ChatView
            onNavigate={setActiveView}
            socket={socket}
            roomId={roomId}
          />
        );
      case 'goals':
        return <GoalsView />;
      case 'insights':
        return <InsightsView />;
      case 'settings':
        return (
          <SettingsView
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
          />
        );
      default:
        return (
          <HomeView
            onNavigate={setActiveView}
            partnerState={partnerState}
            onFloatTop={onFloatTop}
            onOpenPingModal={() => setIsQuickPingOpen(true)}
          />
        );
    }
  };

  return (
    <div
      className={`amigo ${isDark ? 'dark' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg)',
        color: 'var(--fg)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Toast Notification Banner */}
      {pingBanner && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--ps)',
            color: 'var(--p)',
            border: '1px solid var(--p)',
            padding: '8px 18px',
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '13px',
            zIndex: 99999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '15px' }}>🌸</span>
          <span>{pingBanner}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        activeTab={activeView}
        onNavigate={setActiveView}
        onSelectTab={setActiveView}
        partnerStatus={partnerStatus}
        onQuickPing={() => setIsQuickPingOpen(true)}
        onOpenPingModal={() => setIsQuickPingOpen(true)}
        compact={isCompactSidebar}
        onToggleCompact={() => setIsCompactSidebar(!isCompactSidebar)}
      />

      {/* Right Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Top Header */}
        <Header
          onOpenCommand={() => setIsCommandPaletteOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onFloatTop={onFloatTop}
          onToggleFloatOnTop={onFloatTop}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        {/* View Switcher Viewport */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          {renderActiveView()}
        </div>
      </div>

      {/* Command Palette Modal (Ctrl K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveView}
        onStartFocus={(task) => setActiveView('focus')}
      />

      {/* Quick Ping Modal (Ctrl Shift P) */}
      <QuickPingModal
        isOpen={isQuickPingOpen}
        onClose={() => setIsQuickPingOpen(false)}
        onSendPing={handleSendPing}
        onNavigate={setActiveView}
      />
    </div>
  );
}
