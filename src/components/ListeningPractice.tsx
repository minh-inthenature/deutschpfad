import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Play,
  Square,
  Headphones,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Turtle,
} from 'lucide-react';
import {
  db,
  logMistake,
  recordMistakeCorrect,
  recordStudyActivity,
  type CefrLevel,
  type GermanArticle,
  type ListeningLesson,
  type VocabItem,
} from '../db/database';
import {
  formatWordWithArticle,
  getArticleStyle,
  getLevelStyle,
  shuffleArray,
} from '../utils/german';
import {
  generateGeminiDialogueLesson,
  getAllListeningLessons,
  playLessonAudio,
  speakDe,
  stopAudio,
  type PlaybackSpeed,
} from '../services/audioService';
import { hasGeminiKey } from '../services/geminiTutor';

type ListeningSubMode = 'diktat' | 'recognition' | 'dialogue';

interface ListeningPracticeProps {
  levelFilter: 'ALL' | CefrLevel;
}

const UMLAUT_BAR = ['ä', 'ö', 'ü', 'ß'] as const;
const WAVE_BARS = [40, 75, 55, 95, 65, 85, 45, 90, 60, 80, 50, 70];

interface DiffSegment {
  char: string;
  status: 'match' | 'wrong' | 'missing';
}

function buildCharDiff(expected: string, actual: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  const maxLen = Math.max(expected.length, actual.length);
  for (let i = 0; i < maxLen; i++) {
    const expCh = expected[i];
    const actCh = actual[i];
    if (expCh !== undefined && actCh !== undefined) {
      if (expCh === actCh) {
        segments.push({ char: expCh, status: 'match' });
      } else {
        segments.push({ char: expCh, status: 'wrong' });
      }
    } else if (expCh !== undefined) {
      segments.push({ char: expCh, status: 'missing' });
    }
  }
  return segments;
}

