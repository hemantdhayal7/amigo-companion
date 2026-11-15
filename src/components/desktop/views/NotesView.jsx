import React, { useState } from 'react';

export default function NotesView() {
  const [selectedNotebook, setSelectedNotebook] = useState('Statistics');
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const flashcards = [
    {
      front: 'What does high variance mean in machine learning?',
      back: 'The model overfits the training data — low training error, but high test error on unseen data.',
      hint: 'Click to flip',
    },
    {
      front: 'How do you reduce model variance?',
      back: 'Collect more training data, add L1/L2 regularization, reduce model complexity, or use bagging (Random Forests).',
      hint: 'Click to flip',
    },
    {
      front: 'Expected error decomposition formula?',
      back: 'Expected error = Bias² + Variance + Irreducible noise.',
      hint: 'Click to flip',
    },
  ];

  const currentCard = flashcards[cardIndex % flashcards.length];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => prev + 1);
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <header
        style={{
          height: '68px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 28px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h" style={{ fontSize: '20px' }}>Notes &amp; Flashcards</div>
          <div className="mut" style={{ fontSize: '12px' }}>
            28 notes · 164 cards · 12 due for review today
          </div>
        </div>

        <button
          className="btn"
          onClick={() => prompt('New note title:')}
        >
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New note
        </button>

        <button className="btn pri" onClick={() => setIsFlipped(!isFlipped)}>
          <svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h13v11H4zM7 4h13v11" />
          </svg>
          Review 12 cards
        </button>
      </header>

      {/* 3 Column Layout */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr) 330px',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Column 1: Notebooks & Note List */}
        <section className="card" style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <div className="lbl" style={{ padding: '0 10px 6px' }}>Notebooks</div>
          
          <div
            onClick={() => setSelectedNotebook('Machine Learning')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              background: selectedNotebook === 'Machine Learning' ? 'var(--gs)' : 'transparent',
              color: selectedNotebook === 'Machine Learning' ? 'var(--gt)' : 'inherit',
              fontWeight: selectedNotebook === 'Machine Learning' ? 600 : 400,
            }}
          >
            <span style={{ flex: 1, fontSize: '13px' }}>Machine Learning</span>
            <span className="mut" style={{ fontSize: '12px' }}>12</span>
          </div>

          <div
            onClick={() => setSelectedNotebook('Statistics')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              background: selectedNotebook === 'Statistics' ? 'var(--gs)' : 'transparent',
              color: selectedNotebook === 'Statistics' ? 'var(--gt)' : 'inherit',
              fontWeight: selectedNotebook === 'Statistics' ? 600 : 400,
            }}
          >
            <span style={{ flex: 1, fontSize: '13px' }}>Statistics</span>
            <span style={{ fontSize: '12px' }}>8</span>
          </div>

          <div
            onClick={() => setSelectedNotebook('Linear Algebra')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              background: selectedNotebook === 'Linear Algebra' ? 'var(--gs)' : 'transparent',
              color: selectedNotebook === 'Linear Algebra' ? 'var(--gt)' : 'inherit',
              fontWeight: selectedNotebook === 'Linear Algebra' ? 600 : 400,
            }}
          >
            <span style={{ flex: 1, fontSize: '13px' }}>Linear Algebra</span>
            <span className="chip" style={{ background: 'var(--ps)', color: 'var(--p)', padding: '2px 7px' }}>Shared</span>
          </div>

          <div
            onClick={() => setSelectedNotebook('Certification')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              background: selectedNotebook === 'Certification' ? 'var(--gs)' : 'transparent',
              color: selectedNotebook === 'Certification' ? 'var(--gt)' : 'inherit',
              fontWeight: selectedNotebook === 'Certification' ? 600 : 400,
            }}
          >
            <span style={{ flex: 1, fontSize: '13px' }}>Certification</span>
            <span className="mut" style={{ fontSize: '12px' }}>3</span>
          </div>

          <div className="lbl" style={{ padding: '14px 10px 6px' }}>In {selectedNotebook}</div>
          
          <div style={{ padding: '8px 10px', borderRadius: '9px', background: 'var(--alt)', cursor: 'pointer' }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Bias–variance tradeoff</div>
            <div className="mut" style={{ fontSize: '11px' }}>Edited 12 min ago · 6 cards</div>
          </div>

          <div style={{ padding: '8px 10px', cursor: 'pointer' }}>
            <div style={{ fontWeight: 500, fontSize: '13px' }}>Hypothesis testing cheatsheet</div>
            <div className="mut" style={{ fontSize: '11px' }}>Yesterday · 14 cards</div>
          </div>

          <div style={{ padding: '8px 10px', cursor: 'pointer' }}>
            <div style={{ fontWeight: 500, fontSize: '13px' }}>Confidence intervals</div>
            <div className="mut" style={{ fontSize: '11px' }}>Thu · 9 cards</div>
          </div>

          <div style={{ padding: '8px 10px', cursor: 'pointer' }}>
            <div style={{ fontWeight: 500, fontSize: '13px' }}>Quiz 2 — what I got wrong</div>
            <div className="mut" style={{ fontSize: '11px' }}>3 Nov · 5 cards</div>
          </div>

          <div style={{ flex: 1 }}></div>
          <div className="mut" style={{ fontSize: '11px', padding: '0 10px' }}>
            Paste a lecture PDF or slides to turn them into notes.
          </div>
        </section>

        {/* Column 2: Note Content Reader / Editor */}
        <section className="card" style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="mut" style={{ fontSize: '12px', flex: 1 }}>Statistics / Bias–variance tradeoff</span>
            <div style={{ display: 'flex' }}>
              <div className="av" style={{ width: '26px', height: '26px', borderRadius: '50%', fontSize: '12px', background: 'var(--gs)', color: 'var(--gt)', border: '2px solid var(--card)' }}>
                H
              </div>
              <div className="av" style={{ width: '26px', height: '26px', borderRadius: '50%', fontSize: '12px', background: 'var(--ps)', color: 'var(--p)', border: '2px solid var(--card)', marginLeft: '-8px' }}>
                S
              </div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--p)', fontWeight: 600 }}>Sakura is reading</span>
            <button className="btn" style={{ height: '30px', fontSize: '12px' }}>Share</button>
          </div>

          <h1 className="h" style={{ fontSize: '26px', margin: '14px 0 4px' }}>Bias–variance tradeoff</h1>
          
          <p style={{ fontSize: '14px', lineHeight: 1.65, margin: '8px 0 0' }}>
            Every model's expected error splits into three parts: bias, variance and noise we can't remove. Making a model more flexible lowers bias but raises variance, so the goal is the point where their sum is smallest.
          </p>

          <div style={{ margin: '14px 0', padding: '12px 16px', borderRadius: '12px', background: 'var(--alt)', fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', textAlign: 'center' }}>
            Expected error = Bias² + Variance + Irreducible noise
          </div>

          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.75 }}>
            <li><strong>High bias</strong> — underfits; training and test error are both high.</li>
            <li><span style={{ background: 'var(--ps)', borderRadius: '4px', padding: '1px 4px' }}><strong>High variance</strong> — overfits; low training error, high test error.</span></li>
            <li>Fixes for variance: more data, regularisation, simpler model, bagging.</li>
            <li>Fixes for bias: richer features, a more flexible model, boosting.</li>
          </ul>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div className="av" style={{ width: '26px', height: '26px', borderRadius: '50%', fontSize: '12px', background: 'var(--ps)', color: 'var(--p)' }}>
              S
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px' }}>
                <strong>Sakura</strong> <span className="mut">commented on the highlight</span>
              </div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>
                This one came up twice on last year's quiz — add the learning-curve picture?
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', background: 'var(--ps)' }}>
            <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>6 flashcards suggested from this note</div>
              <div className="mut" style={{ fontSize: '12px' }}>Review and edit them before they join your Statistics deck.</div>
            </div>
            <button className="btn" style={{ background: 'var(--card)', fontSize: '12px' }}>
              Review suggestions
            </button>
          </div>
        </section>

        {/* Column 3: Spaced Repetition Flashcards Review */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="h" style={{ fontSize: '15px', flex: 1 }}>Review · Statistics</div>
              <span className="mut" style={{ fontSize: '12px' }}>
                {(cardIndex % flashcards.length) + 1} of 12
              </span>
            </div>

            <div style={{ height: '5px', borderRadius: '3px', background: 'var(--alt)' }}>
              <div style={{ width: `${(((cardIndex % flashcards.length) + 1) / 12) * 100}%`, height: '100%', borderRadius: '3px', background: 'var(--g)' }}></div>
            </div>

            {/* Interactive Card */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              aria-label="Flip card"
              style={{
                height: '210px',
                padding: '18px',
                borderRadius: '16px',
                background: 'var(--alt)',
                color: 'var(--fg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                textAlign: 'center',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <span className="lbl">{isFlipped ? 'ANSWER' : 'QUESTION'}</span>
              <span style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.4 }}>
                {isFlipped ? currentCard.back : currentCard.front}
              </span>
              <span className="mut" style={{ fontSize: '12px' }}>{currentCard.hint}</span>
            </button>

            {/* Spaced Repetition Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn"
                onClick={handleNextCard}
                style={{ flex: 1, height: '42px', flexDirection: 'column', padding: 0, justifyContent: 'center', gap: 0 }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Again</span>
                <span className="mut" style={{ fontSize: '10px' }}>1 min</span>
              </button>
              <button
                className="btn"
                onClick={handleNextCard}
                style={{ flex: 1, height: '42px', flexDirection: 'column', padding: 0, justifyContent: 'center', gap: 0 }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Hard</span>
                <span className="mut" style={{ fontSize: '10px' }}>6 min</span>
              </button>
              <button
                className="btn"
                onClick={handleNextCard}
                style={{ flex: 1, height: '42px', flexDirection: 'column', padding: 0, justifyContent: 'center', gap: 0, background: 'var(--gs)', color: 'var(--gt)', border: '1px solid var(--g)' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Good</span>
                <span style={{ fontSize: '10px' }}>1 day</span>
              </button>
              <button
                className="btn"
                onClick={handleNextCard}
                style={{ flex: 1, height: '42px', flexDirection: 'column', padding: 0, justifyContent: 'center', gap: 0 }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Easy</span>
                <span className="mut" style={{ fontSize: '10px' }}>4 days</span>
              </button>
            </div>
          </div>

          {/* Retention Stats */}
          <div className="card" style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', textAlign: 'center' }}>
            <div>
              <div className="h" style={{ fontSize: '18px' }}>88%</div>
              <div className="mut" style={{ fontSize: '11px' }}>Retention</div>
            </div>
            <div>
              <div className="h" style={{ fontSize: '18px' }}>164</div>
              <div className="mut" style={{ fontSize: '11px' }}>Cards</div>
            </div>
            <div>
              <div className="h" style={{ fontSize: '18px' }}>9</div>
              <div className="mut" style={{ fontSize: '11px' }}>Day streak</div>
            </div>
          </div>

          {/* Quiz Each Other */}
          <div className="card" style={{ padding: '16px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg className="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--p)' }}>
                <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6" />
              </svg>
              <div className="h" style={{ fontSize: '15px' }}>Quiz each other</div>
            </div>
            <div className="mut" style={{ fontSize: '12px', marginTop: '6px' }}>
              Send Sakura 5 random cards from Statistics to test her on your next break.
            </div>
            <button className="btn pri" style={{ width: '100%', marginTop: '12px', height: '36px', fontSize: '13px' }}>
              Send 5-card break quiz
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
