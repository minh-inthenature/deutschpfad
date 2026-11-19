import {
  db,
  upsertDictionaryCache,
  type DictLevel,
  type DictPartOfSpeech,
  type DictionaryEntry,
  type GermanArticle,
  type VerbConjugation,
  type VocabItem,
} from '../db/database';
import {
  buildVerbConjugation,
  computeGenitiveSingular,
  foldGermanSearch,
  syllabifyGerman,
} from '../data/dictionary';

interface WiktionaryDefinitionItem {
  definition?: string;
  parsedExamples?: { example?: string; translation?: string }[];
  examples?: string[];
}

interface WiktionarySection {
  partOfSpeech?: string;
  language?: string;
  definitions?: WiktionaryDefinitionItem[];
}

interface WiktionaryResponse {
  de?: WiktionarySection[];
}

interface MyMemoryResponse {
  responseStatus?: number;
  responseData?: {
    translatedText?: string;
  };
  matches?: {
    segment?: string;
    translation?: string;
    quality?: string | number;
    match?: number;
  }[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapWiktionaryPos(raw?: string): DictPartOfSpeech {
  const lower = (raw ?? '').toLowerCase();
  if (lower.includes('noun') || lower.includes('proper')) return 'noun';
  if (lower.includes('verb')) return 'verb';
  if (lower.includes('adj')) return 'adjective';
  if (lower.includes('prep')) return 'preposition';
  if (lower.includes('adv')) return 'adverb';
  return 'phrase';
}

function capitalizeGerman(word: string): string {
  const t = word.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Converts a local curriculum VocabItem into a full DictionaryEntry so all
 * A0-B1 curriculum words appear instantaneously in Dictionary search.
 */
export function vocabItemToDictionaryEntry(v: VocabItem): DictionaryEntry {
  const pos: DictPartOfSpeech =
    v.partOfSpeech === 'noun'
      ? 'noun'
      : v.partOfSpeech === 'verb'
        ? 'verb'
        : v.partOfSpeech === 'adjective'
          ? 'adjective'
          : 'phrase';

  let conjugation: VerbConjugation | undefined;
  if (pos === 'verb' && v.verbForms) {
    const parts = v.verbForms.split('·').map((s) => s.trim());
    if (parts.length === 3) {
      conjugation = buildVerbConjugation(v.german, parts[0], parts[1], parts[2]);
    }
  }

  let comparative: string | undefined;
  let superlative: string | undefined;
  if (pos === 'adjective' && v.adjectiveForms) {
    const parts = v.adjectiveForms.split('·').map((s) => s.trim());
    if (parts.length === 2) {
      comparative = parts[0];
      superlative = parts[1];
    }
  }

  const genitiveSingular = computeGenitiveSingular(v.german, v.article, v.grammarNote);
  const aliases = new Set<string>([
    v.german.toLowerCase(),
    foldGermanSearch(v.german),
  ]);
  if (v.plural && v.plural !== '—') {
    aliases.add(v.plural.toLowerCase());
    aliases.add(v.plural.replace(/^die\s+/i, '').toLowerCase());
    aliases.add(foldGermanSearch(v.plural.replace(/^die\s+/i, '')));
  }
  if (conjugation) {
    [conjugation.erSieEs, conjugation.praeteritum, conjugation.perfekt].forEach((f) => {
      aliases.add(f.toLowerCase());
      aliases.add(foldGermanSearch(f));
    });
  }

  return {
    german: v.german,
    syllables: syllabifyGerman(v.german),
    article: v.article,
    plural: v.plural || '—',
    genitiveSingular,
    partOfSpeech: pos,
    level: v.level as DictLevel,
    english: v.meaning,
    conjugation,
    comparative,
    superlative,
    grammarNotes: v.grammarNote,
    collocations: [],
    examples: v.exampleDe && v.exampleEn ? [{ de: v.exampleDe, en: v.exampleEn }] : [],
    relatedWords: [],
    searchAliases: Array.from(aliases),
    isFavorite: false,
    source: 'vocab',
  };
}

/**
 * Searches local Dexie.js tables (dictionaryCache + vocab) instantaneously.
 */
export async function searchLocalDictionary(
  query: string,
): Promise<{ entry: DictionaryEntry; score: number; matchedAlias?: string }[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const qLower = trimmed.toLowerCase();
  const qFolded = foldGermanSearch(trimmed);

  const [cached, vocabList] = await Promise.all([
    db.dictionaryCache.toArray(),
    db.vocab.toArray(),
  ]);

  // Merge cached + vocab, preferring dictionaryCache when same lemma+pos exists
  const byKey = new Map<string, DictionaryEntry>();
  for (const c of cached) {
    byKey.set(`${c.german.toLowerCase()}|${c.partOfSpeech}`, c);
  }
  for (const v of vocabList) {
    const converted = vocabItemToDictionaryEntry(v);
    const key = `${converted.german.toLowerCase()}|${converted.partOfSpeech}`;
    if (!byKey.has(key)) {
      byKey.set(key, converted);
    }
  }

  const scored: { entry: DictionaryEntry; score: number; matchedAlias?: string }[] = [];

  for (const entry of byKey.values()) {
    const deLower = entry.german.toLowerCase();
    const deFolded = foldGermanSearch(entry.german);
    const enLower = entry.english.toLowerCase();

    let score = 0;
    let matchedAlias: string | undefined;

    if (deLower === qLower || deFolded === qFolded) {
      score = 100;
    } else if (deLower.startsWith(qLower) || deFolded.startsWith(qFolded)) {
      score = 85;
    } else if (entry.searchAliases.some((a) => a === qLower || a === qFolded)) {
      score = 80;
      matchedAlias = trimmed;
    } else if (enLower === qLower) {
      score = 75;
    } else if (enLower.split(/[;,\s/]+/).some((w) => w.startsWith(qLower))) {
      score = 65;
    } else if (deLower.includes(qLower) || deFolded.includes(qFolded)) {
      score = 55;
    } else if (
      entry.searchAliases.some((a) => a.startsWith(qLower) || a.startsWith(qFolded))
    ) {
      score = 50;
      matchedAlias = entry.searchAliases.find(
        (a) => a.startsWith(qLower) || a.startsWith(qFolded),
      );
    } else if (enLower.includes(qLower)) {
      score = 40;
    }

    if (score > 0) {
      scored.push({ entry, score, matchedAlias });
    }
  }

  scored.sort(
    (a, b) => b.score - a.score || a.entry.german.localeCompare(b.entry.german, 'de'),
  );
  return scored.slice(0, 40);
}

interface ParsedWiktionaryGrammar {
  article: GermanArticle;
  plural: string;
  genitiveSingular: string;
  conjugation?: VerbConjugation;
  grammarNotes?: string;
}

/**
 * Fetches Wiktionary's plain-text German morphology summary (gender, plural, genitive, verb forms)
 * via CORS-enabled MediaWiki API (origin=*).
 */
async function fetchWiktionaryGrammarMeta(
  term: string,
  pos: DictPartOfSpeech,
  signal?: AbortSignal,
): Promise<ParsedWiktionaryGrammar> {
  const fallback: ParsedWiktionaryGrammar = {
    article: 'none',
    plural: '—',
    genitiveSingular: '—',
  };

  try {
    const url = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(
      term,
    )}&prop=extracts&explaintext=1&exchars=1600&format=json&origin=*`;
    const res = await fetch(url, { signal });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { extract?: string }> };
    };
    const pages = data.query?.pages;
    if (!pages) return fallback;
    const firstPage = Object.values(pages)[0];
    const extract = firstPage?.extract ?? '';
    const deIdx = extract.indexOf('== German ==');
    if (deIdx === -1) return fallback;
    const deChunk = extract.slice(deIdx, deIdx + 900);

    if (pos === 'noun') {
      let article: GermanArticle = 'none';
      const headMatch = deChunk.match(new RegExp(`${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(m|f|n)\\b`));
      if (headMatch) {
        article = headMatch[1] === 'm' ? 'der' : headMatch[1] === 'f' ? 'die' : 'das';
      } else if (/\bmasculine\b/i.test(deChunk)) {
        article = 'der';
      } else if (/\bfeminine\b/i.test(deChunk)) {
        article = 'die';
      } else if (/\bneuter\b/i.test(deChunk)) {
        article = 'das';
      }

      const pluralMatch = deChunk.match(/plural\s+([A-ZÄÖÜ][a-zäöüß-]+)/);
      const plural = pluralMatch ? `die ${pluralMatch[1]}` : '—';
      const genMatch = deChunk.match(/genitive\s+([A-ZÄÖÜ][a-zäöüß-]+)/);
      const genitiveSingular = genMatch
        ? `${article === 'die' ? 'der' : 'des'} ${genMatch[1]}`
        : computeGenitiveSingular(term, article);

      const weak = /\bweak\b/i.test(deChunk) ? 'weak noun (n-Declension)' : undefined;
      return { article, plural, genitiveSingular, grammarNotes: weak };
    }

    if (pos === 'verb') {
      const presMatch = deChunk.match(/third-person singular present\s+([a-zäöüß]+(?:\s+[a-zäöüß]+)?)/i);
      const pastMatch = deChunk.match(/past tense\s+([a-zäöüß]+(?:\s+[a-zäöüß]+)?)/i);
      const partMatch = deChunk.match(/past participle\s+([a-zäöüß]+)/i);
      const auxMatch = deChunk.match(/auxiliary\s+(haben|sein)/i);

      if (presMatch && pastMatch && partMatch) {
        const aux = (auxMatch?.[1]?.toLowerCase() === 'sein' ? 'sein' : 'haben') as 'haben' | 'sein';
        const conj = buildVerbConjugation(
          term,
          presMatch[1].trim(),
          pastMatch[1].trim(),
          `${aux} ${partMatch[1].trim()}`,
        );
        const notes = /\bstrong\b/i.test(deChunk)
          ? `strong verb · aux: ${aux}`
          : `aux: ${aux}`;
        return {
          article: 'none',
          plural: '—',
          genitiveSingular: '—',
          conjugation: conj,
          grammarNotes: notes,
        };
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}

async function fetchWiktionaryDe(
  term: string,
  signal?: AbortSignal,
): Promise<Omit<DictionaryEntry, 'id'>[]> {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(term)}`,
      { signal },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as WiktionaryResponse;
    const deSections = json.de;
    if (!deSections || deSections.length === 0) return [];

    const results: Omit<DictionaryEntry, 'id'>[] = [];

    for (const sec of deSections.slice(0, 2)) {
      const pos = mapWiktionaryPos(sec.partOfSpeech);
      const defs = (sec.definitions ?? [])
        .map((d) => stripHtml(d.definition ?? ''))
        .filter((d) => d.length > 0)
        .slice(0, 3);

      if (defs.length === 0) continue;

      const examples: { de: string; en: string }[] = [];
      for (const d of sec.definitions ?? []) {
        for (const ex of d.parsedExamples ?? []) {
          const de = stripHtml(ex.example ?? '');
          const en = stripHtml(ex.translation ?? '');
          if (de && en) {
            examples.push({ de, en });
            if (examples.length >= 2) break;
          }
        }
        if (examples.length >= 2) break;
      }

      const meta = await fetchWiktionaryGrammarMeta(term, pos, signal);
      const aliases = new Set<string>([term.toLowerCase(), foldGermanSearch(term)]);
      if (meta.plural !== '—') {
        const barePl = meta.plural.replace(/^die\s+/i, '');
        aliases.add(barePl.toLowerCase());
        aliases.add(foldGermanSearch(barePl));
      }
      if (meta.conjugation) {
        [meta.conjugation.erSieEs, meta.conjugation.praeteritum, meta.conjugation.perfekt].forEach(
          (f) => {
            aliases.add(f.toLowerCase());
            aliases.add(foldGermanSearch(f));
          },
        );
      }

      results.push({
        german: term,
        syllables: syllabifyGerman(term),
        article: meta.article,
        plural: meta.plural,
        genitiveSingular: meta.genitiveSingular,
        partOfSpeech: pos,
        level: 'B1',
        english: defs.join('; '),
        conjugation: meta.conjugation,
        grammarNotes: meta.grammarNotes,
        collocations: [],
        examples,
        relatedWords: [],
        searchAliases: Array.from(aliases),
        isFavorite: false,
        source: 'wiktionary',
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function fetchMyMemory(
  term: string,
  langpair: 'de|en' | 'en|de',
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      term,
    )}&langpair=${langpair}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as MyMemoryResponse;
    const translated = json.responseData?.translatedText?.trim();
    if (!translated || translated.toLowerCase() === term.toLowerCase()) return null;
    // Ignore MyMemory quota/error strings
    if (/MYMEMORY WARNING|PLEASE SELECT TWO DISTINCT/i.test(translated)) return null;
    return translated;
  } catch {
    return null;
  }
}

/**
 * Fetches live German <-> English dictionary data from Wiktionary REST API + MyMemory fallback,
 * and auto-caches every fetched entry into Dexie's `dictionaryCache` table for offline reuse.
 */
export async function fetchAndCacheLiveLookup(
  rawQuery: string,
  signal?: AbortSignal,
): Promise<DictionaryEntry[]> {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];
  if (typeof navigator !== 'undefined' && !navigator.onLine) return [];

  // Strip optional leading German article if user typed e.g. "der Hund"
  const articlePrefixMatch = trimmed.match(/^(der|die|das)\s+(.+)$/i);
  const queryTerm = articlePrefixMatch ? articlePrefixMatch[2].trim() : trimmed;
  const capTerm = capitalizeGerman(queryTerm);
  const lowerTerm = queryTerm.toLowerCase();

  // 1. Try Wiktionary German definitions (try capitalized first for nouns, then lowercase for verbs/adj)
  const wiktCandidates = capTerm === lowerTerm ? [lowerTerm] : [capTerm, lowerTerm];
  let parsed: Omit<DictionaryEntry, 'id'>[] = [];

  for (const candidate of wiktCandidates) {
    if (signal?.aborted) return [];
    const found = await fetchWiktionaryDe(candidate, signal);
    if (found.length > 0) {
      parsed.push(...found);
      break;
    }
  }

  // 2. If Wiktionary had no German entry, try MyMemory en|de and de|en
  if (parsed.length === 0 && !signal?.aborted) {
    const [enToDe, deToEn] = await Promise.all([
      fetchMyMemory(queryTerm, 'en|de', signal),
      fetchMyMemory(queryTerm, 'de|en', signal),
    ]);

    if (enToDe && !signal?.aborted) {
      // User likely searched English -> got German translation! Try enriching via Wiktionary
      const artMatch = enToDe.match(/^(der|die|das)\s+(.+)$/i);
      const detectedArt: GermanArticle = artMatch
        ? (artMatch[1].toLowerCase() as GermanArticle)
        : 'none';
      const cleanDe = artMatch ? artMatch[2].trim() : enToDe.replace(/[.,!?]+$/, '').trim();

      const enriched = await fetchWiktionaryDe(cleanDe, signal);
      if (enriched.length > 0) {
        parsed.push(...enriched);
      } else {
        const isNoun = detectedArt !== 'none' || /^[A-ZÄÖÜ]/.test(cleanDe);
        const pos: DictPartOfSpeech = isNoun ? 'noun' : 'phrase';
        parsed.push({
          german: cleanDe,
          syllables: syllabifyGerman(cleanDe),
          article: detectedArt,
          plural: '—',
          genitiveSingular: computeGenitiveSingular(cleanDe, detectedArt),
          partOfSpeech: pos,
          level: 'B1',
          english: queryTerm,
          collocations: [],
          examples: [],
          relatedWords: [],
          searchAliases: [
            cleanDe.toLowerCase(),
            foldGermanSearch(cleanDe),
            queryTerm.toLowerCase(),
          ],
          isFavorite: false,
          source: 'mymemory',
        });
      }
    } else if (deToEn && !signal?.aborted) {
      const isNoun = /^[A-ZÄÖÜ]/.test(queryTerm);
      parsed.push({
        german: queryTerm,
        syllables: syllabifyGerman(queryTerm),
        article: articlePrefixMatch
          ? (articlePrefixMatch[1].toLowerCase() as GermanArticle)
          : 'none',
        plural: '—',
        genitiveSingular: '—',
        partOfSpeech: isNoun ? 'noun' : 'phrase',
        level: 'B1',
        english: deToEn,
        collocations: [],
        examples: [],
        relatedWords: [],
        searchAliases: [queryTerm.toLowerCase(), foldGermanSearch(queryTerm)],
        isFavorite: false,
        source: 'mymemory',
      });
    }
  }

  if (parsed.length === 0 || signal?.aborted) return [];

  // 3. Auto-cache every fetched entry into Dexie's `dictionaryCache`
  const cachedResults: DictionaryEntry[] = [];
  for (const item of parsed) {
    const saved = await upsertDictionaryCache(item);
    cachedResults.push(saved);
  }

  return cachedResults;
}
