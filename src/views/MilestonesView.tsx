import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Lock,
  CheckCircle2,
  ChevronRight,
  X,
  BookOpen,
  Play,
  Trophy,
  RotateCcw,
  XCircle,
  BookMarked,
} from 'lucide-react';
import {
  db,
  recordStudyActivity,
  type CefrLevel,
  type Milestone,
  type MilestoneQuestion,
} from '../db/database';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { getLevelStyle } from '../utils/german';

interface MilestonesViewProps {
  initialMilestoneCode: string | null;
  onClearInitialMilestone: () => void;
  onOpenReference: () => void;
}

const LEVEL_META: { level: CefrLevel; label: string; subtitle: string }[] = [
  { level: 'A0', label: 'A0 · Starter', subtitle: 'Alphabet, Pronouns & Basic Nouns' },
  { level: 'A1', label: 'A1 · Beginner', subtitle: 'Articles, Present Tense & Accusative' },
  { level: 'A2', label: 'A2 · Elementary', subtitle: 'Perfekt, Dative & Clauses' },
  { level: 'B1', label: 'B1 · Intermediate', subtitle: 'Konjunktiv II, Relatives & Passive' },
];

const UMLAUT_BAR = ['ä', 'ö', 'ü', 'ß'] as const;
const PASS_THRESHOLD = 80;

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  initialMilestoneCode,
  onClearInitialMilestone,
  onOpenReference,
}) => {
  const milestones = useLiveQuery(() => db.milestones.orderBy('orderIndex').toArray(), []);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialMilestoneCode);

  useEffect(() => {
    if (initialMilestoneCode) {
      setSelectedCode(initialMilestoneCode);
      onClearInitialMilestone();
    }
  }, [initialMilestoneCode, onClearInitialMilestone]);

  const selectedMilestone = useMemo(
    () => (milestones ?? []).find((m) => m.code === selectedCode) ?? null,
    [milestones, selectedCode],
  );

  const completedCount = (milestones ?? []).filter((m) => m.completed).length;

  return (
    <div className="space-y-5 px-4 pt-4 pb-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-editorial text-2xl font-bold tracking-tight text-slate-950">
            Skill Tree
          </h1>
          <p className="text-xs text-stone-500">
            Score ≥{PASS_THRESHOLD}% on a Mastery Test to unlock the next node
          </p>
        </div>
        <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-900">
          {completedCount}/{milestones?.length ?? 21}
        </span>
      </header>

      {/* Vertical A1 → A2 → B1 Skill Tree */}
      <div className="space-y-6">
        {LEVEL_META.map(({ level, label, subtitle }) => {
          const group = (milestones ?? []).filter((m) => m.level === level);
          return (
            <section key={level}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${getLevelStyle(level)}`}
                >
                  {label}
                </span>
                <span className="truncate text-[11px] font-medium text-stone-500">{subtitle}</span>
              </div>

              <div className="relative pl-6">
                {/* Vertical Skill-Tree Rail */}
                <div
                  aria-hidden="true"
                  className="absolute top-5 bottom-5 left-[11px] w-0.5 bg-stone-300"
                />

                <div className="space-y-3">
                  {group.map((m) => {
                    const nodeDot = m.completed
                      ? 'border-emerald-700 bg-emerald-600 text-white'
                      : m.isUnlocked
                        ? 'border-blue-700 bg-blue-700 text-white ring-4 ring-blue-100'
                        : 'border-stone-300 bg-stone-200 text-stone-400';

                    return (
                      <div key={m.code} className="relative">
                        {/* Node Circle on the Vertical Rail */}
                        <span
                          className={`absolute top-1/2 -left-6 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 ${nodeDot}`}
                        >
                          {m.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : m.isUnlocked ? (
                            <Play className="h-2.5 w-2.5 fill-current" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                        </span>

                        <button
                          type="button"
                          disabled={!m.isUnlocked}
                          onClick={() => setSelectedCode(m.code)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                            m.isUnlocked
                              ? 'border-stone-200 bg-white shadow-xs active:scale-[0.985]'
                              : 'cursor-not-allowed border-stone-200/70 bg-stone-100/80 opacity-70'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-extrabold tracking-wide text-blue-800">
                                {m.code}
                              </span>
                              {m.bestScore > 0 && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                    m.completed
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  Best {m.bestScore}%
                                </span>
                              )}
                              {!m.isUnlocked && (
                                <span className="text-[10px] font-semibold text-stone-400">
                                  Locked
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm font-bold text-slate-950">
                              {m.title}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Grammar Rules · {m.questions.length}-question Mastery Test
                            </p>
                          </div>

                          {m.isUnlocked && (
                            <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Tabbed Sheet for Selected Unlocked Milestone */}
      {selectedMilestone && (
        <MilestoneSheet
          key={selectedMilestone.code}
          milestone={selectedMilestone}
          allMilestones={milestones ?? []}
          onClose={() => setSelectedCode(null)}
          onSelectMilestone={(code) => setSelectedCode(code)}
          onOpenReference={onOpenReference}
        />
      )}
    </div>
  );
};

interface MilestoneSheetProps {
  milestone: Milestone;
  allMilestones: Milestone[];
  onClose: () => void;
  onSelectMilestone: (code: string) => void;
  onOpenReference: () => void;
}

const MilestoneSheet: React.FC<MilestoneSheetProps> = ({
  milestone,
  allMilestones,
  onClose,
  onSelectMilestone,
  onOpenReference,
}) => {
  const [sheetTab, setSheetTab] = useState<'rules' | 'test'>('rules');
  const [qIndex, setQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);

  const [mcqChoice, setMcqChoice] = useState<string | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [reorderPicked, setReorderPicked] = useState<number[]>([]);

  const question: MilestoneQuestion | undefined = milestone.questions[qIndex];
  const finalScore = Math.round((correctCount / Math.max(1, milestone.questions.length)) * 100);
  const passed = finalScore >= PASS_THRESHOLD;
  const nextMilestone = allMilestones.find((m) => m.orderIndex === milestone.orderIndex + 1);

  const resetQuestionState = () => {
    setSubmitted(false);
    setIsCorrect(false);
    setMcqChoice(null);
    setFillValue('');
    setReorderPicked([]);
  };

  const restartTest = () => {
    setQIndex(0);
    setCorrectCount(0);
    setFinished(false);
    resetQuestionState();
    setSheetTab('test');
  };

  const handleCheckAnswer = () => {
    if (!question || submitted) return;
    let right = false;

    if (question.type === 'mcq') {
      right = mcqChoice === question.answer;
    } else if (question.type === 'fill') {
      const cleaned = fillValue.trim();
      const accepted = question.acceptedAnswers ?? [question.answer];
      right = accepted.some((a) => a.toLowerCase() === cleaned.toLowerCase());
    } else if (question.type === 'reorder') {
      const built = reorderPicked.map((i) => question.words[i]);
      right =
        built.length === question.correctOrder.length &&
        built.every((w, idx) => w === question.correctOrder[idx]);
    }

    setSubmitted(true);
    setIsCorrect(right);
    if (right) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = async () => {
    if (qIndex + 1 < milestone.questions.length) {
      setQIndex((idx) => idx + 1);
      resetQuestionState();
      return;
    }

    const score = Math.round((correctCount / milestone.questions.length) * 100);
    const didPass = score >= PASS_THRESHOLD;
    const newBest = Math.max(milestone.bestScore, score);

    if (milestone.id) {
      await db.milestones.update(milestone.id, {
        bestScore: newBest,
        completed: milestone.completed || didPass,
      });
    }

    if (didPass) {
      const nextMs = allMilestones.find((m) => m.orderIndex === milestone.orderIndex + 1);
      if (nextMs?.id && !nextMs.isUnlocked) {
        await db.milestones.update(nextMs.id, { isUnlocked: true });
      }
    }

    await recordStudyActivity({
      minutesStudied: 3,
      reviewsCompleted: milestone.questions.length,
    });

    setFinished(true);
  };

  const canSubmit =
    question &&
    !submitted &&
    ((question.type === 'mcq' && mcqChoice !== null) ||
      (question.type === 'fill' && fillValue.trim().length > 0) ||
      (question.type === 'reorder' && reorderPicked.length === question.words.length));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-paper shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Handle & Header */}
        <div className="shrink-0 border-b border-stone-200 bg-white px-5 pt-3 pb-4 rounded-t-3xl">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${getLevelStyle(milestone.level)}`}
                >
                  {milestone.code}
                </span>
                {milestone.completed && (
                  <span className="text-[11px] font-bold text-emerald-700">Mastered</span>
                )}
              </div>
              <h2 className="font-editorial mt-1 truncate text-lg font-bold text-slate-950">
                {milestone.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close milestone sheet"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Segmented Sheet Tabs */}
          <div className="mt-3.5 grid grid-cols-2 gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setSheetTab('rules')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                sheetTab === 'rules'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-stone-600'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Grammar Rules
            </button>
            <button
              type="button"
              onClick={() => setSheetTab('test')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                sheetTab === 'test'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-stone-600'
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              Mastery Test
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* GRAMMAR RULES TAB */}
          {sheetTab === 'rules' && (
            <div className="space-y-4 pb-3">
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
                <MarkdownRenderer markdown={milestone.ruleMarkdown} />
              </div>
              <button
                type="button"
                onClick={onOpenReference}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 py-3 text-xs font-extrabold text-blue-800 transition active:scale-[0.98]"
              >
                <BookMarked className="h-4 w-4" />
                Open Offline Reference (Cases, 60 Verbs &amp; Prepositions)
              </button>
              <button
                type="button"
                onClick={restartTest}
                className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
              >
                Take Mastery Test (≥{PASS_THRESHOLD}% to Unlock)
              </button>
            </div>
          )}

          {/* MASTERY TEST TAB */}
          {sheetTab === 'test' && !finished && question && (
            <div className="space-y-4 pb-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                <span className="uppercase tracking-wider">
                  {question.type === 'mcq'
                    ? 'Multiple Choice'
                    : question.type === 'fill'
                      ? 'Fill in the Blank'
                      : 'Word Reorder'}
                </span>
                <span>
                  {qIndex + 1} / {milestone.questions.length}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-blue-700 transition-all duration-300"
                  style={{
                    width: `${((qIndex + (submitted ? 1 : 0)) / milestone.questions.length) * 100}%`,
                  }}
                />
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
                <p className="text-sm font-bold leading-snug text-slate-950">{question.prompt}</p>

                {/* MCQ */}
                {question.type === 'mcq' && (
                  <div className="mt-4 space-y-2.5">
                    {question.options.map((opt) => {
                      const selected = mcqChoice === opt;
                      let style = 'border-stone-200 bg-white text-slate-900';
                      if (submitted) {
                        if (opt === question.answer) {
                          style = 'border-emerald-400 bg-emerald-50 text-emerald-900';
                        } else if (selected) {
                          style = 'border-red-400 bg-red-50 text-red-900';
                        }
                      } else if (selected) {
                        style = 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-100';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={submitted}
                          onClick={() => setMcqChoice(opt)}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition active:scale-[0.99] ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* FILL IN THE BLANK */}
                {question.type === 'fill' && (
                  <div className="mt-4 space-y-3">
                    {!submitted && (
                      <div className="grid grid-cols-4 gap-2">
                        {UMLAUT_BAR.map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => setFillValue((prev) => prev + ch)}
                            className="flex h-9 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-sm font-extrabold text-slate-900 active:scale-95"
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-slate-900">
                      {question.sentenceBefore && <span>{question.sentenceBefore} </span>}
                      <input
                        type="text"
                        disabled={submitted}
                        value={fillValue}
                        onChange={(e) => setFillValue(e.target.value)}
                        placeholder={question.hint ?? 'Answer...'}
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="my-1 inline-block w-36 rounded-xl border-2 border-blue-300 bg-white px-3 py-1.5 text-center text-sm font-bold text-slate-950 focus:border-blue-700 focus:outline-none disabled:bg-stone-100"
                      />
                      {question.sentenceAfter && <span> {question.sentenceAfter}</span>}
                    </div>
                  </div>
                )}

                {/* WORD REORDER */}
                {question.type === 'reorder' && (
                  <div className="mt-4 space-y-4">
                    <div className="min-h-[64px] rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-3">
                      {reorderPicked.length === 0 ? (
                        <p className="py-2 text-center text-xs text-stone-400">
                          Tap word chips below in order
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {reorderPicked.map((wordIdx, pos) => (
                            <button
                              key={`${wordIdx}-${pos}`}
                              type="button"
                              disabled={submitted}
                              onClick={() =>
                                setReorderPicked((prev) => prev.filter((_, i) => i !== pos))
                              }
                              className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-900 active:scale-95"
                            >
                              {question.words[wordIdx]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {question.words.map((word, idx) => {
                        const used = reorderPicked.includes(idx);
                        return (
                          <button
                            key={`${word}-${idx}`}
                            type="button"
                            disabled={submitted || used}
                            onClick={() => setReorderPicked((prev) => [...prev, idx])}
                            className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
                              used
                                ? 'border-stone-100 bg-stone-100 text-stone-300'
                                : 'border-stone-200 bg-white text-slate-900 shadow-2xs'
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INSTANT EXPLANATION */}
                {submitted && (
                  <div
                    className={`mt-4 rounded-2xl border p-3.5 text-xs leading-relaxed ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                        : 'border-red-200 bg-red-50 text-red-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                          Correct!
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-700" />
                          Answer:{' '}
                          {question.type === 'reorder'
                            ? question.correctOrder.join(' ')
                            : question.answer}
                        </>
                      )}
                    </div>
                    <p className="mt-1 opacity-90">{question.explanation}</p>
                  </div>
                )}
              </div>

              {!submitted ? (
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleCheckAnswer}
                  className="w-full rounded-2xl bg-blue-700 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
                >
                  {qIndex + 1 < milestone.questions.length ? 'Next Question' : 'See Results'}
                </button>
              )}
            </div>
          )}

          {/* MASTERY TEST RESULTS */}
          {sheetTab === 'test' && finished && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-xs">
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                  passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <Trophy className="h-7 w-7" />
              </div>
              <h3 className="font-editorial mt-4 text-2xl font-bold text-slate-950">
                {finalScore}%
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                {correctCount} of {milestone.questions.length} correct.{' '}
                {passed
                  ? nextMilestone
                    ? `${nextMilestone.code} is now unlocked!`
                    : 'All B1 milestones mastered!'
                  : `Score ≥${PASS_THRESHOLD}% to unlock the next milestone.`}
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                {passed && nextMilestone && (
                  <button
                    type="button"
                    onClick={() => onSelectMilestone(nextMilestone.code)}
                    className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white active:scale-[0.98]"
                  >
                    Continue to {nextMilestone.code}: {nextMilestone.title}
                  </button>
                )}
                <button
                  type="button"
                  onClick={restartTest}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 py-3.5 text-sm font-bold text-slate-900 active:scale-[0.98]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
