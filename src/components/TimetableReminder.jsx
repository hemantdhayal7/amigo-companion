import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Bell,
  BellOff,
  User,
  Users,
  Coffee,
  BookOpen,
  GraduationCap,
  Monitor,
  Moon,
  Sun,
  Sunrise,
} from 'lucide-react';

const HEMANT_SCHEDULE = [
  { start: 5, end: 7, label: 'Morning Routine', icon: 'sunrise', color: '#F59E0B' },
  { start: 7, end: 11, label: 'GATE Preparation', icon: 'book', color: '#16A34A' },
  { start: 11, end: 16, label: 'Practice & Revision — GATE', icon: 'grad', color: '#3B82F6' },
  { start: 16, end: 19, label: 'IIT Madras Theory', icon: 'monitor', color: '#8B5CF6' },
  { start: 19, end: 22, label: 'Shared Study Time', icon: 'users', color: '#EC4899' },
  { start: 22, end: 24, label: 'Wind Down & Review', icon: 'moon', color: '#6366F1' },
];

const SAKURA_SCHEDULE = [
  { start: 7, end: 11, label: 'Morning & Start', icon: 'sunrise', color: '#F59E0B' },
  { start: 11, end: 16, label: 'Projects & Theory', icon: 'book', color: '#A855F7' },
  { start: 16, end: 19, label: 'Content Classes', icon: 'grad', color: '#EC4899' },
  { start: 19, end: 22, label: 'Shared Study Time', icon: 'users', color: '#EC4899' },
  { start: 22, end: 26, label: 'Late Study & Finish', icon: 'moon', color: '#6366F1' },
];

function getIcon(name, size = 14) {
  const props = { size, strokeWidth: 2 };
  switch (name) {
    case 'sunrise': return <Sunrise {...props} />;
    case 'book': return <BookOpen {...props} />;
    case 'grad': return <GraduationCap {...props} />;
    case 'monitor': return <Monitor {...props} />;
    case 'users': return <Users {...props} />;
    case 'moon': return <Moon {...props} />;
    case 'coffee': return <Coffee {...props} />;
    default: return <Clock {...props} />;
  }
}

function getCurrentBlock(schedule, hour) {
  return schedule.find(b => {
    const e = b.end > 24 ? b.end : b.end;
    const h = hour < 5 ? hour + 24 : hour;
    const s = b.start < 5 ? b.start + 24 : b.start;
    const eAdj = e < 5 ? e + 24 : e;
    return h >= s && h < eAdj;
  });
}

function getNextBlock(schedule, hour) {
  const sorted = [...schedule].sort((a, b) => a.start - b.start);
  for (const b of sorted) {
    const s = b.start < 5 ? b.start + 24 : b.start;
    const h = hour < 5 ? hour + 24 : hour;
    if (s > h) return b;
  }
  return sorted[0];
}

function formatHour(h) {
  const hh = h % 24;
  if (hh === 0 || hh === 24) return '12 AM';
  if (hh === 12) return '12 PM';
  if (hh < 12) return `${hh} AM`;
  return `${hh - 12} PM`;
}

function blockProgress(block, now) {
  const h = now.getHours() + now.getMinutes() / 60;
  const duration = block.end - block.start;
  const elapsed = h - block.start;
  return Math.max(0, Math.min(1, elapsed / duration));
}

function minutesUntilEnd(block, now) {
  const h = now.getHours() + now.getMinutes() / 60;
  return Math.max(0, Math.round((block.end - h) * 60));
}

