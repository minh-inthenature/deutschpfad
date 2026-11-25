import React, { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  Layers,
  Tag,
  Keyboard,
  Trophy,
  Sparkles,
  BookA,
  Zap,
  Puzzle,
  AlertCircle,
  Headphones,
} from 'lucide-react';
import {
  computeSm2Update,
  db,
  logMistake,
  recordMistakeCorrect,
  recordStudyActivity,
  type CefrLevel,
  type GermanArticle,
  type ReviewRating,
  type VocabItem,
} from '../db/database';
import {
  CEFR_ORDER,
  formatWordWithArticle,
  getArticleStyle,
  getLevelStyle,
  speakGerman,
} from '../utils/german';
import { ArticlePluralDrill } from '../components/drills/ArticlePluralDrill';
import { CaseBlitzDrill } from '../components/drills/CaseBlitzDrill';
import { SentenceBuilderDrill } from '../components/drills/SentenceBuilderDrill';
import { InlineMistakeNote } from '../components/InlineMistakeNote';
import { ListeningPractice } from '../components/ListeningPractice';
import {
  AiEnrichIconButton,
  EditCardIconButton,
  type EnrichButtonState,
} from '../components/CardIconButtons';
import { CardEditSheet } from '../components/CardEditSheet';
import { enrichVocabCard } from '../services/cardEnrichService';

type DrillMode =
  | 'flip'
  | 'article'
  | 'spell'
  | 'article-plural'
  | 'case-blitz'
  | 'satzbau'
  | 'listening';

interface VocabCheckViewProps {
  activeMistakesCount: number;
  onOpenMistakes: () => void;
  initialLevel?: CefrLevel | null;
  onClearInitialLevel?: () => void;
}

const UMLAUT_BAR = ['ä', 'ö', 'ü', 'ß'] as const;

