import React from 'react';

/**
 * Celebration Emoji Mascot for Amigo 🎉✨
 */
export default function CabbageLogo({
  size = 44,
  className = '',
  animated = false,
  showBadge = false,
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        animated ? 'hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title="Amigo Celebration 🎉"
    >
      <span
        className="leading-none select-none filter drop-shadow-sm transition-transform duration-200 flex items-center justify-center"
        style={{ fontSize: `${Math.round(size * 0.82)}px`, width: size, height: size }}
        role="img"
        aria-label="Celebration Emoji"
      >
        🎉
      </span>

      {/* Optional online / active dot badge */}
      {showBadge && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow" />
      )}
    </div>
  );
}

// Also export as CelebrationLogo for clean code semantics
export { CabbageLogo as CelebrationLogo };
