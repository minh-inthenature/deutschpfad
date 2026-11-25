import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  X,
  Search,
  Volume2,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { db, type CefrLevel, type VocabItem } from '../db/database';
import {
  formatWordWithArticle,
  getArticleStyle,
  speakGerman,
} from '../utils/german';
import { EditCardIconButton } from './CardIconButtons';
import { CardEditSheet } from './CardEditSheet';

type LearnedFilter = 'all' | 'mastered' | 'review';

interface LearnedWordsModalProps {
  open: boolean;
  initialLevel: CefrLevel;
  onClose: () => void;
  onStartLearningLevel: (level: CefrLevel) => void;
  onPracticeLevel: (level: CefrLevel) => void;
}

const LEVELS: CefrLevel[] = ['A0', 'A1', 'A2', 'B1'];

export const LearnedWordsModal: React.FC<LearnedWordsModalProps> = ({
  open,
  initialLevel,
  onClose,
  onStartLearningLevel,
  onPracticeLevel,
}) => {
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [filter, setFilter] = useState<LearnedFilter>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<VocabItem | null>(null);

  useEffect(() => {
    if (open) {
      setLevel(initialLevel);
      setFilter('all');
      setQuery('');
      setExpandedId(null);
    }
  }, [open, initialLevel]);

  const levelVocab = useLiveQuery<VocabItem[]>(
    () => (open ? db.vocab.where('level').equals(level).toArray() : []),
    [open, level],
  );

  const stats = useMemo(() => {
    const all = levelVocab ?? [];
    const learned = all.filter((v) => v.status !== 'new' || v.intervalDays > 0);
    const now = Date.now();
    const mastered = learned.filter((v) => v.status === 'mastered');
    const needsReview = learned.filter(
      (v) => v.status === 'learning' || v.nextReviewAt <= now,
    );
    return {
      total: all.length,
      learned,
      masteredCount: mastered.length,
      reviewCount: needsReview.length,
    };
  }, [levelVocab]);

  const filteredWords = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return stats.learned
      .filter((v) => {
        if (filter === 'mastered' && v.status !== 'mastered') return false;
        if (filter === 'review' && v.status !== 'learning' && v.nextReviewAt > now) {
          return false;
        }
        if (!q) return true;
        return (
          v.german.toLowerCase().includes(q) ||
          v.meaning.toLowerCase().includes(q) ||
          (v.meaningVi?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.german.localeCompare(b.german, 'de'));
  }, [stats.learned, filter, query]);

  if (!open) return null;

  const now = Date.now();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl ring-1 ring-stone-900/10 sm:rounded-3xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-stone-200 bg-white px-5 pt-3.5 pb-3.5">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-stone-300 sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-editorial text-lg font-bold text-slate-950">
                  {level} Learned Words
                </h2>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-800">
                  {stats.learned.length} / {stats.total} learned
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close learned words"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Level-Switcher Pills */}
          <div className="mt-3 grid grid-cols-4 gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
            {LEVELS.map((lvl) => {
              const active = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setLevel(lvl);
                    setExpandedId(null);
                  }}
                  className={`rounded-xl py-1.5 text-xs font-extrabold transition ${
                    active
                      ? 'bg-blue-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Search & Filter Pills */}
          {stats.learned.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${level} learned words...`}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-8 text-xs font-medium text-slate-900 placeholder:text-stone-400 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: `All Learned (${stats.learned.length})` },
                    { id: 'mastered', label: `Mastered (${stats.masteredCount})` },
                    { id: 'review', label: `Needs Review (${stats.reviewCount})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                      filter === item.id
                        ? 'border-blue-800 bg-blue-800 text-white'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Word List or Empty State */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {stats.learned.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-2xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-editorial mt-3 text-lg font-bold text-slate-950">
                No {level} words learned yet
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Start swiping through {level} cards in Learn mode to build your vocabulary bank.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartLearningLevel(level);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-800 px-5 py-3 text-xs font-extrabold text-white shadow-xs transition active:scale-95"
              >
                <BookOpen className="h-4 w-4" />
                Start Learning {level}
              </button>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center text-xs text-stone-500">
              No matching {level} words found.
            </div>
          ) : (
            filteredWords.map((item) => {
              const art = getArticleStyle(item.article);
              const isMastered = item.status === 'mastered';
              const isDue = item.nextReviewAt <= now;
              const expanded = expandedId === item.id;
              const fullWord = formatWordWithArticle(item.article, item.german);

              return (
                <div
                  key={item.id ?? item.german}
                  className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs transition"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(expanded ? null : (item.id ?? null))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(expanded ? null : (item.id ?? null));
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.article !== 'none' && (
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${art.solid}`}
                          >
                            {item.article}
                          </span>
                        )}
                        <span className="font-editorial text-base font-bold text-slate-950">
                          {item.german}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                            isMastered
                              ? 'bg-emerald-50 text-emerald-700'
                              : isDue
                                ? 'bg-red-50 text-red-700'
                                : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {isMastered ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <Clock className="h-2.5 w-2.5" />
                          )}
                          {isMastered ? 'Mastered' : isDue ? 'Due' : 'Learning'}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs font-medium text-stone-600">
                        {item.meaning}
                        {item.meaningVi ? ` · ${item.meaningVi}` : ''}
                      </p>
                      {(item.plural && item.plural !== '—') || item.verbForms ? (
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {item.partOfSpeech === 'verb' && item.verbForms
                            ? item.verbForms
                            : `Plural: ${item.plural}`}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void speakGerman(fullWord);
                        }}
                        aria-label={`Pronounce ${item.german}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-800 active:scale-90"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                      <EditCardIconButton
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCard(item);
                        }}
                      />
                    </div>
                  </div>

                  {expanded && item.exampleDe && (
                    <div className="mt-2.5 rounded-xl border border-stone-200/80 bg-stone-50 p-2.5 text-xs">
                      <p className="font-semibold text-slate-900">{item.exampleDe}</p>
                      <p className="mt-0.5 text-[11px] text-stone-500">{item.exampleEn}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Practice These CTA */}
        {stats.learned.length > 0 && (
          <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onPracticeLevel(level);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-800 py-3 text-xs font-extrabold text-white shadow-xs transition active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Practice These ({level})
            </button>
          </div>
        )}
      </div>

      <CardEditSheet
        open={Boolean(editingCard)}
        card={editingCard}
        onClose={() => setEditingCard(null)}
      />
    </div>
  );
};
