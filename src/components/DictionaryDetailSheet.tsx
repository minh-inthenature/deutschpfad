import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  X,
  Volume2,
  Star,
  Plus,
  CheckCircle2,
  AlertCircle,
  StickyNote,
  BookOpen,
} from 'lucide-react';
import {
  addDictionaryEntryToStudyDeck,
  db,
  toggleDictionaryFavorite,
  type DictionaryEntry,
} from '../db/database';
import { buildNounDeclension } from '../data/dictionary';
import {
  formatWordWithArticle,
  getArticleStyle,
  getLevelStyle,
  speakGerman,
} from '../utils/german';

interface DictionaryDetailSheetProps {
  entry: DictionaryEntry | null;
  onClose: () => void;
  onJumpToWord: (germanWord: string) => void;
}

export const DictionaryDetailSheet: React.FC<DictionaryDetailSheetProps> = ({
  entry,
  onClose,
  onJumpToWord,
}) => {
  const [adding, setAdding] = useState(false);
  const [localEntry, setLocalEntry] = useState<DictionaryEntry | null>(entry);

  React.useEffect(() => {
    setLocalEntry(entry);
  }, [entry]);

  // Live entry from Dexie dictionaryCache so favorite toggle updates instantaneously
  const liveCached = useLiveQuery(async () => {
    if (!localEntry) return undefined;
    if (localEntry.id !== undefined) {
      return db.dictionaryCache.get(localEntry.id);
    }
    return db.dictionaryCache
      .where('german')
      .equalsIgnoreCase(localEntry.german)
      .first();
  }, [localEntry?.id, localEntry?.german]);

  const liveEntry = liveCached ?? localEntry;

  // Live sync with vocab study deck
  const vocabMatch = useLiveQuery(
    () => (liveEntry ? db.vocab.where('german').equals(liveEntry.german).first() : undefined),
    [liveEntry?.german],
  );

  // Live sync with mistakeLogs
  const mistakeMatch = useLiveQuery(async () => {
    if (!liveEntry) return undefined;
    const fullTitle = formatWordWithArticle(liveEntry.article, liveEntry.german).toLowerCase();
    const bare = liveEntry.german.toLowerCase();
    const all = await db.mistakeLogs.toArray();
    return all.find(
      (m) =>
        (vocabMatch?.id && m.vocabId === vocabMatch.id) ||
        m.itemTitle.toLowerCase() === fullTitle ||
        m.itemTitle.toLowerCase() === bare,
    );
  }, [liveEntry?.german, liveEntry?.article, vocabMatch?.id]);

  const declensionRows = useMemo(() => {
    if (!liveEntry || liveEntry.partOfSpeech !== 'noun' || liveEntry.article === 'none') {
      return [];
    }
    return buildNounDeclension(liveEntry);
  }, [liveEntry]);

  if (!liveEntry) return null;

  const spokenForm = formatWordWithArticle(liveEntry.article, liveEntry.german);
  const artStyle = getArticleStyle(liveEntry.article);

  const handleToggleFav = async () => {
    if (!liveEntry) return;
    const updated = await toggleDictionaryFavorite(liveEntry);
    setLocalEntry(updated);
  };

  const handleAddToStudyDeck = async () => {
    setAdding(true);
    try {
      await addDictionaryEntryToStudyDeck(liveEntry);
    } finally {
      setAdding(false);
    }
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
        {/* Sticky Sheet Header */}
        <div className="shrink-0 rounded-t-3xl border-b border-stone-200 bg-white px-5 pt-3 pb-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {liveEntry.article !== 'none' ? (
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${artStyle.solid}`}
                  >
                    {liveEntry.article}
                  </span>
                ) : (
                  <span className="rounded-lg border border-stone-300 bg-stone-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700">
                    {liveEntry.partOfSpeech}
                  </span>
                )}
                <span
                  className={`rounded-lg border px-2 py-0.5 text-[10px] font-extrabold ${getLevelStyle(liveEntry.level)}`}
                >
                  {liveEntry.level}
                </span>
                <span className="text-[11px] font-semibold text-stone-400">
                  {liveEntry.syllables}
                </span>
              </div>

              <h2 className="font-editorial mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                {liveEntry.article !== 'none' && (
                  <span className={`mr-1.5 ${artStyle.text}`}>{liveEntry.article}</span>
                )}
                {liveEntry.german}
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">{liveEntry.english}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleToggleFav()}
                aria-label={liveEntry.isFavorite ? 'Remove bookmark' : 'Bookmark word'}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-90 ${
                  liveEntry.isFavorite
                    ? 'border-amber-300 bg-amber-50 text-amber-500'
                    : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}
              >
                <Star className={`h-4 w-4 ${liveEntry.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close entry"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 1.0x & 0.8x TTS Audio Controls + Grammar Notes */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void speakGerman(spokenForm, 1.0)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-extrabold text-slate-900 active:scale-95"
            >
              <Volume2 className="h-3.5 w-3.5 text-blue-700" />
              1.0×
            </button>
            <button
              type="button"
              onClick={() => void speakGerman(spokenForm, 0.78)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-extrabold text-slate-900 active:scale-95"
            >
              <Volume2 className="h-3.5 w-3.5 text-emerald-700" />
              0.8× Slow
            </button>
            {liveEntry.grammarNotes && (
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                {liveEntry.grammarNotes}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Study & Mistake Sync Card */}
          <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {vocabMatch ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize ${
                      vocabMatch.status === 'mastered'
                        ? 'bg-emerald-50 text-emerald-800'
                        : vocabMatch.status === 'learning'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    <BookOpen className="h-3 w-3" />
                    In Deck · {vocabMatch.status}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-stone-500">
                    Not in your Study Deck yet
                  </span>
                )}

                {mistakeMatch && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-800">
                    <AlertCircle className="h-3 w-3" />
                    Missed {mistakeMatch.errorCount}× ({mistakeMatch.mistakeType})
                  </span>
                )}
              </div>

              {(!vocabMatch || vocabMatch.status === 'new') && (
                <button
                  type="button"
                  disabled={adding}
                  onClick={() => void handleAddToStudyDeck()}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add to Study Deck
                </button>
              )}

              {vocabMatch && vocabMatch.status !== 'new' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active in SRS
                </span>
              )}
            </div>

            {mistakeMatch?.userNote && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-2.5 py-2 text-xs text-amber-950">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span className="font-medium">{mistakeMatch.userNote}</span>
              </div>
            )}
          </section>

          {/* 4-Case Declension Table for Nouns */}
          {declensionRows.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                  4-Case Declension
                </h3>
                {liveEntry.plural && liveEntry.plural !== '—' && (
                  <span className="text-[11px] font-bold text-slate-700">
                    Plural: {liveEntry.plural}
                  </span>
                )}
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-[11px] text-stone-500">
                      <th className="py-1.5 pr-2 font-bold">Case</th>
                      <th className="px-2 py-1.5 font-extrabold text-slate-900">Singular</th>
                      <th className="pl-2 py-1.5 font-extrabold text-slate-900">Plural</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                    {declensionRows.map((row, idx) => (
                      <tr key={row.caseLabel} className={idx % 2 === 1 ? 'bg-stone-50/70' : ''}>
                        <td className="py-2 pr-2 font-extrabold text-stone-500">
                          {row.caseLabel}
                        </td>
                        <td className="px-2 py-2">{row.singular}</td>
                        <td className="pl-2 py-2">{row.plural}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Full Conjugation Table for Verbs */}
          {liveEntry.conjugation && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                  Verb Conjugation
                </h3>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                  Aux: {liveEntry.conjugation.auxiliary}
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
                {(
                  [
                    ['ich', liveEntry.conjugation.ich],
                    ['wir', liveEntry.conjugation.wir],
                    ['du', liveEntry.conjugation.du],
                    ['ihr', liveEntry.conjugation.ihr],
                    ['er/sie/es', liveEntry.conjugation.erSieEs],
                    ['sie/Sie', liveEntry.conjugation.sieSie],
                  ] as const
                ).map(([pron, form]) => (
                  <div
                    key={pron}
                    className="flex items-baseline justify-between rounded-xl bg-stone-50 px-2.5 py-1.5"
                  >
                    <span className="text-[11px] font-semibold text-stone-500">{pron}</span>
                    <span className="font-extrabold text-slate-900">{form}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-stone-100 pt-2.5 text-xs">
                <div className="rounded-xl border border-stone-200 bg-white px-2.5 py-2">
                  <span className="block text-[10px] font-bold uppercase text-stone-400">
                    Präteritum
                  </span>
                  <span className="font-extrabold text-blue-800">
                    {liveEntry.conjugation.praeteritum}
                  </span>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white px-2.5 py-2">
                  <span className="block text-[10px] font-bold uppercase text-stone-400">
                    Perfekt
                  </span>
                  <span className="font-extrabold text-emerald-800">
                    {liveEntry.conjugation.perfekt}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Adjective Comparison */}
          {liveEntry.comparative && liveEntry.superlative && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Comparison (Steigerung)
              </h3>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-stone-50 p-2">
                  <span className="block text-[10px] font-bold text-stone-400">Positive</span>
                  <span className="font-extrabold text-slate-900">{liveEntry.german}</span>
                </div>
                <div className="rounded-xl bg-blue-50/70 p-2">
                  <span className="block text-[10px] font-bold text-blue-700">Comparative</span>
                  <span className="font-extrabold text-blue-900">{liveEntry.comparative}</span>
                </div>
                <div className="rounded-xl bg-emerald-50/70 p-2">
                  <span className="block text-[10px] font-bold text-emerald-700">Superlative</span>
                  <span className="font-extrabold text-emerald-900">{liveEntry.superlative}</span>
                </div>
              </div>
            </section>
          )}

          {/* Bilingual Examples */}
          {liveEntry.examples.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Examples
              </h3>
              <div className="mt-2.5 space-y-2.5">
                {liveEntry.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 rounded-xl bg-stone-50 p-3"
                  >
                    <div>
                      <p className="text-xs font-bold leading-relaxed text-slate-900">{ex.de}</p>
                      <p className="mt-0.5 text-[11px] text-stone-500">{ex.en}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void speakGerman(ex.de, 0.92)}
                      aria-label="Pronounce example sentence"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 active:scale-90"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Collocations */}
          {liveEntry.collocations.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Common Phrases &amp; Collocations
              </h3>
              <div className="mt-2 divide-y divide-stone-100">
                {liveEntry.collocations.map((col, idx) => (
                  <div key={idx} className="flex items-baseline justify-between gap-3 py-2 text-xs">
                    <span className="font-bold text-slate-900">{col.de}</span>
                    <span className="text-right text-stone-500">{col.en}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clickable Word Family Chips */}
          {liveEntry.relatedWords.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Word Family
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {liveEntry.relatedWords.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => onJumpToWord(word)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 transition active:scale-95"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
