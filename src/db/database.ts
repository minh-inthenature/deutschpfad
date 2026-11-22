import Dexie, { type EntityTable } from 'dexie';

export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1';
export type DictLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
export type GermanArticle = 'der' | 'die' | 'das' | 'none';
export type VocabStatus = 'new' | 'learning' | 'mastered';
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'phrase';
export type DictPartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'preposition'
  | 'adverb'
  | 'phrase';
export type MistakeType = 'Article' | 'Plural' | 'Spelling' | 'Case' | 'Satzbau';
export type MistakeStatus = 'active' | 'resolved';

export interface VerbConjugation {
  ich: string;
  du: string;
  erSieEs: string;
  wir: string;
  ihr: string;
  sieSie: string;
  praeteritum: string;
  perfekt: string;
  auxiliary: 'haben' | 'sein' | 'haben/sein';
}

export interface DictionaryEntry {
  id?: number;
  german: string;
  syllables: string;
  article: GermanArticle;
  plural: string;
  genitiveSingular: string;
  partOfSpeech: DictPartOfSpeech;
  level: DictLevel;
  english: string;
  conjugation?: VerbConjugation;
  comparative?: string;
  superlative?: string;
  grammarNotes?: string;
  collocations: { de: string; en: string }[];
  examples: { de: string; en: string }[];
  relatedWords: string[];
  searchAliases: string[];
  isFavorite: boolean;
  cachedAt?: number;
  source?: 'wiktionary' | 'mymemory' | 'vocab' | 'local';
}

export interface RecentLookup {
  id?: number;
  dictId: number;
  german: string;
  lookedUpAt: number;
}

export interface VocabItem {
  id?: number;
  german: string;
  word?: string;
  article: GermanArticle;
  gender?: string;
  plural: string;
  meaning: string;
  exampleDe: string;
  exampleEn: string;
  level: CefrLevel;
  topic: string;
  partOfSpeech: PartOfSpeech;
  verbForms?: string;
  adjectiveForms?: string;
  grammarNote?: string;
  status: VocabStatus;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: number;
}

export type SeedVocabInput = Omit<
  VocabItem,
  'status' | 'easeFactor' | 'intervalDays' | 'nextReviewAt'
>;

export interface McqQuestion {
  id: string;
  type: 'mcq';
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface FillBlankQuestion {
  id: string;
  type: 'fill';
  prompt: string;
  sentenceBefore: string;
  sentenceAfter: string;
  answer: string;
  acceptedAnswers?: string[];
  hint?: string;
  explanation: string;
}

export interface WordReorderQuestion {
  id: string;
  type: 'reorder';
  prompt: string;
  words: string[];
  correctOrder: string[];
  explanation: string;
}

export type MilestoneQuestion = McqQuestion | FillBlankQuestion | WordReorderQuestion;

export interface Milestone {
  id?: number;
  code: string;
  level: CefrLevel;
  title: string;
  orderIndex: number;
  ruleMarkdown: string;
  isUnlocked: boolean;
  bestScore: number;
  completed: boolean;
  questions: MilestoneQuestion[];
}

export type SeedMilestoneInput = Omit<Milestone, 'id'>;

export interface StudyLog {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  wordsLearned: number;
  reviewsCompleted: number;
}

export interface MistakeLog {
  id?: number;
  vocabId: number | null;
  itemTitle: string;
  mistakeType: MistakeType;
  lastWrongAnswer: string;
  correctAnswer: string;
  errorCount: number;
  consecutiveCorrect: number;
  userNote: string;
  status: MistakeStatus;
  updatedAt: number;
}

export class DeutschPfadDB extends Dexie {
  vocab!: EntityTable<VocabItem, 'id'>;
  milestones!: EntityTable<Milestone, 'id'>;
  studyLogs!: EntityTable<StudyLog, 'date'>;
  mistakeLogs!: EntityTable<MistakeLog, 'id'>;
  dictionary!: EntityTable<DictionaryEntry, 'id'>;
  dictionaryCache!: EntityTable<DictionaryEntry, 'id'>;
  recentLookups!: EntityTable<RecentLookup, 'id'>;

