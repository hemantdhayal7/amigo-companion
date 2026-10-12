import React, { useState } from 'react';
import { Palette, X, RotateCcw, Check, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

const SUGGESTED_EMOJIS = [
  '🎉', '🥳', '❤️', '🥰', '🔥', '☕', '✨', '👏',
  '🌸', '💖', '💡', '🎯', '💯', '🚀', '🐱', '🍕',
  '🌙', '⭐', '📚', '🧠', '⚡', '🥑', '🏆', '💌',
  '🍀', '🌈', '🍦', '🍩', '🎧', '👾', '💎', '🌺'
];

export default function EmojiCustomizerModal({
  emojis,
  onSaveEmojis,
  onResetDefaults,
  onClose,
  theme = 'dark',
}) {
  const [currentSlots, setCurrentSlots] = useState([...emojis]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');

  const handleSelectSuggested = (emoji) => {
    sounds.playPop();
    const updated = [...currentSlots];
    updated[selectedSlotIndex] = emoji;
    setCurrentSlots(updated);
    // Auto advance to next slot for quick customization
    setSelectedSlotIndex((prev) => (prev + 1) % updated.length);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      const updated = [...currentSlots];
      updated[selectedSlotIndex] = customInput.trim();
      setCurrentSlots(updated);
      setCustomInput('');
      sounds.playPop();
      setSelectedSlotIndex((prev) => (prev + 1) % updated.length);
    }
  };

  const handleSave = () => {
    sounds.playCelebration();
    onSaveEmojis(currentSlots);
    onClose();
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
    <div className={`p-4 rounded-3xl border backdrop-blur-2xl max-w-sm w-full ${modalBg} animate-fadeIn`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs">Customize Reaction Bar</h3>
            <p className="text-[10px] opacity-70">Tap a slot below then pick your favorite emoji</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 8 Reaction Slots */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1.5">
          Your 8 Quick Reaction Slots:
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {currentSlots.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSlotIndex(idx)}
              className={`p-2 rounded-xl text-2xl flex flex-col items-center justify-center border transition relative ${
                selectedSlotIndex === idx
                  ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-500/10 scale-105'
                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20'
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[9px] font-mono opacity-60 mt-0.5">Slot {idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Emoji Typed Input */}
      <form onSubmit={handleCustomSubmit} className="flex gap-1.5 mb-3">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={`Type custom emoji for Slot ${selectedSlotIndex + 1}...`}
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
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition"
        >
          Set
        </button>
      </form>

      {/* Suggested Emojis Grid */}
      <div className="mb-3">
        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Click to Assign to Slot {selectedSlotIndex + 1}:
        </label>
        <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 bg-black/5 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
          {SUGGESTED_EMOJIS.map((em, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggested(em)}
              className="w-7 h-7 flex items-center justify-center text-lg rounded-lg hover:scale-125 hover:bg-black/10 dark:hover:bg-white/10 transition"
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
        <button
          onClick={() => {
            onResetDefaults();
            onClose();
          }}
          className="flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg transition active:scale-95"
        >
          <Check className="w-3.5 h-3.5" />
          Save Emojis
        </button>
      </div>
    </div>
  );
}
