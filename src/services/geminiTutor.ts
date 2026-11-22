import type { CefrLevel } from '../db/database';
import type { TileSentenceDrill } from '../data/sentenceDrills';
import type { CustomWordInput } from './customWords';

export const GEMINI_KEY_STORAGE = 'deutschpfad_gemini_key';
export const GEMINI_MODEL_STORAGE = 'deutschpfad_gemini_model';

export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Default)' },
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (Fast / Light)' },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]['id'];

export function getSavedGeminiKey(): string {
  try {
    return (localStorage.getItem(GEMINI_KEY_STORAGE) ?? '').trim();
  } catch {
    return '';
  }
}

export function saveGeminiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearGeminiKey(): void {
  try {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  } catch {
    // ignore storage errors
  }
}

export function getSavedGeminiModel(): GeminiModelId {
  try {
    const saved = (localStorage.getItem(GEMINI_MODEL_STORAGE) ?? '').trim();
    if (saved === 'gemini-3.5-flash-lite') return 'gemini-3.5-flash-lite';
    return 'gemini-3.8-flash';
  } catch {
    return 'gemini-3.8-flash';
  }
}

export function saveGeminiModel(model: GeminiModelId): void {
  try {
    localStorage.setItem(GEMINI_MODEL_STORAGE, model);
  } catch {
    // ignore storage errors
  }
}

export function hasGeminiKey(): boolean {
  const key = getSavedGeminiKey();
  return key.length >= 10 && !/\s/.test(key);
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

async function callGeminiGenerateContent(params: {
  prompt: string;
  apiKey?: string;
  model?: GeminiModelId;
  responseMimeType?: 'application/json' | 'text/plain';
  temperature?: number;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = (params.apiKey ?? getSavedGeminiKey()).trim();
  if (!apiKey) {
    throw new Error('No Gemini API key configured.');
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Device appears to be offline.');
  }

  const model = params.model ?? getSavedGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), params.timeoutMs ?? 20000);

  try {
    const body: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: params.prompt }],
        },
      ],
      generationConfig: {
        temperature: params.temperature ?? 0.3,
        ...(params.responseMimeType ? { responseMimeType: params.responseMimeType } : {}),
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as GeminiApiResponse;

    if (!res.ok) {
      const apiMsg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 429) {
        throw new Error('Rate limit reached (429). Please wait a moment and try again.');
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(`API key rejected (${res.status}): ${apiMsg}`);
      }
      throw new Error(apiMsg);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text.trim()) {
      throw new Error('Gemini returned an empty response.');
    }
    return text.trim();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function testGeminiConnection(
  apiKeyOverride?: string,
  modelOverride?: GeminiModelId,
): Promise<{ ok: boolean; message: string }> {
  const key = (apiKeyOverride ?? getSavedGeminiKey()).trim();
  if (!key) {
    return { ok: false, message: 'Offline Mode — no API key saved.' };
  }
  try {
    await callGeminiGenerateContent({
      prompt: 'Reply with exactly: OK',
      apiKey: key,
      model: modelOverride ?? getSavedGeminiModel(),
      temperature: 0,
      timeoutMs: 12000,
    });
    return { ok: true, message: 'Connected' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    return { ok: false, message: msg };
  }
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
  return trimmed;
}

export async function generateAiSatzbauDrill(params: {
  level: CefrLevel;
  focusWords: string[];
}): Promise<TileSentenceDrill[]> {
  const effectiveLevel = params.level === 'A0' ? 'A1' : params.level;
  const wordsContext =
    params.focusWords.length > 0
      ? `Prioritize incorporating some of these words from the student's mistake notebook or learned deck where natural: ${params.focusWords.slice(0, 15).join(', ')}.`
      : 'Use high-frequency everyday German vocabulary.';

  const prompt = `Generate exactly 10 German Satzbau (sentence-building) exercises for CEFR level ${effectiveLevel}.
${wordsContext}

Grammar focus by level:
- A1: V2 word order, time-manner-place, accusative objects, modal verbs (können, müssen, möchten), negation (nicht/kein).
- A2: Separable prefix verbs, Perfekt (haben/sein + Partizip II), dative prepositions, weil/dass/wenn subordinate clauses.
- B1: Relative clauses, obwohl/damit/um...zu, reflexive verbs, two-part connectors (nicht nur ... sondern auch).

Return ONLY a valid JSON array of 10 objects with this exact schema:
[
  {
    "id": "ai-01",
    "level": "${effectiveLevel}",
    "grammarRule": "short grammar tag, e.g. V2 Word Order",
    "english": "Natural English translation",
    "correctTokens": ["Token1", "token2", "token3."],
    "distractors": ["wrongDistractor1", "wrongDistractor2"],
    "explanation": "Concise 1-sentence English explanation of the grammar rule."
  }
]

Rules:
- Keep punctuation attached to the last token of each clause/sentence (e.g. "Kaffee.", "Hause,").
- Every sentence must have at least 4 tokens in correctTokens and exactly 2 realistic grammatical distractors (wrong verb conjugation or wrong case article) in distractors.
- Ensure 100% grammatically accurate German.`;

  const rawText = await callGeminiGenerateContent({
    prompt,
    responseMimeType: 'application/json',
    temperature: 0.65,
    timeoutMs: 25000,
  });

  const parsed = JSON.parse(stripJsonFences(rawText)) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI returned an invalid drill format.');
  }

  const validated: TileSentenceDrill[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;
    const english = typeof item.english === 'string' ? item.english.trim() : '';
    const grammarRule = typeof item.grammarRule === 'string' ? item.grammarRule.trim() : 'AI Grammar';
    const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';
    const correctTokens = Array.isArray(item.correctTokens)
      ? item.correctTokens.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
    const distractors = Array.isArray(item.distractors)
      ? item.distractors.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];

    if (english && correctTokens.length >= 3 && distractors.length >= 1) {
      validated.push({
        id: `ai-${Date.now()}-${i + 1}`,
        level: effectiveLevel,
        grammarRule,
        english,
        correctTokens,
        distractors: distractors.slice(0, 2),
        explanation: explanation || 'Check German verb position and case endings.',
      });
    }
  }

  if (validated.length === 0) {
    throw new Error('No valid Satzbau exercises could be parsed from AI response.');
  }

  return validated.slice(0, 10);
}