  constructor() {
    super('DeutschPfadDB');

    this.version(1).stores({
      vocab: '++id, german, level, topic, status, nextReviewAt',
      milestones: '++id, &code, level, orderIndex, isUnlocked, completed',
      studyLogs: '&date',
    });

    this.version(2)
      .stores({
        vocab: '++id, german, level, topic, partOfSpeech, status, nextReviewAt',
        milestones: '++id, &code, level, orderIndex, isUnlocked, completed',
        studyLogs: '&date',
      })
      .upgrade(async (tx) => {
        await tx
          .table('vocab')
          .toCollection()
          .modify((item: Partial<VocabItem>) => {
            if (!item.partOfSpeech) {
              if (item.article && item.article !== 'none') {
                item.partOfSpeech = 'noun';
              } else if (item.topic === 'Verben') {
                item.partOfSpeech = 'verb';
              } else if (item.topic === 'Adjektive') {
                item.partOfSpeech = 'adjective';
              } else {
                item.partOfSpeech = 'phrase';
              }
            }
          });
      });

    this.version(3).stores({
      vocab: '++id, german, level, topic, partOfSpeech, status, nextReviewAt',
      milestones: '++id, &code, level, orderIndex, isUnlocked, completed',
      studyLogs: '&date',
      mistakeLogs: '++id, vocabId, mistakeType, status, updatedAt',
    });

    this.version(4).stores({
      vocab: '++id, german, level, topic, partOfSpeech, status, nextReviewAt',
      milestones: '++id, &code, level, orderIndex, isUnlocked, completed',
      studyLogs: '&date',
      mistakeLogs: '++id, vocabId, mistakeType, status, updatedAt',
    });

    this.version(5).stores({
      vocab: '++id, german, level, topic, partOfSpeech, status, nextReviewAt',
      milestones: '++id, &code, level, orderIndex, isUnlocked, completed',
      studyLogs: '&date',
      mistakeLogs: '++id, vocabId, mistakeType, status, updatedAt',
      dictionary: '++id, german, partOfSpeech, level, isFavorite, *searchAliases',
      recentLookups: '++id, &dictId, lookedUpAt',
    });

    this.version(6).stores({
      vocab: '++id, german, level, topic, partOfSpeech, status, nextReviewAt',
      milestones: '++id, &code, level, orderIndex, isUnlocked, completed',
      studyLogs: '&date',
      mistakeLogs: '++id, vocabId, mistakeType, status, updatedAt',
      dictionary: '++id, german, partOfSpeech, level, isFavorite, *searchAliases',
      dictionaryCache: '++id, german, partOfSpeech, level, isFavorite, cachedAt, *searchAliases',
      recentLookups: '++id, &dictId, lookedUpAt',
    });
  }
}

export const db = new DeutschPfadDB();

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function recordStudyActivity(deltas: {
  minutesStudied?: number;
  wordsLearned?: number;
  reviewsCompleted?: number;
}): Promise<void> {
  const today = getTodayDateString();
  await db.transaction('rw', db.studyLogs, async () => {
    const existing = await db.studyLogs.get(today);
    if (existing) {
      await db.studyLogs.update(today, {
        minutesStudied: existing.minutesStudied + (deltas.minutesStudied ?? 0),
        wordsLearned: existing.wordsLearned + (deltas.wordsLearned ?? 0),
        reviewsCompleted: existing.reviewsCompleted + (deltas.reviewsCompleted ?? 0),
      });
    } else {
      await db.studyLogs.add({
        date: today,
        minutesStudied: deltas.minutesStudied ?? 0,
        wordsLearned: deltas.wordsLearned ?? 0,
        reviewsCompleted: deltas.reviewsCompleted ?? 0,
      });
    }
  });
}

/**
 * Logs a mistake into `mistakeLogs`.
 * If an active (or previously tracked) record exists for the same item + mistakeType,
 * increments errorCount, resets consecutiveCorrect to 0, updates lastWrongAnswer, and ensures status is 'active'.
 * Returns the mistake row id.
 */
export async function logMistake(input: {
  vocabId: number | null;
  itemTitle: string;
  mistakeType: MistakeType;
  lastWrongAnswer: string;
  correctAnswer: string;
}): Promise<number> {
  const now = Date.now();
  const normalizedTitle = input.itemTitle.trim();

  return db.transaction('rw', db.mistakeLogs, async () => {
    const candidates = await db.mistakeLogs
      .where('mistakeType')
      .equals(input.mistakeType)
      .toArray();

    const existing = candidates.find(
      (m) =>
        (input.vocabId !== null && m.vocabId === input.vocabId) ||
        m.itemTitle.toLowerCase() === normalizedTitle.toLowerCase(),
    );

    if (existing?.id) {
      await db.mistakeLogs.update(existing.id, {
        lastWrongAnswer: input.lastWrongAnswer,
        correctAnswer: input.correctAnswer,
        errorCount: existing.errorCount + 1,
        consecutiveCorrect: 0,
        status: 'active',
        updatedAt: now,
      });
      return existing.id;
    }

    const newId = await db.mistakeLogs.add({
      vocabId: input.vocabId,
      itemTitle: normalizedTitle,
      mistakeType: input.mistakeType,
      lastWrongAnswer: input.lastWrongAnswer,
      correctAnswer: input.correctAnswer,
      errorCount: 1,
      consecutiveCorrect: 0,
      userNote: '',
      status: 'active',
      updatedAt: now,
    });
    return Number(newId);
  });
}

/**
 * Records a correct recall for a tracked active mistake.
 * Getting a mistake right 2 times in a row automatically marks it 'resolved'.
 * Returns true if the mistake was just resolved.
 */
export async function recordMistakeCorrect(input: {
  id?: number;
  vocabId?: number | null;
  itemTitle?: string;
  mistakeType: MistakeType;
}): Promise<boolean> {
  const now = Date.now();
  let resolvedNow = false;

  await db.transaction('rw', db.mistakeLogs, async () => {
    let target: MistakeLog | undefined;

    if (input.id !== undefined) {
      target = await db.mistakeLogs.get(input.id);
    } else {
      const actives = await db.mistakeLogs
        .where('status')
        .equals('active')
        .filter((m) => m.mistakeType === input.mistakeType)
        .toArray();

      target = actives.find(
        (m) =>
          (input.vocabId !== undefined && input.vocabId !== null && m.vocabId === input.vocabId) ||
          (input.itemTitle !== undefined &&
            m.itemTitle.toLowerCase() === input.itemTitle.trim().toLowerCase()),
      );
    }

    if (target?.id && target.status === 'active') {
      const nextConsecutive = target.consecutiveCorrect + 1;
      const nextStatus: MistakeStatus = nextConsecutive >= 2 ? 'resolved' : 'active';
      resolvedNow = nextStatus === 'resolved';
      await db.mistakeLogs.update(target.id, {
        consecutiveCorrect: nextConsecutive,
        status: nextStatus,
        updatedAt: now,
      });
    }
  });

  return resolvedNow;
}

export async function updateMistakeNote(id: number, userNote: string): Promise<void> {
  await db.mistakeLogs.update(id, {
    userNote: userNote.trim(),
    updatedAt: Date.now(),
  });
}

export async function recordRecentLookup(dictId: number, german: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.recentLookups, async () => {
    const existing = await db.recentLookups.where('dictId').equals(dictId).first();
    if (existing?.id) {
      await db.recentLookups.update(existing.id, { lookedUpAt: now, german });
    } else {
      await db.recentLookups.add({ dictId, german, lookedUpAt: now });
    }
    const all = await db.recentLookups.orderBy('lookedUpAt').reverse().toArray();
    if (all.length > 20) {
      const toDelete = all
        .slice(20)
        .map((r) => r.id)
        .filter((id): id is number => id !== undefined);
      if (toDelete.length > 0) {
        await db.recentLookups.bulkDelete(toDelete);
      }
    }
  });
}

