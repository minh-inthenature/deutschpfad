import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Info,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { db, recordStudyActivity, type CefrLevel, type VocabItem } from '../db/database';
import {
  formatWordWithArticle,
  getArticleStyle,
  getLevelStyle,
  shuffleArray,
  speakGerman,
} from '../utils/german';
import { AiWordPackModal } from '../components/AiWordPackModal';
import { deleteCustomWord } from '../services/customWords';
import { hasGeminiKey } from '../services/geminiTutor';

export const LearnView: React.FC = () => {
  const allVocab = useLiveQuery(() => db.vocab.toArray(), []);
  const allVocabRef = useRef<VocabItem[]>([]);
  if (allVocab && allVocab.length > 0) {
    allVocabRef.current = allVocab;
  }

  const [levelFilter, setLevelFilter] = useState<'ALL' | CefrLevel>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');
  const [cardIndex, setCardIndex] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [justAddedWord, setJustAddedWord] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean>(() => hasGeminiKey());
  const [aiPackModalOpen, setAiPackModalOpen] = useState(false);
  const [aiPackToast, setAiPackToast] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const syncKey = () => setAiAvailable(hasGeminiKey());
    window.addEventListener('focus', syncKey);
    window.addEventListener('storage', syncKey);
    const id = window.setInterval(syncKey, 1500);
    return () => {
      window.removeEventListener('focus', syncKey);
      window.removeEventListener('storage', syncKey);
      window.clearInterval(id);
    };
  }, []);

  const availableTopics = useMemo(() => {
    const list = allVocabRef.current.length > 0 ? allVocabRef.current : (allVocab ?? []);
    const scoped = levelFilter === 'ALL' ? list : list.filter((w) => w.level === levelFilter);
    const set = new Set<string>();
    for (const w of scoped) {
      if (w.topic) set.add(w.topic);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
  }, [allVocab, levelFilter]);

  // Compute sessionDeck via useMemo whenever:
  // - Learn screen mounts (initial load when allVocab length becomes > 0)
  // - selectedLevel changes
  // - selectedTopic changes
  // - shuffleSeed increments
  // Note: learnedIds is NOT in the useMemo dependencies so tapping Start Practicing
  // or Skip/Next does NOT re-shuffle the deck mid-session!
  const sessionDeck = useMemo(() => {
    const list = allVocabRef.current.length > 0 ? allVocabRef.current : (allVocab ?? []);
    if (list.length === 0) return [];

    const filtered = list.filter((w) => {
      if (levelFilter !== 'ALL' && w.level !== levelFilter) return false;
      if (topicFilter !== 'ALL' && w.topic !== topicFilter) return false;
      return true;
    });

    // Partition into unlearned words (!learnedIds.has(w.id)) and already-learned words
    const learnedIds = new Set(
      list.filter((w) => w.status !== 'new' && w.id != null).map((w) => w.id!)
    );

    const unlearnedWords = filtered.filter((w) => !learnedIds.has(w.id!));
    const learnedWords = filtered.filter((w) => learnedIds.has(w.id!));

    return [...shuffleArray(unlearnedWords), ...shuffleArray(learnedWords)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, topicFilter, shuffleSeed, allVocab ? allVocab.length : 0]);

  const safeIndex = sessionDeck.length > 0 ? Math.min(cardIndex, sessionDeck.length - 1) : 0;
  const currentCard: VocabItem | undefined = sessionDeck[safeIndex];

  const handleSelectLevel = (lvl: 'ALL' | CefrLevel) => {
    setLevelFilter(lvl);
    setTopicFilter('ALL');
    setCardIndex(0);
  };

  const handleSelectTopic = (topic: string) => {
    setTopicFilter(topic);
    setCardIndex(0);
  };

  const handleShuffle = () => {
    setShuffleSeed((prev) => prev + 1);
    setCardIndex(0);
  };

  const goPrev = () => {
    if (sessionDeck.length <= 1) return;
    setCardIndex((prev) => (prev <= 0 ? sessionDeck.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (sessionDeck.length <= 1) return;
    setCardIndex((prev) => (prev >= sessionDeck.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const delta = e.touches[0].clientX - touchStartXRef.current;
    setDragOffsetX(Math.max(-90, Math.min(90, delta)));
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    if (dragOffsetX < -48) {
      goNext();
    } else if (dragOffsetX > 48) {
      goPrev();
    }
    touchStartXRef.current = null;
    setDragOffsetX(0);
  };

  const handleStartPracticing = async (item: VocabItem) => {
    if (!item.id) return;
    const label = formatWordWithArticle(item.article, item.german);
    await db.vocab.update(item.id, {
      status: 'learning',
      intervalDays: 0,
      nextReviewAt: Date.now(),
    });
    await recordStudyActivity({ wordsLearned: 1, minutesStudied: 1 });
    setJustAddedWord(label);
    window.setTimeout(() => {
      setJustAddedWord((cur) => (cur === label ? null : cur));
    }, 2200);
  };

  const posLabel = (item: VocabItem): string => {
    if (item.article !== 'none') return getArticleStyle(item.article).label;
    switch (item.partOfSpeech) {
      case 'verb':
        return 'verb';
      case 'adjective':
        return 'adjective';
      case 'phrase':
        return 'phrase';
      default:
        return 'noun';
    }
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-6">
      {/* Header */}
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-editorial text-2xl font-bold tracking-tight text-slate-950">
            Learn New Words
          </h1>
          <p className="text-xs text-stone-500">
            Swipe or tap through cards · Add words to your review deck
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {aiAvailable && (
            <button
              type="button"
              onClick={() => setAiPackModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-800 shadow-2xs transition active:scale-95"
            >
              <Sparkles className="h-3 w-3" />
              ✨ + AI Words
            </button>
          )}
          <div className="flex items-center gap-1 text-[10px] font-extrabold">
            <span className="rounded bg-blue-700 px-1.5 py-0.5 text-white">der</span>
            <span className="rounded bg-red-700 px-1.5 py-0.5 text-white">die</span>
            <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-white">das</span>
          </div>
        </div>
      </header>

      {/* CEFR Level Bar */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {(['ALL', 'A0', 'A1', 'A2', 'B1'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => handleSelectLevel(lvl)}
              className={`rounded-full px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                levelFilter === lvl
                  ? 'bg-slate-950 text-white'
                  : 'border border-stone-200 bg-white text-slate-700'
              }`}
            >
              {lvl === 'ALL' ? 'All' : lvl}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleShuffle}
            aria-label="Shuffle deck"
            title="Shuffle deck"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-2xs transition active:scale-90 hover:bg-stone-50"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
          <span className="whitespace-nowrap text-xs font-bold text-stone-500 tabular-nums">
            {sessionDeck.length > 0 ? `${safeIndex + 1} / ${sessionDeck.length}` : '0 words'}
          </span>
        </div>
      </div>

      {/* Topic Filter Pills */}
      {availableTopics.length > 0 && (
        <div className="no-scrollbar mb-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleSelectTopic('ALL')}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
              topicFilter === 'ALL'
                ? 'bg-blue-700 text-white'
                : 'border border-stone-200 bg-white text-stone-600'
            }`}
          >
            All Topics
          </button>
          {availableTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handleSelectTopic(topic)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                topicFilter === topic
                  ? 'bg-blue-700 text-white'
                  : 'border border-stone-200 bg-white text-stone-600'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Confirmation Banner */}
      {aiPackToast && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-900">
          <Sparkles className="h-4 w-4 shrink-0 text-blue-700" />
          <span>{aiPackToast}</span>
        </div>
      )}

      {justAddedWord && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          <span>
            Added <strong>{justAddedWord}</strong> to Test!
          </span>
        </div>
      )}

      {/* Swipeable Flashcard */}
      {currentCard ? (
        <div className="space-y-4">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateX(${dragOffsetX}px) rotate(${dragOffsetX * 0.03}deg)`,
              transition: dragOffsetX === 0 ? 'transform 200ms ease-out' : 'none',
            }}
            className="select-none rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            {/* Top Meta Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs font-extrabold ${getArticleStyle(currentCard.article).solid}`}
                >
                  {posLabel(currentCard)}
                </span>
                <span
                  className={`rounded-lg border px-2 py-1 text-[11px] font-extrabold ${getLevelStyle(currentCard.level)}`}
                >
                  {currentCard.level}
                </span>
                {currentCard.isCustom && (
                  <>
                    <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-extrabold text-blue-800">
                      ✨ Custom
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteCustomWord({
                          word: currentCard.word ?? currentCard.german,
                          article: currentCard.article,
                          vocabId: currentCard.id,
                        }).then(() => {
                          setCardIndex((prev) =>
                            sessionDeck.length <= 1 ? 0 : Math.min(prev, sessionDeck.length - 2),
                          );
                        });
                      }}
                      aria-label="Delete custom word"
                      title="Delete custom word"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {currentCard.status !== 'new' && (
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-800">
                    Learned
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void speakGerman(formatWordWithArticle(currentCard.article, currentCard.german))
                }
                aria-label="Listen to pronunciation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 shadow-2xs transition active:scale-90"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            {/* Word & Meaning */}
            <div className="my-5 border-b border-stone-100 pb-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
                {currentCard.topic}
              </p>
              <h2 className="font-editorial mt-1.5 text-3xl font-bold tracking-tight text-slate-950">
                {currentCard.article !== 'none' && (
                  <span className={`mr-1.5 ${getArticleStyle(currentCard.article).text}`}>
                    {currentCard.article}
                  </span>
                )}
                {currentCard.german}
              </h2>
              <p className="mt-2 text-lg font-semibold text-slate-700">{currentCard.meaning}</p>

              {/* Morphology Chips: Plural / Verb Forms / Adjective Forms / Grammar Note */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {currentCard.plural && currentCard.plural !== '—' && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1 text-xs">
                    <span className="font-semibold text-stone-500">Plural:</span>
                    <span className="font-bold text-slate-900">{currentCard.plural}</span>
                  </div>
                )}

                {currentCard.verbForms && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs">
                    <span className="font-semibold text-blue-700">Forms:</span>
                    <span className="font-bold text-slate-900">{currentCard.verbForms}</span>
                  </div>
                )}

                {currentCard.adjectiveForms && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs">
                    <span className="font-semibold text-emerald-800">Steigerung:</span>
                    <span className="font-bold text-slate-900">{currentCard.adjectiveForms}</span>
                  </div>
                )}

                {currentCard.grammarNote && (
                  <div className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>{currentCard.grammarNote}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Example Sentence */}
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                    In Context
                  </p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-slate-900">
                    {currentCard.exampleDe}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    {currentCard.exampleEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void speakGerman(currentCard.exampleDe)}
                  aria-label="Listen to example sentence"
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 transition active:scale-90"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action + Swipe/Tap Navigation */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => void handleStartPracticing(currentCard)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              {currentCard.status === 'new' ? (
                <>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Start Practicing
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  In Review Deck · Practice Again
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={goPrev}
                disabled={sessionDeck.length <= 1}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white py-3 text-xs font-bold text-slate-800 transition active:scale-[0.98] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={sessionDeck.length <= 1}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white py-3 text-xs font-bold text-slate-800 transition active:scale-[0.98] disabled:opacity-40"
              >
                Skip / Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="font-editorial mt-4 text-xl font-bold text-slate-950">
            All Caught Up!
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            {levelFilter === 'ALL' && topicFilter === 'ALL'
              ? 'Every word is already in your active practice deck. Head to Test to review!'
              : 'No remaining new words match this level and topic filter.'}
          </p>
          {(levelFilter !== 'ALL' || topicFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setLevelFilter('ALL');
                setTopicFilter('ALL');
                setCardIndex(0);
              }}
              className="mt-4 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white active:scale-95"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      <AiWordPackModal
        open={aiPackModalOpen}
        onClose={() => setAiPackModalOpen(false)}
        existingTopics={availableTopics}
        onWordsAdded={(addedCount, lvl, addedTopic) => {
          setAiPackToast(
            addedCount > 0
              ? `Added ${addedCount} new ${lvl} words to your deck!`
              : 'All generated words were already in your deck.',
          );
          window.setTimeout(() => setAiPackToast(null), 4000);
          if (addedCount > 0) {
            setLevelFilter(lvl);
            setTopicFilter(addedTopic);
            setCardIndex(0);
            setShuffleSeed((p) => p + 1);
          }
        }}
      />
    </div>
  );
};