export interface AiGrammarCheckResult {
  isValid: boolean;
  correctedSentence: string;
  shortExplanation: string;
}

export async function checkGermanSentenceWithAI(params: {
  userSentence: string;
  canonicalTarget: string;
  englishPrompt: string;
  grammarRule: string;
}): Promise<AiGrammarCheckResult> {
  const prompt = `You are a strict, helpful German grammar tutor.
A student is translating: "${params.englishPrompt}" (Grammar target: ${params.grammarRule}).
Canonical answer: "${params.canonicalTarget}"
Student typed: "${params.userSentence}"

Evaluate whether the student's sentence is grammatically valid German AND accurately conveys the English prompt (for example, valid alternative German word order like V2 time-fronting vs subject-first is VALID).
Ignore minor trailing punctuation differences, but do NOT accept wrong cases, wrong verb conjugations, wrong verb position, or missing noun capitalization.

Return ONLY valid JSON matching:
{
  "isValid": boolean,
  "correctedSentence": "the student's sentence if valid, otherwise the closest corrected German sentence",
  "shortExplanation": "1-2 concise sentences in English explaining either why the alternative word order is valid or the exact grammar rule that was violated."
}`;

  const rawText = await callGeminiGenerateContent({
    prompt,
    responseMimeType: 'application/json',
    temperature: 0.1,
    timeoutMs: 15000,
  });

  const parsed = JSON.parse(stripJsonFences(rawText)) as Record<string, unknown>;
  return {
    isValid: Boolean(parsed.isValid),
    correctedSentence:
      typeof parsed.correctedSentence === 'string' && parsed.correctedSentence.trim()
        ? parsed.correctedSentence.trim()
        : params.canonicalTarget,
    shortExplanation:
      typeof parsed.shortExplanation === 'string' && parsed.shortExplanation.trim()
        ? parsed.shortExplanation.trim()
        : 'Compare your word order and case endings with the canonical German sentence.',
  };
}

