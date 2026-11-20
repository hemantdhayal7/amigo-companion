import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, Gift, Star, Users, Lock, Plus, Trash2 } from 'lucide-react';
import { load, save, uid } from '../utils/store';

const COLORS = ['var(--g)', 'var(--p)', 'var(--a)', 'var(--b)', 'var(--r)'];

const DEFAULT_GOALS = [
  { id: 'g1', label: 'Complete GATE syllabus', progress: 68, target: '100%', shared: false, color: 'var(--g)' },
  { id: 'g2', label: 'ML project submission', progress: 40, target: 'Nov 28', shared: true, color: 'var(--p)' },
  { id: 'g3', label: '30-day study streak', progress: 40, target: '30 days', shared: true, color: 'var(--a)' },
  { id: 'g4', label: 'Master Statistics', progress: 75, target: '12 chapters', shared: false, color: 'var(--b)' },
];

const ACHIEVEMENTS = [
  { icon: '🔥', label: 'Week Warrior', desc: '7-day streak', unlocked: true },
  { icon: '📚', label: 'Bookworm', desc: '50 notes created', unlocked: true },
  { icon: '⚡', label: 'Speed Demon', desc: '5h in one session', unlocked: true },
  { icon: '🤝', label: 'Better Together', desc: '10 shared sessions', unlocked: true },
  { icon: '🎯', label: 'Perfectionist', desc: '100% daily goal 5x', unlocked: false },
  { icon: '🏆', label: 'Champion', desc: 'Complete all goals', unlocked: false },
];

export default function Goals() {
  const [goals, setGoals] = useState(() => load('goals', DEFAULT_GOALS));
  const [streak, setStreak] = useState(() => load('streak', { days: 12, freezes: 2 }));
  const [newGoal, setNewGoal] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { save('goals', goals); }, [goals]);
  useEffect(() => { save('streak', streak); }, [streak]);

  const updateProgress = (id, delta) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: Math.max(0, Math.min(100, g.progress + delta)) } : g));
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals(prev => [...prev, { id: uid(), label: newGoal.trim(), progress: 0, target: 'Set target', shared: false, color: COLORS[prev.length % COLORS.length] }]);
    setNewGoal('');
    setShowAdd(false);
  };

  const deleteGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id));
  const rewards = goals.filter(g => g.progress >= 100).length;

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>Goals & Rewards</h1>
        <div style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--as)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--a)' }}>
          <Flame size={16} /> {streak.days}-day streak · {streak.freezes} freezes left
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} style={{ color: 'var(--g)' }} /> Goals
            <button onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto', border: 'none', background: 'var(--g)', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Add
            </button>
          </div>

          {showAdd && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()}
                placeholder="New goal..." autoFocus
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--g)', background: 'var(--card)', fontSize: 13, color: 'var(--fg)', outline: 'none' }} />
              <button onClick={addGoal} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {goals.map(g => (
              <div key={g.id} style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{g.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {g.shared && <Users size={12} style={{ color: 'var(--p)' }} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.progress}%</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--alt)', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => updateProgress(g.id, 5)}>
                  <div style={{ height: '100%', borderRadius: 3, background: g.color, width: `${g.progress}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => updateProgress(g.id, -5)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', color: 'var(--muted)' }}>-5%</button>
                    <button onClick={() => updateProgress(g.id, 5)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', color: 'var(--g)' }}>+5%</button>
                    <button onClick={() => updateProgress(g.id, 10)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', color: 'var(--g)' }}>+10%</button>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Reward jar */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={16} style={{ color: 'var(--p)' }} /> Reward Jar
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 36 }}>🫙</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--p)', fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{rewards} rewards</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Complete goals to earn rewards</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'var(--p)', width: `${goals.length ? Math.round((goals.reduce((s, g) => s + g.progress, 0) / (goals.length * 100)) * 100) : 0}%` }} />
            </div>
          </div>

          {/* Achievements */}
          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', background: 'var(--card)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={16} style={{ color: 'var(--a)' }} /> Achievements
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ACHIEVEMENTS.map((a, i) => (
                <div key={i} style={{ padding: '12px 8px', borderRadius: 10, background: 'var(--alt)', textAlign: 'center', opacity: a.unlocked ? 1 : 0.4, position: 'relative' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{a.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg)' }}>{a.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{a.desc}</div>
                  {!a.unlocked && <Lock size={10} style={{ position: 'absolute', top: 6, right: 6, color: 'var(--muted)' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