export default function TimetableReminder({ theme = 'dark', nickname = 'Hemant' }) {
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [confirmedBlocks, setConfirmedBlocks] = useState(new Set());
  const [pausedUntil, setPausedUntil] = useState(null);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const lastBlockRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours() + now.getMinutes() / 60;
  const isPaused = pausedUntil && now < pausedUntil;

  const myBlock = getCurrentBlock(HEMANT_SCHEDULE, hour);
  const partnerBlock = getCurrentBlock(SAKURA_SCHEDULE, hour);
  const myNext = getNextBlock(HEMANT_SCHEDULE, hour);

  // Trigger confirmation popup when entering a new block
  useEffect(() => {
    if (!myBlock || isPaused) return;
    const key = `${myBlock.start}-${myBlock.label}`;
    if (lastBlockRef.current !== key && !confirmedBlocks.has(key)) {
      lastBlockRef.current = key;
      setShowConfirm(myBlock);
    } else {
      lastBlockRef.current = key;
    }
  }, [myBlock?.start, myBlock?.label, isPaused]);

  const handleConfirm = useCallback((accepted) => {
    if (showConfirm) {
      const key = `${showConfirm.start}-${showConfirm.label}`;
      setConfirmedBlocks(prev => new Set([...prev, key]));
    }
    setShowConfirm(null);
  }, [showConfirm]);

  const handlePause = useCallback((hours) => {
    const until = new Date(now.getTime() + hours * 60 * 60 * 1000);
    setPausedUntil(until);
    setShowPauseMenu(false);
    setShowConfirm(null);
  }, [now]);

  const handleResume = useCallback(() => {
    setPausedUntil(null);
  }, []);

  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(15,15,20,0.92)' : 'rgba(255,255,255,0.92)';
  const fg = isDark ? '#E5E7EB' : '#1F2937';
  const muted = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  if (isPaused) {
    const minsLeft = Math.round((pausedUntil - now) / 60000);
    return (
      <div
        data-amigo-interactive="true"
        style={{
          position: 'fixed', bottom: 80, left: 16, zIndex: 99998,
          background: bg, backdropFilter: 'blur(20px)', borderRadius: 14,
          border: `1px solid ${border}`, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 12,
          color: muted, cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
        onClick={handleResume}
      >
        <BellOff size={14} />
        <span>Timetable paused — {minsLeft}m left</span>
        <Play size={12} style={{ color: '#16A34A' }} />
      </div>
    );
  }

  return (
    <>
      {/* Confirmation popup */}
      {showConfirm && (
        <div
          data-amigo-interactive="true"
          style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 100000, background: isDark ? '#1a1a24' : '#fff',
            borderRadius: 20, padding: '24px 28px', minWidth: 320,
            border: `1px solid ${border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: fg, textAlign: 'center',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px',
            background: `${showConfirm.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showConfirm.color,
          }}>
            {getIcon(showConfirm.icon, 24)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            Time to start
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: showConfirm.color, marginBottom: 4 }}>
            {showConfirm.label}
          </div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 20 }}>
            {formatHour(showConfirm.start)} — {formatHour(showConfirm.end)}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              data-amigo-interactive="true"
              onClick={() => handleConfirm(true)}
              style={{
                padding: '10px 28px', borderRadius: 12, border: 'none',
                background: '#16A34A', color: '#fff', fontWeight: 600,
                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Check size={16} /> On it
            </button>
            <button
              data-amigo-interactive="true"
              onClick={() => handleConfirm(false)}
              style={{
                padding: '10px 20px', borderRadius: 12,
                border: `1px solid ${border}`, background: cardBg,
                color: muted, fontWeight: 500, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <X size={16} /> Skip
            </button>
          </div>
        </div>
      )}

      {/* Floating timetable widget */}
      <div
        data-amigo-interactive="true"
        style={{
          position: 'fixed', bottom: 80, left: 16, zIndex: 99998,
          background: bg, backdropFilter: 'blur(20px)', borderRadius: 18,
          border: `1px solid ${border}`, overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, sans-serif",
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          width: expanded ? 320 : 280,
          transition: 'width 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 14px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: `1px solid ${border}`,
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} style={{ color: '#16A34A' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {myBlock && (
              <span style={{
                fontSize: 11, fontWeight: 500, color: myBlock.color,
                background: `${myBlock.color}18`, padding: '2px 8px', borderRadius: 6,
              }}>
                {myBlock.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              data-amigo-interactive="true"
              onClick={(e) => { e.stopPropagation(); setShowPauseMenu(!showPauseMenu); }}
              style={{ padding: 4, borderRadius: 6, cursor: 'pointer', color: muted }}
            >
              <Pause size={12} />
            </div>
            {expanded ? <ChevronDown size={14} style={{ color: muted }} /> : <ChevronUp size={14} style={{ color: muted }} />}
          </div>
        </div>

        {/* Pause menu */}
        {showPauseMenu && (
          <div style={{
            padding: '8px 14px', borderBottom: `1px solid ${border}`,
            display: 'flex', gap: 6, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 11, color: muted, width: '100%', marginBottom: 2 }}>Pause reminders for:</span>
            {[1, 2, 3].map(h => (
              <button
                key={h}
                data-amigo-interactive="true"
                onClick={() => handlePause(h)}
                style={{
                  padding: '4px 12px', borderRadius: 8, border: `1px solid ${border}`,
                  background: cardBg, color: fg, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {h}h
              </button>
            ))}
            <button
              data-amigo-interactive="true"
              onClick={() => setShowPauseMenu(false)}
              style={{
                padding: '4px 8px', borderRadius: 8, border: 'none',
                background: 'transparent', color: muted, fontSize: 11, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Current blocks */}
        <div style={{ padding: '10px 14px' }}>
          {/* My block */}
          {myBlock ? (
            <div style={{ marginBottom: expanded ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 7, background: '#16A34A20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#16A34A',
                }}>H</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: fg, flex: 1 }}>
                  {myBlock.label}
                </span>
                <span style={{ fontSize: 10, color: muted }}>
                  {minutesUntilEnd(myBlock, now)}m left
                </span>
              </div>
              <div style={{
                height: 3, borderRadius: 2, background: `${myBlock.color}20`, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: myBlock.color,
                  width: `${blockProgress(myBlock, now) * 100}%`,
                  transition: 'width 1s linear',
                }} />
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: muted, marginBottom: expanded ? 10 : 0 }}>
              <Sun size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
              Free time — no block scheduled
            </div>
          )}

          {/* Partner block (always visible) */}
          {partnerBlock && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 7, background: '#A855F720',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#A855F7',
                }}>S</div>
                <span style={{ fontSize: 12, fontWeight: 500, color: muted, flex: 1 }}>
                  {partnerBlock.label}
                </span>
                <span style={{ fontSize: 10, color: muted }}>
                  {minutesUntilEnd(partnerBlock, now)}m left
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expanded: full day timeline */}
        {expanded && (
          <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 8, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Today's Schedule
            </div>

            {/* My schedule */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#16A34A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={10} /> {nickname}
              </div>
              {HEMANT_SCHEDULE.map((b, i) => {
                const isCurrent = myBlock && b.start === myBlock.start;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    opacity: (hour > b.end && !isCurrent) ? 0.4 : 1,
                  }}>
                    <span style={{ fontSize: 10, color: muted, width: 50, textAlign: 'right', flexShrink: 0 }}>
                      {formatHour(b.start)}
                    </span>
                    <div style={{
                      width: 6, height: 6, borderRadius: 3,
                      background: isCurrent ? b.color : `${b.color}40`,
                      boxShadow: isCurrent ? `0 0 6px ${b.color}60` : 'none',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11, color: isCurrent ? fg : muted,
                      fontWeight: isCurrent ? 600 : 400,
                    }}>
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Partner schedule */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#A855F7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={10} /> Siddhi
              </div>
              {SAKURA_SCHEDULE.map((b, i) => {
                const isCurrent = partnerBlock && b.start === partnerBlock.start;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    opacity: (hour > b.end && !isCurrent) ? 0.4 : 1,
                  }}>
                    <span style={{ fontSize: 10, color: muted, width: 50, textAlign: 'right', flexShrink: 0 }}>
                      {formatHour(b.start)}
                    </span>
                    <div style={{
                      width: 6, height: 6, borderRadius: 3,
                      background: isCurrent ? b.color : `${b.color}40`,
                      boxShadow: isCurrent ? `0 0 6px ${b.color}60` : 'none',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11, color: isCurrent ? fg : muted,
                      fontWeight: isCurrent ? 600 : 400,
                    }}>
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Next up */}
            {myNext && myNext !== myBlock && (
              <div style={{
                marginTop: 10, padding: '8px 10px', borderRadius: 10,
                background: `${myNext.color}10`, border: `1px solid ${myNext.color}20`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ color: myNext.color }}>{getIcon(myNext.icon, 14)}</div>
                <div>
                  <div style={{ fontSize: 10, color: muted }}>Next up</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: fg }}>{myNext.label}</div>
                </div>
                <span style={{ fontSize: 10, color: muted, marginLeft: 'auto' }}>
                  {formatHour(myNext.start)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
