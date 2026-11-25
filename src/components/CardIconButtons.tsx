import React from 'react';
import { Check, Pencil } from 'lucide-react';

export const PlanetIcon: React.FC<{ className?: string }> = ({
  className = 'h-4 w-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M3.5 14.5c-1.1 1.6 1.9 3.6 7.4 2.4 5.5-1.2 10.6-4.1 9.6-6.2-.5-1-2.2-1.4-4.5-1.2" />
  </svg>
);

export type EnrichButtonState = 'idle' | 'loading' | 'success';

interface AiEnrichIconButtonProps {
  state: EnrichButtonState;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'md' | 'sm';
}

export const AiEnrichIconButton: React.FC<AiEnrichIconButtonProps> = ({
  state,
  onClick,
  title = 'Enrich with AI',
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'loading'}
      aria-label="Enrich with AI"
      title={title}
      className={`flex ${dim} items-center justify-center rounded-full border transition active:scale-90 disabled:opacity-75 ${
        state === 'success'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : state === 'loading'
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-stone-200 bg-stone-50 text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800'
      }`}
    >
      {state === 'success' ? (
        <Check className="h-4 w-4" />
      ) : (
        <PlanetIcon
          className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`}
        />
      )}
    </button>
  );
};

interface EditCardIconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'md' | 'sm';
}

export const EditCardIconButton: React.FC<EditCardIconButtonProps> = ({
  onClick,
  title = 'Edit card',
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Edit card"
      title={title}
      className={`flex ${dim} items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-800 transition hover:border-stone-300 hover:bg-stone-100 active:scale-90`}
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
};
