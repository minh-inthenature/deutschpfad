import {
  db,
  type CefrLevel,
  type DictionaryEntry,
  type GermanArticle,
  type PartOfSpeech,
  type VocabItem,
} from '../db/database';
import { getSavedGeminiKey, getSavedGeminiModel } from './geminiTutor';

export interface EnrichedCardPayload {
  lemma: string;
  partOfSpeech: PartOfSpeech;
  article: GermanArticle;
  plural: string;
  verbForms?: string;
  meaningEn: string;
  meaningVi: string;
  level: CefrLevel;
  exampleDe: string;
  exampleEn: string;
}

const SINGLE_CARD_SCHEMA = {
  type: 'OBJECT',
  properties: {
    lemma: { type: 'STRING' },
    partOfSpeech: { type: 'STRING', enum: ['noun', 'verb', 'adjective', 'phrase'] },
    article: { type: 'STRING', enum: ['der', 'die', 'das', 'none'] },
    plural: { type: 'STRING' },
    verbForms: { type: 'STRING' },
    meaningEn: { type: 'STRING' },
    meaningVi: { type: 'STRING' },
    level: { type: 'STRING', enum: ['A0', 'A1', 'A2', 'B1'] },
    exampleDe: { type: 'STRING' },
    exampleEn: { type: 'STRING' },
  },
  required: [
    'lemma',
    'partOfSpeech',
    'article',
    'plural',
    'meaningEn',
    'meaningVi',
    'level',
    'exampleDe',
    'exampleEn',
  ],
};

const BATCH_CARD_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          lemma: { type: 'STRING' },
          partOfSpeech: {
            type: 'STRING',
            enum: ['noun', 'verb', 'adjective', 'phrase'],
          },
          article: { type: 'STRING', enum: ['der', 'die', 'das', 'none'] },
          plural: { type: 'STRING' },
          verbForms: { type: 'STRING' },
          meaningEn: { type: 'STRING' },
          meaningVi: { type: 'STRING' },
          level: { type: 'STRING', enum: ['A0', 'A1', 'A2', 'B1'] },
          exampleDe: { type: 'STRING' },
          exampleEn: { type: 'STRING' },
        },
        required: [
          'id',
          'lemma',
          'partOfSpeech',
          'article',
          'plural',
          'meaningEn',
          'meaningVi',
          'level',
          'exampleDe',
          'exampleEn',
        ],
      },
    },
  },
  required: ['items'],
};

async function callGeminiStructured<T>(
  prompt: string,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const apiKey = getSavedGeminiKey();
  if (!apiKey) {
    throw new Error(
      'No Gemini API key configured. Add your key in Reference → AI Tutor.',
    );
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Device appears to be offline.');
  }

  const model = getSavedGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  });

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini request failed (${res.status})`);
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }
  return JSON.parse(rawText) as T;
}

function toGender(article: GermanArticle): string | undefined {
  if (article === 'der') return 'masc.';
  if (article === 'die') return 'fem.';
  if (article === 'das') return 'neut.';
  return undefined;
}

export function isCardIncomplete(v: VocabItem): boolean {
  if (v.enriched) return false;
  const missingMeaning = !v.meaning || v.meaning.trim() === '' || v.meaning === '—';
  const missingExample = !v.exampleDe || v.exampleDe.trim() === '';
  const missingVi = !v.meaningVi || v.meaningVi.trim() === '';
  return missingMeaning || missingExample || missingVi;
}

/**
 * Enriches a single VocabItem using Gemini structured JSON output and caches
 * all fields in Dexie (`enriched: true`) to prevent duplicate API token spend.
 */
export async function enrichVocabCard(
  item: VocabItem,
  options?: { forceRefresh?: boolean },
): Promise<VocabItem> {
  if (item.enriched && !options?.forceRefresh && item.meaning && item.exampleDe) {
    return item;
  }

  const prompt = `Enrich this German vocabulary flashcard into canonical dictionary form:
Input word: "${item.german}"
Current article: "${item.article}"
Current meaning: "${item.meaning || ''}"
Current POS: "${item.partOfSpeech}"

Rules:
- Normalize inflected/plural inputs to their canonical singular lemma (e.g., "Häuser" -> lemma "Haus", article "das", plural "die Häuser").
- Use authentic German umlauts (ä, ö, ü) and ß.
- For nouns: article must be "der", "die", or "das", plural must start with "die " or be "-" if uncountable.
- For verbs: article "none", plural "—", verbForms like "spricht · sprach · hat gesprochen".
- Provide concise English (meaningEn) and Vietnamese (meaningVi) meanings.
- Provide 1 natural A1/A2 German example sentence (exampleDe) and English translation (exampleEn).`;

  const payload = await callGeminiStructured<EnrichedCardPayload>(
    prompt,
    SINGLE_CARD_SCHEMA,
  );

  const updates: Partial<VocabItem> = {
    german: payload.lemma.trim(),
    word: payload.lemma.trim(),
    partOfSpeech: payload.partOfSpeech,
    article: payload.article,
    gender: toGender(payload.article),
    plural: payload.plural.trim() || '—',
    verbForms: payload.verbForms?.trim() || item.verbForms,
    meaning: payload.meaningEn.trim(),
    meaningVi: payload.meaningVi.trim(),
    level: payload.level,
    exampleDe: payload.exampleDe.trim(),
    exampleEn: payload.exampleEn.trim(),
    enriched: true,
  };

  if (item.id !== undefined) {
    await db.vocab.update(item.id, updates);
  }

  return { ...item, ...updates };
}

/**
 * Generates structured enrichment fields without writing to Dexie yet
 * (used inside the manual Card Editor bottom sheet before tapping Save).
 */
export async function previewEnrichFields(input: {
  german: string;
  article?: string;
  meaning?: string;
  partOfSpeech?: string;
}): Promise<EnrichedCardPayload> {
  const prompt = `Normalize and enrich this German flashcard:
