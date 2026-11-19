import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  RotateCcw,
  Trophy,
  Puzzle,
  PenLine,
} from 'lucide-react';
import {
  SELF_TYPE_SENTENCE_DRILLS,
  TILE_SENTENCE_DRILLS,
} from '../../data/sentenceDrills';
import {
  logMistake,
  recordMistakeCorrect,
  recordStudyActivity,
} from '../../db/database';
import { getLevelStyle, speakGerman } from '../../utils/german';
import {
  validateGermanSentence,
  type SentenceValidationFeedback,
} from '../../utils/sentenceValidator';
import { InlineMistakeNote } from '../InlineMistakeNote';

type BuilderSubMode = 'tiles' | 'type';
const UMLAUT_KEYS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'] as const;

function shuffleDeterministic(tokens: string[], seedStr: string): string[] {
  const arr = [...tokens];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 9973;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 17 + 13) % 9973;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SentenceBuilderDrill: React.FC = () => {
  const [subMode, setSubMode] = useState<BuilderSubMode>('tiles');

  // Tile Assembly state
  const [tileIdx, setTileIdx] = useState(0);
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [tileSubmitted, setTileSubmitted] = useState(false);
  const [tileCorrect, setTileCorrect] = useState(false);
  const [tileMistakeId, setTileMistakeId] = useState<number | null>(null);
  const [tileScore, setTileScore] = useState({ right: 0, total: 0 });

  // Self-Type Sentence state
  const [typeIdx, setTypeIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [validation, setValidation] = useState<SentenceValidationFeedback | null>(null);
  const [typeMistakeId, setTypeMistakeId] = useState<number | null>(null);
  const [typeScore, setTypeScore] = useState({ right: 0, total: 0 });
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentTile = TILE_SENTENCE_DRILLS[tileIdx];
  const currentType = SELF_TYPE_SENTENCE_DRILLS[typeIdx];

  const shuffledTileBank = useMemo(() => {
    if (!currentTile) return [];
    return shuffleDeterministic(
      [...currentTile.correctTokens, ...currentTile.distractors],
      currentTile.id,
    );
  }, [currentTile]);

  const handleCheckTiles = async () => {
    if (!currentTile || tileSubmitted) return;
    const built = pickedIndices.map((i) => shuffledTileBank[i]);
    const isRight =
      built.length === currentTile.correctTokens.length &&
      built.every((tok, idx) => tok === currentTile.correctTokens[idx]);

    setTileSubmitted(true);
    setTileCorrect(isRight);
    setTileScore((p) => ({
      right: p.right + (isRight ? 1 : 0),
      total: p.total + 1,
    }));

    if (isRight) {
      await recordMistakeCorrect({
        vocabId: null,
        itemTitle: currentTile.english,
        mistakeType: 'Satzbau',
      });
    } else {
      const mId = await logMistake({
        vocabId: null,
        itemTitle: currentTile.english,
        mistakeType: 'Satzbau',
        lastWrongAnswer: built.join(' '),
        correctAnswer: currentTile.correctTokens.join(' '),
      });
      setTileMistakeId(mId);
    }

    await recordStudyActivity({
      reviewsCompleted: 1,
      minutesStudied: (tileScore.total + 1) % 3 === 0 ? 1 : 0,
    });
  };

  const handleNextTile = () => {
    setTileIdx((i) => i + 1);
    setPickedIndices([]);
    setTileSubmitted(false);
    setTileCorrect(false);
    setTileMistakeId(null);
  };

  const insertUmlaut = (ch: string) => {
    const el = textAreaRef.current;
    if (!el) {
      setTypedText((p) => p + ch);
      return;
    }
    const start = el.selectionStart ?? typedText.length;
    const end = el.selectionEnd ?? typedText.length;
    const next = typedText.slice(0, start) + ch + typedText.slice(end);
    setTypedText(next);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  const handleCheckTyped = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentType || validation !== null || !typedText.trim()) return;
    const result = validateGermanSentence(
      typedText,
      currentType.targetSentence,
      currentType.acceptedAlternatives,
    );
    setValidation(result);
    setTypeScore((p) => ({
      right: p.right + (result.isCorrect ? 1 : 0),
      total: p.total + 1,
    }));

    const itemTitle = `${currentType.baseWords} [${currentType.targetTag}]`;
    if (result.isCorrect) {
      await recordMistakeCorrect({
        vocabId: null,
        itemTitle,
        mistakeType: 'Satzbau',
      });
    } else {
      const mId = await logMistake({
        vocabId: null,
        itemTitle,
        mistakeType: 'Satzbau',
        lastWrongAnswer: typedText.trim(),
        correctAnswer: currentType.targetSentence,
      });
      setTypeMistakeId(mId);
    }

    await recordStudyActivity({
      reviewsCompleted: 1,
      minutesStudied: (typeScore.total + 1) % 3 === 0 ? 1 : 0,
    });
  };

  const handleNextTyped = () => {
    setTypeIdx((i) => i + 1);
    setTypedText('');
    setValidation(null);
    setTypeMistakeId(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub-mode Toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setSubMode('tiles')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            subMode === 'tiles' ? 'bg-white text-slate-950 shadow-xs' : 'text-stone-600'
          }`}
        >
          <Puzzle className="h-3.5 w-3.5" />
          Tile Assembly
        </button>
        <button
          type="button"
          onClick={() => setSubMode('type')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            subMode === 'type' ? 'bg-white text-slate-950 shadow-xs' : 'text-stone-600'
          }`}
        >
          <PenLine className="h-3.5 w-3.5" />
          Self-Type Sentence
        </button>
      </div>

      {/* ==================== SUB-MODE A: TILE ASSEMBLY ==================== */}
      {subMode === 'tiles' &&
        (currentTile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
              <span>
                Sentence {tileIdx + 1} / {TILE_SENTENCE_DRILLS.length}
              </span>
              <span>
                {tileScore.right}/{tileScore.total} exact
              </span>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(currentTile.level)}`}
                  >
                    {currentTile.level}
                  </span>
                  <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold text-blue-800">
                    {currentTile.grammarRule}
                  </span>
                </div>

                {tileSubmitted && (
                  <button
                    type="button"
                    onClick={() => void speakGerman(currentTile.correctTokens.join(' '))}
                    aria-label="Listen to German sentence"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="font-editorial mt-4 text-lg font-bold text-slate-950">
                “{currentTile.english}”
              </p>
              <p className="mt-1 text-[11px] font-medium text-stone-500">
                Watch out: the bank includes {currentTile.distractors.length} wrong-case/verb distractor
                {currentTile.distractors.length === 1 ? '' : 's'}!
              </p>

              {/* Assembly Drop Zone */}
              <div className="mt-4 min-h-[76px] rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-3">
                {pickedIndices.length === 0 ? (
                  <p className="py-3 text-center text-xs text-stone-400">
                    Tap word tiles below to construct the German sentence
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pickedIndices.map((bankIdx, pos) => (
                      <button
                        key={`${bankIdx}-${pos}`}
                        type="button"
                        disabled={tileSubmitted}
                        onClick={() =>
                          setPickedIndices((prev) => prev.filter((_, idx) => idx !== pos))
                        }
                        className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-900 active:scale-95"
                      >
                        {shuffledTileBank[bankIdx]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Shuffled Tile Bank */}
              <div className="mt-4 flex flex-wrap gap-2">
                {shuffledTileBank.map((tok, idx) => {
                  const used = pickedIndices.includes(idx);
                  return (
                    <button
                      key={`${tok}-${idx}`}
                      type="button"
                      disabled={tileSubmitted || used}
                      onClick={() => setPickedIndices((prev) => [...prev, idx])}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
                        used
                          ? 'border-stone-100 bg-stone-100 text-stone-300'
                          : 'border-stone-200 bg-white text-slate-900 shadow-2xs'
                      }`}
                    >
                      {tok}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {tileSubmitted && (
                <div
                  className={`mt-4 rounded-2xl border p-3.5 text-xs leading-relaxed ${
                    tileCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-red-200 bg-red-50 text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold">
                    {tileCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        Perfekt gebaut!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-700" />
                        Target: {currentTile.correctTokens.join(' ')}
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 font-medium">{currentTile.explanation}</p>
                  {!tileCorrect && <InlineMistakeNote mistakeId={tileMistakeId} />}
                </div>
              )}
            </div>

            {!tileSubmitted ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pickedIndices.length === 0}
                  onClick={() => setPickedIndices([])}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-xs font-bold text-slate-700 active:scale-95 disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={pickedIndices.length === 0}
                  onClick={() => void handleCheckTiles()}
                  className="flex-1 rounded-2xl bg-blue-700 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
                >
                  Check Sentence
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNextTile}
                className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
              >
                Next Sentence
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-xs">
            <Trophy className="mx-auto h-10 w-10 text-emerald-700" />
            <h2 className="font-editorial mt-3 text-xl font-bold text-slate-950">
              All Tile Sentences Completed!
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Score: {tileScore.right} / {tileScore.total}
            </p>
            <button
              type="button"
              onClick={() => {
                setTileIdx(0);
                setPickedIndices([]);
                setTileSubmitted(false);
                setTileScore({ right: 0, total: 0 });
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </button>
          </div>
        ))}

      {/* ==================== SUB-MODE B: SELF-TYPE SENTENCE ==================== */}
      {subMode === 'type' &&
        (currentType ? (
          <form onSubmit={(e) => void handleCheckTyped(e)} className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
              <span>
                Prompt {typeIdx + 1} / {SELF_TYPE_SENTENCE_DRILLS.length}
              </span>
              <span>
                {typeScore.right}/{typeScore.total} exact
              </span>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(currentType.level)}`}
                  >
                    {currentType.level}
                  </span>
                  <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-900">
                    [{currentType.targetTag}]
                  </span>
                </div>
                {validation !== null && (
                  <button
                    type="button"
                    onClick={() => void speakGerman(currentType.targetSentence)}
                    aria-label="Listen to target sentence"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Base Words Prompt */}
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                  Build from Base Words
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-950">
                  {currentType.baseWords}
                </p>
                <p className="mt-1 text-xs text-stone-500">Meaning: “{currentType.english}”</p>
              </div>

              {/* Umlaut Quick-Bar */}
              {validation === null && (
                <div className="mt-4 mb-2 grid grid-cols-7 gap-1">
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

              <textarea
                ref={textAreaRef}
                rows={2}
                disabled={validation !== null}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type the full German sentence..."
                autoCorrect="off"
                spellCheck={false}
                className="w-full resize-none rounded-2xl border-2 border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-bold text-slate-950 placeholder:text-stone-400 focus:border-blue-700 focus:bg-white focus:outline-none disabled:opacity-75"
              />

              {/* Smart Offline Validation Feedback */}
              {validation && (
                <div
                  className={`mt-4 space-y-2.5 rounded-2xl border p-3.5 text-xs ${
                    validation.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-red-200 bg-red-50 text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-extrabold">
                    {validation.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                    )}
                    <span>{validation.headline}</span>
                  </div>

                  {!validation.isCorrect && (
                    <div className="rounded-xl bg-white/90 px-3 py-2 text-slate-950">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                        Target Sentence
                      </span>
                      <p className="mt-0.5 text-sm font-extrabold">{currentType.targetSentence}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {validation.checks.map((chk, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        {chk.type === 'ok' ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                        ) : chk.type === 'warn' ? (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-700" />
                        )}
                        <div>
                          <strong>{chk.label}:</strong> {chk.detail}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="border-t border-black/10 pt-2 text-[11px] opacity-90">
                    {currentType.explanation}
                  </p>
                  {!validation.isCorrect && <InlineMistakeNote mistakeId={typeMistakeId} />}
                </div>
              )}
            </div>

            {validation === null ? (
              <button
                type="submit"
                disabled={!typedText.trim()}
                className="w-full rounded-2xl bg-blue-700 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
              >
                Validate Sentence
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextTyped}
                className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
              >
                Next Prompt
              </button>
            )}
          </form>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-xs">
            <Trophy className="mx-auto h-10 w-10 text-emerald-700" />
            <h2 className="font-editorial mt-3 text-xl font-bold text-slate-950">
              All Self-Type Prompts Completed!
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Exact matches: {typeScore.right} / {typeScore.total}
            </p>
            <button
              type="button"
              onClick={() => {
                setTypeIdx(0);
                setTypedText('');
                setValidation(null);
                setTypeScore({ right: 0, total: 0 });
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </button>
          </div>
        ))}
    </div>
  );
};
