import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type ActionPerformed,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { db, type VocabItem } from '../db/database';
import { formatWordWithArticle, speakGerman } from '../utils/german';
import { renderSpiderVerseComicCard } from './spiderVerseCard';
import { getSavedThemeMode } from '../context/ThemeContext';

export const STUDY_CHANNEL_ID = 'deutschpfad_study_reminders';
export const STUDY_ACTION_TYPE_ID = 'DEUTSCHPFAD_REMINDER_ACTIONS';
export const DAILY_REMINDER_ID = 1001;
export const SNOOZE_REMINDER_ID = 1002;
export const TEST_NOTIFICATION_ID = 1003;

export const ACTION_LISTEN_WORD = 'listen_word';
export const ACTION_DRILL_WORD = 'drill_word';
export const ACTION_REVIEW_NOW = 'review_now';
export const ACTION_SNOOZE_1H = 'snooze_1h';

const PREFS_STORAGE_KEY = 'deutschpfad_reminder_prefs';

export interface ReminderPreferences {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_PREFS: ReminderPreferences = {
  enabled: true,
  hour: 19,
  minute: 0,
};

export function loadReminderPreferences(): ReminderPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReminderPreferences>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_PREFS.enabled,
      hour:
        typeof parsed.hour === 'number' && parsed.hour >= 0 && parsed.hour <= 23
          ? parsed.hour
          : DEFAULT_PREFS.hour,
      minute:
        typeof parsed.minute === 'number' && parsed.minute >= 0 && parsed.minute <= 59
          ? parsed.minute
          : DEFAULT_PREFS.minute,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveReminderPreferences(prefs: ReminderPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota issues
  }
}

let setupDone = false;

/**
 * Creates the high-priority Android Notification Channel and registers
 * inline notification shade quick actions ("Review Now", "Snooze 1h").
 */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  let perm = await LocalNotifications.checkPermissions();
  if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
    perm = await LocalNotifications.requestPermissions();
  }
  if (perm.display !== 'granted') {
    return false;
  }

  if (setupDone) return true;

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: STUDY_CHANNEL_ID,
      name: 'Daily German Reminders',
      description: 'High-priority daily German vocabulary & review reminders',
      importance: 4, // HIGH: heads-up banners + lock screen
      visibility: 1, // PUBLIC
      vibration: true,
    });
  }

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: STUDY_ACTION_TYPE_ID,
        actions: [
          {
            id: ACTION_LISTEN_WORD,
            title: '🔊 Listen',
            foreground: false,
          },
          {
            id: ACTION_DRILL_WORD,
            title: '⚡ Drill',
            foreground: true,
          },
        ],
      },
    ],
  });

  setupDone = true;
  return true;
}

function formatVocabPreviewLine(item: VocabItem): string {
  const head =
    item.article && item.article !== 'none'
      ? `${item.article} ${item.word || item.german}`
      : item.word || item.german;
  return `• ${head} (${item.meaning})`;
}

const MOCK_LEARN_WORD: VocabItem = {
  id: 1,
  german: 'Bahnhof',
  word: 'Bahnhof',
  article: 'der',
  gender: 'masc.',
  plural: 'die Bahnhöfe',
  meaning: 'train station',
  meaningVi: 'nhà ga',
  exampleDe: 'Der Zug fährt gleich vom Bahnhof ab.',
  exampleEn: 'The train is departing from the station soon.',
  level: 'A1',
  topic: 'Reisen & Verkehr',
  partOfSpeech: 'noun',
  status: 'learning',
  easeFactor: 2.5,
  intervalDays: 0,
  nextReviewAt: Date.now(),
};

/**
 * Picks an active word from the user's Dexie "Learn" list (prioritizing 'learning'
 * words, then 'new' words) so notifications surface real active vocabulary.
 */
export async function pickActiveLearnWord(): Promise<VocabItem> {
  const learning = await db.vocab.where('status').equals('learning').toArray();
  if (learning.length > 0) {
    return learning[Math.floor(Math.random() * learning.length)];
  }
  const newWords = await db.vocab.where('status').equals('new').limit(30).toArray();
  if (newWords.length > 0) {
    return newWords[Math.floor(Math.random() * newWords.length)];
  }
  return MOCK_LEARN_WORD;
}

