import React, { useState, useEffect } from 'react';
import { HeartHandshake, PhoneCall, Wind, AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

const HELPLINES = [
  {
    country: 'India',
    name: 'Tele-MANAS (Govt 24/7 Mental Health)',
    number: '14416',
    alt: '1800-891-4416',
  },
  {
    country: 'India',
    name: 'KIRAN Helpline',
    number: '1800-599-0019',
    alt: 'Free 24/7 Toll-Free',
  },
  {
    country: 'USA & Canada',
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    alt: 'Free, confidential, 24/7',
  },
  {
    country: 'United Kingdom',
    name: 'Samaritans / Shout',
    number: '116 123',
    alt: 'Text SHOUT to 85258',
  },
  {
    country: 'Worldwide',
    name: 'Find A Helpline / Befrienders',
    number: 'https://findahelpline.com',
    alt: 'Confidential crisis support globally',
    isUrl: true,
  },
];

export default function SosCrisisModal({ onTriggerSos, onClose }) {
  const [tab, setTab] = useState('helplines'); // 'helplines' | 'breathe' | 'alert'
  const [alertSent, setAlertSent] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale, Hold, Exhale
  const [timerCount, setTimerCount] = useState(4);

  // Breathing 4-7-8 exercise cycle
  useEffect(() => {
    if (tab !== 'breathe') return;

    let mounted = true;
    const runCycle = async () => {
      while (mounted) {
        // Inhale 4s
        setBreathPhase('Inhale slowly through your nose...');
        for (let i = 4; i > 0 && mounted; i--) {
          setTimerCount(i);
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Hold 7s
        setBreathPhase('Gently hold your breath...');
        for (let i = 7; i > 0 && mounted; i--) {
          setTimerCount(i);
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Exhale 8s
        setBreathPhase('Release slowly through your mouth...');
        for (let i = 8; i > 0 && mounted; i--) {
          setTimerCount(i);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    };

    runCycle();
    return () => {
      mounted = false;
    };
  }, [tab]);

  const handleSendAlert = () => {
    sounds.playGentleAlert();
    onTriggerSos('is feeling overwhelmed and requested a check-in or emotional support.');
    setAlertSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 max-w-md w-full shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <HeartHandshake className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                You Are Not Alone
              </h2>
              <p className="text-xs text-rose-300">
                Study and life pressure can feel heavy. Support is always here.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 p-1 bg-slate-800/80 rounded-xl my-3 text-xs">
          <button
            onClick={() => setTab('helplines')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition ${
              tab === 'helplines'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hotlines & Help
          </button>
          <button
            onClick={() => setTab('alert')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition ${
              tab === 'alert'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alert Study Mates
          </button>
          <button
            onClick={() => setTab('breathe')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition ${
              tab === 'breathe'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calm Breathing
          </button>
        </div>

        {/* Content based on tab */}
        <div className="overflow-y-auto pr-1 flex-1">
          {tab === 'helplines' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-300 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl">
                Please reach out to one of these free, 24/7 confidential services right now. Trained people who care are waiting to listen and help you through this moment.
              </p>
              {HELPLINES.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-white/5 rounded-2xl flex items-center justify-between gap-3 transition"
                >
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                      {item.country}
                    </span>
                    <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                    <p className="text-[11px] text-slate-400">{item.alt}</p>
                  </div>
                  {item.isUrl ? (
                    <a
                      href={item.number}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      Visit
                    </a>
                  ) : (
                    <a
                      href={`tel:${item.number.replace(/\s+/g, '')}`}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <PhoneCall className="w-3 h-3" />
                      {item.number}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'alert' && (
            <div className="space-y-3 py-2 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Send a Check-in Request to Study Mates
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  This will gently notify your friends in the study room that you are feeling overwhelmed and would appreciate someone chatting with you or pausing the grind.
                </p>
              </div>

              {!alertSent ? (
                <button
                  onClick={handleSendAlert}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition"
                >
                  Send Check-In Alert to Study Room
                </button>
              ) : (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Your study group has been notified. Take a pause!
                </div>
              )}
            </div>
          )}

          {tab === 'breathe' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full bg-indigo-500/20 border-2 border-indigo-400/40 animate-ping"
                  style={{ animationDuration: '4s' }}
                />
                <div className="relative z-10 w-28 h-28 rounded-full bg-indigo-600/40 backdrop-blur-md border border-indigo-300/40 flex flex-col items-center justify-center text-white shadow-2xl">
                  <Wind className="w-6 h-6 text-indigo-300 mb-1" />
                  <span className="text-2xl font-bold font-mono">{timerCount}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-indigo-200">
                  {breathPhase}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  4-7-8 Breathing reduces panic, exam anxiety, and nervous system overload.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Remember: Grades do not define your worth.</span>
          <button
            onClick={onClose}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
          >
            I'm Okay Now
          </button>
        </div>
      </div>
    </div>
  );
}
