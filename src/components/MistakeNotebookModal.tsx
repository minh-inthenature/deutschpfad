import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  StickyNote,
  Play,
  ArrowLeft,
  Trophy,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  db,
  logMistake,
  recordMistakeCorrect,
  recordStudyActivity,
  updateMistakeNote,
  type GermanArticle,
  type MistakeLog,
  type MistakeStatus,
  type MistakeType,
} from '../db/database';
import { speakGerman } from '../utils/german';

interface MistakeNotebookModalProps {
  open: boolean;
  onClose: () => void;
  autoStartDrill?: boolean;
}

const CATEGORIES: ('All' | MistakeType)[] = [
  'All',
  'Article',
  'Plural',
  'Spelling',
  'Case',
  'Satzbau',
];

const UMLAUT_KEYS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'] as const;

function typeBadgeClass(type: MistakeType): string {
  switch (type) {
    case 'Article':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'Plural':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'Spelling':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'Case':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'Satzbau':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
}

export const MistakeNotebookModal: React.FC<MistakeNotebookModalProps> = ({
  open,
  onClose,
  autoStartDrill = false,
}) => {
  const allMistakes = useLiveQuery(
    () => db.mistakeLogs.orderBy('updatedAt').reverse().toArray(),
    [],
  );

  const [category, setCategory] = useState<'All' | MistakeType>('All');
  const [statusView, setStatusView] = useState<MistakeStatus>('active');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Targeted Weak-Items Drill state
  const [drilling, setDrilling] = useState(false);
  const [drillQueueIds, setDrillQueueIds] = useState<number[]>([]);
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillInput, setDrillInput] = useState('');
  const [drillSubmitted, setDrillSubmitted] = useState(false);
  const [drillRight, setDrillRight] = useState(false);
  const [drillJustResolved, setDrillJustResolved] = useState(false);
  const [drillStats, setDrillStats] = useState({ total: 0, right: 0, resolved: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeCount = useMemo(
    () => (allMistakes ?? []).filter((m) => m.status === 'active').length,
    [allMistakes],
  );
  const resolvedCount = useMemo(
    () => (allMistakes ?? []).filter((m) => m.status === 'resolved').length,
    [allMistakes],
  );

  const filteredMistakes = useMemo(() => {
    return (allMistakes ?? []).filter((m) => {
      if (m.status !== statusView) return false;
      if (category !== 'All' && m.mistakeType !== category) return false;
      return true;
    });
  }, [allMistakes, statusView, category]);

  const activeInCategory = useMemo(() => {
    return (allMistakes ?? []).filter((m) => {
      if (m.status !== 'active') return false;
      if (category !== 'All' && m.mistakeType !== category) return false;
      return true;
    });
  }, [allMistakes, category]);

  const currentDrillItem: MistakeLog | undefined = useMemo(() => {
    if (!drilling || !allMistakes) return undefined;
    const id = drillQueueIds[drillIdx];
    if (id === undefined) return undefined;
    return allMistakes.find((m) => m.id === id);
  }, [drilling, allMistakes, drillQueueIds, drillIdx]);

  useEffect(() => {
    if (!open) {
      setDrilling(false);
      return;
    }
    if (autoStartDrill && allMistakes) {
      const ids = allMistakes
        .filter((m) => m.status === 'active')
        .sort((a, b) => b.errorCount - a.errorCount || b.updatedAt - a.updatedAt)
        .map((m) => m.id!)
        .filter(Boolean);
      if (ids.length > 0) {
        setDrillQueueIds(ids);
        setDrillIdx(0);
        setDrillInput('');
        setDrillSubmitted(false);
        setDrillRight(false);
        setDrillJustResolved(false);
        setDrillStats({ total: 0, right: 0, resolved: 0 });
        setDrilling(true);
      }
    }
  }, [open, autoStartDrill]);

  if (!open) return null;

  const startWeakDrill = () => {
    const ids = activeInCategory.map((m) => m.id!).filter(Boolean);
    if (ids.length === 0) return;
    setDrillQueueIds(ids);
    setDrillIdx(0);
    setDrillInput('');
    setDrillSubmitted(false);
    setDrillRight(false);
    setDrillJustResolved(false);
    setDrillStats({ total: 0, right: 0, resolved: 0 });
    setDrilling(true);
  };

  const evaluateDrillAnswer = async (userAnswer: string) => {
    if (!currentDrillItem?.id || drillSubmitted) return;
    const cleanedUser = userAnswer.trim().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
    const cleanedCorrect = currentDrillItem.correctAnswer
      .trim()
      .replace(/[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ');

    // For Spelling & Plural & Case & Article, accept case-insensitive; for Satzbau check exact word match
    const isRight =
      currentDrillItem.mistakeType === 'Satzbau'
        ? cleanedUser === cleanedCorrect
        : cleanedUser.toLowerCase() === cleanedCorrect.toLowerCase();

    setDrillSubmitted(true);
    setDrillRight(isRight);

    let resolvedNow = false;
    if (isRight) {
      resolvedNow = await recordMistakeCorrect({
        id: currentDrillItem.id,
        mistakeType: currentDrillItem.mistakeType,
      });
    } else {
      await logMistake({
        vocabId: currentDrillItem.vocabId,
        itemTitle: currentDrillItem.itemTitle,
        mistakeType: currentDrillItem.mistakeType,
        lastWrongAnswer: userAnswer.trim() || '(blank)',
        correctAnswer: currentDrillItem.correctAnswer,
      });
    }

    await recordStudyActivity({ reviewsCompleted: 1 });
    setDrillJustResolved(resolvedNow);
    setDrillStats((prev) => ({
      total: prev.total + 1,
      right: prev.right + (isRight ? 1 : 0),
      resolved: prev.resolved + (resolvedNow ? 1 : 0),
    }));
  };

  const handleNextDrill = () => {
    setDrillIdx((i) => i + 1);
    setDrillInput('');
    setDrillSubmitted(false);
    setDrillRight(false);
    setDrillJustResolved(false);
  };

  const insertUmlaut = (ch: string) => {
    const el = inputRef.current;
    if (!el) {
      setDrillInput((p) => p + ch);
      return;
    }
    const start = el.selectionStart ?? drillInput.length;
    const end = el.selectionEnd ?? drillInput.length;
    const next = drillInput.slice(0, start) + ch + drillInput.slice(end);
    setDrillInput(next);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  const handleSaveCardNote = async (id: number) => {
    await updateMistakeNote(id, noteDraft);
    setEditingNoteId(null);
  };

  const stripLeadingArticle = (title: string): string => {
    return title.replace(/^(der|die|das)\s+/i, '').trim();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-paper shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 rounded-t-3xl border-b border-stone-200 bg-white px-5 pt-3 pb-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {drilling && (
                <button
                  type="button"
                  onClick={() => setDrilling(false)}
                  aria-label="Back to notebook"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-800 active:scale-90"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-700">
                  {drilling ? 'Targeted Weak-Items Drill' : 'Automatic Mistake Tracker'}
                </p>
                <h2 className="font-editorial truncate text-xl font-bold text-slate-950">
                  {drilling ? 'Fix Your Mistakes' : 'Mistake Notebook'}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notebook"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!drilling && (
            <>
              {/* Active / Resolved Switch + Drill CTA */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStatusView('active')}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      statusView === 'active'
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-stone-500'
                    }`}
                  >
                    Active ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusView('resolved')}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      statusView === 'resolved'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-stone-500'
                    }`}
                  >
                    Resolved ({resolvedCount})
                  </button>
                </div>

                <button
                  type="button"
                  disabled={activeInCategory.length === 0}
                  onClick={startWeakDrill}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition active:scale-95 disabled:bg-stone-300"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Drill Weak Items ({activeInCategory.length})
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                      category === cat
                        ? 'bg-slate-950 text-white'
                        : 'border border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* ==================== NOTEBOOK LIST VIEW ==================== */}
          {!drilling && (
            <div className="space-y-3 pb-4">
              {filteredMistakes.length === 0 ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-2xs">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="font-editorial mt-3 text-lg font-bold text-slate-950">
                    {statusView === 'active' ? 'No Active Mistakes!' : 'No Resolved Mistakes Yet'}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    {statusView === 'active'
                      ? 'Any wrong answers during Vocab Check drills are captured here automatically.'
                      : 'Answer an active mistake correctly 2 times in a row to resolve it.'}
                  </p>
                </div>
              ) : (
                filteredMistakes.map((m) => {
                  const isEditing = editingNoteId === m.id;
                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${typeBadgeClass(m.mistakeType)}`}
                            >
                              {m.mistakeType}
                            </span>
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-800">
                              Missed {m.errorCount}×
                            </span>
                            {m.status === 'active' ? (
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                                {m.consecutiveCorrect}/2 to resolve
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                Resolved
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-sm font-extrabold text-slate-950">
                            {m.itemTitle}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => void speakGerman(m.correctAnswer)}
                          aria-label="Pronounce correct answer"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Last Wrong vs Correct */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-red-200/80 bg-red-50/70 px-2.5 py-2">
                          <span className="block text-[10px] font-bold uppercase text-red-700/80">
                            Last Wrong
                          </span>
                          <span className="font-bold text-red-900 break-words">
                            {m.lastWrongAnswer}
                          </span>
                        </div>
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-2">
                          <span className="block text-[10px] font-bold uppercase text-emerald-700/80">
                            Correct
                          </span>
                          <span className="font-bold text-emerald-950 break-words">
                            {m.correctAnswer}
                          </span>
                        </div>
                      </div>

                      {/* Editable Personal Note */}
                      <div className="mt-2.5 border-t border-stone-100 pt-2.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Write your mnemonic note..."
                              autoFocus
                              className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => m.id && void handleSaveCardNote(m.id)}
                              className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (m.id) {
                                setEditingNoteId(m.id);
                                setNoteDraft(m.userNote);
                              }
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-xl bg-stone-50 px-2.5 py-1.5 text-left text-xs transition hover:bg-stone-100"
                          >
                            <span
                              className={`truncate ${
                                m.userNote ? 'font-medium text-slate-800' : 'text-stone-400'
                              }`}
                            >
                              <StickyNote className="mr-1.5 inline h-3.5 w-3.5 text-amber-600" />
                              {m.userNote || 'Tap to add a personal mnemonic note...'}
                            </span>
                            <span className="shrink-0 text-[10px] font-extrabold text-blue-700">
                              {m.userNote ? 'Edit' : '+ Note'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ==================== TARGETED WEAK-ITEMS DRILL ==================== */}
          {drilling &&
            (currentDrillItem ? (
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                  <span>
                    Weak Item {drillIdx + 1} / {drillQueueIds.length}
                  </span>
                  <span className="text-emerald-700">
                    {drillStats.resolved} resolved this session
                  </span>
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${typeBadgeClass(currentDrillItem.mistakeType)}`}
                    >
                      {currentDrillItem.mistakeType}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      Streak: {currentDrillItem.consecutiveCorrect}/2 to resolve
                    </span>
                  </div>

                  <div className="my-5 text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                      {currentDrillItem.mistakeType === 'Article'
                        ? 'Choose the correct article'
                        : currentDrillItem.mistakeType === 'Plural'
                          ? 'Type the plural form (with die)'
                          : currentDrillItem.mistakeType === 'Case'
                            ? 'Fill in the missing case article'
                            : currentDrillItem.mistakeType === 'Satzbau'
                              ? 'Type the full German sentence'
                              : 'Type the correct German word'}
                    </p>
                    <h3 className="font-editorial mt-2 text-2xl font-bold text-slate-950">
                      {currentDrillItem.mistakeType === 'Article'
                        ? stripLeadingArticle(currentDrillItem.itemTitle)
                        : currentDrillItem.itemTitle}
                    </h3>

                    {currentDrillItem.userNote && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                        <StickyNote className="h-3.5 w-3.5" />
                        Note: {currentDrillItem.userNote}
                      </p>
                    )}
                  </div>

                  {/* Interactive Prompt by Mistake Type */}
                  {currentDrillItem.mistakeType === 'Article' ? (
                    <div className="grid grid-cols-3 gap-2.5">
                      {(
                        [
                          { art: 'der', cls: 'border-blue-300 bg-blue-700 text-white' },
                          { art: 'die', cls: 'border-red-300 bg-red-700 text-white' },
                          { art: 'das', cls: 'border-emerald-300 bg-emerald-700 text-white' },
                        ] as const
                      ).map(({ art, cls }) => (
                        <button
                          key={art}
                          type="button"
                          disabled={drillSubmitted}
                          onClick={() => void evaluateDrillAnswer(art as GermanArticle)}
                          className={`rounded-2xl border py-4 text-base font-extrabold transition active:scale-95 disabled:opacity-55 ${cls}`}
                        >
                          {art}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (drillInput.trim()) void evaluateDrillAnswer(drillInput);
                      }}
                      className="space-y-2.5"
                    >
                      {!drillSubmitted && (
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
                        disabled={drillSubmitted}
                        value={drillInput}
                        onChange={(e) => setDrillInput(e.target.value)}
                        placeholder="Type your answer..."
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 px-3.5 py-3 text-center text-base font-bold text-slate-950 focus:border-blue-700 focus:bg-white focus:outline-none disabled:opacity-75"
                      />

                      {!drillSubmitted && (
                        <button
                          type="submit"
                          disabled={!drillInput.trim()}
                          className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
                        >
                          Check Answer
                        </button>
                      )}
                    </form>
                  )}

                  {/* Feedback */}
                  {drillSubmitted && (
                    <div
                      className={`mt-4 rounded-2xl border p-3.5 text-xs ${
                        drillRight
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                          : 'border-red-200 bg-red-50 text-red-950'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-extrabold">
                        {drillRight ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                            {drillJustResolved
                              ? 'Resolved! (2/2 in a row)'
                              : 'Correct! (1/2 — one more time to resolve)'}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-700" />
                            Correct answer: {currentDrillItem.correctAnswer}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {drillSubmitted && (
                  <button
                    type="button"
                    onClick={handleNextDrill}
                    className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
                  >
                    {drillIdx + 1 < drillQueueIds.length ? 'Next Weak Item' : 'Finish Drill'}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-xs">
                <Trophy className="mx-auto h-11 w-11 text-emerald-700" />
                <h3 className="font-editorial mt-3 text-xl font-bold text-slate-950">
                  Weak-Items Drill Finished!
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {drillStats.right}/{drillStats.total} correct ·{' '}
                  <strong className="text-emerald-700">{drillStats.resolved} resolved</strong>!
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  {activeInCategory.length > 0 && (
                    <button
                      type="button"
                      onClick={startWeakDrill}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white active:scale-95"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Drill Remaining ({activeInCategory.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDrilling(false)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3.5 text-sm font-bold text-slate-900 active:scale-95"
                  >
                    Back to Notebook
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Re-export AlertCircle usage helper if needed elsewhere
export { AlertCircle };
