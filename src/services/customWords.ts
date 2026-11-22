import {
  db,
  type CefrLevel,
  type GermanArticle,
  type PartOfSpeech,
  type VocabItem,
  type VocabStatus,
} from '../db/database';

export const CUSTOM_WORDS_STORAGE_KEY = 'deutschpfad_custom_words';

export interface CustomWordInput {
  level: CefrLevel;
  topic: string;
  article: GermanArticle;
  gender?: string;
  word: string;
  plural: string;
  meaning: string;
  exampleDe: string;
  exampleEn: string;
  partOfSpeech?: PartOfSpeech;
  isCustom?: boolean;
}

export interface CustomWordStored extends CustomWordInput {
  german: string;
  partOfSpeech: PartOfSpeech;
  isCustom: true;
  createdAt: number;
}

function makeWordKey(word: string, article: string): string {
  return `${word.trim().toLowerCase()}|${(article || 'none').trim().toLowerCase()}`;
}

function normalizeArticle(raw: unknown): GermanArticle {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : 'none';
  if (s === 'der' || s === 'die' || s === 'das') return s;
  return 'none';
}

function normalizeGender(article: GermanArticle, rawGender?: unknown): string {
  if (article === 'der') return 'masc.';
  if (article === 'die') return 'fem.';
  if (article === 'das') return 'neut.';
  return typeof rawGender === 'string' ? rawGender.trim() : '';
}

function normalizeLevel(raw: unknown): CefrLevel {
  const s = typeof raw === 'string' ? raw.trim().toUpperCase() : 'A1';
  if (s === 'A0' || s === 'A1' || s === 'A2' || s === 'B1') return s;
  return 'A1';
}

function normalizePartOfSpeech(
  article: GermanArticle,
  rawPos?: unknown,
): PartOfSpeech {
  const s = typeof rawPos === 'string' ? rawPos.trim().toLowerCase() : '';
  if (s === 'noun' || s === 'verb' || s === 'adjective' || s === 'phrase') return s;
  if (article !== 'none') return 'noun';
  return 'phrase';
}

export function getStoredCustomWords(): CustomWordStored[] {
  try {
    const raw = localStorage.getItem(CUSTOM_WORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomWordStored =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as CustomWordStored).word === 'string' &&
        (item as CustomWordStored).word.trim().length > 0,
    );
  } catch {
    return [];
  }
}

function saveStoredCustomWords(words: CustomWordStored[]): void {
  try {
    localStorage.setItem(CUSTOM_WORDS_STORAGE_KEY, JSON.stringify(words));
  } catch {
    // ignore quota/storage errors
  }
}

export function toCustomWordStored(input: CustomWordInput): CustomWordStored | null {
  const word = (input.word ?? '').trim();
  const meaning = (input.meaning ?? '').trim();
  if (!word || !meaning) return null;

  const article = normalizeArticle(input.article);
  const gender = normalizeGender(article, input.gender);
  const partOfSpeech = normalizePartOfSpeech(article, input.partOfSpeech);
  const level = normalizeLevel(input.level);
  const topic = (input.topic ?? '').trim() || 'AI Custom';
  const plural =
    (input.plural ?? '').trim() || (article !== 'none' ? `die ${word}` : '—');
  const exampleDe = (input.exampleDe ?? '').trim() || `${word}.`;
  const exampleEn = (input.exampleEn ?? '').trim() || meaning;

  return {
    level,
    topic,
    article,
    gender,
    word,
    german: word,
    plural,
    meaning,
    exampleDe,
    exampleEn,
    partOfSpeech,
    isCustom: true,
    createdAt: Date.now(),
  };
}

/**
 * Adds custom words to `deutschpfad_custom_words` in localStorage and syncs them into
 * Dexie `db.vocab`, strictly deduplicated by `lowercase word + article`.
 */
export async function addCustomWords(
  inputs: CustomWordInput[],
): Promise<{ added: CustomWordStored[]; skippedCount: number }> {
  const existingDbVocab = await db.vocab.toArray();
  const existingStored = getStoredCustomWords();

  const seenKeys = new Set<string>();
  for (const v of existingDbVocab) {
    seenKeys.add(makeWordKey(v.word ?? v.german, v.article));
  }
  for (const c of existingStored) {
    seenKeys.add(makeWordKey(c.word, c.article));
  }

  const added: CustomWordStored[] = [];
  let skippedCount = 0;

  for (const rawInput of inputs) {
    const normalized = toCustomWordStored(rawInput);
    if (!normalized) {
      skippedCount++;
      continue;
    }
    const key = makeWordKey(normalized.word, normalized.article);
    if (seenKeys.has(key)) {
      skippedCount++;
      continue;
    }
    seenKeys.add(key);
    added.push(normalized);
  }

  if (added.length > 0) {
    saveStoredCustomWords([...existingStored, ...added]);
    const now = Date.now();
    const vocabRows: VocabItem[] = added.map((item) => ({
      german: item.word,
      word: item.word,
      article: item.article,
      gender: item.gender,
      plural: item.plural,
      meaning: item.meaning,
      exampleDe: item.exampleDe,
      exampleEn: item.exampleEn,
      level: item.level,
      topic: item.topic,
      partOfSpeech: item.partOfSpeech,
      isCustom: true,
      status: 'new',
      easeFactor: 2.5,
      intervalDays: 0,
      nextReviewAt: now,
    }));
    await db.vocab.bulkAdd(vocabRows);
  }

  return { added, skippedCount };
}

