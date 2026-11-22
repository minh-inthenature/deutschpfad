import { db, type SeedVocabInput, type VocabItem } from './database';
import { VOCAB_A0 } from '../data/vocabA0';
import { VOCAB_A1 } from '../data/vocabA1';
import { VOCAB_A2 } from '../data/vocabA2';
import { VOCAB_B1 } from '../data/vocabB1';
import { VOCAB_CORE_80 } from '../data/vocabCore80';
import { VOCAB_EXPANSION_150 } from '../data/vocabExpansion150';
import { VOCAB_EXPANSION_200 } from '../data/vocabExpansion200';
import { VOCAB_EXPANSION_190 } from '../data/vocabExpansion190';
import { ALL_MILESTONES } from '../data/milestones';

function toStandardGender(article: string, gender?: string): string | undefined {
  if (gender === 'masc.' || article === 'der') return 'masc.';
  if (gender === 'fem.' || article === 'die') return 'fem.';
  if (gender === 'neut.' || article === 'das') return 'neut.';
  return gender;
}

// Deduplicate by exact German casing (preserves distinctions like 'sie' vs. 'Sie'),
// prioritizing lower CEFR levels (A0 -> A1 -> A2 -> B1)
function buildOrderedSeedVocab(): SeedVocabInput[] {
  const seen = new Set<string>();
  const combined: SeedVocabInput[] = [];
  for (const item of [
    ...VOCAB_A0,
    ...VOCAB_A1,
    ...VOCAB_A2,
    ...VOCAB_B1,
    ...VOCAB_CORE_80,
    ...VOCAB_EXPANSION_150,
    ...VOCAB_EXPANSION_200,
    ...VOCAB_EXPANSION_190,
  ]) {
    const key = item.german.trim();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push({
        ...item,
        word: item.word ?? item.german,
        gender: toStandardGender(item.article, item.gender),
      });
    }
  }
  return combined;
}

export const SEED_VOCAB_LIST: SeedVocabInput[] = buildOrderedSeedVocab();
export const SEED_MILESTONES_LIST = ALL_MILESTONES;

let seedPromise: Promise<void> | null = null;

/**
 * Seeds or upgrades the offline IndexedDB cleanly on launch:
 * - Preserves all existing user progress (status, SM-2 intervals, bestScore, completed, isUnlocked).
 * - Adds newly introduced A0-B1 vocabulary words and A0-B1 milestones (21 total) without wiping data.
 * - Ensures A0-01 is unlocked by default.
 * Safe to call multiple times (idempotent & React StrictMode-safe).
 */
export function seedDatabaseIfNeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await db.transaction('rw', [db.vocab, db.milestones], async () => {
        // 1. Sync Vocabulary (A0 -> A1 -> A2 -> B1) while preserving user SM-2 progress
        const existingVocab = await db.vocab.toArray();
        const vocabByKey = new Map<string, VocabItem>();
        for (const item of existingVocab) {
          vocabByKey.set(item.german.trim(), item);
        }

        const now = Date.now();
        const toAddVocab: VocabItem[] = [];

        for (const seed of SEED_VOCAB_LIST) {
          const key = seed.german.trim();
          const match = vocabByKey.get(key);
          if (match?.id) {
            await db.vocab.update(match.id, {
              article: seed.article,
              plural: seed.plural,
              meaning: seed.meaning,
              exampleDe: seed.exampleDe,
              exampleEn: seed.exampleEn,
              level: seed.level,
              topic: seed.topic,
              partOfSpeech: seed.partOfSpeech,
              verbForms: seed.verbForms,
              adjectiveForms: seed.adjectiveForms,
              grammarNote: seed.grammarNote,
              word: seed.word ?? seed.german,
              gender: toStandardGender(seed.article, seed.gender),
            });
          } else {
            toAddVocab.push({
              ...seed,
              word: seed.word ?? seed.german,
              gender: toStandardGender(seed.article, seed.gender),
              status: 'new',
              easeFactor: 2.5,
              intervalDays: 0,
              nextReviewAt: now,
            });
          }
        }

        if (toAddVocab.length > 0) {
          await db.vocab.bulkAdd(toAddVocab);
        }

        // 2. Sync Milestones (21 sequential checkpoints: A0-01 .. B1-06) preserving progress
        const existingMilestones = await db.milestones.toArray();
        const milestoneByCode = new Map(existingMilestones.map((m) => [m.code, m]));

        const toAddMilestones = [];
        for (const seed of SEED_MILESTONES_LIST) {
          const match = milestoneByCode.get(seed.code);
          if (match?.id) {
            await db.milestones.update(match.id, {
              level: seed.level,
              title: seed.title,
              orderIndex: seed.orderIndex,
              ruleMarkdown: seed.ruleMarkdown,
              questions: seed.questions,
              isUnlocked: seed.code === 'A0-01' ? true : match.isUnlocked,
            });
          } else {
            toAddMilestones.push({ ...seed });
          }
        }

        if (toAddMilestones.length > 0) {
          await db.milestones.bulkAdd(toAddMilestones);
        }

        // Ensure sequential unlock integrity after upgrade
        const allAfter = await db.milestones.orderBy('orderIndex').toArray();
        for (let i = 0; i < allAfter.length - 1; i++) {
          const cur = allAfter[i];
          const next = allAfter[i + 1];
          if (cur.completed && next.id && !next.isUnlocked) {
            await db.milestones.update(next.id, { isUnlocked: true });
          }
        }
      });
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}