/**
 * Queries Dexie for an active Learn word and builds a Spider-Verse styled
 * Android notification payload with custom badge, comic panel card attachment,
 * InboxStyle preview, and deep-link metadata.
 */
export async function buildRichStudyNotification(options: {
  id: number;
  schedule?: LocalNotificationSchema['schedule'];
  useMockIfEmpty?: boolean;
  extra?: Record<string, unknown>;
  targetWord?: VocabItem;
}): Promise<LocalNotificationSchema> {
  const now = Date.now();
  const [dueVocab, activeMistakes, activeWord] = await Promise.all([
    db.vocab
      .where('status')
      .anyOf('learning', 'mastered')
      .filter((v) => v.nextReviewAt <= now)
      .toArray(),
    db.mistakeLogs.where('status').equals('active').toArray(),
    options.targetWord ? Promise.resolve(options.targetWord) : pickActiveLearnWord(),
  ]);

  const fullWord = formatWordWithArticle(activeWord.article, activeWord.german);
  const meaningLabel = activeWord.meaningVi
    ? `${activeWord.meaning} (${activeWord.meaningVi})`
    : activeWord.meaning;

  const previewLines: string[] = [];
  const seenWords = new Set<string>();
  seenWords.add(activeWord.german.trim().toLowerCase());
  previewLines.push(`⚡ ${fullWord} — ${meaningLabel}`);

  for (const v of dueVocab) {
    if (previewLines.length >= 3) break;
    const key = v.german.trim().toLowerCase();
    if (!seenWords.has(key)) {
      seenWords.add(key);
      previewLines.push(formatVocabPreviewLine(v));
    }
  }

  if (previewLines.length < 3 && activeMistakes.length > 0) {
    for (const m of activeMistakes) {
      if (previewLines.length >= 3) break;
      const key = m.itemTitle.trim().toLowerCase();
      if (!seenWords.has(key)) {
        seenWords.add(key);
        previewLines.push(`• ${m.itemTitle} (${m.correctAnswer})`);
      }
    }
  }

  const totalCount = dueVocab.length + activeMistakes.length;
  const remaining = Math.max(0, totalCount - previewLines.length);
  const inboxList = [...previewLines];
  if (remaining > 0) {
    inboxList.push(`+ ${remaining} more ${remaining === 1 ? 'word' : 'words'} waiting`);
  }

  const isSpiderTheme = getSavedThemeMode() === 'spiderverse';
  const title = isSpiderTheme
    ? `⚡ ${fullWord} • Learn List`
    : `Zeit für Deutsch • ${fullWord}`;
  const shortExample = activeWord.exampleDe ? ` — ${activeWord.exampleDe}` : '';
  const collapsedBody = `${meaningLabel}${shortExample}`;
  const largeBody = `${collapsedBody}\n${inboxList.join('\n')}`;

  const comicCardUri = isSpiderTheme ? renderSpiderVerseComicCard(activeWord) : null;

  return {
    id: options.id,
    title,
    body: collapsedBody,
    largeBody,
    inboxList: inboxList.length > 0 ? inboxList : undefined,
    summaryText: isSpiderTheme ? 'Spider-Verse Learn Deck' : 'Daily German · Learn List',
    channelId: STUDY_CHANNEL_ID,
    smallIcon: 'ic_stat_deutschpfad',
    largeIcon: isSpiderTheme ? 'ic_spiderverse_badge' : 'ic_notif_large',
    iconColor: isSpiderTheme ? '#E23636' : '#1E40AF',
    attachments: comicCardUri
      ? [{ id: 'spiderverse-card', url: comicCardUri }]
      : undefined,
    actionTypeId: STUDY_ACTION_TYPE_ID,
    ongoing: false,
    autoCancel: true,
    schedule: options.schedule,
    extra: {
      route: 'learn',
      vocabId: activeWord.id,
      pronounceText: fullWord,
      ...options.extra,
    },
  };
}