Word: "${input.german}"
Article hint: "${input.article || 'unknown'}"
Meaning hint: "${input.meaning || ''}"
POS hint: "${input.partOfSpeech || 'unknown'}"

Return canonical singular lemma (e.g., "Häuser" -> "Haus", article "das", plural "die Häuser"), authentic ä/ö/ü/ß, concise English & Vietnamese meanings, CEFR level (A0-B1), and 1 natural A1/A2 German example sentence.`;

  return callGeminiStructured<EnrichedCardPayload>(prompt, SINGLE_CARD_SCHEMA);
}

/**
 * Enriches a DictionaryEntry and persists updates to Dexie dictionaryCache & vocab.
 */
export async function enrichDictionaryEntry(
  entry: DictionaryEntry,
): Promise<DictionaryEntry> {
  const payload = await previewEnrichFields({
    german: entry.german,
    article: entry.article,
    meaning: entry.english,
    partOfSpeech: entry.partOfSpeech,
  });

  const combinedEnglish = payload.meaningVi
    ? `${payload.meaningEn} (${payload.meaningVi})`
    : payload.meaningEn;

  const updated: DictionaryEntry = {
    ...entry,
    german: payload.lemma.trim(),
    article: payload.article,
    plural: payload.plural.trim() || entry.plural,
    english: combinedEnglish,
    level: payload.level,
    examples: [
      { de: payload.exampleDe.trim(), en: payload.exampleEn.trim() },
      ...(entry.examples ?? []).filter(
        (ex) => ex.de.toLowerCase() !== payload.exampleDe.trim().toLowerCase(),
      ),
    ].slice(0, 3),
    cachedAt: Date.now(),
  };

  if (entry.id !== undefined) {
    const dictUpdates = {
      german: updated.german,
      article: updated.article,
      plural: updated.plural,
      english: updated.english,
      level: updated.level,
      examples: updated.examples,
      cachedAt: updated.cachedAt,
    };
    const existingCache = await db.dictionaryCache.get(entry.id);
    if (existingCache) {
      await db.dictionaryCache.update(entry.id, dictUpdates);
    } else {
      const existingDict = await db.dictionary.get(entry.id);
      if (existingDict) {
        await db.dictionary.update(entry.id, dictUpdates);
      }
    }
  }

  // Also update matching vocab card if present
  const vocabMatch = await db.vocab
    .where('german')
    .equalsIgnoreCase(entry.german.trim())
    .first();
  if (vocabMatch?.id) {
    await db.vocab.update(vocabMatch.id, {
      german: payload.lemma.trim(),
      word: payload.lemma.trim(),
      article: payload.article,
      gender: toGender(payload.article),
      plural: payload.plural.trim(),
      meaning: payload.meaningEn.trim(),
      meaningVi: payload.meaningVi.trim(),
      level: payload.level,
      exampleDe: payload.exampleDe.trim(),
      exampleEn: payload.exampleEn.trim(),
      enriched: true,
    });
  }

  return updated;
}

/**
 * Batches up to `batchSize` unenriched/incomplete cards into a single Gemini API
 * request and saves all enriched results into Dexie (`enriched: true`).
 */
export async function batchEnrichIncompleteCards(
  batchSize = 15,
): Promise<{ enrichedCount: number; remainingCount: number }> {
  const allVocab = await db.vocab.toArray();
  const incomplete = allVocab.filter(
    (v) => v.id !== undefined && isCardIncomplete(v),
  );

  if (incomplete.length === 0) {
    return { enrichedCount: 0, remainingCount: 0 };
  }

  const batch = incomplete.slice(0, batchSize);
  const inputList = batch.map((v) => ({
    id: v.id!,
    german: v.german,
    article: v.article,
    meaning: v.meaning,
    partOfSpeech: v.partOfSpeech,
  }));

  const prompt = `Enrich each German vocabulary card below into canonical dictionary form with authentic ä/ö/ü/ß, article, plural or verbForms, concise English (meaningEn) and Vietnamese (meaningVi) meanings, CEFR level, and 1 natural A1/A2 German example sentence. Preserve each item's exact numeric "id".
Input:
${JSON.stringify(inputList)}`;

  const result = await callGeminiStructured<{
    items: Array<EnrichedCardPayload & { id: number }>;
  }>(prompt, BATCH_CARD_SCHEMA);

  let enrichedCount = 0;
  for (const row of result.items ?? []) {
    if (!row.id) continue;
    await db.vocab.update(row.id, {
      german: row.lemma.trim(),
      word: row.lemma.trim(),
      partOfSpeech: row.partOfSpeech,
      article: row.article,
      gender: toGender(row.article),
      plural: row.plural.trim() || '—',
      verbForms: row.verbForms?.trim() || undefined,
      meaning: row.meaningEn.trim(),
      meaningVi: row.meaningVi.trim(),
      level: row.level,
      exampleDe: row.exampleDe.trim(),
      exampleEn: row.exampleEn.trim(),
      enriched: true,
    });
    enrichedCount++;
  }

  return {
    enrichedCount,
    remainingCount: Math.max(0, incomplete.length - enrichedCount),
  };
}