export async function upsertDictionaryCache(
  entry: Omit<DictionaryEntry, 'id'>,
): Promise<DictionaryEntry> {
  const now = Date.now();
  return db.transaction('rw', db.dictionaryCache, async () => {
    const existingList = await db.dictionaryCache
      .where('german')
      .equalsIgnoreCase(entry.german.trim())
      .toArray();
    const existing = existingList.find((e) => e.partOfSpeech === entry.partOfSpeech) ?? existingList[0];

    if (existing?.id) {
      const merged: DictionaryEntry = {
        ...existing,
        ...entry,
        id: existing.id,
        isFavorite: existing.isFavorite || entry.isFavorite,
        cachedAt: now,
      };
      await db.dictionaryCache.put(merged);
      return merged;
    }

    const id = await db.dictionaryCache.add({
      ...entry,
      cachedAt: now,
    });
    return { ...entry, id: Number(id), cachedAt: now };
  });
}

export async function toggleDictionaryFavorite(entry: DictionaryEntry): Promise<DictionaryEntry> {
  if (entry.id !== undefined) {
    const existing = await db.dictionaryCache.get(entry.id);
    if (existing) {
      const next = !existing.isFavorite;
      await db.dictionaryCache.update(entry.id, { isFavorite: next });
      return { ...existing, isFavorite: next };
    }
  }
  const { id: _ignore, ...rest } = entry;
  return upsertDictionaryCache({ ...rest, isFavorite: !entry.isFavorite });
}

