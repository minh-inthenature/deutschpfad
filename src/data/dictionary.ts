import type {
  DictLevel,
  DictPartOfSpeech,
  DictionaryEntry,
  GermanArticle,
  SeedVocabInput,
  VerbConjugation,
} from '../db/database';
import { VOCAB_A0 } from './vocabA0';
import { VOCAB_A1 } from './vocabA1';
import { VOCAB_A2 } from './vocabA2';
import { VOCAB_B1 } from './vocabB1';
import { IRREGULAR_VERBS } from './referenceData';
import { DICT_NOUNS_1 } from './dictNouns1';
import { DICT_NOUNS_2 } from './dictNouns2';
import { DICT_VERBS } from './dictVerbs';
import { DICT_ADJ_PREP } from './dictAdjPrep';

export type SeedDictionaryInput = Omit<DictionaryEntry, 'id'>;

/**
 * Normalizes German text for accent/umlaut-tolerant search (ä↔ae, ö↔oe, ü↔ue, ß↔ss).
 */
export function foldGermanSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .trim();
}

const KNOWN_PREFIXES = [
  'ent', 'ver', 'zer', 'emp', 'miss', 'be', 'ge', 'er',
  'auf', 'aus', 'ein', 'vor', 'mit', 'nach', 'zurück', 'zusammen',
  'über', 'unter', 'durch', 'wider', 'weiter', 'weg', 'ab', 'an', 'zu', 'um',
];

const KNOWN_SUFFIXES = [
  'schaft', 'lichkeit', 'igkeit', 'keit', 'heit', 'ung', 'tion', 'sion',
  'ment', 'chen', 'lein', 'isch', 'lich', 'bar', 'sam', 'los', 'voll',
  'ieren', 'tät', 'ismus',
];

/**
 * Generates clean German syllable breaks (e.g., "Ent·schei·dung", "Ge·sund·heit").
 */
export function syllabifyGerman(word: string): string {
  const clean = word.trim();
  if (clean.includes(' ') || clean.length <= 4) return clean;

  const lower = clean.toLowerCase();
  const parts: string[] = [];
  let rest = clean;

  // Check leading prefix
  for (const pre of KNOWN_PREFIXES) {
    if (lower.startsWith(pre) && clean.length - pre.length >= 3) {
      parts.push(clean.slice(0, pre.length));
      rest = clean.slice(pre.length);
      break;
    }
  }

  // Check trailing suffix
  let suffix = '';
  const restLower = rest.toLowerCase();
  for (const suf of KNOWN_SUFFIXES) {
    if (restLower.endsWith(suf) && rest.length - suf.length >= 3) {
      suffix = rest.slice(rest.length - suf.length);
      rest = rest.slice(0, rest.length - suf.length);
      break;
    }
  }

  // Split remaining middle on vowel-consonant-vowel boundaries if long
  if (rest.length >= 6) {
    const splitMid = rest.replace(
      /([aeiouäöüy])([bcdfghjklmnpqrstvwxzß])([aeiouäöüy])/gi,
      '$1·$2$3',
    );
    parts.push(splitMid);
  } else if (rest) {
    parts.push(rest);
  }

  if (suffix) parts.push(suffix);
  return parts.join('·').replace(/··+/g, '·');
}

/**
 * Computes accurate German Genitive Singular for nouns.
 */
export function computeGenitiveSingular(
  german: string,
  article: GermanArticle,
  grammarNote?: string,
): string {
  if (article === 'none') return '—';
  if (article === 'die') return `der ${german}`;

  const noteLower = (grammarNote ?? '').toLowerCase();
  if (noteLower.includes('weak noun') || noteLower.includes('n-declension')) {
    const ending = german.endsWith('e') ? 'n' : 'en';
    return `des ${german}${ending}`;
  }

  const lower = german.toLowerCase();
  if (
    lower.endsWith('s') ||
    lower.endsWith('ß') ||
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('sch') ||
    (german.length <= 5 && !/[aeiouäöü]$/.test(lower))
  ) {
    return `des ${german}es`;
  }
  return `des ${german}s`;
}