/**
 * Ensures any words stored in `deutschpfad_custom_words` are present in `db.vocab`
 * on app startup (without duplicating built-in or existing entries).
 */
export async function syncCustomWordsToDb(): Promise<void> {
  const stored = getStoredCustomWords();
  if (stored.length === 0) return;

  const existingDbVocab = await db.vocab.toArray();
  const existingKeys = new Map<string, VocabItem>();
  for (const v of existingDbVocab) {
    existingKeys.set(makeWordKey(v.word ?? v.german, v.article), v);
  }

  const now = Date.now();
  const toInsert: VocabItem[] = [];

  for (const item of stored) {
    const key = makeWordKey(item.word, item.article);
    const match = existingKeys.get(key);
    if (!match) {
      toInsert.push({
        german: item.word,
        word: item.word,
        article: item.article,
        gender: item.gender,
        plural: item.plural,
        meaning: item.meaning,
        exampleDe: item.exampleDe,
        exampleEn: item.exampleEn,
        level: item.level,
        topic: item.topic,
        partOfSpeech: item.partOfSpeech,
        isCustom: true,
        status: 'new',
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewAt: now,
      });
    } else if (match.id && !match.isCustom && item.isCustom) {
      // Ensure custom flag is preserved
      await db.vocab.update(match.id, { isCustom: true });
    }
  }

  if (toInsert.length > 0) {
    await db.vocab.bulkAdd(toInsert);
  }
}

export interface CustomDeckBackupPayload {
  version: 1;
  exportedAt: string;
  customWords: CustomWordStored[];
  studyProgress: Array<{
    word: string;
    article: GermanArticle;
    status: VocabStatus;
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: number;
  }>;
}

export async function exportCustomWordsBackup(): Promise<CustomDeckBackupPayload> {
  const customWords = getStoredCustomWords();
  const allVocab = await db.vocab.toArray();

  const studyProgress = allVocab
    .filter((v) => v.status !== 'new' || v.isCustom)
    .map((v) => ({
      word: v.word ?? v.german,
      article: v.article,
      status: v.status,
      easeFactor: v.easeFactor,
      intervalDays: v.intervalDays,
      nextReviewAt: v.nextReviewAt,
    }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    customWords,
    studyProgress,
  };
}

export async function importCustomWordsBackup(
  rawJson: string,
): Promise<{ importedWords: number; restoredProgress: number }> {
  const parsed = JSON.parse(rawJson) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON backup file.');
  }

  const obj = parsed as Partial<CustomDeckBackupPayload>;
  const wordsToImport = Array.isArray(obj.customWords) ? obj.customWords : [];
  const progressList = Array.isArray(obj.studyProgress) ? obj.studyProgress : [];

  const { added } = await addCustomWords(wordsToImport);

  let restoredProgress = 0;
  if (progressList.length > 0) {
    const allVocab = await db.vocab.toArray();
    const vocabByKey = new Map<string, VocabItem>();
    for (const v of allVocab) {
      vocabByKey.set(makeWordKey(v.word ?? v.german, v.article), v);
    }

    for (const prog of progressList) {
      if (!prog || typeof prog.word !== 'string') continue;
      const key = makeWordKey(prog.word, prog.article ?? 'none');
      const match = vocabByKey.get(key);
      if (match?.id && (prog.status === 'new' || prog.status === 'learning' || prog.status === 'mastered')) {
        await db.vocab.update(match.id, {
          status: prog.status,
          easeFactor: typeof prog.easeFactor === 'number' ? prog.easeFactor : match.easeFactor,
          intervalDays: typeof prog.intervalDays === 'number' ? prog.intervalDays : match.intervalDays,
          nextReviewAt: typeof prog.nextReviewAt === 'number' ? prog.nextReviewAt : match.nextReviewAt,
        });
        restoredProgress++;
      }
    }
  }

  return {
    importedWords: added.length,
    restoredProgress,
  };
}
