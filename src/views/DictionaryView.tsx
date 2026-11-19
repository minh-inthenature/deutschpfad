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
} from 'lucide-react';
import {
  db,
  recordRecentLookup,
  upsertDictionaryCache,
  type DictionaryEntry,
} from '../db/database';
import {
  fetchAndCacheLiveLookup,
  searchLocalDictionary,
  vocabItemToDictionaryEntry,
} from '../services/dictionaryApi';
import { DictionaryDetailSheet } from '../components/DictionaryDetailSheet';
import { getArticleStyle, getLevelStyle } from '../utils/german';

type DictFilter = 'all' | 'noun' | 'verb' | 'adjective' | 'favorites';

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

  const [localHits, setLocalHits] = useState<
    { entry: DictionaryEntry; score: number; matchedAlias?: string }[]
  >([]);
  const [liveHits, setLiveHits] = useState<DictionaryEntry[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Browse list when search is empty and a category filter (Nouns / Verbs / Adjectives / Favorites) is active
  const browseCategoryList = useMemo(() => {
    if (filter === 'favorites') return favorites;
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

  const renderEntryRow = (
    entry: DictionaryEntry,
    matchedAlias?: string,
    isLive?: boolean,
  ) => {
    const art = getArticleStyle(entry.article);
    return (
      <button
        key={entry.id ?? `${entry.german}-${entry.partOfSpeech}`}
        type="button"
        onClick={() => void handleOpenEntry(entry)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-left shadow-2xs transition active:scale-[0.985]"
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
        <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
      </button>
    );
  };

  return (
    <div className="flex flex-col pb-6">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-20 border-b border-stone-200 bg-paper/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="mb-2.5">
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
                  {filter === 'favorites' ? 'No bookmarked words yet' : 'No cached entries yet'}
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

            {!isFetchingLive && mergedSearchResults.length === 0 && (
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
          </div>
        )}
      </div>

      {/* Entry Detail Sheet */}
      <DictionaryDetailSheet
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onJumpToWord={(w) => void handleJumpToWord(w)}
      />
    </div>
  );
};
