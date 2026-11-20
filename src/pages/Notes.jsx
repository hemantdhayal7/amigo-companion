import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Users, RotateCcw, Zap, Trash2, ChevronLeft } from 'lucide-react';
import { uid } from '../utils/store';
import { useSyncData } from '../hooks/useSyncData';

const DEFAULT_NOTEBOOKS = [
  { id: 'nb1', name: 'Statistics', color: 'var(--b)', notes: [
    { id: 'n1', title: 'Central Limit Theorem', content: 'As sample size increases, the distribution of sample means approaches a normal distribution.', created: '2026-11-18' },
    { id: 'n2', title: 'Bayes Theorem', content: 'P(A|B) = P(B|A) * P(A) / P(B). Fundamental to probabilistic reasoning.', created: '2026-11-17' },
  ]},
  { id: 'nb2', name: 'ML & AI', color: 'var(--p)', notes: [
    { id: 'n3', title: 'Backpropagation', content: 'An algorithm for training neural networks by computing gradients using the chain rule.', created: '2026-11-16' },
  ]},
  { id: 'nb3', name: 'GATE Prep', color: 'var(--g)', notes: [] },
  { id: 'nb4', name: 'Certification', color: 'var(--a)', notes: [] },
];

const DEFAULT_FLASHCARDS = [
  { id: 'f1', front: 'What is the Central Limit Theorem?', back: 'As sample size increases, the distribution of sample means approaches a normal distribution, regardless of the population distribution shape.', subject: 'Statistics', ease: 2.5, interval: 1 },
  { id: 'f2', front: 'Define Big-O notation', back: 'Big-O describes the upper bound of an algorithm\'s time complexity as input size approaches infinity.', subject: 'GATE Prep', ease: 2.5, interval: 1 },
  { id: 'f3', front: 'What is backpropagation?', back: 'An algorithm for training neural networks by computing gradients of the loss function with respect to weights using the chain rule.', subject: 'ML & AI', ease: 2.5, interval: 1 },
];