const SPECIAL_CONJUGATIONS: Record<string, Omit<VerbConjugation, 'praeteritum' | 'perfekt' | 'auxiliary'>> = {
  sein: { ich: 'bin', du: 'bist', erSieEs: 'ist', wir: 'sind', ihr: 'seid', sieSie: 'sind' },
  haben: { ich: 'habe', du: 'hast', erSieEs: 'hat', wir: 'haben', ihr: 'habt', sieSie: 'haben' },
  werden: { ich: 'werde', du: 'wirst', erSieEs: 'wird', wir: 'werden', ihr: 'werdet', sieSie: 'werden' },
  wissen: { ich: 'weiß', du: 'weißt', erSieEs: 'weiß', wir: 'wissen', ihr: 'wisst', sieSie: 'wissen' },
  können: { ich: 'kann', du: 'kannst', erSieEs: 'kann', wir: 'können', ihr: 'könnt', sieSie: 'können' },
  müssen: { ich: 'muss', du: 'musst', erSieEs: 'muss', wir: 'müssen', ihr: 'müsst', sieSie: 'müssen' },
  dürfen: { ich: 'darf', du: 'darfst', erSieEs: 'darf', wir: 'dürfen', ihr: 'dürft', sieSie: 'dürfen' },
  sollen: { ich: 'soll', du: 'sollst', erSieEs: 'soll', wir: 'sollen', ihr: 'sollt', sieSie: 'sollen' },
  wollen: { ich: 'will', du: 'willst', erSieEs: 'will', wir: 'wollen', ihr: 'wollt', sieSie: 'wollen' },
  mögen: { ich: 'mag', du: 'magst', erSieEs: 'mag', wir: 'mögen', ihr: 'mögt', sieSie: 'mögen' },
  tun: { ich: 'tue', du: 'tust', erSieEs: 'tut', wir: 'tun', ihr: 'tut', sieSie: 'tun' },
};

/**
 * Builds complete 6-person Present + Präteritum + Perfekt conjugation from principal parts.
 */
export function buildVerbConjugation(
  infinitive: string,
  erSieEsRaw: string,
  praeteritumRaw: string,
  perfektRaw: string,
): VerbConjugation {
  const inf = infinitive.replace(/^sich\s+/i, '').trim();
  const erSieEs = erSieEsRaw.trim();
  const praeteritum = praeteritumRaw.trim();
  const perfekt = perfektRaw.trim();

  const auxiliary: VerbConjugation['auxiliary'] = perfekt.startsWith('hat/ist')
    ? 'haben/sein'
    : perfekt.startsWith('ist ')
      ? 'sein'
      : 'haben';

  if (SPECIAL_CONJUGATIONS[inf]) {
    return {
      ...SPECIAL_CONJUGATIONS[inf],
      praeteritum,
      perfekt,
      auxiliary,
    };
  }

  // Detect separable verb from erSieEs containing a space (e.g., "lädt ein", "steht auf")
  const erParts = erSieEs.split(/\s+/);
  const sepPrefix = erParts.length === 2 ? erParts[1] : '';
  const erVerb = erParts[0];

  const baseInf = sepPrefix && inf.startsWith(sepPrefix) ? inf.slice(sepPrefix.length) : inf;
  const stem = baseInf.endsWith('en')
    ? baseInf.slice(0, -2)
    : baseInf.endsWith('n')
      ? baseInf.slice(0, -1)
      : baseInf;

  const suffixSpace = sepPrefix ? ` ${sepPrefix}` : '';

  // Derive ich
  const ichBase = baseInf.endsWith('eln') ? `${stem.slice(0, -2)}le` : `${stem}e`;

  // Derive du from erVerb (preserves stem vowel changes like fährt -> fährst, spricht -> sprichst, liest -> liest)
  let duBase: string;
  if (erVerb.endsWith('et') && /[tdmn]$/.test(stem)) {
    duBase = `${erVerb.slice(0, -1)}st`; // arbeitet -> arbeitest
  } else if (erVerb.endsWith('t') && !erVerb.endsWith('st')) {
    const erStem = erVerb.slice(0, -1);
    if (/[sßxz]$/.test(erStem)) {
      duBase = `${erStem}t`; // isst -> isst, liest -> liest, heißt -> heißt
    } else if (erStem.endsWith('d') || erStem.endsWith('t')) {
      duBase = `${erStem}st`; // lädt -> lädst
    } else {
      duBase = `${erStem}st`; // fährt -> fährst, spricht -> sprichst
    }
  } else if (erVerb.endsWith('st')) {
    duBase = erVerb;
  } else {
    duBase = `${stem}st`;
  }

  // Derive ihr
  const ihrBase = /[td]$/.test(stem) ? `${stem}et` : `${stem}t`;

  return {
    ich: `${ichBase}${suffixSpace}`,
    du: `${duBase}${suffixSpace}`,
    erSieEs,
    wir: `${baseInf}${suffixSpace}`,
    ihr: `${ihrBase}${suffixSpace}`,
    sieSie: `${baseInf}${suffixSpace}`,
    praeteritum,
    perfekt,
    auxiliary,
  };
}

