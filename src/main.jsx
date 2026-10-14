import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Amigo Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥬⚠️</div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#34d399' }}>
            Amigo Companion
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px 0', maxWidth: '320px' }}>
            {this.state.error?.message || 'Initialization issue detected.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 18px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            Reload Amigo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