export default function Notes({ user, partnerPresence }) {
  const [notebooks, saveNotebooks] = useSyncData(user, 'notebooks', DEFAULT_NOTEBOOKS);
  const [flashcards, saveFlashcards] = useSyncData(user, 'flashcards', DEFAULT_FLASHCARDS);
  const [reviewStats, saveReviewStats] = useSyncData(user, 'review_stats', { reviewed: 0, correct: 0 });
  const [flipped, setFlipped] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [activeNb, setActiveNb] = useState(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddNb, setShowAddNb] = useState(false);
  const [newNbName, setNewNbName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  const card = flashcards[cardIdx % flashcards.length];

  const nextCard = (quality) => {
    saveReviewStats(prev => ({
      reviewed: (prev?.reviewed || 0) + 1,
      correct: quality === 'Good' || quality === 'Easy' ? (prev?.correct || 0) + 1 : (prev?.correct || 0),
    }));
    setFlipped(false);
    setCardIdx((cardIdx + 1) % flashcards.length);
  };

  const addNotebook = () => {
    if (!newNbName.trim()) return;
    const colors = ['var(--b)', 'var(--p)', 'var(--g)', 'var(--a)', 'var(--r)'];
    saveNotebooks(prev => [...prev, { id: uid(), name: newNbName.trim(), color: colors[prev.length % colors.length], notes: [] }]);
    setNewNbName('');
    setShowAddNb(false);
  };

  const deleteNotebook = (id) => {
    saveNotebooks(prev => prev.filter(nb => nb.id !== id));
    if (activeNb === id) setActiveNb(null);
  };

  const addNote = () => {
    if (!newNoteTitle.trim() || !activeNb) return;
    saveNotebooks(prev => prev.map(nb => nb.id === activeNb
      ? { ...nb, notes: [...nb.notes, { id: uid(), title: newNoteTitle.trim(), content: newNoteContent.trim(), created: new Date().toISOString().slice(0, 10) }] }
      : nb
    ));
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
  };

  const deleteNote = (nbId, noteId) => {
    saveNotebooks(prev => prev.map(nb => nb.id === nbId
      ? { ...nb, notes: nb.notes.filter(n => n.id !== noteId) }
      : nb
    ));
  };

  const addFlashcard = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    saveFlashcards(prev => [...prev, { id: uid(), front: newCardFront.trim(), back: newCardBack.trim(), subject: 'General', ease: 2.5, interval: 1 }]);
    setNewCardFront('');
    setNewCardBack('');
    setShowAddCard(false);
  };

  const deleteFlashcard = (id) => saveFlashcards(prev => prev.filter(f => f.id !== id));

  const currentNb = notebooks.find(nb => nb.id === activeNb);

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeNb && (
            <button onClick={() => setActiveNb(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--fg)', margin: 0 }}>
            {activeNb ? currentNb?.name || 'Notes' : 'Notes & Cards'}
          </h1>
        </div>
        {activeNb ? (
          <button onClick={() => setShowAddNote(true)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} /> New note
          </button>
        ) : (
          <button onClick={() => setShowAddNb(true)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} /> New notebook
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Notebooks or notes */}
        <div>
          {!activeNb ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 14 }}>Notebooks</div>
              {showAddNb && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input value={newNbName} onChange={e => setNewNbName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNotebook()}
                    placeholder="Notebook name..." autoFocus
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--g)', background: 'var(--card)', fontSize: 13, color: 'var(--fg)', outline: 'none' }} />
                  <button onClick={addNotebook} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {notebooks.map(nb => (
                  <div key={nb.id} onClick={() => setActiveNb(nb.id)} style={{
                    padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--line)',
                    background: 'var(--card)', cursor: 'pointer', position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <BookOpen size={16} style={{ color: nb.color }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{nb.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{nb.notes.length} notes</div>
                      <button onClick={e => { e.stopPropagation(); deleteNotebook(nb.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5, padding: 2 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

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
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--p)', marginBottom: 2 }}>Partner's comment</div>
                    Should we add the dropout regularization example from lecture?
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {showAddNote && (
                <div style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--g)', background: 'var(--card)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} placeholder="Note title..."
                    autoFocus style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 13, color: 'var(--fg)', outline: 'none' }} />
                  <textarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="Content..."
                    rows={4} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 13, color: 'var(--fg)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addNote} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--g)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setShowAddNote(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              {currentNb?.notes.length === 0 && !showAddNote && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No notes yet. Click "New note" to add one.</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentNb?.notes.map(note => (
                  <div key={note.id} style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{note.title}</span>
                      <button onClick={() => deleteNote(currentNb.id, note.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6 }}>{note.content}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{note.created}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Flashcard review */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Flashcard Review</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{flashcards.length} cards</span>
              <button onClick={() => setShowAddCard(true)} style={{
                border: 'none', background: 'var(--g)', color: '#fff', borderRadius: 6,
                padding: '3px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}><Plus size={10} /> Add</button>
            </div>
          </div>

          {showAddCard && (
            <div style={{ padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--g)', background: 'var(--card)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={newCardFront} onChange={e => setNewCardFront(e.target.value)} placeholder="Question..."
                autoFocus style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none' }} />
              <input value={newCardBack} onChange={e => setNewCardBack(e.target.value)} placeholder="Answer..."
                onKeyDown={e => e.key === 'Enter' && addFlashcard()}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--alt)', fontSize: 12, color: 'var(--fg)', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addFlashcard} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--g)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setShowAddCard(false)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {flashcards.length > 0 && card && (
            <>
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
                  {card.subject} · {flipped ? 'Answer' : 'Question'} · Card {(cardIdx % flashcards.length) + 1}/{flashcards.length}
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
            </>
          )}

          {flashcards.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No flashcards yet. Add some to start reviewing.</div>
          )}

          <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--radius)', background: 'var(--alt)', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', fontFamily: "'Space Grotesk', sans-serif" }}>{reviewStats.reviewed}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Reviewed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--g)', fontFamily: "'Space Grotesk', sans-serif" }}>{reviewStats.correct}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Correct</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--a)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {reviewStats.reviewed ? Math.round((reviewStats.correct / reviewStats.reviewed) * 100) : 0}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Accuracy</div>
            </div>
          </div>

          <div style={{
            marginTop: 12, padding: 14, borderRadius: 'var(--radius)',
            border: '1px solid var(--line)', background: 'var(--card)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Zap size={14} style={{ color: 'var(--p)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg)' }}>Quiz each other</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Partner is online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
