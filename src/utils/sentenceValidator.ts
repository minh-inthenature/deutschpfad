import type { VocabItem } from '../db/database';

export interface PluralDiffResult {
  umlautChange: string | null; // e.g., 'a → ä'
  stem: string;
  ending: string;
  pluralNoun: string;
}

const UMLAUT_PAIRS: [string, string][] = [
  ['a', 'ä'],
  ['o', 'ö'],
  ['u', 'ü'],
  ['A', 'Ä'],
  ['O', 'Ö'],
  ['U', 'Ü'],
];

/**
 * Computes a clean visual diff between a German singular noun (e.g. "Apfel", "Haus", "Wohnung")
 * and its plural form (e.g. "die Äpfel", "die Häuser", "die Wohnungen") to highlight
 * umlaut shifts and added plural endings.
 */
export function computePluralDiff(singular: string, fullPlural: string): PluralDiffResult {
  const pluralNoun = fullPlural.replace(/^die\s+/i, '').trim();
  const sing = singular.trim();

  // Detect umlaut vowel shift
  let umlautChange: string | null = null;
  const minLen = Math.min(sing.length, pluralNoun.length);
  for (let i = 0; i < minLen; i++) {
    const sCh = sing[i];
    const pCh = pluralNoun[i];
    if (sCh !== pCh) {
      const pair = UMLAUT_PAIRS.find(([base, uml]) => base === sCh && uml === pCh);
      if (pair) {
        umlautChange = `${pair[0].toLowerCase()} → ${pair[1].toLowerCase()}`;
        break;
      }
    }
  }

  // Determine stem vs added ending
  if (pluralNoun.length > sing.length) {
    // Check if plural extends singular (with or without umlaut shift in stem)
    const stemPart = pluralNoun.slice(0, sing.length);
    const endingPart = pluralNoun.slice(sing.length);
    // Handle -in -> -innen or -nis -> -nisse or -e -> -en
    if (sing.endsWith('e') && pluralNoun === `${sing}n`) {
      return { umlautChange, stem: sing, ending: 'n', pluralNoun };
    }
    if (sing.endsWith('a') && pluralNoun.endsWith('en')) {
      return { umlautChange, stem: pluralNoun.slice(0, -2), ending: 'en', pluralNoun };
    }
    return {
      umlautChange,
      stem: stemPart,
      ending: endingPart,
      pluralNoun,
    };
  }

  return {
    umlautChange,
    stem: pluralNoun,
    ending: '',
    pluralNoun,
  };
}

/**
 * Generates 4 multiple-choice plural options (1 correct + 3 plausible German distractors)
 * for faster thumb practice in Article & Plural Master.
 */