export interface NounDeclensionRow {
  caseLabel: string;
  singular: string;
  plural: string;
}

/**
 * Auto-generates the 4-Case Declension Table (Nom/Akk/Dat/Gen × Singular & Plural) for a noun.
 */
export function buildNounDeclension(entry: DictionaryEntry): NounDeclensionRow[] {
  const { article, german, plural, genitiveSingular, grammarNotes } = entry;
  const hasPlural = Boolean(plural && plural !== '—');
  const pluralBare = hasPlural ? plural.replace(/^die\s+/i, '').trim() : '';

  const isWeak =
    (grammarNotes ?? '').toLowerCase().includes('weak noun') ||
    (grammarNotes ?? '').toLowerCase().includes('n-declension');
  const weakForm = isWeak ? `${german}${german.endsWith('e') ? 'n' : 'en'}` : german;

  const singNom = `${article} ${german}`;
  const singAkk =
    article === 'der' ? `den ${weakForm}` : `${article} ${german}`;
  const singDat =
    article === 'der'
      ? `dem ${weakForm}`
      : article === 'das'
        ? `dem ${german}`
        : `der ${german}`;
  const singGen = genitiveSingular || computeGenitiveSingular(german, article, grammarNotes);

  let plDat = '—';
  if (hasPlural) {
    const needsN = !/[ns]$/.test(pluralBare.toLowerCase());
    plDat = `den ${pluralBare}${needsN ? 'n' : ''}`;
  }

  return [
    { caseLabel: 'Nom.', singular: singNom, plural: hasPlural ? `die ${pluralBare}` : '—' },
    { caseLabel: 'Akk.', singular: singAkk, plural: hasPlural ? `die ${pluralBare}` : '—' },
    { caseLabel: 'Dat.', singular: singDat, plural: plDat },
    { caseLabel: 'Gen.', singular: singGen, plural: hasPlural ? `der ${pluralBare}` : '—' },
  ];
}

function buildDefaultExamplesAndCollocations(
  german: string,
  article: GermanArticle,
  pos: DictPartOfSpeech,
  english: string,
  conjugation?: VerbConjugation,
  existingEx?: { de: string; en: string },
): {
  collocations: { de: string; en: string }[];
  examples: { de: string; en: string }[];
} {
  const shortEn = english.split(/[;,]/)[0].trim();

  if (pos === 'noun' && article !== 'none') {
    const akkArt = article === 'der' ? 'den' : article;
    const indefAkk = article === 'der' ? 'einen' : article === 'die' ? 'eine' : 'ein';
    const datArt = article === 'die' ? 'der' : 'dem';
    const collocations = [
      { de: `${article} ${german}`, en: `the ${shortEn}` },
      { de: `mit ${datArt} ${german}`, en: `with the ${shortEn}` },
      { de: `${indefAkk} ${german} haben`, en: `to have a ${shortEn}` },
    ];
    const ex1 = existingEx ?? {
      de: `Ich brauche heute ${indefAkk} ${german}.`,
      en: `I need a ${shortEn} today.`,
    };
    const ex2 = {
      de: `Kannst du mir ${akkArt} ${german} zeigen?`,
      en: `Can you show me the ${shortEn}?`,
    };
    return { collocations, examples: [ex1, ex2] };
  }

  if (pos === 'verb' && conjugation) {
    const collocations = [
      { de: `oft ${german}`, en: `to ${shortEn.replace(/^to\s+/i, '')} often` },
      { de: `gern ${german}`, en: `to like to ${shortEn.replace(/^to\s+/i, '')}` },
    ];
    const ex1 = existingEx ?? {
      de: `Sie ${conjugation.erSieEs} fast jeden Tag.`,
      en: `She ${shortEn.replace(/^to\s+/i, '')}s almost every day.`,
    };
    const ex2 = {
      de: `Gestern ${conjugation.perfekt.replace(/^(hat|ist)\s+/, 'habe ich ').replace(/^hat\/ist\s+/, 'habe ich ')}.`,
      en: `Yesterday I completed this action (${shortEn}).`,
    };
    // Make ex2 cleaner using auxiliary
    const auxIch = conjugation.auxiliary === 'sein' ? 'bin' : 'habe';
    const partII = conjugation.perfekt.replace(/^(hat\/ist|hat|ist)\s+/, '');
    ex2.de = `Gestern ${auxIch} ich schon ${partII}.`;
    ex2.en = `Yesterday I already did this (${shortEn}).`;
    return { collocations, examples: [ex1, ex2] };
  }

  if (pos === 'adjective') {
    const collocations = [
      { de: `sehr ${german}`, en: `very ${shortEn}` },
      { de: `ziemlich ${german}`, en: `quite ${shortEn}` },
    ];
    const ex1 = existingEx ?? {
      de: `Das Ergebnis ist wirklich ${german}.`,
      en: `The result is really ${shortEn}.`,
    };
    const ex2 = {
      de: `Im Alltag ist das oft sehr ${german}.`,
      en: `In everyday life, that is often very ${shortEn}.`,
    };
    return { collocations, examples: [ex1, ex2] };
  }

  const ex1 = existingEx ?? {
    de: `Im Deutschen verwendet man „${german}“ sehr häufig.`,
    en: `In German, "${german}" (${shortEn}) is used very frequently.`,
  };
  const ex2 = {
    de: `Achte im Satzbau genau auf „${german}“.`,
    en: `Pay close attention to "${german}" in sentence structure.`,
  };
  return {
    collocations: [{ de: german, en: shortEn }],
    examples: [ex1, ex2],
  };
}