export const ListeningPractice: React.FC<ListeningPracticeProps> = ({
  levelFilter,
}) => {
  const vocab = useLiveQuery(() => db.vocab.toArray(), []);

  const [subMode, setSubMode] = useState<ListeningSubMode>('diktat');
  const [speed, setSpeed] = useState<PlaybackSpeed>('normal');
  const [isPlaying, setIsPlaying] = useState(false);

  // Diktat state
  const [diktatIndex, setDiktatIndex] = useState(0);
  const [diktatUseSentence, setDiktatUseSentence] = useState(false);
  const [diktatInput, setDiktatInput] = useState('');
  const [diktatResult, setDiktatResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const diktatInputRef = useRef<HTMLInputElement | null>(null);

  // Article & Word Recognition state
  const [recIndex, setRecIndex] = useState(0);
  const [pickedArticle, setPickedArticle] = useState<GermanArticle | null>(null);
  const [pickedMeaning, setPickedMeaning] = useState<string | null>(null);

  // Mini-Dialogue state
  const [lessons, setLessons] = useState<ListeningLesson[]>([]);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [dialogueAnswers, setDialogueAnswers] = useState<Record<number, number>>({});
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    void getAllListeningLessons().then(setLessons);
    return () => {
      void stopAudio();
    };
  }, []);

  const filteredVocab = useMemo(() => {
    const list = (vocab ?? []).filter(
      (v) => levelFilter === 'ALL' || v.level === levelFilter,
    );
    const prioritized = [
      ...list.filter((v) => v.status !== 'new'),
      ...list.filter((v) => v.status === 'new'),
    ];
    return shuffleArray(prioritized.slice(0, 40));
  }, [vocab, levelFilter]);

  const nounDeck = useMemo(() => {
    const nouns = (vocab ?? []).filter(
      (v) =>
        v.article !== 'none' &&
        (levelFilter === 'ALL' || v.level === levelFilter),
    );
    return shuffleArray(nouns.slice(0, 40));
  }, [vocab, levelFilter]);

  const currentDiktat: VocabItem | undefined =
    filteredVocab[diktatIndex % Math.max(1, filteredVocab.length)];
  const currentRecNoun: VocabItem | undefined =
    nounDeck[recIndex % Math.max(1, nounDeck.length)];

  const meaningOptions = useMemo(() => {
    if (!currentRecNoun || !vocab) return [];
    const distractors = shuffleArray(
      vocab.filter(
        (v) => v.id !== currentRecNoun.id && v.meaning !== currentRecNoun.meaning,
      ),
    )
      .slice(0, 3)
      .map((v) => v.meaning);
    return shuffleArray([currentRecNoun.meaning, ...distractors]);
  }, [currentRecNoun, vocab]);

  const filteredLessons = useMemo(() => {
    if (levelFilter === 'ALL') return lessons;
    const match = lessons.filter((l) => l.level === levelFilter);
    return match.length > 0 ? match : lessons;
  }, [lessons, levelFilter]);

  const currentLesson: ListeningLesson | undefined =
    filteredLessons[lessonIndex % Math.max(1, filteredLessons.length)];

  const diktatExpected = currentDiktat
    ? diktatUseSentence
      ? currentDiktat.exampleDe
      : formatWordWithArticle(currentDiktat.article, currentDiktat.german)
    : '';

  const handleTogglePlay = async () => {
    if (isPlaying) {
      await stopAudio();
      setIsPlaying(false);
      setActiveLineIdx(null);
      return;
    }

    setIsPlaying(true);
    try {
      if (subMode === 'diktat' && diktatExpected) {
        await speakDe(diktatExpected, speed);
      } else if (subMode === 'recognition' && currentRecNoun) {
        await speakDe(
          formatWordWithArticle(currentRecNoun.article, currentRecNoun.german),
          speed,
        );
      } else if (subMode === 'dialogue' && currentLesson) {
        await playLessonAudio(currentLesson, speed, setActiveLineIdx);
      }
    } finally {
      setIsPlaying(false);
      setActiveLineIdx(null);
    }
  };

  const handleInsertUmlaut = (char: string) => {
    const el = diktatInputRef.current;
    if (!el) {
      setDiktatInput((prev) => prev + char);
      return;
    }
    const start = el.selectionStart ?? diktatInput.length;
    const end = el.selectionEnd ?? diktatInput.length;
    const next = diktatInput.slice(0, start) + char + diktatInput.slice(end);
    setDiktatInput(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  };

  const handleCheckDiktat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDiktat || diktatResult !== 'idle' || !diktatInput.trim()) return;

    const cleanActual = diktatInput.trim();
    const cleanExpected = diktatExpected.trim();
    const isExact =
      cleanActual.localeCompare(cleanExpected, 'de', { sensitivity: 'case' }) === 0 ||
      cleanActual.toLowerCase() === cleanExpected.toLowerCase();

    setDiktatResult(isExact ? 'correct' : 'wrong');

    if (currentDiktat.id) {
      if (isExact) {
        await recordMistakeCorrect({
          vocabId: currentDiktat.id,
          mistakeType: 'Spelling',
        });
      } else {
        await logMistake({
          vocabId: currentDiktat.id,
          itemTitle: formatWordWithArticle(currentDiktat.article, currentDiktat.german),
          mistakeType: 'Spelling',
          lastWrongAnswer: cleanActual,
          correctAnswer: cleanExpected,
        });
      }
    }
    await recordStudyActivity({ reviewsCompleted: 1 });
  };

  const handleNextDiktat = () => {
    void stopAudio();
    setIsPlaying(false);
    setDiktatInput('');
    setDiktatResult('idle');
    setDiktatIndex((i) => i + 1);
  };

  const handlePickRecognition = async (
    article: GermanArticle | null,
    meaning: string | null,
  ) => {
    if (!currentRecNoun) return;
    const nextArt = article ?? pickedArticle;
    const nextMean = meaning ?? pickedMeaning;
    if (article !== null && !pickedArticle) setPickedArticle(article);
    if (meaning !== null && !pickedMeaning) setPickedMeaning(meaning);

    if (nextArt && nextMean && !(pickedArticle && pickedMeaning)) {
      const ok =
        nextArt === currentRecNoun.article && nextMean === currentRecNoun.meaning;
      if (currentRecNoun.id) {
        if (ok) {
          await recordMistakeCorrect({
            vocabId: currentRecNoun.id,
            mistakeType: 'Article',
          });
        } else {
          await logMistake({
            vocabId: currentRecNoun.id,
            itemTitle: currentRecNoun.german,
            mistakeType: 'Article',
            lastWrongAnswer: `${nextArt} · ${nextMean}`,
            correctAnswer: `${currentRecNoun.article} (${currentRecNoun.meaning})`,
          });
        }
      }
      await recordStudyActivity({ reviewsCompleted: 1 });
    }
  };

  const handleNextRec = () => {
    void stopAudio();
    setIsPlaying(false);
    setPickedArticle(null);
    setPickedMeaning(null);
    setRecIndex((i) => i + 1);
  };

  const handleGenerateAiDialogue = async () => {
    setGeneratingAi(true);
    setAiError(null);
    try {
      const lvl: CefrLevel = levelFilter === 'ALL' ? 'A1' : levelFilter;
      const created = await generateGeminiDialogueLesson(lvl);
      const updated = await getAllListeningLessons();
      setLessons(updated);
      const idx = updated.findIndex((l) => l.cacheKey === created.cacheKey);
      setLessonIndex(idx >= 0 ? idx : 0);
      setDialogueAnswers({});
      setShowTranscript(false);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Could not generate AI dialogue.',
      );
    } finally {
      setGeneratingAi(false);
    }
  };

  const recognitionDone = Boolean(pickedArticle && pickedMeaning);

  return (
    <div className="space-y-4">
      {/* Sub-mode Segmented Selector */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-stone-200 bg-white p-1 shadow-2xs">
        {(
          [
            { id: 'diktat', label: 'Diktat' },
            { id: 'recognition', label: 'Article & Word' },
            { id: 'dialogue', label: 'Dialogue' },
          ] as const
        ).map((tab) => {
          const active = subMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                void stopAudio();
                setIsPlaying(false);
                setSubMode(tab.id);
              }}
              className={`rounded-xl px-2 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Minimalist Audio Player Card */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
            <Headphones className="h-3.5 w-3.5" />
            Hörverstehen ·{' '}
            {subMode === 'diktat'
              ? 'Diktat'
              : subMode === 'recognition'
                ? 'Recognition'
                : 'Mini-Dialogue'}
          </span>

          <button
            type="button"
            onClick={() => setSpeed((s) => (s === 'normal' ? 'slow' : 'normal'))}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition active:scale-95 ${
              speed === 'slow'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-stone-200 bg-stone-50 text-stone-700'
            }`}
          >
            <Turtle className="h-3.5 w-3.5" />
            {speed === 'slow' ? '0.75× Slow' : '1.0× Normal'}
          </button>
        </div>

        {/* Central Play Button + CSS Waveform */}
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleTogglePlay()}
            aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition active:scale-95 ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-800 hover:bg-blue-900'
            }`}
          >
            {isPlaying ? (
              <Square className="h-5 w-5 fill-current" />
            ) : (
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            )}
          </button>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex h-9 items-center gap-1.5">
              {WAVE_BARS.map((height, idx) => (
                <span
                  key={idx}
                  style={{
                    height: isPlaying ? `${height}%` : `${Math.max(22, height * 0.45)}%`,
                    animationDelay: `${idx * 70}ms`,
                  }}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'animate-pulse bg-blue-700'
                      : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] font-medium text-stone-500">
              {isPlaying
                ? 'Playing German audio (de-DE)…'
                : 'Tap Play to listen before answering'}
            </p>
          </div>
        </div>
      </section>

      {/* Mode 1: Dictation ("Diktat") */}
      {subMode === 'diktat' && currentDiktat && (
        <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getLevelStyle(
                currentDiktat.level,
              )}`}
            >
              {currentDiktat.level} · {currentDiktat.topic}
            </span>
            <button
              type="button"
              onClick={() => {
                setDiktatUseSentence((v) => !v);
                setDiktatInput('');
                setDiktatResult('idle');
              }}
              className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-bold text-stone-600 transition hover:bg-stone-100"
            >
              {diktatUseSentence ? 'Switch to Word' : 'Switch to Sentence'}
            </button>
          </div>

          <p className="text-xs font-medium text-stone-500">
            Meaning hint:{' '}
            <span className="font-semibold text-slate-800">
              {diktatUseSentence ? currentDiktat.exampleEn : currentDiktat.meaning}
            </span>
          </p>

          <form onSubmit={(e) => void handleCheckDiktat(e)} className="space-y-2.5">
            <input
              ref={diktatInputRef}
              type="text"
              value={diktatInput}
              onChange={(e) => setDiktatInput(e.target.value)}
              disabled={diktatResult !== 'idle'}
              placeholder="Type what you hear in German..."
              className="w-full rounded-2xl border border-stone-200 bg-[#faf9f6] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-700 disabled:opacity-75"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {UMLAUT_BAR.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    disabled={diktatResult !== 'idle'}
                    onClick={() => handleInsertUmlaut(ch)}
                    className="h-9 w-9 rounded-xl border border-stone-200 bg-stone-50 text-sm font-bold text-slate-800 transition hover:bg-stone-100 active:scale-95 disabled:opacity-50"
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {diktatResult === 'idle' ? (
                <button
                  type="submit"
                  disabled={!diktatInput.trim()}
                  className="rounded-xl bg-blue-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-900 disabled:opacity-50"
                >
                  Check
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextDiktat}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {diktatResult !== 'idle' && (
            <div
              className={`rounded-2xl border p-3.5 ${
                diktatResult === 'correct'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-red-200 bg-red-50 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                {diktatResult === 'correct' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Perfekt! Exact match.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-700" />
                    <span>Logged to Mistake Notebook · Expected:</span>
                  </>
                )}
              </div>

              <p className="mt-2 font-editorial text-base font-bold tracking-wide">
                {diktatResult === 'correct'
                  ? diktatExpected
                  : buildCharDiff(diktatExpected.trim(), diktatInput.trim()).map(
                      (seg, i) => (
                        <span
                          key={i}
                          className={
                            seg.status === 'match'
                              ? 'text-emerald-800'
                              : seg.status === 'wrong'
                                ? 'rounded bg-red-200/80 px-0.5 text-red-950 underline decoration-red-600'
                                : 'rounded bg-amber-200/80 px-0.5 text-amber-950'
                          }
                        >
                          {seg.char}
                        </span>
                      ),
                    )}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Mode 2: Article & Word Recognition */}
      {subMode === 'recognition' && currentRecNoun && (
        <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getLevelStyle(
                currentRecNoun.level,
              )}`}
            >
              {currentRecNoun.level} · Listen &amp; Identify
            </span>
            {recognitionDone && (
              <button
                type="button"
                onClick={handleNextRec}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              1. Tap the Article You Hear
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['der', 'die', 'das'] as const).map((art) => {
                const style = getArticleStyle(art);
                const selected = pickedArticle === art;
                const showFeedback = Boolean(pickedArticle);
                const isCorrect = currentRecNoun.article === art;
                return (
                  <button
                    key={art}
                    type="button"
                    disabled={Boolean(pickedArticle)}
                    onClick={() => void handlePickRecognition(art, null)}
                    className={`rounded-2xl border py-2.5 text-sm font-extrabold transition ${
                      showFeedback && isCorrect
                        ? style.solid
                        : showFeedback && selected
                          ? 'border-red-400 bg-red-100 text-red-900'
                          : `${style.badge} hover:opacity-90`
                    }`}
                  >
                    {art}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              2. Tap the Meaning
            </p>
            <div className="grid grid-cols-1 gap-2">
              {meaningOptions.map((opt) => {
                const selected = pickedMeaning === opt;
                const showFeedback = Boolean(pickedMeaning);
                const isCorrect = opt === currentRecNoun.meaning;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={Boolean(pickedMeaning)}
                    onClick={() => void handlePickRecognition(null, opt)}
                    className={`rounded-2xl border px-4 py-2.5 text-left text-xs font-bold transition ${
                      showFeedback && isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                        : showFeedback && selected
                          ? 'border-red-400 bg-red-50 text-red-900'
                          : 'border-stone-200 bg-[#faf9f6] text-slate-800 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {recognitionDone && (
            <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Revealed Word
              </p>
              <p className="mt-1 font-editorial text-lg font-bold text-slate-950">
                {formatWordWithArticle(currentRecNoun.article, currentRecNoun.german)}
              </p>
              <p className="text-xs text-stone-600">
                Plural: {currentRecNoun.plural} · {currentRecNoun.meaning}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Mode 3: Mini-Dialogue Comprehension */}
      {subMode === 'dialogue' && currentLesson && (
        <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getLevelStyle(
                  currentLesson.level,
                )}`}
              >
                {currentLesson.level} ·{' '}
                {currentLesson.source === 'gemini' ? 'Cached AI Audio' : 'Offline Preset'}
              </span>
              <h3 className="mt-1.5 font-editorial text-base font-bold text-slate-950">
                {currentLesson.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  void stopAudio();
                  setIsPlaying(false);
                  setLessonIndex((i) => i + 1);
                  setDialogueAnswers({});
                  setShowTranscript(false);
                }}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-stone-100"
              >
                Next
              </button>
              {hasGeminiKey() && (
                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={() => void handleGenerateAiDialogue()}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-800 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs disabled:opacity-60"
                >
                  {generatingAi ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  New AI
                </button>
              )}
            </div>
          </div>

          {aiError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
              {aiError}
            </p>
          )}

          {/* Spoiler Transcript Drawer */}
          <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-3">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-bold text-slate-800"
            >
              <span className="inline-flex items-center gap-1.5">
                {showTranscript ? (
                  <EyeOff className="h-3.5 w-3.5 text-blue-700" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-blue-700" />
                )}
                {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
              </span>
              <span className="text-[11px] text-stone-500">
                {currentLesson.lines.length} lines
              </span>
            </button>

            {showTranscript && (
              <div className="mt-3 space-y-2 border-t border-stone-200 pt-2.5">
                {currentLesson.lines.map((line, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-2.5 py-2 text-xs transition ${
                      activeLineIdx === i
                        ? 'bg-blue-50 ring-1 ring-blue-300'
                        : 'bg-white'
                    }`}
                  >
                    <p className="font-bold text-slate-900">
                      <span className="text-blue-800">{line.speaker}:</span>{' '}
                      {line.de}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">{line.en}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2 Comprehension Questions */}
          <div className="space-y-3">
            {currentLesson.questions.map((q, qIdx) => {
              const picked = dialogueAnswers[qIdx];
              const answered = picked !== undefined;
              return (
                <div key={qIdx} className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-900">
                    {qIdx + 1}. {q.prompt}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      const isPicked = picked === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            setDialogueAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
                            void recordStudyActivity({ reviewsCompleted: 1 });
                          }}
                          className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                            answered && isCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                              : answered && isPicked
                                ? 'border-red-400 bg-red-50 text-red-900'
                                : 'border-stone-200 bg-white text-slate-800 hover:bg-stone-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
