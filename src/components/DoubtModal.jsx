import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Trash2,
  CheckCircle2,
  Bot,
  Send,
  AlertCircle,
  HelpCircle,
  ZoomIn,
  MessageSquare,
  Copy,
  Flame,
  ArrowRight
} from 'lucide-react';
import CabbageLogo from './CabbageLogo';
import { sounds } from '../utils/audio';

// Helper to format remaining time until 3-hour self-destruct
function formatRemainingTime(expiresAt) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expiring...';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  if (hours > 0) {
    return `${hours}h ${mins}m left`;
  }
  return `${mins}m ${secs}s left`;
}

export default function DoubtModal({
  isOpen,
  onClose,
  theme = 'dark',
  doubts = [],
  onCreateDoubt,
  onDeleteDoubt,
  onAskDoubtAi,
  onAskQuickAi,
  selfName = 'You',
  partnerName = 'Study Date'
}) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'new' | 'quick-ai'
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);
  const [quickAiPrompt, setQuickAiPrompt] = useState('');
  const [quickAiLoading, setQuickAiLoading] = useState(false);
  const [quickAiHistory, setQuickAiHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [timeTicker, setTimeTicker] = useState(Date.now());
  const fileInputRef = useRef(null);

  // Live timer tick every second for real-time 3-hour countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Global paste listener when modal is open to grab clipboard screenshot effortlessly
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setScreenshotPreview(event.target.result);
              setActiveTab('new');
              sounds.playPop();
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target.result);
        sounds.playPop();
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target.result);
        sounds.playPop();
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Doubt
  const handleSubmitDoubt = () => {
    if (!screenshotPreview && !questionText.trim()) return;
    onCreateDoubt({
      image: screenshotPreview,
      question: questionText.trim()
    });
    setScreenshotPreview(null);
    setQuestionText('');
    setActiveTab('feed');
    sounds.playCelebration();
  };

  // Quick AI Direct Ask
  const handleQuickAiSubmit = async (e) => {
    e?.preventDefault();
    if (!quickAiPrompt.trim() || quickAiLoading) return;
    const prompt = quickAiPrompt.trim();
    setQuickAiPrompt('');
    setQuickAiLoading(true);
    sounds.playPop();

    const tempId = Date.now().toString();
    setQuickAiHistory((prev) => [
      ...prev,
      { id: tempId, prompt, answer: null, loading: true }
    ]);

    try {
      const answer = await onAskQuickAi(prompt);
      setQuickAiHistory((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, answer, loading: false } : item
        )
      );
      sounds.playCelebration();
    } catch (err) {
      setQuickAiHistory((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, answer: `⚠️ Error: ${err.message}`, loading: false, isError: true }
            : item
        )
      );
    } finally {
      setQuickAiLoading(false);
    }
  };

  // Theme styling
  const isWhite = theme === 'white';
  const isBlush = theme === 'blush';

  const modalBg = isWhite
    ? 'bg-white/95 text-slate-800 border-emerald-300'
    : isBlush
    ? 'bg-rose-50/95 text-rose-950 border-rose-200'
    : 'bg-slate-900/95 text-slate-100 border-slate-700/80';

  const cardBg = isWhite
    ? 'bg-slate-50 border-slate-200 text-slate-800'
    : isBlush
    ? 'bg-white/80 border-rose-200 text-rose-950 shadow-sm'
    : 'bg-slate-800/70 border-slate-700/60 text-slate-100';

  const activeTabClass = isBlush
    ? 'bg-rose-500 text-white shadow-md'
    : 'bg-emerald-500 text-white shadow-md';

  return (
    <div
      data-amigo-interactive="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${modalBg}`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <CabbageLogo size={32} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold flex items-center gap-1.5">
                  Ephemeral Doubt Hub
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> 3h Auto-Purge
                </span>
              </div>
              <p className="text-[11px] opacity-70">
                Paste screenshots & ask doubts • Syncs between both PCs • Auto-vanishes in 3 hours
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition opacity-70 hover:opacity-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? activeTabClass
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Active Doubts</span>
              {doubts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {doubts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'new'
                  ? activeTabClass
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>+ Share Doubt</span>
            </button>

            <button
              onClick={() => setActiveTab('quick-ai')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'quick-ai'
                  ? activeTabClass
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Local Gemma</span>
            </button>
          </div>

          <div className="text-[11px] font-mono opacity-60 hidden sm:block">
            {doubts.length === 0 ? 'No active doubts' : `${doubts.length} pending`}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* ============================================================== */}
          {/* TAB 1: ACTIVE DOUBTS FEED                                     */}
          {/* ============================================================== */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {doubts.length === 0 ? (
                <div className="text-center py-10 px-4 flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">No Pending Doubts!</h3>
                    <p className="text-xs opacity-70 mt-1 max-w-xs mx-auto">
                      Whenever you or your partner get stuck, press{' '}
                      <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">
                        Cmd+V
                      </kbd>{' '}
                      to paste a screenshot here.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> Post First Doubt
                  </button>
                </div>
              ) : (
                doubts.map((doubt) => {
                  const remaining = formatRemainingTime(doubt.expiresAt);
                  const isExpiringSoon = doubt.expiresAt - Date.now() < 30 * 60 * 1000;

                  return (
                    <div
                      key={doubt.id}
                      className={`p-4 rounded-2xl border transition shadow-sm space-y-3 ${cardBg}`}
                    >
                      {/* Top Bar: Sender & 3h Countdown */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{doubt.senderAvatar || '👤'}</span>
                          <div>
                            <span className="text-xs font-bold">
                              {doubt.senderName || 'Partner'}
                            </span>
                            <span className="text-[10px] opacity-60 ml-2">
                              {new Date(doubt.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Live Countdown Badge */}
                          <div
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                              isExpiringSoon
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 animate-pulse'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            }`}
                            title="Auto-destructs after 3 hours"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{remaining}</span>
                          </div>

                          {/* Delete / Resolve Button */}
                          <button
                            onClick={() => onDeleteDoubt(doubt.id)}
                            className="p-1 rounded-full opacity-50 hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-500 transition"
                            title="Resolve & Remove Doubt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question / Note Text */}
                      {doubt.question && (
                        <p className="text-xs leading-relaxed font-medium bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                          {doubt.question}
                        </p>
                      )}

                      {/* Screenshot Preview (Clickable to Zoom) */}
                      {doubt.image && (
                        <div className="relative group rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/20 max-h-56 flex items-center justify-center">
                          <img
                            src={doubt.image}
                            alt="Doubt Screenshot"
                            className="w-full h-auto max-h-56 object-contain cursor-zoom-in group-hover:scale-[1.01] transition"
                            onClick={() => setZoomedImage(doubt.image)}
                          />
                          <button
                            onClick={() => setZoomedImage(doubt.image)}
                            className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 backdrop-blur-sm transition"
                          >
                            <ZoomIn className="w-3 h-3" /> Click to Zoom
                          </button>
                        </div>
                      )}

                      {/* AI Answer / AI Button Section */}
                      <div className="pt-1">
                        {doubt.aiAnswer ? (
                          <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <Bot className="w-3.5 h-3.5" />
                              <span>Amigo AI Explanation (Local Gemma 3)</span>
                            </div>
                            <div className="text-xs leading-relaxed whitespace-pre-wrap opacity-90">
                              {doubt.aiAnswer}
                            </div>
                          </div>
                        ) : doubt.aiStatus === 'generating' ? (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span>Gemma is formulating an explanation on your Mac...</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAskDoubtAi(doubt.id, doubt.question)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-2 group"
                          >
                            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                            <span>✨ Ask Local Amigo AI (Ollama)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: POST NEW DOUBT                                          */}
          {/* ============================================================== */}
          {activeTab === 'new' && (
            <div className="space-y-4">
              {/* Dropzone / Paste Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : screenshotPreview
                    ? 'border-emerald-500/40 bg-black/5 dark:bg-white/5'
                    : 'border-black/20 dark:border-white/20 hover:border-emerald-500/60'
                }`}
                onClick={() => !screenshotPreview && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {screenshotPreview ? (
                  <div className="w-full space-y-2">
                    <div className="relative max-h-56 overflow-hidden rounded-xl bg-black/20 flex items-center justify-center">
                      <img
                        src={screenshotPreview}
                        alt="Pasted Screenshot"
                        className="w-full h-auto max-h-56 object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshotPreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot captured!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 mx-auto flex items-center justify-center text-emerald-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">
                        Paste Screenshot directly (<kbd className="px-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Cmd+V</kbd> or <kbd className="px-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">Ctrl+V</kbd>)
                      </p>
                      <p className="text-[10px] opacity-60 mt-0.5">
                        or drag & drop an image, or click to browse
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Doubt Note / Question */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block">
                  Question or doubt description:
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Can you explain step 4? Why did the sign change here?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* 3-Hour TTL Notice */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Strict 3-Hour Self-Destruct:</strong> This doubt will automatically vanish from memory after 3 hours. Zero permanent clutter.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSubmitDoubt}
                  disabled={!screenshotPreview && !questionText.trim()}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
                    screenshotPreview || questionText.trim()
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                      : 'bg-black/10 dark:bg-white/10 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share Doubt with Mate</span>
                </button>

                <button
                  onClick={() => {
                    setScreenshotPreview(null);
                    setQuestionText('');
                    setActiveTab('feed');
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition opacity-70 hover:opacity-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: QUICK LOCAL AI QUERY                                   */}
          {/* ============================================================== */}
          {activeTab === 'quick-ai' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3">
                <CabbageLogo size={36} />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    Amigo Study Tutor
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Local Gemma 3 1B
                    </span>
                  </div>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    Ask study questions directly. Powered by Ollama on your Mac without internet fees.
                  </p>
                </div>
              </div>

              {/* Q&A Stream History */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {quickAiHistory.length === 0 ? (
                  <div className="text-center py-6 text-xs opacity-50">
                    Ask anything! e.g., "Explain Bayes Theorem simply" or "Give 3 tips to remember calculus derivatives".
                  </div>
                ) : (
                  quickAiHistory.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-medium flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <span>{item.prompt}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <Bot className="w-3.5 h-3.5" />
                          <span>Amigo Explanation:</span>
                        </div>
                        {item.loading ? (
                          <div className="flex items-center gap-2 py-2 text-amber-500">
                            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{item.answer}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ask Input Form */}
              <form onSubmit={handleQuickAiSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={quickAiPrompt}
                  onChange={(e) => setQuickAiPrompt(e.target.value)}
                  placeholder="Type a study question for Amigo..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!quickAiPrompt.trim() || quickAiLoading}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    quickAiPrompt.trim() && !quickAiLoading
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                      : 'bg-black/10 dark:bg-white/10 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox High-Resolution Zoom Modal for Screenshots */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out select-none"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed Screenshot"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
