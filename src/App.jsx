import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Focus from './pages/Focus';
import Planner from './pages/Planner';
import Calendar from './pages/Calendar';
import StudyRoom from './pages/StudyRoom';
import Notes from './pages/Notes';
import Chat from './pages/Chat';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Ping from './pages/Ping';
import Notifications from './pages/Notifications';

export default function App() {
  const [page, setPage] = useState(() => {
    try { return localStorage.getItem('amigo_page') || 'home'; } catch { return 'home'; }
  });
  const [nickname] = useState(() => {
    try { return localStorage.getItem('study_nickname') || 'Hemant'; } catch { return 'Hemant'; }
  });
  const [platform, setPlatform] = useState('darwin');

  useEffect(() => {
    try { localStorage.setItem('amigo_page', page); } catch {}
  }, [page]);

  // Detect platform from Electron
  useEffect(() => {
    if (window.electronAPI?.getPlatform) {
      window.electronAPI.getPlatform().then(p => setPlatform(p));
    }
  }, []);

  // Keyboard shortcut for Quick Ping
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setPage('ping');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Apply dark theme by default
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const hideSidebar = page === 'room';

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home />;
      case 'focus': return <Focus />;
      case 'planner': return <Planner />;
      case 'calendar': return <Calendar />;
      case 'room': return <StudyRoom onBack={() => setPage('home')} />;
      case 'notes': return <Notes />;
      case 'chat': return <Chat />;
      case 'insights': return <Insights />;
      case 'goals': return <Goals />;
      case 'settings': return <Settings onNavigate={setPage} />;
      case 'ping': return <Ping onClose={() => setPage('home')} />;
      case 'notifications': return <Notifications />;
      default: return <Home />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg)', overflow: 'hidden' }}>
      {!hideSidebar && (
        <Sidebar active={page} onNavigate={setPage} nickname={nickname} platform={platform} />
      )}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {renderPage()}
      </main>
    </div>
  );
}
