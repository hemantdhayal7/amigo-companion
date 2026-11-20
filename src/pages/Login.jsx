import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        await signup(email, password, name.trim());
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 380, padding: 40, borderRadius: 20, background: 'var(--card)',
        border: '1px solid var(--line)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--g)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            Amigo
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>
            {isSignup ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isSignup && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Hemant"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--alt)', fontSize: 13, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box',
                }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'var(--alt)', fontSize: 13, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'var(--alt)', fontSize: 13, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box',
              }} />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--rs)', color: 'var(--r)', fontSize: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '12px 20px', borderRadius: 10, border: 'none',
            background: 'var(--g)', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => { setIsSignup(!isSignup); setError(''); }} style={{
            border: 'none', background: 'none', color: 'var(--g)', fontSize: 12,
            fontWeight: 500, cursor: 'pointer', textDecoration: 'underline',
          }}>
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