export function generatePluralChoices(item: VocabItem): string[] {
  const correct = item.plural.trim();
  const base = item.german.trim();

  const umlautBase = base
    .replace(/([aouAOU])/, (m) => {
      const map: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };
      return map[m] ?? m;
    });

  const candidates = [
    `die ${base}e`,
    `die ${base}en`,
    `die ${base}er`,
    `die ${base}n`,
    `die ${base}s`,
    `die ${base}`,
    `die ${umlautBase}e`,
    `die ${umlautBase}er`,
    `die ${umlautBase}`,
  ].filter((c) => c.toLowerCase() !== correct.toLowerCase());

  const uniqueDistractors: string[] = [];
  for (const c of candidates) {
    if (!uniqueDistractors.some((u) => u.toLowerCase() === c.toLowerCase())) {
      uniqueDistractors.push(c);
    }
    if (uniqueDistractors.length === 3) break;
  }

  // Deterministic-ish shuffle based on word length + char code so order isn't always index 0
  const all = [correct, ...uniqueDistractors];
  const seed = base.charCodeAt(0) + base.length;
  for (let i = all.length - 1; i > 0; i--) {
    const j = (seed + i * 7) % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export interface SentenceValidationFeedback {
  isCorrect: boolean;
  headline: string;
  checks: {
    type: 'ok' | 'warn' | 'error';
    label: string;
    detail: string;
  }[];
}

function tokenizeSentence(s: string): string[] {
  return s
    .trim()
    .replace(/[.,!?;:]+/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Offline smart German sentence validator.
 * Checks:
 * 1. Exact match (with punctuation tolerance)
 * 2. Noun & sentence-initial capitalization
 * 3. Verb position (V2 / verb-final)
 * 4. Article / verb inflection mismatches
 */
export function validateGermanSentence(
  userInput: string,
  targetSentence: string,
  acceptedAlternatives: string[] = [],
): SentenceValidationFeedback {
  const allTargets = [targetSentence, ...acceptedAlternatives];
  const userTokens = tokenizeSentence(userInput);

  // Check exact match (case-sensitive on words, ignoring trailing punctuation differences)
  for (const target of allTargets) {
    const targetTokens = tokenizeSentence(target);
    if (
      userTokens.length === targetTokens.length &&
      userTokens.every((tok, idx) => tok === targetTokens[idx])
    ) {
      return {
        isCorrect: true,
        headline: 'Perfekt! Exact German grammar & capitalization.',
        checks: [
          {
            type: 'ok',
            label: 'Structure & Inflection',
            detail: 'Word order, articles, verb conjugation, and noun capitalization are all spot-on.',
          },
        ],
      };
    }
  }

  // Compare against primary target for rich diagnostics
  const targetTokens = tokenizeSentence(targetSentence);
  const checks: SentenceValidationFeedback['checks'] = [];

  // 1. Check if case-insensitive exact match (capitalization issue only!)
  const caseInsensitiveMatch =
    userTokens.length === targetTokens.length &&
    userTokens.every((tok, idx) => tok.toLowerCase() === targetTokens[idx].toLowerCase());

  if (caseInsensitiveMatch) {
    const capIssues: string[] = [];
    userTokens.forEach((tok, idx) => {
      if (tok !== targetTokens[idx]) {
        capIssues.push(`"${tok}" → "${targetTokens[idx]}"`);
      }
    });
    return {
      isCorrect: false,
      headline: 'Almost! Check German capitalization.',
      checks: [
        {
          type: 'ok',
          label: 'Word Order & Inflection',
          detail: 'All words, articles, and verb forms are in the right place.',
        },
        {
          type: 'warn',
          label: 'Capitalization',
          detail: `Remember to capitalize sentence starts and all German nouns: ${capIssues.join(', ')}.`,
        },
      ],
    };
  }

  // 2. Check if same multiset of words (case-insensitive) → Word Order / Verb Position error!
  const sortedUser = [...userTokens].map((w) => w.toLowerCase()).sort();
  const sortedTarget = [...targetTokens].map((w) => w.toLowerCase()).sort();
  const sameWordsWrongOrder =
    sortedUser.length === sortedTarget.length &&
    sortedUser.every((w, i) => w === sortedTarget[i]);

  if (sameWordsWrongOrder) {
    const v2Target = targetTokens[1];
    const v2User = userTokens[1];
    checks.push({
      type: 'error',
      label: 'Verb Position / Word Order',
      detail:
        v2User?.toLowerCase() !== v2Target?.toLowerCase()
          ? `Position 2 expects "${v2Target}" (you wrote "${v2User ?? '—'}"). Check V2 or verb-final placement.`
          : 'You used the right words, but their order needs adjustment (check clause bracket / verb-final rule).',
    });
  } else {
    // 3. Detailed token-level checks: capitalization, articles, verb inflection
    const capMissed: string[] = [];
    const articleSet = new Set([
      'der', 'die', 'das', 'den', 'dem', 'des',
      'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
      'kein', 'keine', 'keinen', 'keinem', 'keiner',
      'mein', 'meine', 'meinen', 'meinem', 'meiner',
      'dein', 'deine', 'deinen', 'deinem', 'deiner',
    ]);
    const articleMismatches: string[] = [];
    const inflectionMismatches: string[] = [];

    const maxLen = Math.max(userTokens.length, targetTokens.length);
    for (let i = 0; i < maxLen; i++) {
      const u = userTokens[i];
      const t = targetTokens[i];
      if (!u || !t) continue;
      if (u === t) continue;

      if (u.toLowerCase() === t.toLowerCase()) {
        capMissed.push(`"${u}" → "${t}"`);
      } else if (articleSet.has(t.toLowerCase()) || articleSet.has(u.toLowerCase())) {
        articleMismatches.push(`"${u}" → "${t}"`);
      } else {
        inflectionMismatches.push(`"${u}" → "${t}"`);
      }
    }

    if (capMissed.length > 0) {
      checks.push({
        type: 'warn',
        label: 'Noun / Sentence Capitalization',
        detail: `Capitalize: ${capMissed.join(', ')}.`,
      });
    }

    if (articleMismatches.length > 0) {
      checks.push({
        type: 'error',
        label: 'Article / Case Inflection',
        detail: `Check case ending: ${articleMismatches.slice(0, 3).join(', ')}.`,
      });
    }

    if (inflectionMismatches.length > 0) {
      checks.push({
        type: 'error',
        label: 'Verb / Word Form',
        detail: `Compare: ${inflectionMismatches.slice(0, 3).join(', ')}.`,
      });
    }

    if (userTokens.length !== targetTokens.length) {
      checks.push({
        type: 'warn',
        label: 'Sentence Length',
        detail: `Expected ${targetTokens.length} words (you wrote ${userTokens.length}). Check for missing auxiliary verbs (haben/sein/zu) or articles.`,
      });
    }
  }

  return {
    isCorrect: false,
    headline: 'Review the feedback below and compare with the target sentence.',
    checks,
  };
}
