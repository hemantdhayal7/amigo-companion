import React, { useState, useEffect } from 'react';

export default function CommandPalette({ isOpen = false, onClose = () => {}, onNavigate = () => {}, onStartFocus = () => {} }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action) => {
    if (action.route) {
      onNavigate(action.route);
    }
    if (action.focus) {
      onStartFocus(action.task);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '90px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(12, 10, 9, 0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-label="Quick add & command palette"
        className="card"
        style={{
          position: 'relative',
          width: '680px',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          zIndex: 10,
          background: 'var(--card)',
          border: '1px solid var(--line)',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '60px',
            padding: '0 18px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Type a task, deadline, note or search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--fg)',
              fontSize: '16px',
            }}
          />
          <span
            onClick={onClose}
            className="kbd"
            style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', background: 'var(--alt)', padding: '3px 7px', borderRadius: '4px' }}
          >
            Esc
          </span>
        </div>

        {/* AI Intent Preview */}
        <div style={{ padding: '12px 18px', background: 'var(--alt)', borderBottom: '1px solid var(--line)' }}>
          <div className="lbl">Amigo understood</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            <span className="chip" style={{ background: 'var(--rs)', color: 'var(--r)' }}>Deadline</span>
            <span className="chip" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>ML assignment</span>
            <span className="chip" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>Tomorrow, 11:59 PM</span>
            <span className="chip" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>Machine Learning</span>
            <span className="chip" style={{ background: 'var(--ps)', color: 'var(--p)' }}>Reminder 6:00 PM suggested</span>
          </div>
        </div>

        {/* Actions list */}
        <div style={{ padding: '8px', maxHeight: '340px', overflowY: 'auto' }}>
          <div className="lbl" style={{ padding: '4px 10px' }}>Create</div>

          <div
            onClick={() => handleAction({ route: 'planner' })}
            className="item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              background: 'var(--gs)',
            }}
          >
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--r)' }}>
              <path d="M12 4 2.5 20h19zM12 10v4M12 17h.01" />
            </svg>
            <span style={{ flex: 1, fontSize: '13px' }}>
              <strong>Add deadline</strong> “ML assignment” for tomorrow, 11:59 PM
            </span>
            <span className="kbd" style={{ background: 'var(--card)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Enter</span>
          </div>

          <div
            onClick={() => handleAction({ route: 'planner' })}
            className="item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
              <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
            </svg>
            <span style={{ flex: 1, fontSize: '13px' }}>Add as a task instead</span>
            <span className="kbd" style={{ background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl 1</span>
          </div>

          <div
            onClick={() => handleAction({ route: 'calendar' })}
            className="item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
              <path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 3v4M16 3v4" />
            </svg>
            <span style={{ flex: 1, fontSize: '13px' }}>Block 2 hours for it on the calendar</span>
            <span className="kbd" style={{ background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl 2</span>
          </div>

          <div
            onClick={() => handleAction({ route: 'focus' })}
            className="item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
              <path d="M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l2.5 1.5M9 2h6" />
            </svg>
            <span style={{ flex: 1, fontSize: '13px' }}>Start a focus session on it now</span>
            <span className="kbd" style={{ background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl 3</span>
          </div>

          <div className="lbl" style={{ padding: '10px 10px 4px' }}>Commands</div>

          <div
            onClick={() => handleAction({ route: 'study-room' })}
            className="item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
              <path d="M3 7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM16 10.5l5-3v9l-5-3" />
            </svg>
            <span style={{ flex: 1, fontSize: '13px' }}>Open the study room</span>
            <span className="chip" style={{ background: 'var(--ps)', color: 'var(--p)', fontSize: '11px' }}>Sakura inside</span>
          </div>

          <div
            onClick={() => handleAction({ route: 'notes' })}
            className="item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
              <path d="M4 7h13v11H4zM7 4h13v11" />
            </svg>
            <span style={{ flex: 1, fontSize: '13px' }}>Review flashcards deck</span>
            <span className="kbd" style={{ background: 'var(--alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>12 due</span>
          </div>
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            height: '40px',
            padding: '0 18px',
            borderTop: '1px solid var(--line)',
            fontSize: '12px',
          }}
          className="mut"
        >
          <span><span className="kbd" style={{ background: 'var(--alt)', padding: '1px 5px', borderRadius: '3px' }}>↑</span> <span className="kbd" style={{ background: 'var(--alt)', padding: '1px 5px', borderRadius: '3px' }}>↓</span> move</span>
          <span><span className="kbd" style={{ background: 'var(--alt)', padding: '1px 5px', borderRadius: '3px' }}>Enter</span> choose</span>
          <span><span className="kbd" style={{ background: 'var(--alt)', padding: '1px 5px', borderRadius: '3px' }}>Tab</span> edit detail</span>
          <span style={{ flex: 1 }}></span>
          <span>Try “quiz Tuesday 10am”, “remind me Friday”</span>
        </div>
      </div>
    </div>
  );
}
