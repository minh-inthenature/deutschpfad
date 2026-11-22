import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Trophy,
  Zap,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { CASE_DRILLS, type CaseDrillItem } from '../../data/caseDrills';
import {
  logMistake,
  recordMistakeCorrect,
  recordStudyActivity,
  type CefrLevel,
} from '../../db/database';
import { getLevelStyle, speakGerman } from '../../utils/german';
import { InlineMistakeNote } from '../InlineMistakeNote';
import {
  checkCaseChoiceWithAI,
  hasGeminiKey,
  type AiGrammarCheckResult,
} from '../../services/geminiTutor';

export const CaseBlitzDrill: React.FC = () => {
  const [levelFilter, setLevelFilter] = useState<'ALL' | CefrLevel>('ALL');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [mistakeId, setMistakeId] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const [showNounGender, setShowNounGender] = useState(true);
  const [checkingAiCase, setCheckingAiCase] = useState(false);
  const [aiCaseResult, setAiCaseResult] = useState<AiGrammarCheckResult | null>(null);

  const pool = useMemo(() => {
    if (levelFilter === 'ALL') return CASE_DRILLS;
    return CASE_DRILLS.filter((d) => d.level === levelFilter);
  }, [levelFilter]);

  const item: CaseDrillItem | undefined = pool[index];

  const handleSelectLevel = (lvl: 'ALL' | CefrLevel) => {
    setLevelFilter(lvl);
    setIndex(0);
    setPicked(null);
    setMistakeId(null);
    setAiCaseResult(null);
    setCheckingAiCase(false);
    setScore({ right: 0, total: 0, streak: 0 });
  };

  const handlePick = async (choice: string) => {
    if (!item || picked !== null) return;
    setPicked(choice);
    setAiCaseResult(null);
    const isRight = choice === item.answer;
    const itemTitle = `${item.sentenceBefore} ___ ${item.sentenceAfter}`.trim();

    if (isRight) {
      await recordMistakeCorrect({
        vocabId: null,
        itemTitle,
        mistakeType: 'Case',
      });
      setScore((prev) => ({
        right: prev.right + 1,
        total: prev.total + 1,
        streak: prev.streak + 1,
      }));
    } else {
      const mId = await logMistake({
        vocabId: null,
        itemTitle,
        mistakeType: 'Case',
        lastWrongAnswer: choice,
        correctAnswer: item.answer,
      });
      setMistakeId(mId);
      setScore((prev) => ({
        right: prev.right,
        total: prev.total + 1,
        streak: 0,
      }));

      if (hasGeminiKey()) {
        setCheckingAiCase(true);
        checkCaseChoiceWithAI({
          sentenceBefore: item.sentenceBefore,
          sentenceAfter: item.sentenceAfter,
          chosenArticle: choice,
          correctArticle: item.answer,
          targetCase: item.targetCase,
          nounHint: item.nounHint,
        })
          .then(async (res) => {
            setAiCaseResult(res);
            if (res.isValid) {
              await recordMistakeCorrect({
                vocabId: null,
                itemTitle,
                mistakeType: 'Case',
              });
              setScore((prev) => ({
                right: prev.right + 1,
                total: prev.total,
                streak: prev.streak + 1,
              }));
            }
          })
          .catch(() => {
            // Keep offline feedback silently if AI fails
          })
          .finally(() => {
            setCheckingAiCase(false);
          });
      }
    }

    await recordStudyActivity({
      reviewsCompleted: 1,
      minutesStudied: (score.total + 1) % 6 === 0 ? 1 : 0,
    });
  };

  const handleNext = () => {
    setPicked(null);
    setMistakeId(null);
    setAiCaseResult(null);
    setCheckingAiCase(false);
    setIndex((i) => i + 1);
  };

  const handleRestart = () => {
    setIndex(0);
    setPicked(null);
    setMistakeId(null);
    setAiCaseResult(null);
    setCheckingAiCase(false);
    setScore({ right: 0, total: 0, streak: 0 });
  };

  const caseBadgeColor = (c: CaseDrillItem['targetCase']) => {
    if (c === 'Nominative') return 'bg-stone-100 text-slate-800 border-stone-300';
    if (c === 'Accusative') return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-amber-50 text-amber-900 border-amber-200';
  };

  return (
    <div className="space-y-4">
      {/* Level Filter & Streak */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {(['ALL', 'A1', 'A2', 'B1'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => handleSelectLevel(lvl)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                levelFilter === lvl
                  ? 'bg-slate-950 text-white'
                  : 'border border-stone-200 bg-white text-slate-700'
              }`}
            >
              {lvl === 'ALL' ? 'All (45)' : lvl}
            </button>
          ))}
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
          <Zap className="h-3 w-3 text-amber-600" />
          {score.streak} streak
        </span>
      </div>

      {item ? (
        <>
          {/* Progress */}
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
            <span>
              Drill {index + 1} / {pool.length}
            </span>
            <span>
              {score.right}/{score.total} correct
            </span>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(item.level)}`}
                >
                  {item.level}
                </span>

                {showNounGender && item.nounHint && (
                  <span className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                    {item.nounHint}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowNounGender((prev) => !prev)}
                  aria-label={showNounGender ? 'Hide noun gender hint' : 'Show noun gender hint'}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition active:scale-95 ${
                    showNounGender
                      ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100/70'
                      : 'border-stone-200 bg-stone-100 text-stone-500 hover:bg-stone-200/60'
                  }`}
                >
                  {showNounGender ? 'Noun Gender: Visible' : 'Show Noun Gender'}
                </button>
              </div>

              {picked !== null && (
                <button
                  type="button"
                  onClick={() =>
                    void speakGerman(
                      `${item.sentenceBefore} ${item.answer} ${item.sentenceAfter}`.trim(),
                    )
                  }
                  aria-label="Listen to full sentence"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Cloze Sentence */}
            <div className="my-6 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 text-center">
              <p className="font-editorial text-xl font-bold leading-relaxed text-slate-950">
                {item.sentenceBefore && <span>{item.sentenceBefore} </span>}
                <span
                  className={`mx-1 inline-block min-w-[68px] rounded-xl border-2 px-2.5 py-0.5 font-sans text-lg font-extrabold ${
                    picked === null
                      ? 'border-dashed border-blue-400 bg-blue-50/60 text-blue-700'
                      : picked === item.answer
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                  }`}
                >
                  {picked ?? '___'}
                </span>
                {item.sentenceAfter && <span> {item.sentenceAfter}</span>}
              </p>
            </div>

            {/* 4 Rapid-Fire Option Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {item.options.map((opt) => {
                const isAnswer = opt === item.answer;
                const isPicked = picked === opt;
                let cls = 'border-stone-200 bg-white text-slate-950 hover:border-stone-300';
                if (picked !== null) {
                  if (isAnswer) cls = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                  else if (isPicked) cls = 'border-red-500 bg-red-50 text-red-900';
                  else cls = 'border-stone-100 bg-stone-50 text-stone-400';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={picked !== null}
                    onClick={() => void handlePick(opt)}
                    className={`rounded-2xl border py-3.5 text-base font-extrabold shadow-2xs transition active:scale-95 ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Immediate 1-Line Rule Hint + Optional AI Case Explanation */}
            {picked !== null && (
              <div
                className={`mt-4 rounded-2xl border p-3.5 text-xs leading-relaxed ${
                  picked === item.answer || aiCaseResult?.isValid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-red-200 bg-red-50 text-red-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-extrabold">
                    {picked === item.answer ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        Richtig!
                      </>
                    ) : aiCaseResult?.isValid ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        Valid alternative!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-700" />
                        Answer: {item.answer}
                      </>
                    )}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${caseBadgeColor(item.targetCase)}`}
                  >
                    {item.targetCase}
                  </span>
                </div>
                <p className="mt-1.5 font-medium">{item.ruleHint}</p>

                {checkingAiCase && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI Tutor analyzing case rule...
                  </p>
                )}

                {aiCaseResult && (
                  <div className="mt-2 rounded-xl border border-blue-200 bg-white/90 px-3 py-2 text-slate-900">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                      <Sparkles className="h-3 w-3" />
                      AI Grammar Tutor
                    </span>
                    <p className="mt-0.5 text-xs font-medium leading-relaxed">
                      {aiCaseResult.shortExplanation}
                    </p>
                  </div>
                )}

                {picked !== item.answer && !aiCaseResult?.isValid && (
                  <InlineMistakeNote mistakeId={mistakeId} />
                )}
              </div>
            )}
          </div>

          {picked !== null && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              Next Sentence
            </button>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Trophy className="h-7 w-7" />
          </div>
          <h2 className="font-editorial mt-4 text-xl font-bold text-slate-950">
            Fall-Training Complete!
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            Score: {score.right} / {score.total} (
            {Math.round((score.right / Math.max(1, score.total)) * 100)}%)
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Run Blitz Again
          </button>
        </div>
      )}
    </div>
  );
};