function formatIntervalLabel(days: number): string {
  if (days <= 0) return '10 min';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export const VocabCheckView: React.FC<VocabCheckViewProps> = ({
  activeMistakesCount,
  onOpenMistakes,
  initialLevel,
  onClearInitialLevel,
}) => {
  const vocab = useLiveQuery(() => db.vocab.toArray(), []);
  const [mode, setMode] = useState<DrillMode>('flip');
  const [levelFilter, setLevelFilter] = useState<'ALL' | CefrLevel>(
    initialLevel ?? 'ALL',
  );

  React.useEffect(() => {
    if (!initialLevel) return;
    setLevelFilter(initialLevel);
    setPinnedIds(null);
    setIndex(0);
    onClearInitialLevel?.();
  }, [initialLevel, onClearInitialLevel]);

  // Pin active batch IDs so live Dexie updates don't cause cards to jump mid-session
  const [pinnedIds, setPinnedIds] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);
  const [sessionReviews, setSessionReviews] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  // Recall Flip state
  const [flipped, setFlipped] = useState(false);
  const [lastAgainMistake, setLastAgainMistake] = useState<{
    id: number;
    label: string;
  } | null>(null);

  // Article Tap state
  const [articlePick, setArticlePick] = useState<GermanArticle | null>(null);
  const [articleMistakeId, setArticleMistakeId] = useState<number | null>(null);

  // Type & Spell state
  const [spellInput, setSpellInput] = useState('');
  const [spellResult, setSpellResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [spellMistakeId, setSpellMistakeId] = useState<number | null>(null);
  const spellInputRef = useRef<HTMLInputElement | null>(null);

  const [editingCard, setEditingCard] = useState<VocabItem | null>(null);
  const [enrichStates, setEnrichStates] = useState<Record<number, EnrichButtonState>>({});
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const now = Date.now();

  const dueInfo = useMemo(() => {
    const all = (vocab ?? [])
      .filter((v) => levelFilter === 'ALL' || v.level === levelFilter)
      .sort((a, b) => CEFR_ORDER[a.level] - CEFR_ORDER[b.level] || (a.id ?? 0) - (b.id ?? 0));
    const due = all
      .filter((v) => v.status !== 'new' && v.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt || CEFR_ORDER[a.level] - CEFR_ORDER[b.level]);

    if (mode === 'article') {
      const dueNouns = due.filter((v) => v.article !== 'none');
      if (dueNouns.length > 0) return { items: dueNouns, isFallback: false };
      const fallbackNouns = all.filter((v) => v.article !== 'none').slice(0, 12);
      return { items: fallbackNouns, isFallback: true };
    }

    if (due.length > 0) return { items: due, isFallback: false };
    const learningPool = all.filter((v) => v.status === 'learning').slice(0, 10);
    if (learningPool.length > 0) return { items: learningPool, isFallback: true };
    return { items: all.slice(0, 10), isFallback: true };
  }, [vocab, mode, levelFilter, now]);

  const activeDeck = useMemo(() => {
    if (!vocab) return [];
    if (pinnedIds) {
      const byId = new Map(vocab.map((v) => [v.id!, v]));
      return pinnedIds.map((id) => byId.get(id)).filter((x): x is VocabItem => Boolean(x));
    }
    return dueInfo.items;
  }, [vocab, pinnedIds, dueInfo.items]);

  const currentCard: VocabItem | undefined = activeDeck[index];

  const resetPerCardState = () => {
    setFlipped(false);
    setArticlePick(null);
    setArticleMistakeId(null);
    setSpellInput('');
    setSpellResult('idle');
    setSpellMistakeId(null);
  };

  const switchMode = (nextMode: DrillMode) => {
    setMode(nextMode);
    setPinnedIds(null);
    setIndex(0);
    setSessionReviews(0);
    setSessionCorrect(0);
    resetPerCardState();
  };

  const restartBatch = () => {
    setPinnedIds(null);
    setIndex(0);
    setSessionReviews(0);
    setSessionCorrect(0);
    resetPerCardState();
  };

  const ensurePinned = () => {
    if (!pinnedIds) {
      setPinnedIds(activeDeck.map((v) => v.id!).filter(Boolean));
    }
  };

  const advanceCard = () => {
    setIndex((i) => i + 1);
    resetPerCardState();
  };

  // Mode 1: Recall Flip SM-2 rating
  const handleFlipRate = async (rating: ReviewRating) => {
    if (!currentCard?.id) return;
    ensurePinned();
    const wasNew = currentCard.status === 'new';
    const sm2 = computeSm2Update(currentCard, rating);
    const itemTitle = formatWordWithArticle(currentCard.article, currentCard.german);

    await db.vocab.update(currentCard.id, sm2);
    if (rating === 'again') {
      const mId = await logMistake({
        vocabId: currentCard.id,
        itemTitle,
        mistakeType: 'Spelling',
        lastWrongAnswer: 'Again (forgot)',
        correctAnswer: `${itemTitle} — ${currentCard.meaning}`,
      });
      setLastAgainMistake({ id: mId, label: itemTitle });
    } else {
      setLastAgainMistake(null);
      if (rating === 'good' || rating === 'easy') {
        await recordMistakeCorrect({
          vocabId: currentCard.id,
          itemTitle,
          mistakeType: 'Spelling',
        });
      }
    }

    await recordStudyActivity({
      reviewsCompleted: 1,
      wordsLearned: wasNew ? 1 : 0,
      minutesStudied: (sessionReviews + 1) % 4 === 0 ? 1 : 0,
    });

    setSessionReviews((n) => n + 1);
    if (rating !== 'again') setSessionCorrect((n) => n + 1);
    advanceCard();
  };

  // Mode 2: Article Tap
  const handleArticleTap = async (chosen: GermanArticle) => {
    if (!currentCard?.id || articlePick !== null) return;
    ensurePinned();
    setArticlePick(chosen);

    const isCorrect = chosen === currentCard.article;
    const wasNew = currentCard.status === 'new';
    const sm2 = computeSm2Update(currentCard, isCorrect ? 'good' : 'again');
    const itemTitle = formatWordWithArticle(currentCard.article, currentCard.german);

    await db.vocab.update(currentCard.id, sm2);
    if (isCorrect) {
      await recordMistakeCorrect({
        vocabId: currentCard.id,
        itemTitle,
        mistakeType: 'Article',
      });
    } else {
      const mId = await logMistake({
        vocabId: currentCard.id,
        itemTitle,
        mistakeType: 'Article',
        lastWrongAnswer: chosen,
        correctAnswer: currentCard.article,
      });
      setArticleMistakeId(mId);
    }

    await recordStudyActivity({
      reviewsCompleted: 1,
      wordsLearned: wasNew ? 1 : 0,
      minutesStudied: (sessionReviews + 1) % 6 === 0 ? 1 : 0,
    });

    setSessionReviews((n) => n + 1);
    if (isCorrect) setSessionCorrect((n) => n + 1);
  };

  // Mode 3: Type & Spell
  const insertUmlaut = (char: string) => {
    const input = spellInputRef.current;
    if (!input) {
      setSpellInput((prev) => prev + char);
      return;
    }
    const start = input.selectionStart ?? spellInput.length;
    const end = input.selectionEnd ?? spellInput.length;
    const next = spellInput.slice(0, start) + char + spellInput.slice(end);
    setSpellInput(next);
    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    });
  };

  const handleCheckSpelling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard?.id || spellResult !== 'idle' || !spellInput.trim()) return;
    ensurePinned();

    const cleaned = spellInput.trim().toLowerCase();
    const targetBare = currentCard.german.trim().toLowerCase();
    const targetFull = formatWordWithArticle(currentCard.article, currentCard.german)
      .trim()
      .toLowerCase();
    const isCorrect = cleaned === targetBare || cleaned === targetFull;

    setSpellResult(isCorrect ? 'correct' : 'wrong');

    const wasNew = currentCard.status === 'new';
    const sm2 = computeSm2Update(currentCard, isCorrect ? 'good' : 'again');
    const itemTitle = formatWordWithArticle(currentCard.article, currentCard.german);
    await db.vocab.update(currentCard.id, sm2);

    if (isCorrect) {
      await recordMistakeCorrect({
        vocabId: currentCard.id,
        itemTitle,
        mistakeType: 'Spelling',
      });
    } else {
      const mId = await logMistake({
        vocabId: currentCard.id,
        itemTitle,
        mistakeType: 'Spelling',
        lastWrongAnswer: spellInput.trim(),
        correctAnswer: itemTitle,
      });
      setSpellMistakeId(mId);
    }

    await recordStudyActivity({
      reviewsCompleted: 1,
      wordsLearned: wasNew ? 1 : 0,
      minutesStudied: (sessionReviews + 1) % 5 === 0 ? 1 : 0,
    });

    setSessionReviews((n) => n + 1);
    if (isCorrect) setSessionCorrect((n) => n + 1);
  };

  const progressPct =
    activeDeck.length > 0 ? Math.min(100, (index / activeDeck.length) * 100) : 0;

  const isCoreVocabMode = mode === 'flip' || mode === 'article' || mode === 'spell';

  return (
    <div className="flex flex-col px-4 pt-4 pb-6">
      <header className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h1 className="font-editorial text-2xl font-bold tracking-tight text-slate-950">
            Test
          </h1>
          <p className="text-xs text-stone-500">
            SRS recall drills &amp; active German fluency trainers
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenMistakes}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-extrabold text-red-800 shadow-2xs transition active:scale-95"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Mistakes
          {activeMistakesCount > 0 && (
            <span className="rounded-full bg-red-700 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              {activeMistakesCount}
            </span>
          )}
        </button>
      </header>

      {/* Mode Selector: Row 1 Core Drills · Row 2 Active Fluency */}
      <div className="mb-4 space-y-1.5">
        <div className="sv-drill-track grid grid-cols-3 gap-1 rounded-2xl border border-stone-200 bg-stone-100/90 p-1">
          {(
            [
              { id: 'flip', label: 'Recall Flip', icon: Layers },
              { id: 'article', label: 'Article Tap', icon: Tag },
              { id: 'spell', label: 'Type & Spell', icon: Keyboard },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                data-active={active ? 'true' : 'false'}
                className={`sv-drill-tab flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition ${
                  active
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="sv-fluency-track grid grid-cols-2 gap-1 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-1 sm:grid-cols-4">
          {(
            [
              { id: 'article-plural', label: 'Artikel & Plural', icon: BookA },
              { id: 'case-blitz', label: 'Fall-Training', icon: Zap },
              { id: 'satzbau', label: 'Satzbau', icon: Puzzle },
              { id: 'listening', label: 'Hörverstehen', icon: Headphones },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                data-active={active ? 'true' : 'false'}
                className={`sv-fluency-tab flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition ${
                  active
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-blue-900/80 hover:text-blue-950'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== ACTIVE FLUENCY MODES ==================== */}
      {mode === 'article-plural' && <ArticlePluralDrill />}
      {mode === 'case-blitz' && <CaseBlitzDrill />}
      {mode === 'satzbau' && <SentenceBuilderDrill />}
      {mode === 'listening' && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {(['ALL', 'A0', 'A1', 'A2', 'B1'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  levelFilter === lvl
                    ? 'bg-slate-950 text-white'
                    : 'border border-stone-200 bg-white text-slate-700'
                }`}
              >
                {lvl === 'ALL' ? 'All' : lvl}
              </button>
            ))}
          </div>
          <ListeningPractice levelFilter={levelFilter} />
        </div>
      )}

      {/* Level Filter for Core Test modes (A0 -> B1) */}
      {isCoreVocabMode && (
        <div className="mb-3 flex items-center gap-1">
          {(['ALL', 'A0', 'A1', 'A2', 'B1'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setLevelFilter(lvl);
                setPinnedIds(null);
                setIndex(0);
                resetPerCardState();
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                levelFilter === lvl
                  ? 'bg-slate-950 text-white'
                  : 'border border-stone-200 bg-white text-slate-700'
              }`}
            >
              {lvl === 'ALL' ? 'All' : lvl}
            </button>
          ))}
        </div>
      )}

      {/* Progress Strip (Core SRS modes only) */}
      {isCoreVocabMode && currentCard && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
            <span>
              Card {index + 1} of {activeDeck.length}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-800">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {sessionCorrect}/{sessionReviews} right
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ==================== MODE 1: RECALL FLIP ==================== */}
      {mode === 'flip' && lastAgainMistake && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-900">
          <div>✗ Marked Again: {lastAgainMistake.label}</div>
          <InlineMistakeNote mistakeId={lastAgainMistake.id} />
        </div>
      )}
      {mode === 'flip' && currentCard && (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
            className="cursor-pointer rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span
                className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(currentCard.level)}`}
              >
                {currentCard.level} · {currentCard.topic}
              </span>
              <div className="flex items-center gap-1.5">
                <AiEnrichIconButton
                  state={currentCard.id ? (enrichStates[currentCard.id] ?? 'idle') : 'idle'}
                  onClick={(e) => {
                    e.stopPropagation();
                    const cid = currentCard.id;
                    if (!cid) return;
                    setEnrichError(null);
                    setEnrichStates((prev) => ({ ...prev, [cid]: 'loading' }));
                    void enrichVocabCard(currentCard, { forceRefresh: Boolean(currentCard.enriched) })
                      .then(() => {
                        setEnrichStates((prev) => ({ ...prev, [cid]: 'success' }));
                        setTimeout(() => {
                          setEnrichStates((prev) => ({ ...prev, [cid]: 'idle' }));
                        }, 1200);
                      })
                      .catch((err) => {
                        setEnrichStates((prev) => ({ ...prev, [cid]: 'idle' }));
                        setEnrichError(
                          err instanceof Error ? err.message : 'AI enrichment failed.',
                        );
                      });
                  }}
                />
                <EditCardIconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCard(currentCard);
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void speakGerman(formatWordWithArticle(currentCard.article, currentCard.german));
                  }}
                  aria-label="Pronounce word"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {enrichError && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-800">
                {enrichError}
              </p>
            )}

            {!flipped ? (
              <div className="my-10 text-center">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                  Tap card to reveal
                </p>
                <h2 className="font-editorial mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {currentCard.article === 'none'
                    ? currentCard.german
                    : `___ ${currentCard.german}`}
                </h2>
                <p className="mt-3 text-xs font-medium text-stone-400">
                  Recall the article, plural &amp; English meaning
                </p>
              </div>
            ) : (
              <div className="my-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  {currentCard.article !== 'none' && (
                    <span
                      className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${getArticleStyle(currentCard.article).solid}`}
                    >
                      {currentCard.article}
                    </span>
                  )}
                  <h2 className="font-editorial text-3xl font-bold text-slate-950">
                    {currentCard.german}
                  </h2>
                </div>
                {currentCard.plural && currentCard.plural !== '—' && (
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    Plural: {currentCard.plural}
                  </p>
                )}
                <p className="mt-3 text-xl font-bold text-blue-800">{currentCard.meaning}</p>
                {currentCard.meaningVi && (
                  <p className="mt-1 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-800">
                    {currentCard.meaningVi}
                  </p>
                )}

                <div className="mt-5 rounded-2xl border border-stone-200/80 bg-stone-50 p-3.5 text-left">
                  <p className="text-sm font-semibold text-slate-900">{currentCard.exampleDe}</p>
                  <p className="mt-1 text-xs text-stone-500">{currentCard.exampleEn}</p>
                </div>
              </div>
            )}
          </div>

          {!flipped ? (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              Reveal Answer
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-[11px] font-semibold text-stone-500">
                Rate recall to schedule next SM-2 review
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    {
                      rating: 'again',
                      label: 'Again',
                      cls: 'border-red-300 bg-red-50 text-red-800',
                    },
                    {
                      rating: 'hard',
                      label: 'Hard',
                      cls: 'border-amber-300 bg-amber-50 text-amber-900',
                    },
                    {
                      rating: 'good',
                      label: 'Good',
                      cls: 'border-emerald-300 bg-emerald-50 text-emerald-800',
                    },
                    {
                      rating: 'easy',
                      label: 'Easy',
                      cls: 'border-blue-300 bg-blue-50 text-blue-800',
                    },
                  ] as const
                ).map(({ rating, label, cls }) => {
                  const preview = computeSm2Update(currentCard, rating);
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => void handleFlipRate(rating)}
                      className={`flex min-h-[64px] flex-col items-center justify-center rounded-2xl border px-1 py-2.5 text-center transition active:scale-95 ${cls}`}
                    >
                      <span className="text-xs font-extrabold">{label}</span>
                      <span className="mt-0.5 text-[10px] font-semibold opacity-80">
                        {formatIntervalLabel(preview.intervalDays)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE 2: ARTICLE TAP ==================== */}
      {mode === 'article' && currentCard && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(currentCard.level)}`}
              >
                {currentCard.level} · {currentCard.topic}
              </span>
              <button
                type="button"
                onClick={() =>
                  void speakGerman(formatWordWithArticle(currentCard.article, currentCard.german))
                }
                aria-label="Pronounce noun"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            <div className="my-7">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                Tap the Gender Article
              </p>
              <h2 className="font-editorial mt-2 text-3xl font-bold text-slate-950">
                {currentCard.german}
              </h2>
              <p className="mt-1.5 text-sm font-semibold text-stone-500">{currentCard.meaning}</p>
            </div>

            {articlePick !== null && (
              <div
                className={`mb-5 rounded-2xl border p-3 text-sm font-bold ${
                  articlePick === currentCard.article
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {articlePick === currentCard.article ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Richtig! {currentCard.article} {currentCard.german}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Correct: <strong>{currentCard.article}</strong> {currentCard.german}
                  </span>
                )}
                {articlePick !== currentCard.article && (
                  <InlineMistakeNote mistakeId={articleMistakeId} />
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  {
                    art: 'der',
                    label: 'der',
                    sub: 'masc.',
                    cls: 'border-blue-300 bg-blue-700 text-white',
                  },
                  {
                    art: 'die',
                    label: 'die',
                    sub: 'fem.',
                    cls: 'border-red-300 bg-red-700 text-white',
                  },
                  {
                    art: 'das',
                    label: 'das',
                    sub: 'neut.',
                    cls: 'border-emerald-300 bg-emerald-700 text-white',
                  },
                ] as const
              ).map(({ art, label, sub, cls }) => (
                <button
                  key={art}
                  type="button"
                  disabled={articlePick !== null}
                  onClick={() => void handleArticleTap(art)}
                  className={`flex flex-col items-center justify-center rounded-2xl border py-4 shadow-xs transition active:scale-95 disabled:opacity-55 ${cls}`}
                >
                  <span className="text-lg font-extrabold leading-none">{label}</span>
                  <span className="mt-1 text-[10px] font-semibold opacity-85">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {articlePick !== null && (
            <button
              type="button"
              onClick={advanceCard}
              className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              Next Noun
            </button>
          )}
        </div>
      )}

      {/* ==================== MODE 3: TYPE & SPELL ==================== */}
      {mode === 'spell' && currentCard && (
        <form onSubmit={(e) => void handleCheckSpelling(e)} className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(currentCard.level)}`}
              >
                {currentCard.level} · {currentCard.topic}
              </span>
              {currentCard.article !== 'none' && (
                <span
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${getArticleStyle(currentCard.article).solid}`}
                >
                  {currentCard.article}
                </span>
              )}
            </div>

            <div className="my-5 text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
                Type the German Word
              </p>
              <h2 className="font-editorial mt-2 text-2xl font-bold text-slate-950">
                {currentCard.meaning}
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                {currentCard.article !== 'none'
                  ? `Noun (${currentCard.article} ___)`
                  : 'Verb / Adjective'}
              </p>
            </div>

            {/* Custom on-screen quick-bar for ä, ö, ü, ß right above input */}
            <div className="mb-2 grid grid-cols-4 gap-2">
              {UMLAUT_BAR.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  disabled={spellResult !== 'idle'}
                  onClick={() => insertUmlaut(ch)}
                  className="flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-base font-extrabold text-slate-900 shadow-2xs transition active:scale-95 disabled:opacity-45"
                >
                  {ch}
                </button>
              ))}
            </div>

            <input
              ref={spellInputRef}
              type="text"
              disabled={spellResult !== 'idle'}
              value={spellInput}
              onChange={(e) => setSpellInput(e.target.value)}
              placeholder={
                currentCard.article !== 'none'
                  ? `e.g. ${currentCard.german.slice(0, 1)}...`
                  : 'Type German spelling...'
              }
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-3.5 text-center text-lg font-bold text-slate-950 placeholder:text-stone-400 focus:border-blue-700 focus:bg-white focus:outline-none disabled:opacity-75"
            />

            {spellResult !== 'idle' && (
              <div
                className={`mt-4 rounded-2xl border p-3.5 text-sm font-bold ${
                  spellResult === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {spellResult === 'correct' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                    )}
                    <span>
                      {spellResult === 'correct'
                        ? 'Perfekt!'
                        : `Answer: ${formatWordWithArticle(currentCard.article, currentCard.german)}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void speakGerman(formatWordWithArticle(currentCard.article, currentCard.german))
                    }
                    aria-label="Listen to answer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-2xs"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                {spellResult === 'wrong' && <InlineMistakeNote mistakeId={spellMistakeId} />}
              </div>
            )}
          </div>

          {spellResult === 'idle' ? (
            <button
              type="submit"
              disabled={!spellInput.trim()}
              className="w-full rounded-2xl bg-blue-700 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
            >
              Check Spelling
            </button>
          ) : (
            <button
              type="button"
              onClick={advanceCard}
              className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              Next Word
            </button>
          )}
        </form>
      )}

      {/* ==================== SESSION COMPLETE ==================== */}
      {isCoreVocabMode && !currentCard && (
        <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Trophy className="h-7 w-7" />
          </div>
          <h2 className="font-editorial mt-4 text-xl font-bold text-slate-950">
            {sessionReviews > 0 ? 'Drill Complete!' : 'No Due Cards Right Now'}
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            {sessionReviews > 0
              ? `You completed ${sessionReviews} review${sessionReviews === 1 ? '' : 's'} with ${Math.round((sessionCorrect / sessionReviews) * 100)}% accuracy.`
              : 'All scheduled cards are up to date.'}
          </p>
          <button
            type="button"
            onClick={restartBatch}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xs transition active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Start Another Round
          </button>
        </div>
      )}

      <CardEditSheet
        open={Boolean(editingCard)}
        card={editingCard}
        onClose={() => setEditingCard(null)}
      />
    </div>
  );
};
