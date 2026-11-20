import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, ArrowRight, LogOut } from 'lucide-react';

export default function LinkPartner() {
  const { user, profile, linkPartner, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await linkPartner(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--fg)', margin: '0 0 8px' }}>
            Partner linked!
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Reloading to connect you both...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 420, padding: 40, borderRadius: 20, background: 'var(--card)',
        border: '1px solid var(--line)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Users size={36} style={{ color: 'var(--p)', marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            Link Your Study Partner
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0' }}>
            Hi {profile?.displayName || user?.displayName}! Enter your partner's email to connect.
          </p>
        </div>

        <div style={{
          padding: 16, borderRadius: 12, background: 'var(--alt)', marginBottom: 20,
          fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6,
        }}>
          <strong>How it works:</strong> Both of you need to sign up first. Then one of you enters the other's email here. Once linked, you'll see each other's real status, chat live, share focus sessions, and join study rooms together.
        </div>

        <form onSubmit={handleLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Partner's email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="siddhi@example.com"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'var(--alt)', fontSize: 13, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box',
              }} />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--rs)', color: 'var(--r)', fontSize: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '12px 20px', borderRadius: 10, border: 'none',
            background: 'var(--p)', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? 'Linking...' : <><span>Link Partner</span> <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={logout} style={{
            border: 'none', background: 'none', color: 'var(--muted)', fontSize: 12,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