/**
 * Schedules (or updates) the recurring daily study reminder at the chosen hour & minute.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
): Promise<boolean> {
  const ready = await ensureNotificationSetup();
  if (!ready) return false;

  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });

  const notification = await buildRichStudyNotification({
    id: DAILY_REMINDER_ID,
    useMockIfEmpty: false,
    schedule: {
      on: { hour, minute },
      repeats: true,
      allowWhileIdle: true,
    },
  });

  await LocalNotifications.schedule({ notifications: [notification] });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
}

/**
 * Dismisses the active notification and reschedules a one-shot reminder 60 minutes later.
 */
export async function snoozeReminderOneHour(notificationId?: number): Promise<boolean> {
  const ready = await ensureNotificationSetup();
  if (!ready) return false;

  if (notificationId !== undefined) {
    await LocalNotifications.removeDeliveredNotifications({
      notifications: [{ id: notificationId, title: '', body: '' }],
    }).catch(() => {});
  }

  await LocalNotifications.cancel({ notifications: [{ id: SNOOZE_REMINDER_ID }] });

  const snoozeAt = new Date(Date.now() + 60 * 60 * 1000);
  const notification = await buildRichStudyNotification({
    id: SNOOZE_REMINDER_ID,
    useMockIfEmpty: false,
    schedule: {
      at: snoozeAt,
      allowWhileIdle: true,
    },
  });

  await LocalNotifications.schedule({ notifications: [notification] });
  return true;
}

/**
 * Fires an immediate (2-second delay) rich Android notification using the exact
 * Material You channel, InboxStyle preview, and action buttons so the user
 * can inspect collapsed, expanded, lock-screen, and heads-up states on device.
 */
export async function sendTestNotification(delaySeconds = 2): Promise<{
  ok: boolean;
  mode: 'native' | 'web' | 'denied';
  word: VocabItem;
}> {
  const targetWord = await pickActiveLearnWord();

  if (!Capacitor.isNativePlatform()) {
    // Web preview still triggers in-app SpiderVerseToast; also attempt Web Notification if permitted
    if (typeof Notification !== 'undefined') {
      const perm =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission().catch(() => 'denied' as NotificationPermission);
      if (perm === 'granted') {
        const preview = await buildRichStudyNotification({
          id: TEST_NOTIFICATION_ID,
          useMockIfEmpty: true,
          targetWord,
        });
        new Notification(preview.title, {
          body: preview.body,
        });
      }
    }
    return { ok: true, mode: 'web', word: targetWord };
  }

  const ready = await ensureNotificationSetup();
  if (!ready) {
    return { ok: false, mode: 'denied', word: targetWord };
  }

  await LocalNotifications.cancel({ notifications: [{ id: TEST_NOTIFICATION_ID }] });

  const notification = await buildRichStudyNotification({
    id: TEST_NOTIFICATION_ID,
    useMockIfEmpty: true,
    targetWord,
    schedule: {
      at: new Date(Date.now() + delaySeconds * 1000),
      allowWhileIdle: true,
    },
  });

  await LocalNotifications.schedule({ notifications: [notification] });
  return { ok: true, mode: 'native', word: targetWord };
}

export async function registerNotificationActionListener(
  onReviewNow: (route: 'learn' | 'vocab-check' | 'mistakes', vocabId?: number) => void,
  onSnoozed?: () => void,
): Promise<(() => void) | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const handle = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async (event: ActionPerformed) => {
      const actionId = event.actionId;
      const extra = event.notification?.extra as
        | { route?: string; vocabId?: number; pronounceText?: string }
        | undefined;
      const route =
        extra?.route === 'mistakes'
          ? 'mistakes'
          : extra?.route === 'vocab-check'
            ? 'vocab-check'
            : 'learn';

      if (actionId === ACTION_LISTEN_WORD) {
        if (extra?.pronounceText) {
          await speakGerman(extra.pronounceText);
        } else if (extra?.vocabId) {
          const v = await db.vocab.get(extra.vocabId);
          if (v) await speakGerman(formatWordWithArticle(v.article, v.german));
        }
        return;
      }

      if (actionId === ACTION_SNOOZE_1H) {
        await snoozeReminderOneHour(event.notification?.id);
        onSnoozed?.();
        return;
      }

      // 'tap', ACTION_DRILL_WORD, or ACTION_REVIEW_NOW launches into the target card
      onReviewNow(route, extra?.vocabId);
    },
  );

  return () => {
    void handle.remove();
  };
}
