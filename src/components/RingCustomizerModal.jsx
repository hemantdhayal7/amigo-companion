import React, { useState, useEffect } from 'react';
import {
  Palette,
  X,
  RotateCcw,
  Check,
  Sparkles,
  Star,
  Mic,
  Video,
  ScreenShare,
  HelpCircle,
  Target,
  HeartHandshake,
  GripHorizontal,
  Users,
  Sun,
  Settings,
  EyeOff,
  Send,
  Layers,
  Smile,
  Link2,
  Music,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const DEFAULT_EMOJIS = ['🎉', '🥳', '❤️', '🥰', '🔥', '☕', '✨', '👏'];

export const DEFAULT_MENU_TOOLS = ['drag', 'mic', 'cam', 'share', 'emoji', 'sos', 'doubt', 'target'];

export const EMOJI_CATEGORIES = {
  favorites: {
    name: 'Favorites',
    icon: Star,
    color: 'text-amber-400',
    emojis: ['❤️', '🥰', '🎉', '🔥', '✨', '☕', '👏', '🥳'],
  },
  love: {
    name: 'Hearts & Sweet',
    icon: Sparkles,
    color: 'text-rose-400',
    emojis: ['❤️', '🥰', '💖', '💕', '🫂', '💌', '🌸', '✨', '🧸', '💋', '🌹', '🥺'],
  },
  celebrate: {
    name: 'Party & Hype',
    icon: Sparkles,
    color: 'text-amber-400',
    emojis: ['🎉', '🥳', '🔥', '🚀', '🍾', '🎊', '🌟', '👏', '🏆', '👑', '💯', '🙌'],
  },
  study: {
    name: 'Study & Focus',
    icon: Target,
    color: 'text-emerald-400',
    emojis: ['💡', '📖', '☕', '🎯', '💯', '🧠', '⚡', '🥑', '💻', '📚', '✏️', '📝'],
  },
  fun: {
    name: 'Reactions & Fun',
    icon: Smile,
    color: 'text-sky-400',
    emojis: ['😂', '🤣', '😜', '🥹', '🐱', '🐶', '🍕', '🥬', '🍦', '🍪', '🍔', '😋'],
  },
  vibes: {
    name: 'Magic & Mood',
    icon: Sparkles,
    color: 'text-purple-400',
    emojis: ['🌈', '🍀', '🎧', '👾', '💎', '🌺', '🌙', '🪐', '🎨', '🔮', '🧸', '☀️'],
  },
};

export const AVAILABLE_MENU_TOOLS = {
  drag: {
    id: 'drag',
    label: 'DRAG',
    name: 'Move & Dock App',
    icon: GripHorizontal,
    color: 'text-slate-300',
    desc: 'Hold & drag Amigo anywhere on screen',
  },
  mic: {
    id: 'mic',
    label: 'MIC',
    name: 'Microphone Mute',
    icon: Mic,
    color: 'text-emerald-400',
    desc: 'Toggle your microphone on or off',
  },
  cam: {
    id: 'cam',
    label: 'CAM',
    name: 'Webcam Toggle',
    icon: Video,
    color: 'text-rose-400',
    desc: 'Toggle your live camera stream',
  },
  share: {
    id: 'share',
    label: 'SHARE',
    name: 'Screen Share / Watch',
    icon: ScreenShare,
    color: 'text-cyan-400',
    desc: 'Share your screen or watch partner',
  },
  emoji: {
    id: 'emoji',
    label: 'EMOJI',
    name: 'Emoji Reaction Ring',
    icon: Smile,
    color: 'text-amber-400',
    desc: 'Switch to the outer Emoji reaction dial',
  },
  sos: {
    id: 'sos',
    label: 'SOS',
    name: 'Caring SOS Lifeline',
    icon: HeartHandshake,
    color: 'text-rose-400',
    desc: 'Send gentle check-in or crisis alert',
  },
  doubt: {
    id: 'doubt',
    label: 'DOUBT',
    name: 'Ask Doubt & AI Tutor',
    icon: HelpCircle,
    color: 'text-amber-400',
    desc: 'Ephemeral Doubt Hub & Local AI answers',
  },
  target: {
    id: 'target',
    label: 'GOAL',
    name: 'Daily Goals & Tasks',
    icon: Target,
    color: 'text-emerald-400',
    desc: 'Track targets, milestones, and progress',
  },
  dual: {
    id: 'dual',
    label: 'DUAL',
    name: 'Dual Face-to-Face',
    icon: Users,
    color: 'text-indigo-400',
    desc: 'Side-by-side video cards for study date',
  },
  theme: {
    id: 'theme',
    label: 'THEME',
    name: 'Cycle Color Theme',
    icon: Sun,
    color: 'text-yellow-400',
    desc: 'Switch between Dark, Light, and Blush',
  },
  options: {
    id: 'options',
    label: 'OPTS',
    name: 'Options Drawer',
    icon: Settings,
    color: 'text-blue-400',
    desc: 'Open settings, room code, and controls',
  },
  vanish: {
    id: 'vanish',
    label: 'ORB',
    name: 'Pure Minimalist Orb',
    icon: EyeOff,
    color: 'text-purple-400',
    desc: 'Vanish rings into a pure camera circle',
  },
  connect: {
    id: 'connect',
    label: 'URL',
    name: 'Server URL & Room',
    icon: Link2,
    color: 'text-emerald-400',
    desc: 'Paste server URL, change room & passcode',
  },
  music: {
    id: 'music',
    label: 'MUSIC',
    name: 'Share Music / Audio',
    icon: Music,
    color: 'text-violet-400',
    desc: 'Share YouTube Music or system audio in HD stereo',
  },
};

export default function RingCustomizerModal({
  initialTab = 'emojis', // 'emojis' | 'menu'
  emojis = DEFAULT_EMOJIS,
  menuTools = DEFAULT_MENU_TOOLS,
  onSaveEmojis = () => {},
  onSaveMenuTools = () => {},
  onResetDefaults = () => {},
  onSendEmoji = () => {},
  onClose = () => {},
  theme = 'dark',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // EMOJI STATE
  const [currentEmojiSlots, setCurrentEmojiSlots] = useState([...emojis]);
  const [selectedEmojiSlot, setSelectedEmojiSlot] = useState(0);
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('favorites');
  const [savedFavorites, setSavedFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('study_user_favorite_emojis');
      return saved ? JSON.parse(saved) : EMOJI_CATEGORIES.favorites.emojis;
    } catch {
      return EMOJI_CATEGORIES.favorites.emojis;
    }
  });

  // MENU RING STATE
  const [currentMenuSlots, setCurrentMenuSlots] = useState([...menuTools]);
  const [selectedMenuSlot, setSelectedMenuSlot] = useState(0);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('study_user_favorite_emojis', JSON.stringify(savedFavorites));
    } catch {}
  }, [savedFavorites]);

  const toggleFavorite = (emoji) => {
    sounds.playPop();
    setSavedFavorites((prev) => {
      if (prev.includes(emoji)) {
        return prev.filter((e) => e !== emoji);
      } else {
        return [...prev, emoji];
      }
    });
  };

  const handleSelectEmoji = (emoji) => {
    sounds.playPop();
    const updated = [...currentEmojiSlots];
    updated[selectedEmojiSlot] = emoji;
    setCurrentEmojiSlots(updated);
    // Auto advance to next slot for rapid customization
    setSelectedEmojiSlot((prev) => (prev + 1) % updated.length);
  };

  const handleCustomEmojiSubmit = (e) => {
    e.preventDefault();
    if (customEmojiInput.trim()) {
      sounds.playPop();
      const updated = [...currentEmojiSlots];
      updated[selectedEmojiSlot] = customEmojiInput.trim();
      setCurrentEmojiSlots(updated);
      setCustomEmojiInput('');
      setSelectedEmojiSlot((prev) => (prev + 1) % updated.length);
    }
  };

  const handleSelectMenuTool = (toolId) => {
    sounds.playPop();
    const updated = [...currentMenuSlots];
    updated[selectedMenuSlot] = toolId;
    setCurrentMenuSlots(updated);
    setSelectedMenuSlot((prev) => (prev + 1) % updated.length);
  };

  const handleSaveAll = () => {
    sounds.playCelebration();
    onSaveEmojis(currentEmojiSlots);
    onSaveMenuTools(currentMenuSlots);
    onClose();
  };

  const handleResetBoth = () => {
    sounds.playPop();
    setCurrentEmojiSlots([...DEFAULT_EMOJIS]);
    setCurrentMenuSlots([...DEFAULT_MENU_TOOLS]);
    if (onResetDefaults) onResetDefaults();
  };

  // Theme styling helpers
  const isWhite = theme === 'white';
  const isBlush = theme === 'blush';

  const modalBg = isWhite
    ? 'bg-white/95 text-slate-800 border-slate-200 shadow-2xl'
    : isBlush
    ? 'bg-rose-50/95 text-rose-950 border-rose-200/90 shadow-2xl'
    : 'bg-slate-900/95 text-slate-100 border-indigo-500/30 shadow-2xl';

  return (
    <div
      data-amigo-interactive="true"
      className={`p-4 rounded-3xl border backdrop-blur-2xl max-w-md w-full ${modalBg} animate-fadeIn shadow-2xl select-none`}
    >
      {/* Header with Close and Tabs */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm">Customize Companion Rings</h3>
            <p className="text-[10px] opacity-70">Customize your Emoji Ring & Menu Ring</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Switcher: Emojis vs Menu Ring */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-3.5">
        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab('emojis');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'emojis'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>😊 Emoji Ring & Stickers</span>
        </button>
        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab('menu');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>⚙️ Menu Ring Buttons</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: EMOJI RING & STICKERS PALETTE                             */}
      {/* ================================================================ */}
      {activeTab === 'emojis' && (
        <div>
          {/* 8 Reaction Slots */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Your 8 Quick Ring Slots:
              </label>
              <span className="text-[9px] text-indigo-400 font-mono">
                Click a slot to replace it
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {currentEmojiSlots.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedEmojiSlot(idx)}
                  className={`p-1.5 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer relative ${
                    selectedEmojiSlot === idx
                      ? 'border-indigo-500 ring-2 ring-indigo-400/50 bg-indigo-500/20 scale-105'
                      : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-indigo-400/40'
                  }`}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="text-[8px] font-mono opacity-60 mt-0.5">#{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom typed emoji input */}
          <form onSubmit={handleCustomEmojiSubmit} className="flex gap-1.5 mb-3">
            <input
              type="text"
              value={customEmojiInput}
              onChange={(e) => setCustomEmojiInput(e.target.value)}
              placeholder={`Type emoji for Slot #${selectedEmojiSlot + 1}...`}
              maxLength={4}
              className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                isWhite
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : isBlush
                  ? 'bg-rose-100/70 border-rose-300 text-rose-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition cursor-pointer"
            >
              Assign
            </button>
          </form>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
            {Object.entries(EMOJI_CATEGORIES).map(([catKey, cat]) => {
              const isSelected = activeEmojiCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveEmojiCategory(catKey)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Emojis Grid for Selected Category */}
          <div className="p-2 bg-black/5 dark:bg-black/30 rounded-2xl border border-black/10 dark:border-white/10 mb-3 max-h-40 overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {(activeEmojiCategory === 'favorites'
                ? savedFavorites
                : EMOJI_CATEGORIES[activeEmojiCategory]?.emojis || []
              ).map((em, idx) => {
                const isFav = savedFavorites.includes(em);
                return (
                  <div
                    key={idx}
                    className="group relative flex items-center justify-center p-1 rounded-xl hover:bg-white/10 transition"
                  >
                    {/* Click emoji to assign to slot */}
                    <button
                      onClick={() => handleSelectEmoji(em)}
                      className="text-2xl hover:scale-130 active:scale-95 transition cursor-pointer"
                      title={`Assign ${em} to Slot #${selectedEmojiSlot + 1}`}
                    >
                      {em}
                    </button>

                    {/* Quick Action Overlay (Send Now / Star Favorite) */}
                    <div className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playPop();
                          onSendEmoji(em);
                        }}
                        title={`Send ${em} live now`}
                        className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] shadow-sm hover:scale-110"
                      >
                        <Send className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(em);
                        }}
                        title={isFav ? 'Remove from favorites' : 'Star favorite'}
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] shadow-sm hover:scale-110 ${
                          isFav ? 'bg-amber-500 text-white' : 'bg-black/60 text-amber-300'
                        }`}
                      >
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: MENU RING CUSTOMIZER (8 SECTOR BUTTONS)                    */}
      {/* ================================================================ */}
      {activeTab === 'menu' && (
        <div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Your 8 Menu Ring Sectors:
              </label>
              <span className="text-[9px] text-indigo-400 font-mono">
                Click a slot then choose below
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {currentMenuSlots.map((toolId, idx) => {
                const tool = AVAILABLE_MENU_TOOLS[toolId] || AVAILABLE_MENU_TOOLS.options;
                const IconComp = tool.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMenuSlot(idx)}
                    className={`p-1.5 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer relative ${
                      selectedMenuSlot === idx
                        ? 'border-indigo-500 ring-2 ring-indigo-400/50 bg-indigo-500/20 scale-105'
                        : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-indigo-400/40'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${tool.color}`} />
                    <span className="text-[7.5px] font-mono font-bold mt-1 truncate max-w-full">
                      {tool.label}
                    </span>
                    <span className="text-[7px] font-mono opacity-50">#{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1.5">
            Choose Tool for Slot #{selectedMenuSlot + 1}:
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-black/5 dark:bg-black/30 rounded-2xl border border-black/10 dark:border-white/10 mb-3">
            {Object.values(AVAILABLE_MENU_TOOLS).map((tool) => {
              const IconComp = tool.icon;
              const isAssigned = currentMenuSlots.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSelectMenuTool(tool.id)}
                  className={`p-2 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                    currentMenuSlots[selectedMenuSlot] === tool.id
                      ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-400/40'
                      : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp className={`w-3.5 h-3.5 ${tool.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                      <span>{tool.name}</span>
                      {isAssigned && <span className="text-[8px] text-emerald-400">✓</span>}
                    </p>
                    <p className="text-[9px] opacity-60 leading-tight truncate">{tool.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-black/10 dark:border-white/10">
        <button
          onClick={handleResetBoth}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { RingCustomizerModal };
