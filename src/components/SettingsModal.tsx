import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Sparkles,
  Eye,
  EyeOff,
  WifiOff,
  Loader2,
  Trash2,
  Download,
  Upload,
  Sun,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SpiderMaskMiniIcon } from './ThemeToggleButton';
import {
  cancelDailyReminder,
  loadReminderPreferences,
  saveReminderPreferences,
  scheduleDailyReminder,
  sendTestNotification,
  type ReminderPreferences,
} from '../services/notificationService';
import { batchEnrichIncompleteCards } from '../services/cardEnrichService';
import { AiEnrichIconButton, type EnrichButtonState } from './CardIconButtons';
import {
  GEMINI_MODELS,
  clearGeminiKey,
  getSavedGeminiKey,
  getSavedGeminiModel,
  saveGeminiKey,
  saveGeminiModel,
  testGeminiConnection,
  type GeminiModelId,
} from '../services/geminiTutor';
import {
  clearAllCustomWords,
  exportCustomWordsBackup,
  getStoredCustomWords,
  importCustomWordsBackup,
} from '../services/customWords';
import type { VocabItem } from '../db/database';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onTriggerSpiderToast?: (word: VocabItem) => void;
}

type SettingsTab = 'notifications' | 'ai';

function formatTimeInput(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onTriggerSpiderToast,
}) => {
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<SettingsTab>('notifications');
  const [prefs, setPrefs] = useState<ReminderPreferences>(() =>
    loadReminderPreferences(),
  );
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [batchState, setBatchState] = useState<EnrichButtonState>('idle');
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  // AI Tutor Settings state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<GeminiModelId>('gemini-3.8-flash');
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    state: 'idle' | 'connected' | 'offline' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  // Custom Deck Backup state
  const [customCount, setCustomCount] = useState(0);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      const savedKey = getSavedGeminiKey();
      setApiKeyInput(savedKey);
      setSelectedModel(getSavedGeminiModel());
      setCustomCount(getStoredCustomWords().length);
      setBackupStatus(null);
      setConfirmClearAll(false);
      setConnStatus(
        savedKey
          ? { state: 'idle', message: 'Key saved in localStorage' }
          : { state: 'offline', message: 'Offline Mode' },
      );
    }
  }, [open]);

  if (!open) return null;

  const handleToggleEnabled = async () => {
    const next: ReminderPreferences = { ...prefs, enabled: !prefs.enabled };
    setPrefs(next);
    saveReminderPreferences(next);
    setStatusMsg(null);

    if (next.enabled) {
      const ok = await scheduleDailyReminder(next.hour, next.minute);
      setStatusMsg(
        ok
          ? {
              type: 'success',
              text: `Daily reminder active for ${formatTimeInput(next.hour, next.minute)}.`,
            }
          : {
              type: 'success',
              text: 'Preference saved. Enable notifications on Android to receive alerts.',
            },
      );
    } else {
      await cancelDailyReminder();
      setStatusMsg({
        type: 'success',
        text: 'Daily study reminders paused.',
      });
    }
  };

  const handleTimeChange = async (value: string) => {
    const [hStr, mStr] = value.split(':');
    const hour = Number.parseInt(hStr, 10);
    const minute = Number.parseInt(mStr, 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return;

    const next: ReminderPreferences = { ...prefs, hour, minute };
    setPrefs(next);
    saveReminderPreferences(next);

    if (next.enabled) {
      await scheduleDailyReminder(hour, minute);
      setStatusMsg({
        type: 'success',
        text: `Reminder updated to ${formatTimeInput(hour, minute)}.`,
      });
    }
  };

  const handleSendTest = async (delaySeconds = 2, triggerInAppToast = true) => {
    setSendingTest(true);
    setStatusMsg(null);
    try {
      const res = await sendTestNotification(delaySeconds);
      if (triggerInAppToast) {
        onTriggerSpiderToast?.(res.word);
      }
      if (res.ok && res.mode === 'native') {
        setStatusMsg({
          type: 'success',
          text:
            delaySeconds >= 5
              ? 'Lock screen test scheduled in 5s — press your Pixel power button now to preview!'
              : 'Spider-Verse notification scheduled (2s) + comic toast previewed!',
        });
      } else if (res.ok && res.mode === 'web') {
        setStatusMsg({
          type: 'success',
          text: 'Spider-Verse comic toast triggered! Full Android lock screen card renders on device.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Notification permission was denied. Allow notifications in system settings.',
        });
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Could not trigger test notification.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim();
    saveGeminiKey(trimmed);
    if (trimmed) {
      setConnStatus({
        state: 'idle',
        message: 'Key saved! Tap Test Connection to verify.',
      });
    } else {
      setConnStatus({ state: 'offline', message: 'Offline Mode' });
    }
  };

  const handleClearKey = () => {
    clearGeminiKey();
    setApiKeyInput('');
    setConnStatus({ state: 'offline', message: 'Offline Mode — key cleared' });
  };

  const handleModelChange = (model: GeminiModelId) => {
    setSelectedModel(model);
    saveGeminiModel(model);
  };

  const handleTestConnection = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setConnStatus({
        state: 'offline',
        message: 'Offline Mode — enter a Gemini key first',
      });
      return;
    }
    saveGeminiKey(trimmed);
    saveGeminiModel(selectedModel);
    setTestingConn(true);
    const res = await testGeminiConnection(trimmed, selectedModel);
    setTestingConn(false);
    if (res.ok) {
      setConnStatus({ state: 'connected', message: 'Connected' });
    } else {
      setConnStatus({
        state: res.message.toLowerCase().includes('offline') ? 'offline' : 'error',
        message: res.message,
      });
    }
  };

  const handleConfirmClearAll = async () => {
    const removed = await clearAllCustomWords();
    setCustomCount(0);
    setConfirmClearAll(false);
    setBackupStatus(
      `Cleared ${removed} custom AI word${removed === 1 ? '' : 's'}.`,
    );
  };

  const handleExportBackup = async () => {
    try {
      const payload = await exportCustomWordsBackup();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deutschpfad-custom-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus(
        `Exported ${payload.customWords.length} custom words & study progress.`,
      );
    } catch {
      setBackupStatus('Failed to export JSON backup.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importCustomWordsBackup(text);
      setCustomCount(getStoredCustomWords().length);
      setBackupStatus(
        `Imported ${res.importedWords} new words & restored ${res.restoredProgress} progress entries.`,
      );
    } catch (err) {
      setBackupStatus(err instanceof Error ? err.message : 'Invalid backup file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[#faf9f6] shadow-2xl ring-1 ring-stone-900/10 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-stone-200 bg-white px-5 pt-4 pb-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                {tab === 'ai' ? (
                  <Sparkles className="h-4.5 w-4.5" />
                ) : (
                  <Bell className="h-4.5 w-4.5" />
                )}
              </span>
              <div>
                <h2 className="font-editorial text-lg font-bold text-slate-950">
                  Settings
                </h2>
                <p className="text-[11px] font-medium text-stone-500">
                  Reminders, AI Tutor &amp; deck backup
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 2 Tabs: Notifications | AI Tutor */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
            {(
              [
                { id: 'notifications', label: 'Reminders', icon: Bell },
                { id: 'ai', label: 'AI Tutor', icon: Sparkles },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-stone-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto p-5">
          {tab === 'notifications' && (
            <>
              {/* Visual Theme Selector (Polished vs Spider-Verse Dark) */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                  Appearance Mode
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTheme('polished')}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
                      theme === 'polished'
                        ? 'border-blue-700 ring-2 ring-blue-700/20'
                        : 'border-stone-200 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: '#FAF8F5', color: '#18181B' }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Sun className="h-4 w-4 text-amber-600" />
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
                    </div>
                    <p className="mt-2 text-xs font-extrabold">Polished</p>
                    <p className="text-[10px] text-stone-500">Warm daylight</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('spiderverse')}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
                      theme === 'spiderverse'
                        ? 'border-[#C81D25] ring-2 ring-[#9E141E]/40'
                        : 'border-[#2E0B0E] opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: '#050505', color: '#F5F5F5' }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <SpiderMaskMiniIcon className="h-4 w-4" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#C81D25]" />
                    </div>
                    <p className="mt-2 text-xs font-extrabold">Spider-Verse Dark</p>
                    <p className="text-[10px] text-zinc-400">Pitch-black &amp; crimson</p>
                  </button>
                </div>
              </div>

              {/* Daily Reminder Card */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Daily German Reminders
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      High-priority heads-up alert with due word previews
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs.enabled}
                    onClick={() => void handleToggleEnabled()}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      prefs.enabled ? 'bg-blue-800' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                        prefs.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Clock className="h-4 w-4 text-blue-700" />
                    Reminder Time
                  </div>
                  <input
                    type="time"
                    value={formatTimeInput(prefs.hour, prefs.minute)}
                    onChange={(e) => void handleTimeChange(e.target.value)}
                    disabled={!prefs.enabled}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Notification Design Preview & Test */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                  Spider-Verse Notification Test
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  Preview the comic-panel notification toast and Pixel lock screen card with{' '}
                  <span className="font-semibold text-slate-800">🔊 Listen</span> &amp;{' '}
                  <span className="font-semibold text-slate-800">⚡ Drill</span>{' '}
                  actions.
                </p>

                <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleSendTest(2, true)}
                    disabled={sendingTest}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-3 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60"
                  >
                    <BellRing className="h-4 w-4 shrink-0" />
                    {sendingTest ? 'Scheduling...' : 'Send Test Notification'}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSendTest(5, false)}
                    disabled={sendingTest}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-xs font-bold text-slate-900 shadow-2xs transition hover:bg-stone-100 active:scale-[0.98] disabled:opacity-60"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-red-600" />
                    Test on Lock Screen (5s delay)
                  </button>
                </div>

                {statusMsg && (
                  <div
                    className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
                      statusMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
                        : 'bg-red-50 text-red-900 ring-1 ring-red-200'
                    }`}
                  >
                    {statusMsg.type === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                    )}
                    <span>{statusMsg.text}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'ai' && (
            <>
              {/* AI Tutor Settings (BYOK) */}
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      AI Tutor Settings (BYOK)
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                      Optional Gemini API key stored locally in{' '}
                      <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">
                        localStorage
                      </code>
                      . Supports Google AI Studio{' '}
                      <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">
                        AQ.
                      </code>{' '}
                      &amp;{' '}
                      <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">
                        AIza
                      </code>{' '}
                      keys.
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${
                      connStatus.state === 'connected'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : connStatus.state === 'error'
                          ? 'border-red-200 bg-red-50 text-red-800'
                          : 'border-stone-200 bg-stone-100 text-stone-600'
                    }`}
                  >
                    {connStatus.state === 'connected' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                    ) : connStatus.state === 'error' ? (
                      <AlertCircle className="h-3 w-3 text-red-700" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-stone-500" />
                    )}
                    {connStatus.state === 'connected'
                      ? 'Connected'
                      : connStatus.state === 'error'
                        ? 'Error'
                        : 'Offline Mode'}
                  </span>
                </div>

                {/* API Key Input */}
                <div className="mt-4 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Gemini API Key
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      onBlur={handleSaveKey}
                      placeholder="Paste AQ. or AIza... key"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pr-10 pl-3 text-xs font-medium text-slate-900 placeholder:text-stone-400 focus:border-blue-700 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((s) => !s)}
                      aria-label={showKey ? 'Hide API key' : 'Show API key'}
                      className="absolute right-2.5 text-stone-400 hover:text-slate-700"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white active:scale-95"
                    >
                      Save Key
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTestConnection()}
                      disabled={testingConn}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-800 active:scale-95 disabled:opacity-50"
                    >
                      {testingConn && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Test Connection
                    </button>
                    <button
                      type="button"
                      onClick={handleClearKey}
                      aria-label="Clear Key"
                      className="ml-auto inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:text-red-700 active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear Key
                    </button>
                  </div>

                  {connStatus.message && (
                    <p
                      className={`mt-1 text-[11px] font-medium ${
                        connStatus.state === 'connected'
                          ? 'text-emerald-700'
                          : connStatus.state === 'error'
                            ? 'text-red-700'
                            : 'text-stone-500'
                      }`}
                    >
                      {connStatus.message}
                    </p>
                  )}
                </div>

                {/* Model Selector */}
                <div className="mt-4 border-t border-stone-100 pt-3.5">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Gemini Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) =>
                      handleModelChange(e.target.value as GeminiModelId)
                    }
                    className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
                  >
                    {GEMINI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Batch Enrich Incomplete Cards */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Enrich Incomplete Cards
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Batch up to 15 unenriched cards in one Gemini request
                    </p>
                  </div>
                  <AiEnrichIconButton
                    state={batchState}
                    title="Enrich Incomplete Cards"
                    onClick={() => {
                      setBatchState('loading');
                      setBatchMsg(null);
                      void batchEnrichIncompleteCards(15)
                        .then(({ enrichedCount, remainingCount }) => {
                          setBatchState('success');
                          setBatchMsg(
                            enrichedCount === 0
                              ? 'All cards are already complete.'
                              : `Enriched ${enrichedCount} cards (${remainingCount} remaining).`,
                          );
                          setTimeout(() => setBatchState('idle'), 1500);
                        })
                        .catch((err) => {
                          setBatchState('idle');
                          setBatchMsg(
                            err instanceof Error
                              ? err.message
                              : 'Batch enrich failed.',
                          );
                        });
                    }}
                  />
                </div>
                {batchMsg && (
                  <p className="mt-2.5 rounded-xl bg-stone-50 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-stone-200">
                    {batchMsg}
                  </p>
                )}
              </div>

              {/* Backup Custom Words */}
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                    Backup Custom Words
                  </h4>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {customCount} custom AI word{customCount === 1 ? '' : 's'} saved locally
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleExportBackup()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-slate-900 active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-slate-900 active:scale-95"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Import JSON
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => void handleImportFile(e)}
                    className="hidden"
                  />
                </div>

                {customCount > 0 && (
                  <div className="mt-2.5 border-t border-stone-100 pt-2.5">
                    {!confirmClearAll ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(true)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear All Custom Words
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleConfirmClearAll()}
                          className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white active:scale-95"
                        >
                          Confirm Clear ({customCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(false)}
                          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {backupStatus && (
                  <p className="mt-2 text-[11px] font-semibold text-emerald-800">
                    {backupStatus}
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