function buildAliases(entry: Omit<SeedDictionaryInput, 'searchAliases' | 'relatedWords'>): string[] {
  const set = new Set<string>();
  const add = (s?: string) => {
    if (!s || s === '—') return;
    const trimmed = s.trim();
    if (!trimmed) return;
    set.add(trimmed.toLowerCase());
    const folded = foldGermanSearch(trimmed);
    if (folded !== trimmed.toLowerCase()) set.add(folded);
  };

  add(entry.german);
  if (entry.plural && entry.plural !== '—') {
    add(entry.plural);
    add(entry.plural.replace(/^die\s+/i, ''));
  }
  if (entry.genitiveSingular && entry.genitiveSingular !== '—') {
    add(entry.genitiveSingular.replace(/^(des|der)\s+/i, ''));
  }
  if (entry.conjugation) {
    add(entry.conjugation.ich);
    add(entry.conjugation.du);
    add(entry.conjugation.erSieEs);
    add(entry.conjugation.praeteritum);
    add(entry.conjugation.perfekt);
    add(entry.conjugation.perfekt.replace(/^(hat\/ist|hat|ist)\s+/, ''));
  }
  if (entry.comparative) add(entry.comparative);
  if (entry.superlative) add(entry.superlative.replace(/^am\s+/i, ''));

  return Array.from(set);
}

function fromCurriculumVocab(v: SeedVocabInput): SeedDictionaryInput {
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
  const { collocations, examples } = buildDefaultExamplesAndCollocations(
    v.german,
    v.article,
    pos,
    v.meaning,
    conjugation,
    v.exampleDe && v.exampleEn ? { de: v.exampleDe, en: v.exampleEn } : undefined,
  );

  const base = {
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
    collocations,
    examples,
    isFavorite: false,
  };

  return {
    ...base,
    relatedWords: [],
    searchAliases: buildAliases(base),
  };
}

let cachedDataset: SeedDictionaryInput[] | null = null;

/**
 * Builds the complete 1,200+ entry offline German <-> English dictionary dataset,
 * combining all A0-B1 curriculum vocabulary + 60 irregular verbs + expanded A1-B2 lexicon,
 * with auto-linked Word Family relationships.
 */
