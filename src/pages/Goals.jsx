import React from 'react';
import { Target, Trophy, Flame, Gift, Star, Users, Lock, CheckCircle2 } from 'lucide-react';

const GOALS = [
  { label: 'Complete GATE syllabus', progress: 68, target: '100%', shared: false, color: 'var(--g)' },
  { label: 'ML project submission', progress: 40, target: 'Nov 28', shared: true, color: 'var(--p)' },
  { label: '30-day study streak', progress: 40, target: '30 days', shared: true, color: 'var(--a)' },
  { label: 'Master Statistics', progress: 75, target: '12 chapters', shared: false, color: 'var(--b)' },
];

const ACHIEVEMENTS = [
  { icon: '🔥', label: 'Week Warrior', desc: '7-day streak', unlocked: true },
  { icon: '📚', label: 'Bookworm', desc: '50 notes created', unlocked: true },
  { icon: '⚡', label: 'Speed Demon', desc: '5h in one session', unlocked: true },
  { icon: '🤝', label: 'Better Together', desc: '10 shared sessions', unlocked: true },
  { icon: '🎯', label: 'Perfectionist', desc: '100% daily goal 5x', unlocked: false },
  { icon: '🏆', label: 'Champion', desc: 'Complete all goals', unlocked: false },
];

const CHALLENGES = [
  { label: 'Focus 25h this week', progress: 60, reward: '+1 streak freeze' },
  { label: 'Complete 3 flashcard reviews', progress: 33, reward: 'Unlock new theme' },
];

export default function Goals() {
  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
          Goals & Rewards
        </h1>
        <div style={{
          padding: '8px 16px', borderRadius: 10, background: 'var(--as)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--a)',
        }}>
          <Flame size={16} /> 12-day streak · 2 freezes left
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Goals */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} style={{ color: 'var(--g)' }} /> Shared Goals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GOALS.map((g, i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
                background: 'var(--card)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{g.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {g.shared && <Users size={12} style={{ color: 'var(--p)' }} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.progress}%</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: g.color, width: `${g.progress}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>Target: {g.target}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Weekly challenge */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={16} style={{ color: 'var(--a)' }} /> Weekly Challenge
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CHALLENGES.map((c, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{c.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--g)', fontWeight: 600 }}>{c.progress}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--alt)', overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: 'var(--g)', width: `${c.progress}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Gift size={10} /> Reward: {c.reward}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reward jar */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={16} style={{ color: 'var(--p)' }} /> Reward Jar
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 36 }}>🫙</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--p)', fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>3 rewards</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Earn by completing goals & challenges</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--alt)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'var(--p)', width: '60%' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>2 more until next reward</div>
          </div>

          {/* Achievements */}
          <div style={{
            padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
            background: 'var(--card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={16} style={{ color: 'var(--a)' }} /> Achievements
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ACHIEVEMENTS.map((a, i) => (
                <div key={i} style={{
                  padding: '12px 8px', borderRadius: 10, background: 'var(--alt)',
                  textAlign: 'center', opacity: a.unlocked ? 1 : 0.4,
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{a.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg)' }}>{a.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{a.desc}</div>
                  {!a.unlocked && (
                    <Lock size={10} style={{ position: 'absolute', top: 6, right: 6, color: 'var(--muted)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
