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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center text-white bg-slate-900/95 rounded-3xl m-4 border border-white/20 shadow-2xl backdrop-blur-xl">
          <div className="text-4xl mb-2">🥬⚠️</div>
          <h2 className="text-base font-bold text-emerald-400 mb-1">Amigo Companion</h2>
          <p className="text-xs text-slate-300 mb-4 max-w-xs">
            {this.state.error?.message || 'An unexpected issue occurred while loading.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg transition"
          >
            Reload Companion
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
