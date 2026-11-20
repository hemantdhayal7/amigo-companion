import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { usePresence } from './hooks/usePresence';
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
import Login from './pages/Login';
import LinkPartner from './pages/LinkPartner';

export default function App() {
  const { user, profile, partner, loading } = useAuth();
  const { partnerPresence, setMyStatus } = usePresence(user, partner);

  const [page, setPage] = useState(() => {
    try { return localStorage.getItem('amigo_page') || 'home'; } catch { return 'home'; }
  });
  const [platform, setPlatform] = useState('darwin');

  useEffect(() => {
    try { localStorage.setItem('amigo_page', page); } catch {}
  }, [page]);

  useEffect(() => {
    if (window.electronAPI?.getPlatform) {
      window.electronAPI.getPlatform().then(p => setPlatform(p));
    }
  }, []);

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Set status based on current page
  useEffect(() => {
    if (!user) return;
    if (page === 'focus') setMyStatus('studying', 'Focus session');
    else if (page === 'room') setMyStatus('studying', 'Study Room');
    else setMyStatus('online', '');
  }, [page, user]);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--g)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (!profile?.partnerId) return <LinkPartner />;

  const nickname = profile?.displayName || user?.displayName || 'User';
  const partnerName = partner?.displayName || 'Partner';
  const partnerInitial = partner?.initial || partnerName.charAt(0).toUpperCase();

  const hideSidebar = page === 'room';

  const fireProps = {
    user, profile, partner, partnerPresence, partnerName, partnerInitial, setMyStatus,
  };

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home {...fireProps} />;
      case 'focus': return <Focus {...fireProps} />;
      case 'planner': return <Planner {...fireProps} />;
      case 'calendar': return <Calendar {...fireProps} />;
      case 'room': return <StudyRoom onBack={() => setPage('home')} {...fireProps} />;
      case 'notes': return <Notes {...fireProps} />;
      case 'chat': return <Chat {...fireProps} />;
      case 'insights': return <Insights {...fireProps} />;
      case 'goals': return <Goals {...fireProps} />;
      case 'settings': return <Settings onNavigate={setPage} {...fireProps} />;
      case 'ping': return <Ping onClose={() => setPage('home')} {...fireProps} />;
      case 'notifications': return <Notifications {...fireProps} />;
      default: return <Home {...fireProps} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg)', overflow: 'hidden' }}>
      {!hideSidebar && (
        <Sidebar active={page} onNavigate={setPage} nickname={nickname} platform={platform}
          partnerName={partnerName} partnerOnline={partnerPresence.online} partnerStatus={partnerPresence.status} />
      )}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {renderPage()}
      </main>
    </div>
  );
}
