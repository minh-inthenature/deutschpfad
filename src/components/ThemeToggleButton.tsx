import React from 'react';
import { Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const SpiderMaskMiniIcon: React.FC<{ className?: string }> = ({
  className = 'h-4 w-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <ellipse
      cx="12"
      cy="12"
      rx="8"
      ry="9.5"
      fill="#E23636"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M11 11.5L6.5 8.5C6.2 11.5 7.8 13.8 10.6 13.2Z"
      fill="#FFFFFF"
    />
    <path
      d="M13 11.5L17.5 8.5C17.8 11.5 16.2 13.8 13.4 13.2Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isSpider = theme === 'spiderverse';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isSpider ? 'Switch to Polished theme' : 'Switch to Spider-Verse Dark theme'
      }
      title={isSpider ? 'Spider-Verse Dark (tap for Polished)' : 'Polished (tap for Spider-Verse Dark)'}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-2xs transition active:scale-90 ${
        isSpider
          ? 'border-[#3A0D11] bg-[#161618] text-[#C81D25]'
          : 'border-stone-200 bg-white text-amber-600 hover:bg-stone-50'
      }`}
    >
      {isSpider ? (
        <SpiderMaskMiniIcon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
};
