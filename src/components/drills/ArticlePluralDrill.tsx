import React, { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Trophy,
  Sparkles,
  ListChecks,
  Keyboard,
} from 'lucide-react';
import {
  computeSm2Update,
  db,
  logMistake,
  recordMistakeCorrect,
  recordStudyActivity,
  type GermanArticle,
  type VocabItem,
} from '../../db/database';
import {
  CEFR_ORDER,
  formatWordWithArticle,
  getArticleStyle,
  getLevelStyle,
  speakGerman,
} from '../../utils/german';
import { computePluralDiff, generatePluralChoices } from '../../utils/sentenceValidator';
import { InlineMistakeNote } from '../InlineMistakeNote';

const UMLAUT_KEYS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'] as const;

export const ArticlePluralDrill: React.FC = () => {
  const vocab = useLiveQuery(() => db.vocab.toArray(), []);
  const activeArticleMistakes = useLiveQuery(
    () =>
      db.mistakeLogs
        .where('status')
        .equals('active')
        .filter((m) => m.mistakeType === 'Article' || m.mistakeType === 'Both')
        .toArray(),
    [],
  );

  const [pinnedIds, setPinnedIds] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [pluralInputMode, setPluralInputMode] = useState<'type' | 'mcq'>('type');

  // Step 1 state
  const [pickedArticle, setPickedArticle] = useState<GermanArticle | null>(null);
  const [step1Correct, setStep1Correct] = useState(false);
  const [step1MistakeId, setStep1MistakeId] = useState<number | null>(null);

  // Step 2 state
  const [pluralTyped, setPluralTyped] = useState('');
  const [pluralPickedMcq, setPluralPickedMcq] = useState<string | null>(null);
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [step2Correct, setStep2Correct] = useState(false);
  const [step2MistakeId, setStep2MistakeId] = useState<number | null>(null);

  const [stats, setStats] = useState({ done: 0, perfect: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const nounPool = useMemo(() => {
    const priorityIds = new Set(
      (activeArticleMistakes ?? [])
        .map((m) => m.vocabId)
        .filter((id): id is number => id !== null),
    );
    const prioritize = (items: VocabItem[]) =>
      priorityIds.size === 0
        ? items
        : [
            ...items.filter((v) => v.id !== undefined && priorityIds.has(v.id)),
            ...items.filter((v) => v.id === undefined || !priorityIds.has(v.id)),
          ];

    const all = (vocab ?? [])
      .filter((v) => v.article !== 'none' && v.plural && v.plural !== '—')
      .sort((a, b) => CEFR_ORDER[a.level] - CEFR_ORDER[b.level] || (a.id ?? 0) - (b.id ?? 0));
    const now = Date.now();
    const due = all
      .filter((v) => v.status !== 'new' && v.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
    if (due.length > 0) return prioritize(due).slice(0, 12);
    const learning = all.filter((v) => v.status === 'learning');
    if (learning.length >= 5) return prioritize(learning).slice(0, 12);
    return prioritize(all).slice(0, 12);
  }, [vocab, activeArticleMistakes]);

  const deck = useMemo(() => {
    if (!vocab) return [];
    if (pinnedIds) {
      const map = new Map(vocab.map((v) => [v.id!, v]));
      return pinnedIds.map((id) => map.get(id)).filter((x): x is VocabItem => Boolean(x));
    }
    return nounPool;
  }, [vocab, pinnedIds, nounPool]);

  const card: VocabItem | undefined = deck[index];

  const mcqOptions = useMemo(() => {
    if (!card) return [];
    return generatePluralChoices(card);
  }, [card]);

  const diff = useMemo(() => {
    if (!card) return null;
    return computePluralDiff(card.german, card.plural);
  }, [card]);

  const resetCardState = () => {
    setStep(1);
    setPickedArticle(null);
    setStep1Correct(false);
    setStep1MistakeId(null);
    setPluralTyped('');
    setPluralPickedMcq(null);
    setStep2Submitted(false);
    setStep2Correct(false);
    setStep2MistakeId(null);
  };

  const handleStep1Tap = async (art: GermanArticle) => {
    if (!card || pickedArticle !== null) return;
    if (!pinnedIds) {
      setPinnedIds(deck.map((d) => d.id!).filter(Boolean));
    }
    const isRight = art === card.article;
    setPickedArticle(art);
    setStep1Correct(isRight);

    const itemTitle = formatWordWithArticle(card.article, card.german);
    if (isRight) {
      await recordMistakeCorrect({
        vocabId: card.id ?? null,
        itemTitle,
        mistakeType: 'Article',
      });
    } else {
      const mId = await logMistake({
        vocabId: card.id ?? null,
        itemTitle,
        mistakeType: 'Article',
        lastWrongAnswer: art,
        correctAnswer: card.article,
      });
      setStep1MistakeId(mId);
    }

    window.setTimeout(() => {
      setStep(2);
    }, isRight ? 380 : 650);
  };

  const insertUmlaut = (ch: string) => {
    const el = inputRef.current;
    if (!el) {
      setPluralTyped((p) => p + ch);
      return;
    }
    const start = el.selectionStart ?? pluralTyped.length;
    const end = el.selectionEnd ?? pluralTyped.length;
    const next = pluralTyped.slice(0, start) + ch + pluralTyped.slice(end);
    setPluralTyped(next);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  const finalizeCard = async (isPluralRight: boolean, userPluralAnswer: string) => {
    if (!card?.id) return;
    setStep2Submitted(true);
    setStep2Correct(isPluralRight);

    const itemTitle = formatWordWithArticle(card.article, card.german);
    if (isPluralRight) {
      await recordMistakeCorrect({
        vocabId: card.id,
        itemTitle,
        mistakeType: 'Plural',
      });
    } else {
      const mId = await logMistake({
        vocabId: card.id,
        itemTitle,
        mistakeType: 'Plural',
        lastWrongAnswer: userPluralAnswer,
        correctAnswer: card.plural,
      });
      setStep2MistakeId(mId);
    }

    const bothRight = step1Correct && isPluralRight;
    const rating = bothRight ? 'good' : step1Correct || isPluralRight ? 'hard' : 'again';
    const sm2 = computeSm2Update(card, rating);

    await db.vocab.update(card.id, sm2);
    await recordStudyActivity({
      reviewsCompleted: 1,
      wordsLearned: card.status === 'new' ? 1 : 0,
      minutesStudied: (stats.done + 1) % 4 === 0 ? 1 : 0,
    });

    setStats((prev) => ({
      done: prev.done + 1,
      perfect: prev.perfect + (bothRight ? 1 : 0),
    }));
  };

  const handleCheckTypedPlural = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || step2Submitted || !pluralTyped.trim()) return;
    const cleaned = pluralTyped.trim().replace(/\s+/g, ' ');
    const target = card.plural.trim().replace(/\s+/g, ' ');
    const isRight = cleaned.toLowerCase() === target.toLowerCase();
    await finalizeCard(isRight, cleaned);
  };

  const handlePickMcqPlural = async (choice: string) => {
    if (!card || step2Submitted) return;
    setPluralPickedMcq(choice);
    const isRight = choice.trim().toLowerCase() === card.plural.trim().toLowerCase();
    await finalizeCard(isRight, choice);
  };

  const handleNext = () => {
    setIndex((i) => i + 1);
    resetCardState();
  };

  const handleRestart = () => {
    setPinnedIds(null);
    setIndex(0);
    setStats({ done: 0, perfect: 0 });
    resetCardState();
  };

  if (!card) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Trophy className="h-7 w-7" />
        </div>
        <h2 className="font-editorial mt-4 text-xl font-bold text-slate-950">
          Artikel &amp; Plural Complete!
        </h2>
        <p className="mt-1.5 text-sm text-stone-500">
          You mastered both article and plural on {stats.perfect} of {stats.done} nouns.
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Practice Another Batch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress & Step Header */}
      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
        <span>
          Noun {index + 1} / {deck.length} · Step {step} of 2
        </span>
        <span className="inline-flex items-center gap-1 text-slate-800">
          <Sparkles className="h-3 w-3 text-amber-500" />
          {stats.perfect}/{stats.done} perfect
        </span>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        {/* Card Meta */}
        <div className="flex items-center justify-between">
          <span
            className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(card.level)}`}
          >
            {card.level} · {card.topic}
          </span>
          <button
            type="button"
            onClick={() =>
              void speakGerman(
                step === 2 && step2Submitted
                  ? `${formatWordWithArticle(card.article, card.german)}, ${card.plural}`
                  : card.german,
              )
            }
            aria-label="Pronounce noun"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        {/* Singular Prompt */}
        <div className="my-5 text-center">
          <h2 className="font-editorial text-3xl font-bold text-slate-950">
            {pickedArticle !== null && (
              <span className={`mr-1.5 ${getArticleStyle(card.article).text}`}>
                {card.article}
              </span>
            )}
            {card.german}
          </h2>
          <p className="mt-1 text-sm font-semibold text-stone-500">{card.meaning}</p>

          {pickedArticle !== null && (
            <div className="mt-2.5">
              {step1Correct ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                  ✓ Step 1: {card.article}
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-800">
                  <div>
                    ✗ You tapped {pickedArticle} · Correct: {card.article}
                  </div>
                  <InlineMistakeNote mistakeId={step1MistakeId} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 1: TAP DER / DIE / DAS */}
        {step === 1 && (
          <div className="space-y-2.5">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
              Step 1 · Choose Singular Article
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { art: 'der', sub: 'masc.', cls: 'border-blue-300 bg-blue-700 text-white' },
                  { art: 'die', sub: 'fem.', cls: 'border-red-300 bg-red-700 text-white' },
                  { art: 'das', sub: 'neut.', cls: 'border-emerald-300 bg-emerald-700 text-white' },
                ] as const
              ).map(({ art, sub, cls }) => (
                <button
                  key={art}
                  type="button"
                  disabled={pickedArticle !== null}
                  onClick={() => void handleStep1Tap(art)}
                  className={`flex flex-col items-center justify-center rounded-2xl border py-4 shadow-xs transition active:scale-95 disabled:opacity-60 ${cls}`}
                >
                  <span className="text-lg font-extrabold leading-none">{art}</span>
                  <span className="mt-1 text-[10px] font-semibold opacity-85">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: TYPE OR MULTIPLE CHOICE PLURAL */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                Step 2 · Plural Form (with die)
              </p>
              <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPluralInputMode('type')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                    pluralInputMode === 'type' ? 'bg-white text-slate-950 shadow-2xs' : 'text-stone-500'
                  }`}
                >
                  <Keyboard className="h-3 w-3" />
                  Type
                </button>
                <button
                  type="button"
                  onClick={() => setPluralInputMode('mcq')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                    pluralInputMode === 'mcq' ? 'bg-white text-slate-950 shadow-2xs' : 'text-stone-500'
                  }`}
                >
                  <ListChecks className="h-3 w-3" />
                  Multiple Choice
                </button>
              </div>
            </div>

            {pluralInputMode === 'type' ? (
              <form onSubmit={(e) => void handleCheckTypedPlural(e)} className="space-y-2.5">
                {!step2Submitted && (
                  <div className="grid grid-cols-7 gap-1">
                    {UMLAUT_KEYS.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => insertUmlaut(ch)}
                        className="flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-xs font-extrabold text-slate-900 active:scale-95"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  disabled={step2Submitted}
                  value={pluralTyped}
                  onChange={(e) => setPluralTyped(e.target.value)}
                  placeholder="e.g., die Äpfel"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-center text-base font-bold text-slate-950 placeholder:text-stone-400 focus:border-blue-700 focus:bg-white focus:outline-none disabled:opacity-75"
                />

                {!step2Submitted && (
                  <button
                    type="submit"
                    disabled={!pluralTyped.trim()}
                    className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
                  >
                    Check Plural
                  </button>
                )}
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {mcqOptions.map((opt) => {
                  const isCorrectOpt = opt.toLowerCase() === card.plural.toLowerCase();
                  const isPicked = pluralPickedMcq === opt;
                  let cls = 'border-stone-200 bg-stone-50 text-slate-900';
                  if (step2Submitted) {
                    if (isCorrectOpt) cls = 'border-emerald-400 bg-emerald-50 text-emerald-900';
                    else if (isPicked) cls = 'border-red-400 bg-red-50 text-red-900';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={step2Submitted}
                      onClick={() => void handlePickMcqPlural(opt)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-bold transition active:scale-95 ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* PLURAL DIFF FEEDBACK */}
            {step2Submitted && diff && (
              <div
                className={`rounded-2xl border p-3.5 text-xs ${
                  step2Correct
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-red-200 bg-red-50 text-red-950'
                }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold">
                  {step2Correct ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      Plural correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-700" />
                      Correct plural: {card.plural}
                    </>
                  )}
                </div>

                {/* Visual Diff Pill */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-white/85 px-3 py-2 text-slate-900">
                  <span className="text-[11px] font-semibold text-stone-500">
                    {card.article} {card.german}
                  </span>
                  <span className="text-stone-400">→</span>
                  <span className="text-sm font-extrabold">
                    <span className="text-red-700">die </span>
                    <span>{diff.stem}</span>
                    {diff.ending && (
                      <span className="rounded bg-blue-100 px-1 text-blue-800">
                        {diff.ending}
                      </span>
                    )}
                  </span>
                  {diff.umlautChange && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                      Umlaut: {diff.umlautChange}
                    </span>
                  )}
                  {!diff.ending && !diff.umlautChange && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                      No ending change
                    </span>
                  )}
                </div>

                {!step2Correct && <InlineMistakeNote mistakeId={step2MistakeId} />}
              </div>
            )}
          </div>
        )}
      </div>

      {step2Submitted && (
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
        >
          Next Noun
        </button>
      )}
    </div>
  );
};