export async function addDictionaryEntryToStudyDeck(entry: DictionaryEntry): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', [db.vocab, db.studyLogs], async () => {
    const existing = await db.vocab.where('german').equals(entry.german).first();
    if (existing?.id) {
      if (existing.status === 'new') {
        await db.vocab.update(existing.id, {
          status: 'learning',
          intervalDays: 0,
          nextReviewAt: now,
        });
      }
      return;
    }

    const mappedPos: PartOfSpeech =
      entry.partOfSpeech === 'noun'
        ? 'noun'
        : entry.partOfSpeech === 'verb'
          ? 'verb'
          : entry.partOfSpeech === 'adjective'
            ? 'adjective'
            : 'phrase';
    const mappedLevel: CefrLevel = entry.level === 'B2' ? 'B1' : entry.level;
    const verbForms = entry.conjugation
      ? `${entry.conjugation.erSieEs} · ${entry.conjugation.praeteritum} · ${entry.conjugation.perfekt}`
      : undefined;
    const adjectiveForms =
      entry.comparative && entry.superlative
        ? `${entry.comparative} · ${entry.superlative}`
        : undefined;

    await db.vocab.add({
      german: entry.german,
      article: entry.article,
      plural: entry.plural || '—',
      meaning: entry.english,
      exampleDe: entry.examples[0]?.de ?? '',
      exampleEn: entry.examples[0]?.en ?? '',
      level: mappedLevel,
      topic: 'Wörterbuch',
      partOfSpeech: mappedPos,
      verbForms,
      adjectiveForms,
      grammarNote: entry.grammarNotes,
      status: 'learning',
      easeFactor: 2.5,
      intervalDays: 0,
      nextReviewAt: now,
    });
  });

  await recordStudyActivity({ wordsLearned: 1 });
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export function computeSm2Update(
  item: VocabItem,
  rating: ReviewRating,
  now: number = Date.now(),
): Pick<VocabItem, 'easeFactor' | 'intervalDays' | 'nextReviewAt' | 'status'> {
  const DAY_MS = 24 * 60 * 60 * 1000;
  let easeFactor = item.easeFactor || 2.5;
  let intervalDays = item.intervalDays || 0;

  if (rating === 'again') {
    intervalDays = 0;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    return {
      easeFactor,
      intervalDays,
      nextReviewAt: now + 10 * 60 * 1000, // 10 minutes
      status: 'learning',
    };
  }

  if (rating === 'hard') {
    intervalDays = intervalDays === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
  } else if (rating === 'good') {
    if (intervalDays === 0) {
      intervalDays = 1;
    } else if (intervalDays === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  } else {
    // easy
    if (intervalDays === 0) {
      intervalDays = 4;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor * 1.3);
    }
    easeFactor = Number((easeFactor + 0.15).toFixed(2));
  }

  const status: VocabStatus = intervalDays >= 14 ? 'mastered' : 'learning';
  return {
    easeFactor,
    intervalDays,
    nextReviewAt: now + intervalDays * DAY_MS,
    status,
  };
}
