import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search,
  X,
  Star,
  Clock,
  BookOpen,
  ChevronRight,
  Trash2,
  Globe,
  WifiOff,
  Sparkles,
  Volume2,
  BookmarkPlus,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  db,
  recordRecentLookup,
  upsertDictionaryCache,
  type DictionaryEntry,
  type PartOfSpeech,
  type VocabItem,
} from '../db/database';
import {
  AiEnrichIconButton,
  EditCardIconButton,
  type EnrichButtonState,
} from '../components/CardIconButtons';
import { CardEditSheet } from '../components/CardEditSheet';
import { enrichDictionaryEntry } from '../services/cardEnrichService';
import {
  fetchAndCacheLiveLookup,
  searchLocalDictionary,
  vocabItemToDictionaryEntry,
} from '../services/dictionaryApi';
import { DictionaryDetailSheet } from '../components/DictionaryDetailSheet';
import { AiWordPackModal } from '../components/AiWordPackModal';
import {
  addCustomWords,
  deleteCustomWord,
  type CustomWordInput,
} from '../services/customWords';
import { defineWordWithAI, hasGeminiKey } from '../services/geminiTutor';
import { getArticleStyle, getLevelStyle, speakGerman } from '../utils/german';

type DictFilter = 'all' | 'noun' | 'verb' | 'adjective' | 'custom' | 'favorites';

const UMLAUT_BAR = ['ä', 'ö', 'ü', 'ß'] as const;

