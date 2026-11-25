import React from 'react';
import { Volume2, X } from 'lucide-react';
import type { VocabItem } from '../db/database';
import { formatWordWithArticle, speakGerman } from '../utils/german';
import { useTheme } from '../context/ThemeContext';

interface SpiderVerseToastProps {
  word: VocabItem | null;
  onDismiss: () => void;
  onDrill: (word: VocabItem) => void;
}

const SpiderMaskEmblem: React.FC = () => (
  <svg
    viewBox="0 0 80 90"
    className="h-14 w-14 shrink-0"
    aria-hidden="true"
  >
    <ellipse
      cx="40"
      cy="46"
      rx="26"
      ry="33"
      fill="#111113"
      stroke="#C81D25"
      strokeWidth="3.5"
    />
    <path
      d="M40 13V79M15 46H65M22 23L58 69M58 23L22 69"
      stroke="#3A080C"
      strokeWidth="1.5"
      opacity="0.7"
    />
    <path
      d="M36 44L19 32C17 44 24 53 35 51Z"
      fill="#FFFFFF"
      stroke="#050505"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M44 44L61 32C63 44 56 53 45 51Z"
      fill="#FFFFFF"
      stroke="#050505"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const SpiderVerseToast: React.FC<SpiderVerseToastProps> = ({
  word,
  onDismiss,
  onDrill,
}) => {
  const { theme } = useTheme();
  if (!word) return null;

  const fullWord = formatWordWithArticle(word.article, word.german);
  const meaningText = word.meaningVi
    ? `${word.meaning} · ${word.meaningVi}`
    : word.meaning;

  if (theme === 'polished') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md px-1 pt-safe"
      >
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xl ring-1 ring-stone-900/5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
                Learn List Reminder
              </p>
              <p className="mt-0.5 font-editorial text-xl font-bold text-slate-950">
                {fullWord}
              </p>
              <p className="mt-0.5 text-xs font-medium text-stone-600">
                {meaningText}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void speakGerman(fullWord)}
              aria-label="Pronounce word"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-800 active:scale-90"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDrill(word)}
              className="rounded-xl bg-blue-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
            >
              DRILL -&gt;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md px-1 pt-safe"
    >
      {/* Double RGB chromatic aberration offset shadow layer */}
      <div className="spiderverse-enter relative">
        <div
          aria-hidden="true"
          className="spiderverse-panel-clip pointer-events-none absolute inset-0 translate-x-[-3px] translate-y-[3px] bg-[#9E141E]"
        />

        {/* Main skewed hand-inked matte pitch-black & crimson comic panel */}
        <div
          style={{ backgroundColor: '#111113' }}
          className="spiderverse-panel-clip relative overflow-hidden border-[2.5px] border-[#2E0B0E] p-3.5 text-[#F5F5F5]"
        >
          {/* Top-left tilted crimson comic caption box + close button */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div
              style={{
                transform: 'rotate(-1.5deg)',
                fontFamily: "'Bangers', 'Impact', 'Arial Black', sans-serif",
              }}
              className="inline-block border border-[#C81D25] bg-[#9E141E] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white uppercase"
            >
              MEANWHILE IN YOUR LEARN LIST...
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#3A0D11] bg-[#161618] text-[#F5F5F5] transition hover:bg-[#9E141E] active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Left Comic Badge */}
            <div className="relative flex shrink-0 flex-col items-center pr-2">
              <SpiderMaskEmblem />
              <span
                style={{
                  fontFamily: "'Bangers', 'Impact', 'Arial Black', sans-serif",
                }}
                className="mt-0.5 -rotate-3 text-[10px] font-black tracking-wider text-[#EF4444]"
              >
                ⚡ THWIP!
              </span>
            </div>

            {/* Subtle Crimson Slash Divider */}
            <div
              aria-hidden="true"
              className="h-16 w-[2px] shrink-0 rotate-[12deg] bg-[#9E141E]"
            />

            {/* Right Vocabulary Content */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-editorial text-2xl font-bold tracking-tight text-[#F5F5F5]">
                {fullWord}
              </p>
              <p className="mt-0.5 truncate text-xs font-medium text-[#A1A1AA]">
                {meaningText}
              </p>

              {/* Minimal Controls: Icon-only speaker + sharp DRILL -> button */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void speakGerman(fullWord)}
                  aria-label="Pronounce word"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3A0D11] bg-[#161618] text-[#F5F5F5] transition active:scale-90"
                >
                  <Volume2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDrill(word)}
                  className="border border-[#C81D25] bg-[#9E141E] px-3 py-1 text-xs font-extrabold tracking-wider text-white uppercase transition hover:bg-[#C81D25] active:scale-95"
                >
                  DRILL -&gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
