import React, { useState } from 'react';
import { BookOpen, Plus, Users, RotateCcw, Zap } from 'lucide-react';

const NOTEBOOKS = [
  { name: 'Statistics', count: 12, color: 'var(--b)' },
  { name: 'ML & AI', count: 8, color: 'var(--p)' },
  { name: 'GATE Prep', count: 23, color: 'var(--g)' },
  { name: 'Certification', count: 5, color: 'var(--a)' },
];

const FLASHCARDS = [
  { front: 'What is the Central Limit Theorem?', back: 'As sample size increases, the distribution of sample means approaches a normal distribution, regardless of the population distribution shape.', subject: 'Statistics' },
  { front: 'Define Big-O notation', back: 'Big-O describes the upper bound of an algorithm\'s time complexity as input size approaches infinity.', subject: 'GATE Prep' },
  { front: 'What is backpropagation?', back: 'An algorithm for training neural networks by computing gradients of the loss function with respect to weights using the chain rule.', subject: 'ML & AI' },
];

export default function Notes() {
  const [flipped, setFlipped] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);

  const card = FLASHCARDS[cardIdx];

  const nextCard = (quality) => {
    setFlipped(false);
    setCardIdx((cardIdx + 1) % FLASHCARDS.length);
  };

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
          Notes & Cards
        </h1>
        <button style={{
          padding: '8px 16px', borderRadius: 10, border: 'none',
          background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={14} /> New note
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Notebooks */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Notebooks</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {NOTEBOOKS.map((nb, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--line)',
                background: 'var(--card)', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <BookOpen size={16} style={{ color: nb.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{nb.name}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{nb.count} notes</div>
              </div>
            ))}
          </div>

          {/* Shared note preview */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Recent Shared Note</div>
            <div style={{
              padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)',
              background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Users size={14} style={{ color: 'var(--p)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>ML Chapter 7 — Neural Networks</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.7, marginBottom: 12 }}>
                <strong>Key concepts:</strong> Forward propagation, loss functions, gradient descent, learning rate scheduling...
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: 8, background: 'var(--ps)',
                borderLeft: '3px solid var(--p)', fontSize: 12, color: 'var(--fg2)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--p)', marginBottom: 2 }}>Sakura's comment</div>
                Should we add the dropout regularization example from lecture?
              </div>
            </div>
          </div>
        </div>

        {/* Flashcard review */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Flashcard Review</div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>12 cards due today</span>
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)',
              background: 'var(--card)', minHeight: 200, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              textAlign: 'center', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted)', marginBottom: 8 }}>
              {card.subject} · {flipped ? 'Answer' : 'Question'} · Card {cardIdx + 1}/{FLASHCARDS.length}
            </div>
            <div style={{ fontSize: flipped ? 14 : 16, fontWeight: flipped ? 400 : 600, color: 'var(--fg)', lineHeight: 1.6 }}>
              {flipped ? card.back : card.front}
            </div>
            {!flipped && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>Click to reveal answer</div>
            )}
          </div>

          {flipped && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              {[
                { label: 'Again', color: 'var(--r)', bg: 'var(--rs)' },
                { label: 'Hard', color: 'var(--a)', bg: 'var(--as)' },
                { label: 'Good', color: 'var(--g)', bg: 'var(--gs)' },
                { label: 'Easy', color: 'var(--b)', bg: 'var(--bs)' },
              ].map(b => (
                <button key={b.label} onClick={() => nextCard(b.label)} style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: b.bg, color: b.color, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  {b.label}
                </button>
              ))}
            </div>
          )}

          <div style={{
            marginTop: 20, padding: 14, borderRadius: 'var(--radius)',
            border: '1px solid var(--line)', background: 'var(--card)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Zap size={14} style={{ color: 'var(--p)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg)' }}>Quiz each other</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Sakura is online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