export async function checkCaseChoiceWithAI(params: {
  sentenceBefore: string;
  sentenceAfter: string;
  chosenArticle: string;
  correctArticle: string;
  targetCase: string;
  nounHint?: string;
}): Promise<AiGrammarCheckResult> {
  const fullStudent = `${params.sentenceBefore} ${params.chosenArticle} ${params.sentenceAfter}`.trim();
  const fullCorrect = `${params.sentenceBefore} ${params.correctArticle} ${params.sentenceAfter}`.trim();

  const prompt = `You are a concise German grammar tutor.
In a Fall-Training (German case) exercise:
Prompt: "${params.sentenceBefore} ___ ${params.sentenceAfter}" (Target case: ${params.targetCase}${params.nounHint ? `, Noun: ${params.nounHint}` : ''})
Canonical answer: "${fullCorrect}"
Student chose: "${params.chosenArticle}" -> "${fullStudent}"

Evaluate if the student's choice could ever be grammatically valid in this exact sentence, and explain the exact German case/preposition/gender rule in 1-2 short English sentences.

Return ONLY valid JSON matching:
{
  "isValid": boolean,
  "correctedSentence": "${fullCorrect}",
  "shortExplanation": "1-2 concise sentences in English explaining the exact case rule."
}`;

  const rawText = await callGeminiGenerateContent({
    prompt,
    responseMimeType: 'application/json',
    temperature: 0.1,
    timeoutMs: 15000,
  });

  const parsed = JSON.parse(stripJsonFences(rawText)) as Record<string, unknown>;
  return {
    isValid: Boolean(parsed.isValid),
    correctedSentence:
      typeof parsed.correctedSentence === 'string' && parsed.correctedSentence.trim()
        ? parsed.correctedSentence.trim()
        : fullCorrect,
    shortExplanation:
      typeof parsed.shortExplanation === 'string' && parsed.shortExplanation.trim()
        ? parsed.shortExplanation.trim()
        : `This slot requires ${params.targetCase} (${params.correctArticle}).`,
  };
}

export async function generateAiWordPack(params: {
  level: 'A1' | 'A2' | 'B1';
  topic: string;
  count: 10 | 20;
  topicWords?: string[];
  existingWordSet: Set<string>;
}): Promise<CustomWordInput[]> {
  const requestCount = params.count + 4;
  const avoidList = (params.topicWords ?? []).slice(0, 20).join(', ');
  const prompt = `Generate exactly ${requestCount} useful, high-accuracy German NOUNS for CEFR level ${params.level} on the theme "${params.topic}".
${avoidList ? `Avoid repeating these words already in this topic: ${avoidList}.` : ''}

Return ONLY a valid JSON array of ${requestCount} objects with this exact schema:
[
  {
    "level": "${params.level}",
    "topic": "${params.topic}",
    "article": "der" | "die" | "das",
    "gender": "masc." | "fem." | "neut.",
    "word": "Capitalized German noun (singular)",
    "plural": "die + plural form (e.g. 'die Tische')",
    "meaning": "Concise English translation",
    "exampleDe": "Natural German example sentence using the noun.",
    "exampleEn": "Natural English translation of the example.",
    "partOfSpeech": "noun"
  }
]

STRICT RULES:
- Return ONLY German nouns (NO verbs, NO adjectives, NO adverbs, NO phrases).
- Every noun MUST be capitalized and have a valid definite article: strictly "der", "die", or "das" (never "none").
- Every gender MUST match the article: "masc." for der, "fem." for die, "neut." for das.
- Every plural MUST be a valid German plural starting with "die " (e.g. "die Bücher", or "die [singular]" if invariant/uncountable).`;

  const rawText = await callGeminiGenerateContent({
    prompt,
    responseMimeType: 'application/json',
    temperature: 0.65,
    timeoutMs: 28000,
  });

  const parsed = JSON.parse(stripJsonFences(rawText)) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI returned an invalid word pack format.');
  }

  const seenLocal = new Set<string>(params.existingWordSet);
  const valid: CustomWordInput[] = [];

  for (const raw of parsed) {
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Record<string, unknown>;
    const word = typeof obj.word === 'string' ? obj.word.trim() : '';
    const meaning = typeof obj.meaning === 'string' ? obj.meaning.trim() : '';
    const artRaw = typeof obj.article === 'string' ? obj.article.trim().toLowerCase() : '';
    const pluralRaw = typeof obj.plural === 'string' ? obj.plural.trim() : '';

    // Strict noun validation: must have der/die/das article and a non-empty plural
    if (!word || !meaning) continue;
    if (artRaw !== 'der' && artRaw !== 'die' && artRaw !== 'das') continue;
    if (!pluralRaw || pluralRaw === '—' || pluralRaw === '-') continue;

    // Instant local deduplication against all built-in + custom words
    const normalizedKey = word.toLowerCase();
    if (seenLocal.has(normalizedKey)) continue;
    seenLocal.add(normalizedKey);

    const gender =
      artRaw === 'der' ? 'masc.' : artRaw === 'die' ? 'fem.' : 'neut.';
    const plural = pluralRaw.toLowerCase().startsWith('die ')
      ? pluralRaw
      : `die ${pluralRaw}`;

    valid.push({
      level: params.level,
      topic: typeof obj.topic === 'string' && obj.topic.trim() ? obj.topic.trim() : params.topic,
      article: artRaw,
      gender,
      word,
      plural,
      meaning,
      exampleDe:
        typeof obj.exampleDe === 'string' && obj.exampleDe.trim()
          ? obj.exampleDe.trim()
          : `${artRaw.charAt(0).toUpperCase() + artRaw.slice(1)} ${word} ist hier.`,
      exampleEn:
        typeof obj.exampleEn === 'string' && obj.exampleEn.trim()
          ? obj.exampleEn.trim()
          : meaning,
      partOfSpeech: 'noun',
      isCustom: true,
    });

    if (valid.length >= params.count) break;
  }

  if (valid.length === 0) {
    throw new Error('No new unique German nouns could be extracted.');
  }

  return valid;
}