export function buildDictionaryDataset(): SeedDictionaryInput[] {
  if (cachedDataset) return cachedDataset;

  const byKey = new Map<string, SeedDictionaryInput>();

  const register = (entry: SeedDictionaryInput) => {
    const key = `${entry.german.trim()}|${entry.partOfSpeech}`;
    if (!byKey.has(key)) {
      byKey.set(key, entry);
    }
  };

  // 1. All 380 A0-B1 curriculum entries first (richest bilingual examples)
  for (const v of [...VOCAB_A0, ...VOCAB_A1, ...VOCAB_A2, ...VOCAB_B1]) {
    register(fromCurriculumVocab(v));
  }

  // 2. All 60 strong/mixed irregular verbs
  for (const iv of IRREGULAR_VERBS) {
    const conj = buildVerbConjugation(iv.infinitive, iv.praesens, iv.praeteritum, iv.perfekt);
    const { collocations, examples } = buildDefaultExamplesAndCollocations(
      iv.infinitive,
      'none',
      'verb',
      iv.meaning,
      conj,
    );
    const base = {
      german: iv.infinitive,
      syllables: syllabifyGerman(iv.infinitive),
      article: 'none' as const,
      plural: '—',
      genitiveSingular: '—',
      partOfSpeech: 'verb' as const,
      level: 'A2' as DictLevel,
      english: iv.meaning,
      conjugation: conj,
      grammarNotes: conj.auxiliary === 'sein' ? 'strong verb · takes sein' : 'strong/mixed verb',
      collocations,
      examples,
      isFavorite: false,
    };
    register({ ...base, relatedWords: [], searchAliases: buildAliases(base) });
  }

  // 3. Expanded Nouns 1 + Nouns 2
  for (const [german, article, plural, level, english, grammarNote] of [
    ...DICT_NOUNS_1,
    ...DICT_NOUNS_2,
  ]) {
    const genitiveSingular = computeGenitiveSingular(german, article, grammarNote);
    const { collocations, examples } = buildDefaultExamplesAndCollocations(
      german,
      article,
      'noun',
      english,
    );
    const base = {
      german,
      syllables: syllabifyGerman(german),
      article,
      plural,
      genitiveSingular,
      partOfSpeech: 'noun' as const,
      level,
      english,
      grammarNotes: grammarNote,
      collocations,
      examples,
      isFavorite: false,
    };
    register({ ...base, relatedWords: [], searchAliases: buildAliases(base) });
  }

  // 4. Expanded Verbs
  for (const [german, level, english, erSieEs, praeteritum, perfekt, grammarNote] of DICT_VERBS) {
    const conj = buildVerbConjugation(german, erSieEs, praeteritum, perfekt);
    const { collocations, examples } = buildDefaultExamplesAndCollocations(
      german,
      'none',
      'verb',
      english,
      conj,
    );
    const base = {
      german,
      syllables: syllabifyGerman(german),
      article: 'none' as const,
      plural: '—',
      genitiveSingular: '—',
      partOfSpeech: 'verb' as const,
      level,
      english,
      conjugation: conj,
      grammarNotes: grammarNote,
      collocations,
      examples,
      isFavorite: false,
    };
    register({ ...base, relatedWords: [], searchAliases: buildAliases(base) });
  }

  // 5. Expanded Adjectives, Adverbs, Prepositions & Phrases
  for (const [german, partOfSpeech, level, english, comparative, superlative, grammarNote] of DICT_ADJ_PREP) {
    const { collocations, examples } = buildDefaultExamplesAndCollocations(
      german,
      'none',
      partOfSpeech,
      english,
    );
    const base = {
      german,
      syllables: syllabifyGerman(german),
      article: 'none' as const,
      plural: '—',
      genitiveSingular: '—',
      partOfSpeech,
      level,
      english,
      comparative,
      superlative,
      grammarNotes: grammarNote,
      collocations,
      examples,
      isFavorite: false,
    };
    register({ ...base, relatedWords: [], searchAliases: buildAliases(base) });
  }

  // 6. Auto-link Word Families by shared 5+ character root stem across entries
  const entries = Array.from(byKey.values());
  const stemIndex = new Map<string, string[]>();

  const extractStem = (word: string): string => {
    const clean = word
      .toLowerCase()
      .replace(/^(be|ge|er|ver|zer|ent|emp|auf|aus|ein|vor|mit|nach|ab|an|zu|um)/, '')
      .replace(/(ungen|ung|heit|keit|schaft|tion|ieren|lich|isch|bar|sam|en|er|el|e)$/, '');
    return clean.length >= 4 ? clean : '';
  };

  for (const e of entries) {
    if (e.german.includes(' ')) continue;
    const st = extractStem(e.german);
    if (!st) continue;
    const list = stemIndex.get(st);
    if (list) {
      if (!list.includes(e.german)) list.push(e.german);
    } else {
      stemIndex.set(st, [e.german]);
    }
  }

  for (const e of entries) {
    if (e.german.includes(' ')) continue;
    const st = extractStem(e.german);
    if (!st) continue;
    const peers = (stemIndex.get(st) ?? []).filter((w) => w !== e.german);
    if (peers.length > 0) {
      e.relatedWords = peers.slice(0, 6);
    }
  }

  cachedDataset = entries;
  return entries;
}
