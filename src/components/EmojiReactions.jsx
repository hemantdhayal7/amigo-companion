import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';
import { Heart, Sparkles, SmilePlus, Flame, Coffee, ArrowDownCircle, ArrowUpCircle, Palette } from 'lucide-react';

const DEFAULT_EMOJIS = ['🥰', '💖', '🌸', '✨', '🫂', '💌', '☕', '🎉'];

export default function EmojiReactions({
  onSendEmoji,
  floatingEmojis = [],
  quickEmojis = DEFAULT_EMOJIS,
  onOpenCustomizer,
  theme = 'dark',
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [showerMode, setShowerMode] = useState('down'); // 'down' (Top-to-Down Shower) | 'up' (Bottom-to-Up)

  const isWhite = theme === 'white';
  const isBlush = theme === 'blush';

  const handleSend = (emoji, isCelebration = false, isHeart = false, forceDown = false) => {
    sounds.playPop();

    const willShowerDown = forceDown || showerMode === 'down' || emoji === '🎉' || emoji === '🥳' || emoji === '✨';

    if (isCelebration || emoji === '🎉' || emoji === '🥳' || emoji === '🔥') {
      confetti({
        particleCount: 75,
        spread: 110,
        origin: willShowerDown ? { y: 0 } : { y: 0.9 },
        gravity: willShowerDown ? 1.2 : 0.8,
        ticks: 220,
        disableForReducedMotion: true,
      });
      sounds.playCelebration();
    } else if (isHeart || emoji === '❤️' || emoji === '🥰') {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: willShowerDown ? { y: 0 } : { y: 0.9 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#ffffff'],
        shapes: ['circle'],
        disableForReducedMotion: true,
      });
    }

    onSendEmoji(emoji, {
      isFountain: true,
      direction: willShowerDown ? 'down' : 'up',
      isCelebration: isCelebration || emoji === '🎉' || emoji === '🥳',
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customEmoji.trim()) {
      handleSend(customEmoji.trim(), true, false, showerMode === 'down');
      setCustomEmoji('');
      setShowCustom(false);
    }
  };

  // Bar background and button styles
  const barBg = isWhite
    ? 'bg-white/95 border-slate-200/90 shadow-xl'
    : isBlush
    ? 'bg-rose-100/95 border-rose-200/90 shadow-xl'
    : 'bg-slate-900/85 border-rose-500/20 shadow-xl';

  return (
    <div className="relative">
      {/* Whole-Screen Floating Reaction Shower Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className={`${
              item.direction === 'down' ? 'shower-down-item' : 'floating-emoji-item'
            } flex flex-col items-center`}
            style={{
              left: `${item.x}%`,
              ...(item.direction === 'down' ? { top: '-40px' } : { bottom: '20px' }),
              animationDelay: `${item.delay || 0}ms`,
              animationDuration: `${item.duration || 3.6}s`,
            }}
          >
            <span
              className={`${
                item.size || 'text-4xl'
              } filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] select-none transition-transform`}
            >
              {item.emoji}
            </span>
            {item.showSender && (
              <span className="text-[10px] font-medium bg-black/80 text-white/95 px-2 py-0.5 rounded-full mt-1 border border-white/15 shadow-xl backdrop-blur-md">
                {item.sender}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Quick Reaction Bar with Direction Toggle & Palette Customizer */}
      <div className={`flex items-center gap-1.5 p-2 backdrop-blur-md rounded-2xl border ${barBg}`}>
        {/* Toggle between Top-to-Down Shower vs Bottom-to-Up Float */}
        <button
          onClick={() => setShowerMode(showerMode === 'down' ? 'up' : 'down')}
          title={showerMode === 'down' ? 'Mode: Top-to-Down Shower ⬇️' : 'Mode: Bottom-to-Up Float ⬆️'}
          className={`w-7 h-7 flex items-center justify-center rounded-xl border text-xs transition ${
            showerMode === 'down'
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-500'
              : 'bg-indigo-500/20 border-indigo-400/50 text-indigo-500'
          }`}
        >
          {showerMode === 'down' ? (
            <ArrowDownCircle className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpCircle className="w-3.5 h-3.5" />
          )}
        </button>

        {/* 8 Customizable Quick Emojis */}
        {quickEmojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() =>
              handleSend(
                emoji,
                emoji === '🎉' || emoji === '🥳' || emoji === '🔥',
                emoji === '❤️' || emoji === '🥰' || emoji === '💖'
              )
            }
            title={`Send ${emoji}`}
            className={`group relative w-8 h-8 flex items-center justify-center rounded-xl active:scale-90 transition-all text-lg shadow-sm border ${
              isWhite
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                : isBlush
                ? 'bg-rose-200/60 hover:bg-rose-200 border-rose-300/40 text-rose-900'
                : 'bg-slate-800/80 hover:bg-slate-700 border-white/10 text-white'
            }`}
          >
            <span className="group-hover:scale-125 transition-transform select-none">
              {emoji}
            </span>
          </button>
        ))}

        {/* Emoji Customizer Palette Button */}
        <button
          onClick={onOpenCustomizer}
          title="Customize 8 Reaction Emojis"
          className="w-7 h-7 flex items-center justify-center rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-500 transition-all border border-amber-500/30"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {/* Type Custom Emoji Button */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          title="Type Custom Emoji"
          className="w-7 h-7 flex items-center justify-center rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 active:scale-95 text-indigo-500 transition-all border border-indigo-500/30"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Custom Emoji Input Popover */}
      {showCustom && (
        <form
          onSubmit={handleCustomSubmit}
          className={`absolute bottom-14 right-2 z-20 flex gap-2 p-2 border rounded-xl shadow-2xl backdrop-blur-xl ${
            isWhite ? 'bg-white border-slate-200' : isBlush ? 'bg-rose-50 border-rose-200' : 'bg-slate-900 border-white/20'
          }`}
        >
          <input
            type="text"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="Type emoji (e.g. 🥳)"
            maxLength={4}
            className={`w-28 px-2 py-1 text-sm rounded-lg border focus:outline-none ${
              isWhite ? 'bg-slate-100 border-slate-300 text-slate-800' : isBlush ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition"
          >
            Shower ⬇
          </button>
        </form>
      )}
    </div>
  );
}