export async function defineWordWithAI(query: string): Promise<CustomWordInput> {
  const cleanQuery = query.trim();
  const prompt = `Define the German word (or translate the English word into its best standard German equivalent) for: "${cleanQuery}".

Return ONLY a valid JSON object matching this exact schema:
{
  "level": "A1" | "A2" | "B1",
  "topic": "Short German or English topic category, e.g. Alltag, Reisen, Universität",
  "article": "der" | "die" | "das" | "none",
  "gender": "masc." | "fem." | "neut." | "",
  "word": "German base word (capitalized if noun, infinitive if verb)",
  "plural": "die + plural form for nouns, or '—' for verbs/adjectives",
  "meaning": "Clear English translation",
  "exampleDe": "Natural German example sentence.",
  "exampleEn": "English translation of the example sentence.",
  "partOfSpeech": "noun" | "verb" | "adjective" | "phrase"
}`;

  const rawText = await callGeminiGenerateContent({
    prompt,
    responseMimeType: 'application/json',
    temperature: 0.2,
    timeoutMs: 18000,
  });

  const obj = JSON.parse(stripJsonFences(rawText)) as Record<string, unknown>;
  const word = typeof obj.word === 'string' ? obj.word.trim() : '';
  const meaning = typeof obj.meaning === 'string' ? obj.meaning.trim() : '';
  if (!word || !meaning) {
    throw new Error('Could not parse a valid German definition from AI.');
  }

  const artRaw = typeof obj.article === 'string' ? obj.article.trim().toLowerCase() : 'none';
  const article = artRaw === 'der' || artRaw === 'die' || artRaw === 'das' ? artRaw : 'none';
  const lvlRaw = typeof obj.level === 'string' ? obj.level.trim().toUpperCase() : 'A2';
  const level = lvlRaw === 'A1' || lvlRaw === 'A2' || lvlRaw === 'B1' ? lvlRaw : 'A2';
  const posRaw = typeof obj.partOfSpeech === 'string' ? obj.partOfSpeech.trim().toLowerCase() : '';
  const partOfSpeech =
    posRaw === 'noun' || posRaw === 'verb' || posRaw === 'adjective' || posRaw === 'phrase'
      ? posRaw
      : article !== 'none'
        ? 'noun'
        : 'phrase';

  return {
    level,
    topic: typeof obj.topic === 'string' && obj.topic.trim() ? obj.topic.trim() : 'AI Dictionary',
    article,
    gender: typeof obj.gender === 'string' ? obj.gender.trim() : '',
    word,
    plural: typeof obj.plural === 'string' && obj.plural.trim() ? obj.plural.trim() : '—',
    meaning,
    exampleDe:
      typeof obj.exampleDe === 'string' && obj.exampleDe.trim()
        ? obj.exampleDe.trim()
        : `${word}.`,
    exampleEn:
      typeof obj.exampleEn === 'string' && obj.exampleEn.trim()
        ? obj.exampleEn.trim()
        : meaning,
    partOfSpeech,
    isCustom: true,
  };
}
