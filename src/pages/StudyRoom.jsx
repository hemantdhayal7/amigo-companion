import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageCircle, PhoneOff, Clock, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { uid } from '../utils/store';
import { useSyncData } from '../hooks/useSyncData';

const MODES = [
  { id: 'pomodoro', label: 'Pomodoro', duration: 25 * 60, breakDur: 5 * 60 },
  { id: 'deep', label: 'Deep Work', duration: 50 * 60, breakDur: 10 * 60 },
  { id: 'sprint', label: 'Sprint', duration: 15 * 60, breakDur: 3 * 60 },
];

const DEFAULT_TASKS = [
  { id: 't1', text: 'Practice exam questions', done: false },
  { id: 't2', text: 'Review formulas', done: true },
  { id: 't3', text: 'Draft summary sheet', done: false },
];

export default function StudyRoom({ onBack, user }) {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [tasks, saveTasks] = useSyncData(user, 'room_tasks', DEFAULT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, saveChatMessages] = useSyncData(user, 'room_chat', []);

  const [mode] = useSyncData(user, 'focus_mode', 'pomodoro');
  const currentMode = MODES.find(m => m.id === mode) || MODES[0];
  const [timeLeft, setTimeLeft] = useState(currentMode.duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const micStreamRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Session elapsed timer
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [sessionStart]);

  // Pomodoro timer
  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (!isBreak) {
            setIsBreak(true);
            return currentMode.breakDur;
          } else {
            setIsBreak(false);
            setRound(r => r + 1);
            return currentMode.duration;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timerRunning, isBreak, currentMode]);

  // Camera
  const toggleCam = useCallback(async () => {
    if (camOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCamOn(true);
      } catch (err) {
        console.warn('Camera access denied:', err);
      }
    }
  }, [camOn]);

  // Mic with audio level
  const toggleMic = useCallback(async () => {
    if (micOn) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      analyserRef.current = null;
      setAudioLevel(0);
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
        setMicOn(true);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(avg / 255);
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('Mic access denied:', err);
      }
    }
  }, [micOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const toggleTask = (id) => saveTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = () => {
    if (!newTask.trim()) return;
    saveTasks(prev => [...prev, { id: uid(), text: newTask.trim(), done: false }]);
    setNewTask('');
  };
  const deleteTask = (id) => saveTasks(prev => prev.filter(t => t.id !== id));

  const sendChat = () => {
    if (!chatInput.trim()) return;
    saveChatMessages(prev => [...prev, { id: uid(), from: 'me', text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmtElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const breakAt = new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div style={{
      height: '100%', background: '#0F0F14', color: '#E5E7EB',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Study Room</h2>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>2 people · {fmtElapsed(elapsed)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          }}>
            <Clock size={12} style={{ color: isBreak ? '#3B82F6' : '#16A34A' }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{fmtTime(timeLeft)}</span>
            <span style={{ color: '#9CA3AF', fontSize: 10 }}>/ {fmtTime(isBreak ? currentMode.breakDur : currentMode.duration)} · R{round}</span>
          </div>
        </div>
      </div>

      {/* Video stage */}
      <div style={{ flex: 1, display: 'flex', padding: 20, gap: 16, minHeight: 0 }}>
        {/* Main video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          {/* Partner video */}
          <div style={{
            flex: 1, borderRadius: 16, background: '#1A1A24',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', minHeight: 0,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, background: 'rgba(124,58,237,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#7C3AED',
            }}>S</div>
            <div style={{
              position: 'absolute', bottom: 12, left: 12, padding: '4px 10px',
              borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#16A34A' }} />
              Partner
            </div>

            {/* Self-view PiP */}
            <div style={{
              position: 'absolute', bottom: 12, right: 12, width: 160, height: 120,
              borderRadius: 10, background: '#24242E', border: '2px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {camOn ? (
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#16A34A',
                }}>H</div>
              )}
              {micOn && (
                <div style={{
                  position: 'absolute', bottom: 4, left: 4, width: 16, height: 16, borderRadius: 4,
                  background: `rgba(22,163,74,${0.3 + audioLevel * 0.7})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mic size={10} style={{ color: '#16A34A' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* Shared timer */}
          <div style={{
            padding: 16, borderRadius: 12, background: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 8 }}>
              {isBreak ? 'Break Time' : 'Shared Pomodoro'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: isBreak ? '#3B82F6' : '#E5E7EB' }}>{fmtTime(timeLeft)}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                Round {round} of 4 · {isBreak ? 'Relax!' : `Break at ${breakAt}`}
              </div>
              <button onClick={() => setTimerRunning(!timerRunning)} style={{
                marginTop: 10, padding: '6px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: timerRunning ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
                color: timerRunning ? '#EF4444' : '#16A34A', fontSize: 11, fontWeight: 600,
              }}>
                {timerRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>

          {/* Session tasks */}
          <div style={{
            padding: 16, borderRadius: 12, background: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.08)', flex: 1, overflowY: 'auto', minHeight: 0,
          }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 10 }}>Session Tasks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleTask(t.id)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: t.done ? '#16A34A' : '#4B5563', flexShrink: 0 }}
                  >
                    {t.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </button>
                  <span style={{
                    fontSize: 12, color: t.done ? '#6B7280' : '#E5E7EB',
                    textDecoration: t.done ? 'line-through' : 'none', flex: 1,
                  }}>{t.text}</span>
                  <button onClick={() => deleteTask(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4B5563', padding: 0, flexShrink: 0 }}>
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Add task..."
                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: 11, color: '#E5E7EB', outline: 'none' }} />
              <button onClick={addTask} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(22,163,74,0.15)', color: '#16A34A', cursor: 'pointer' }}>
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Chat panel */}
          {showChat && (
            <div style={{
              padding: 12, borderRadius: 12, background: '#1A1A24',
              border: '1px solid rgba(255,255,255,0.08)', maxHeight: 200, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 8 }}>Room Chat</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, minHeight: 60 }}>
                {chatMessages.length === 0 && <div style={{ fontSize: 11, color: '#4B5563', textAlign: 'center', padding: 8 }}>No messages yet</div>}
                {chatMessages.map(m => (
                  <div key={m.id} style={{ fontSize: 11, color: m.from === 'me' ? '#16A34A' : '#7C3AED' }}>
                    <span style={{ fontWeight: 600 }}>{m.from === 'me' ? 'You' : 'Partner'}</span>
                    <span style={{ color: '#9CA3AF' }}> {m.time} </span>
                    <span style={{ color: '#E5E7EB' }}>{m.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Message..."
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: 11, color: '#E5E7EB', outline: 'none' }} />
                <button onClick={sendChat} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(22,163,74,0.15)', color: '#16A34A', cursor: 'pointer', fontSize: 11 }}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={toggleMic} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: micOn ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)',
          color: micOn ? '#E5E7EB' : '#EF4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: micOn && audioLevel > 0.1 ? `0 0 ${8 + audioLevel * 16}px rgba(22,163,74,${audioLevel * 0.5})` : 'none',
        }}>
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button onClick={toggleCam} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: camOn ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.08)',
          color: camOn ? '#E5E7EB' : '#9CA3AF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', color: '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Monitor size={18} />
        </button>
        <button onClick={() => setShowChat(!showChat)} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: showChat ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.08)',
          color: showChat ? '#16A34A' : '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageCircle size={18} />
        </button>
        <div style={{ width: 20 }} />
        <button onClick={() => {
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
          if (onBack) onBack();
        }} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#EF4444', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