export const DictionaryView: React.FC = () => {
  const cachedEntries = useLiveQuery(
    () => db.dictionaryCache.orderBy('cachedAt').reverse().toArray(),
    [],
  );
  const vocabEntries = useLiveQuery(() => db.vocab.toArray(), []);
  const recentLookups = useLiveQuery(
    () => db.recentLookups.orderBy('lookedUpAt').reverse().toArray(),
    [],
  );

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DictFilter>('all');
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [editingVocabCard, setEditingVocabCard] = useState<VocabItem | null>(null);
  const [rowEnrichStates, setRowEnrichStates] = useState<Record<string, EnrichButtonState>>({});

  const [localHits, setLocalHits] = useState<
    { entry: DictionaryEntry; score: number; matchedAlias?: string }[]
  >([]);
  const [liveHits, setLiveHits] = useState<DictionaryEntry[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // AI Word Pack & Smart Dictionary Define state
  const [aiAvailable, setAiAvailable] = useState<boolean>(() => hasGeminiKey());
  const [aiPackModalOpen, setAiPackModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [aiDefining, setAiDefining] = useState(false);
  const [aiDefinedWord, setAiDefinedWord] = useState<CustomWordInput | null>(null);
  const [aiDefineError, setAiDefineError] = useState<string | null>(null);
  const [aiSaved, setAiSaved] = useState(false);

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const customWordKeys = useMemo(() => {
    const set = new Set<string>();
    for (const v of vocabEntries ?? []) {
      if (v.isCustom) {
        set.add(`${(v.word ?? v.german).toLowerCase()}|${v.article.toLowerCase()}`);
      }
    }
    return set;
  }, [vocabEntries]);

  const existingTopics = useMemo(() => {
    const set = new Set<string>();
    for (const v of vocabEntries ?? []) {
      if (v.topic) set.add(v.topic);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
  }, [vocabEntries]);

  const handleAskAiDefine = async () => {
    const trimmed = query.trim();
    if (!trimmed || aiDefining) return;
    setAiDefining(true);
    setAiDefineError(null);
    setAiDefinedWord(null);
    setAiSaved(false);
    try {
      const def = await defineWordWithAI(trimmed);
      setAiDefinedWord(def);
    } catch (err) {
      setAiDefineError(err instanceof Error ? err.message : 'AI lookup failed.');
    } finally {
      setAiDefining(false);
    }
  };

  const handleSaveAiWord = async () => {
    if (!aiDefinedWord || aiSaved) return;
    const { added } = await addCustomWords([aiDefinedWord]);
    setAiSaved(true);
    if (added.length > 0) {
      showToast(`Saved "${aiDefinedWord.word}" to your deck!`);
      // Refresh local search hits immediately
      void searchLocalDictionary(query.trim()).then(setLocalHits);
    } else {
      showToast(`"${aiDefinedWord.word}" is already in your deck.`);
    }
  };

  // Track browser online / offline state live
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Instant local search + 350ms debounced online Wiktionary/MyMemory lookup
  useEffect(() => {
    setAiDefinedWord(null);
    setAiDefineError(null);
    setAiSaved(false);
    const trimmed = query.trim();
    if (!trimmed) {
      setLocalHits([]);
      setLiveHits([]);
      setIsFetchingLive(false);
      return;
    }

    let cancelled = false;

    // 1. Instant local search in Dexie (dictionaryCache + vocab)
    void searchLocalDictionary(trimmed).then((hits) => {
      if (!cancelled) setLocalHits(hits);
    });

    // 2. Debounced (350ms) live lookup when online
    if (!isOnline || trimmed.length < 2) {
      setLiveHits([]);
      setIsFetchingLive(false);
      return;
    }

    const controller = new AbortController();
    setIsFetchingLive(true);

    const timer = window.setTimeout(() => {
      void fetchAndCacheLiveLookup(trimmed, controller.signal)
        .then((fetched) => {
          if (!cancelled) {
            setLiveHits(fetched);
            setIsFetchingLive(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsFetchingLive(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOnline]);

  const cachedById = useMemo(() => {
    const map = new Map<number, DictionaryEntry>();
    for (const e of cachedEntries ?? []) {
      if (e.id !== undefined) map.set(e.id, e);
    }
    return map;
  }, [cachedEntries]);

  const favorites = useMemo(() => {
    return (cachedEntries ?? [])
      .filter((e) => e.isFavorite)
      .sort((a, b) => a.german.localeCompare(b.german, 'de'));
  }, [cachedEntries]);

  const recentEntries = useMemo(() => {
    const list: DictionaryEntry[] = [];
    for (const r of recentLookups ?? []) {
      const found = cachedById.get(r.dictId);
      if (found) list.push(found);
    }
    return list;
  }, [recentLookups, cachedById]);

  // Browse list when search is empty and a category filter (Nouns / Verbs / Adjectives / Custom / Favorites) is active
  const browseCategoryList = useMemo(() => {
    if (filter === 'favorites') return favorites;
    if (filter === 'custom') {
      return (vocabEntries ?? [])
        .filter((v) => v.isCustom)
        .map((v) => vocabItemToDictionaryEntry(v))
        .sort((a, b) => a.german.localeCompare(b.german, 'de'));
    }
    if (filter === 'all') return [];
    const byKey = new Map<string, DictionaryEntry>();
    for (const c of cachedEntries ?? []) {
      if (c.partOfSpeech === filter) {
        byKey.set(`${c.german.toLowerCase()}|${c.partOfSpeech}`, c);
      }
    }
    for (const v of vocabEntries ?? []) {
      const converted = vocabItemToDictionaryEntry(v);
      if (converted.partOfSpeech === filter) {
        const key = `${converted.german.toLowerCase()}|${converted.partOfSpeech}`;
        if (!byKey.has(key)) byKey.set(key, converted);
      }
    }
    return Array.from(byKey.values()).slice(0, 60);
  }, [filter, favorites, cachedEntries, vocabEntries]);

  // Merge local hits + live fetched hits cleanly (deduplicated)
  const mergedSearchResults = useMemo(() => {
    const applyFilter = (e: DictionaryEntry) => {
      if (filter === 'favorites') return e.isFavorite;
      if (filter === 'custom') {
        return customWordKeys.has(
          `${e.german.toLowerCase()}|${e.article.toLowerCase()}`,
        );
      }
      if (filter === 'all') return true;
      return e.partOfSpeech === filter;
    };

    const byKey = new Map<
      string,
      { entry: DictionaryEntry; matchedAlias?: string; isLive?: boolean }
    >();

    for (const hit of localHits) {
      if (!applyFilter(hit.entry)) continue;
      const key = `${hit.entry.german.toLowerCase()}|${hit.entry.partOfSpeech}`;
      byKey.set(key, { entry: hit.entry, matchedAlias: hit.matchedAlias });
    }

    for (const live of liveHits) {
      if (!applyFilter(live)) continue;
      const key = `${live.german.toLowerCase()}|${live.partOfSpeech}`;
      if (!byKey.has(key)) {
        byKey.set(key, { entry: live, isLive: true });
      }
    }

    return Array.from(byKey.values());
  }, [localHits, liveHits, filter]);

  const handleOpenEntry = async (entry: DictionaryEntry) => {
    let persisted = entry;
    if (entry.id === undefined) {
      const { id: _ignore, ...rest } = entry;
      persisted = await upsertDictionaryCache(rest);
    }
    setSelectedEntry(persisted);
    if (persisted.id !== undefined) {
      await recordRecentLookup(persisted.id, persisted.german);
    }
  };

  const handleJumpToWord = async (germanWord: string) => {
    setSelectedEntry(null);
    setQuery(germanWord);
  };

  const insertUmlaut = (ch: string) => {
    const el = inputRef.current;
    if (!el) {
      setQuery((prev) => prev + ch);
      return;
    }
    const start = el.selectionStart ?? query.length;
    const end = el.selectionEnd ?? query.length;
    const next = query.slice(0, start) + ch + query.slice(end);
    setQuery(next);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  const clearRecents = async () => {
    await db.recentLookups.clear();
  };

  const isSearchEmpty = query.trim().length === 0;

  const handleDeleteCustomEntry = async (
    e: React.MouseEvent,
    entry: DictionaryEntry,
  ) => {
    e.stopPropagation();
    await deleteCustomWord({
      word: entry.german,
      article: entry.article,
    });
    showToast(`Deleted "${entry.german}" from your custom deck.`);
    if (query.trim()) {
      void searchLocalDictionary(query.trim()).then(setLocalHits);
    }
  };

  const handleEnrichRow = async (e: React.MouseEvent, entry: DictionaryEntry) => {
    e.stopPropagation();
    const rowKey = `${entry.german.toLowerCase()}|${entry.partOfSpeech}`;
    setRowEnrichStates((prev) => ({ ...prev, [rowKey]: 'loading' }));
    try {
      const updated = await enrichDictionaryEntry(entry);
      setRowEnrichStates((prev) => ({ ...prev, [rowKey]: 'success' }));
      showToast(`Enriched "${updated.german}"`);
      if (query.trim()) {
        void searchLocalDictionary(query.trim()).then(setLocalHits);
      }
      setTimeout(() => {
        setRowEnrichStates((prev) => ({ ...prev, [rowKey]: 'idle' }));
      }, 1200);
    } catch (err) {
      setRowEnrichStates((prev) => ({ ...prev, [rowKey]: 'idle' }));
      showToast(err instanceof Error ? err.message : 'AI enrichment failed.');
    }
  };

  const handleEditRow = async (e: React.MouseEvent, entry: DictionaryEntry) => {
    e.stopPropagation();
    const existing = await db.vocab
      .where('german')
      .equalsIgnoreCase(entry.german.trim())
      .first();
    if (existing) {
      setEditingVocabCard(existing);
      return;
    }
    const mappedPos: PartOfSpeech =
      entry.partOfSpeech === 'noun' ||
      entry.partOfSpeech === 'verb' ||
      entry.partOfSpeech === 'adjective'
        ? entry.partOfSpeech
        : 'phrase';
    const firstEx = entry.examples?.[0];
    const newItem: VocabItem = {
      german: entry.german,
      word: entry.german,
      article: entry.article,
      plural: entry.plural || '—',
      meaning: entry.english,
      exampleDe: firstEx?.de || '',
      exampleEn: firstEx?.en || '',
      level: entry.level === 'B2' ? 'B1' : entry.level,
      topic: 'Dictionary',
      partOfSpeech: mappedPos,
      isCustom: true,
      status: 'new',
      easeFactor: 2.5,
      intervalDays: 0,
      nextReviewAt: Date.now(),
    };
    const id = await db.vocab.add(newItem);
    setEditingVocabCard({ ...newItem, id });
  };

  const renderEntryRow = (
    entry: DictionaryEntry,
    matchedAlias?: string,
    isLive?: boolean,
  ) => {
    const art = getArticleStyle(entry.article);
    const isCustomEntry = customWordKeys.has(
      `${entry.german.toLowerCase()}|${entry.article.toLowerCase()}`,
    );
    return (
      <div
        key={entry.id ?? `${entry.german}-${entry.partOfSpeech}`}
        role="button"
        tabIndex={0}
        onClick={() => void handleOpenEntry(entry)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void handleOpenEntry(entry);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-left shadow-2xs transition active:scale-[0.985]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.article !== 'none' && (
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${art.solid}`}
              >
                {entry.article}
              </span>
            )}
            <span className="truncate text-sm font-extrabold text-slate-950">
              {entry.german}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[9px] font-extrabold ${getLevelStyle(entry.level)}`}
            >
              {entry.level}
            </span>
            {isCustomEntry && (
              <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-800">
                ✨ Custom
              </span>
            )}
            {isLive && (
              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800">
                <Sparkles className="h-2.5 w-2.5" />
                Cached
              </span>
            )}
            {entry.isFavorite && (
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-stone-600">{entry.english}</p>
          {matchedAlias && matchedAlias.toLowerCase() !== entry.german.toLowerCase() && (
            <p className="mt-0.5 text-[10px] font-semibold text-blue-700">
              Matched form: {matchedAlias}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <AiEnrichIconButton
            size="sm"
            state={rowEnrichStates[`${entry.german.toLowerCase()}|${entry.partOfSpeech}`] ?? 'idle'}
            onClick={(e) => void handleEnrichRow(e, entry)}
          />
          <EditCardIconButton
            size="sm"
            onClick={(e) => void handleEditRow(e, entry)}
          />
          {isCustomEntry && (
            <button
              type="button"
              onClick={(e) => void handleDeleteCustomEntry(e, entry)}
              aria-label={`Delete ${entry.german}`}
              title={`Delete ${entry.german}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-90"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronRight className="h-4 w-4 text-stone-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col pb-6">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-20 border-b border-stone-200 bg-paper/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div>
            <h1 className="font-editorial text-2xl font-bold tracking-tight text-slate-950 leading-none">
              Wörterbuch
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
              {isOnline ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <Globe className="h-3 w-3 text-emerald-700" />
                  <span className="text-emerald-800">Online Dictionary · Auto-Cached Locally</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  <WifiOff className="h-3 w-3 text-amber-700" />
                  <span className="text-amber-900">Offline Mode · Searching Cached Words</span>
                </>
              )}
            </div>
          </div>

          {aiAvailable && (
            <button
              type="button"
              onClick={() => setAiPackModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold text-blue-800 shadow-2xs transition active:scale-95"
            >
              <Sparkles className="h-3 w-3" />
              ✨ + AI Words
            </button>
          )}
        </div>

        {toastMsg && (
          <div className="mb-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
            {toastMsg}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any German or English word..."
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-2xl border border-stone-300 bg-white py-2.5 pr-9 pl-10 text-sm font-medium text-slate-950 placeholder:text-stone-400 focus:border-blue-700 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-stone-200 text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Umlaut Quick-Insert Bar */}
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {UMLAUT_BAR.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => insertUmlaut(ch)}
              className="flex h-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-sm font-extrabold text-slate-900 shadow-2xs active:scale-95"
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Filter Pills (All active by default) */}
        <div className="no-scrollbar mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'noun', label: 'Nouns' },
              { id: 'verb', label: 'Verbs' },
              { id: 'adjective', label: 'Adjectives' },
              { id: 'custom', label: `✨ Custom Only (${customWordKeys.size})` },
              { id: 'favorites', label: `★ Favorites (${favorites.length})` },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                filter === id
                  ? 'bg-slate-950 text-white'
                  : 'border border-stone-200 bg-white text-stone-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results / Empty State Content */}
      <div className="space-y-5 px-4 pt-4">
        {/* EMPTY SEARCH + ALL FILTER -> Recent Lookups & ★ Favorites */}
        {isSearchEmpty && filter === 'all' && (
          <>
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-stone-500">
                  <Clock className="h-3.5 w-3.5" />
                  Recent Lookups
                </h2>
                {recentEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void clearRecents()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>

              {recentEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-center text-xs text-stone-500">
                  Search any German or English word above. Every online lookup is automatically
                  cached in Dexie.js for instant offline use.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentEntries.slice(0, 8).map((entry) => renderEntryRow(entry))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-stone-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                ★ Favorites ({favorites.length})
              </h2>

              {favorites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-center text-xs text-stone-500">
                  Tap ★ inside any dictionary entry to bookmark it for instant offline access.
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.slice(0, 12).map((entry) => renderEntryRow(entry))}
                </div>
              )}
            </section>
          </>
        )}

        {/* EMPTY SEARCH + SPECIFIC FILTER */}
        {isSearchEmpty && filter !== 'all' && (
          <div className="space-y-2">
            {browseCategoryList.length > 0 ? (
              browseCategoryList.map((entry) => renderEntryRow(entry))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
                <BookOpen className="mx-auto h-7 w-7 text-stone-300" />
                <p className="mt-2 text-sm font-bold text-slate-700">
                  {filter === 'favorites'
                    ? 'No bookmarked words yet'
                    : filter === 'custom'
                      ? 'No custom AI words saved yet'
                      : 'No cached entries yet'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ACTIVE SEARCH RESULTS + LOADING SKELETON */}
        {!isSearchEmpty && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
              <span>
                {mergedSearchResults.length} result{mergedSearchResults.length === 1 ? '' : 's'}
              </span>
              {isFetchingLive && (
                <span className="text-blue-700">Looking up live Wiktionary…</span>
              )}
            </div>

            {mergedSearchResults.map(({ entry, matchedAlias, isLive }) =>
              renderEntryRow(entry, matchedAlias, isLive),
            )}

            {/* Clean Loading Skeleton while fetching live API */}
            {isFetchingLive && (
              <div className="space-y-2" aria-label="Loading online dictionary results">
                {[0, 1].map((s) => (
                  <div
                    key={s}
                    className="animate-pulse rounded-2xl border border-stone-200 bg-white px-3.5 py-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-9 rounded bg-stone-200" />
                      <div className="h-4 w-28 rounded bg-stone-200" />
                      <div className="h-4 w-8 rounded bg-stone-100" />
                    </div>
                    <div className="mt-2 h-3 w-48 rounded bg-stone-100" />
                  </div>
                ))}
              </div>
            )}

            {!isFetchingLive && mergedSearchResults.length === 0 && !aiAvailable && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
                <Search className="mx-auto h-7 w-7 text-stone-300" />
                <p className="mt-2 text-sm font-bold text-slate-700">
                  No matches for “{query}”
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {isOnline
                    ? 'Try checking the spelling or searching the base German/English word.'
                    : 'You are currently offline — only cached and curriculum words are searchable.'}
                </p>
              </div>
            )}

            {/* Feature B: Smart AI Dictionary Lookup + One-Tap Save */}
            {aiAvailable && query.trim().length >= 2 && mergedSearchResults.length <= 2 && (
              <div className="mt-3 space-y-2.5">
                {!aiDefinedWord && !aiDefining && (
                  <button
                    type="button"
                    onClick={() => void handleAskAiDefine()}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-left transition hover:bg-blue-50 active:scale-[0.985]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-blue-900">
                        Not in offline deck — ✨ Ask AI to define &apos;{query.trim()}&apos;
                      </p>
                      <p className="mt-0.5 text-[11px] text-blue-700">
                        Get article, plural, example sentence &amp; save to your deck
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 shrink-0 text-blue-700" />
                  </button>
                )}

                {aiDefining && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white p-5 text-xs font-bold text-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Defining &apos;{query.trim()}&apos; with Gemini AI...
                  </div>
                )}

                {aiDefineError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                    {aiDefineError}
                  </div>
                )}

                {aiDefinedWord && (
                  <div className="rounded-3xl border border-blue-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {aiDefinedWord.article !== 'none' && (
                          <span
                            className={`rounded-md border px-2 py-0.5 text-xs font-extrabold ${getArticleStyle(aiDefinedWord.article).solid}`}
                          >
                            {aiDefinedWord.article}
                          </span>
                        )}
                        <span className="font-editorial text-xl font-bold text-slate-950">
                          {aiDefinedWord.word}
                        </span>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-extrabold ${getLevelStyle(aiDefinedWord.level)}`}
                        >
                          {aiDefinedWord.level}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void speakGerman(
                            aiDefinedWord.article !== 'none'
                              ? `${aiDefinedWord.article} ${aiDefinedWord.word}`
                              : aiDefinedWord.word,
                          )
                        }
                        aria-label="Pronounce word"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-1.5 text-sm font-bold text-slate-800">
                      {aiDefinedWord.meaning}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                      {aiDefinedWord.gender ? `${aiDefinedWord.gender} · ` : ''}
                      Plural: {aiDefinedWord.plural} · {aiDefinedWord.topic}
                    </p>

                    <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs">
                      <p className="font-semibold text-slate-900">{aiDefinedWord.exampleDe}</p>
                      <p className="mt-0.5 text-stone-500">{aiDefinedWord.exampleEn}</p>
                    </div>

                    <button
                      type="button"
                      disabled={aiSaved}
                      onClick={() => void handleSaveAiWord()}
                      className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition active:scale-[0.98] ${
                        aiSaved
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'bg-slate-950 text-white'
                      }`}
                    >
                      {aiSaved ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Saved to My Deck
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-4 w-4" />
                          Save to My Deck
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry Detail Sheet */}
      <DictionaryDetailSheet
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onJumpToWord={(w) => void handleJumpToWord(w)}
      />

      {/* Feature A: AI Word Pack Generator Modal */}
      <AiWordPackModal
        open={aiPackModalOpen}
        onClose={() => setAiPackModalOpen(false)}
        existingTopics={existingTopics}
        onWordsAdded={(addedCount, lvl) => {
          showToast(
            addedCount > 0
              ? `Added ${addedCount} new ${lvl} words to your deck!`
              : 'All generated words were already in your deck.',
          );
        }}
      />

      <CardEditSheet
        open={Boolean(editingVocabCard)}
        card={editingVocabCard}
        onClose={() => setEditingVocabCard(null)}
        onSaved={(updated) => showToast(`Saved "${updated.german}"`)}
      />
    </div>
  );
};
