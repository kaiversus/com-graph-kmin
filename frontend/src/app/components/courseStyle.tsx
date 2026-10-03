import type { CSSProperties } from 'react';

export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

// Kmin palette — one color per course level. "hex" is the solid fill used for
// small marks (pills, strips, bars). "gradient" pairs the level color with an
// adjacent hue for large surfaces (purple→pink, blue→cyan, orange→yellow).
// "on" is the text/icon color that stays readable on top of that level's fill.
export const LEVEL_META: Record<Level, { hex: string; gradient: [string, string]; on: string }> = {
  Beginner: { hex: '#238ec3', gradient: ['#238ec3', '#22d3ee'], on: '#ffffff' },
  Intermediate: { hex: '#fcbf16d6', gradient: ['#f97316', '#fcbf16'], on: '#3d2c00' },
  Advanced: { hex: '#e05992', gradient: ['#e05992', '#fb7185'], on: '#ffffff' }
};

// Level fill for surfaces, strips, progress bars and primary buttons. Stops are
// fully opaque (the translucent yellow turns muddy over the dark-mode navy) and
// interpolated in oklab like Tailwind's gradients, which keeps the midpoint vivid.
// The solid backgroundColor is the fallback for browsers that reject "in oklab".
export function levelFill(level: Level, direction = 'to bottom right'): CSSProperties {
  const { hex, gradient: [from, to] } = LEVEL_META[level];
  return {
    backgroundColor: hex,
    backgroundImage: `linear-gradient(${direction} in oklab, ${from}, ${to})`
  };
}

export const BRAND_HEX = '#1e3e4e';

// The navy brand color disappears on the dark-mode navy background, so text,
// icons and bars get a lighter shade of the same hue there.
export const BRAND_INK_CLS = 'text-[#1e3e4e] dark:text-[#9ccbdd]';
export const BRAND_BAR_CLS = 'bg-[#1e3e4e]/55 dark:bg-[#9ccbdd]/60';

// Softer muted fill for chips/panels inside cards. Lighter than the theme's
// solid --muted in light mode; a faint white overlay in dark mode so text
// nested on top of it stays readable against the dark background.
export const MUTED_TINT_CLS = 'bg-[#ececf040] dark:bg-white/8';

// Same fill, but for actual <button> elements — kept a shade darker than
// MUTED_TINT_CLS so buttons read as tappable surfaces against the lighter panels.
export const MUTED_TINT_BTN_CLS = 'bg-[#ececf07a] dark:bg-white/8';

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LevelPill({ difficulty }: { difficulty: string }) {
  const level = LEVEL_META[difficulty as Level];
  return (
    <span
      className="inline-flex items-center text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
      style={{ backgroundColor: level.hex, color: level.on }}
    >
      {difficulty}
    </span>
  );
}
