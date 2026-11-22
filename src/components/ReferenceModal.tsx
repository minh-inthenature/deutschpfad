import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Search,
  Volume2,
  Table2,
  BookMarked,
  GitFork,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Loader2,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import {
  CONNECTOR_GROUPS,
  IRREGULAR_VERBS,
  PREPOSITION_GROUPS,
} from '../data/referenceData';
import { speakGerman } from '../utils/german';
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

interface ReferenceModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: ReferenceTab;
}

export type ReferenceTab = 'cases' | 'verbs' | 'preps' | 'ai';

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  open,
  onClose,
  initialTab = 'cases',
}) => {
  const [tab, setTab] = useState<ReferenceTab>(initialTab);
  const [verbQuery, setVerbQuery] = useState('');

  // AI Tutor Settings state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.8-flash');
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

  const handleConfirmClearAll = async () => {
    const removed = await clearAllCustomWords();
    setCustomCount(0);
    setConfirmClearAll(false);
    setBackupStatus(`Cleared ${removed} custom AI word${removed === 1 ? '' : 's'}.`);
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
      setBackupStatus(`Exported ${payload.customWords.length} custom words & study progress.`);
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

  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim();
    saveGeminiKey(trimmed);
    if (trimmed) {
      setConnStatus({ state: 'idle', message: 'Key saved! Tap Test Connection to verify.' });
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
      setConnStatus({ state: 'offline', message: 'Offline Mode — enter a Gemini key first' });
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

  const filteredVerbs = useMemo(() => {
    const q = verbQuery.trim().toLowerCase();
    if (!q) return IRREGULAR_VERBS;
    return IRREGULAR_VERBS.filter(
      (v) =>
        v.infinitive.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q) ||
        v.praesens.toLowerCase().includes(q) ||
        v.praeteritum.toLowerCase().includes(q) ||
        v.perfekt.toLowerCase().includes(q),
    );
  }, [verbQuery]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-paper shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 rounded-t-3xl border-b border-stone-200 bg-white px-5 pt-3 pb-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
                100% Offline Cheat-Sheet
              </p>
              <h2 className="font-editorial text-xl font-bold text-slate-950">
                Grammar Reference
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close reference"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 4 Tabs */}
          <div className="mt-3.5 grid grid-cols-4 gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
            {(
              [
                { id: 'cases', label: 'Cases', icon: Table2 },
                { id: 'verbs', label: '60 Verbs', icon: BookMarked },
                { id: 'preps', label: 'Preps', icon: GitFork },
                { id: 'ai', label: 'AI Tutor', icon: Sparkles },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition ${
                    active ? 'bg-white text-slate-950 shadow-xs' : 'text-stone-600'
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
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* TAB 1: CASE & ARTICLE TABLES */}
          {tab === 'cases' && (
            <div className="space-y-4 pb-4">
              {/* Definite Articles */}
              <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Definite Articles (the)
                </h3>
                <div className="mt-2.5 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-[11px]">
                        <th className="py-1.5 pr-2 font-bold text-stone-500">Case</th>
                        <th className="px-2 py-1.5 font-extrabold text-blue-700">Masc.</th>
                        <th className="px-2 py-1.5 font-extrabold text-red-700">Fem.</th>
                        <th className="px-2 py-1.5 font-extrabold text-emerald-700">Neut.</th>
                        <th className="pl-2 py-1.5 font-extrabold text-slate-700">Plural</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-semibold">
                      <tr>
                        <td className="py-2 pr-2 font-bold text-slate-700">Nom.</td>
                        <td className="px-2 py-2 text-blue-800">der</td>
                        <td className="px-2 py-2 text-red-800">die</td>
                        <td className="px-2 py-2 text-emerald-800">das</td>
                        <td className="pl-2 py-2 text-slate-800">die</td>
                      </tr>
                      <tr className="bg-stone-50/70">
                        <td className="py-2 pr-2 font-bold text-slate-700">Akk.</td>
                        <td className="px-2 py-2 font-extrabold text-blue-800">den</td>
                        <td className="px-2 py-2 text-red-800">die</td>
                        <td className="px-2 py-2 text-emerald-800">das</td>
                        <td className="pl-2 py-2 text-slate-800">die</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-2 font-bold text-slate-700">Dat.</td>
                        <td className="px-2 py-2 text-blue-800">dem</td>
                        <td className="px-2 py-2 text-red-800">der</td>
                        <td className="px-2 py-2 text-emerald-800">dem</td>
                        <td className="pl-2 py-2 text-slate-800">den (+n)</td>
                      </tr>
                      <tr className="bg-stone-50/70">
                        <td className="py-2 pr-2 font-bold text-slate-700">Gen.</td>
                        <td className="px-2 py-2 text-blue-800">des (+s)</td>
                        <td className="px-2 py-2 text-red-800">der</td>
                        <td className="px-2 py-2 text-emerald-800">des (+s)</td>
                        <td className="pl-2 py-2 text-slate-800">der</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Indefinite & Negative Articles */}
              <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Indefinite &amp; Negative (ein / kein / mein)
                </h3>
                <div className="mt-2.5 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-[11px]">
                        <th className="py-1.5 pr-2 font-bold text-stone-500">Case</th>
                        <th className="px-2 py-1.5 font-extrabold text-blue-700">Masc.</th>
                        <th className="px-2 py-1.5 font-extrabold text-red-700">Fem.</th>
                        <th className="px-2 py-1.5 font-extrabold text-emerald-700">Neut.</th>
                        <th className="pl-2 py-1.5 font-extrabold text-slate-700">Pl. (kein)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-semibold">
                      <tr>
                        <td className="py-2 pr-2 font-bold text-slate-700">Nom.</td>
                        <td className="px-2 py-2 text-blue-800">ein</td>
                        <td className="px-2 py-2 text-red-800">eine</td>
                        <td className="px-2 py-2 text-emerald-800">ein</td>
                        <td className="pl-2 py-2 text-slate-800">keine</td>
                      </tr>
                      <tr className="bg-stone-50/70">
                        <td className="py-2 pr-2 font-bold text-slate-700">Akk.</td>
                        <td className="px-2 py-2 font-extrabold text-blue-800">einen</td>
                        <td className="px-2 py-2 text-red-800">eine</td>
                        <td className="px-2 py-2 text-emerald-800">ein</td>
                        <td className="pl-2 py-2 text-slate-800">keine</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-2 font-bold text-slate-700">Dat.</td>
                        <td className="px-2 py-2 text-blue-800">einem</td>
                        <td className="px-2 py-2 text-red-800">einer</td>
                        <td className="px-2 py-2 text-emerald-800">einem</td>
                        <td className="pl-2 py-2 text-slate-800">keinen</td>
                      </tr>
                      <tr className="bg-stone-50/70">
                        <td className="py-2 pr-2 font-bold text-slate-700">Gen.</td>
                        <td className="px-2 py-2 text-blue-800">eines</td>
                        <td className="px-2 py-2 text-red-800">einer</td>
                        <td className="px-2 py-2 text-emerald-800">eines</td>
                        <td className="pl-2 py-2 text-slate-800">keiner</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Adjective Endings */}
              <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Adjective Endings (After der / ein / no article)
                </h3>
                <p className="mt-1 text-[11px] text-stone-500">
                  Format: <strong>after der</strong> / <strong>after ein</strong> / <strong>no article</strong>
                </p>
                <div className="mt-2.5 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-stone-200">
                        <th className="py-1.5 pr-1 font-bold text-stone-500">Case</th>
                        <th className="px-1.5 py-1.5 font-extrabold text-blue-700">Masc.</th>
                        <th className="px-1.5 py-1.5 font-extrabold text-red-700">Fem.</th>
                        <th className="px-1.5 py-1.5 font-extrabold text-emerald-700">Neut.</th>
                        <th className="pl-1.5 py-1.5 font-extrabold text-slate-700">Plural</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-semibold text-slate-800">
                      <tr>
                        <td className="py-2 pr-1 font-bold">Nom.</td>
                        <td className="px-1.5 py-2">-e / -er / -er</td>
                        <td className="px-1.5 py-2">-e / -e / -e</td>
                        <td className="px-1.5 py-2">-e / -es / -es</td>
                        <td className="pl-1.5 py-2">-en / -en / -e</td>
                      </tr>
                      <tr className="bg-stone-50/70">
                        <td className="py-2 pr-1 font-bold">Akk.</td>
                        <td className="px-1.5 py-2">-en / -en / -en</td>
                        <td className="px-1.5 py-2">-e / -e / -e</td>
                        <td className="px-1.5 py-2">-e / -es / -es</td>
                        <td className="pl-1.5 py-2">-en / -en / -e</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-1 font-bold">Dat.</td>
                        <td className="px-1.5 py-2">-en / -en / -em</td>
                        <td className="px-1.5 py-2">-en / -en / -er</td>
                        <td className="px-1.5 py-2">-en / -en / -em</td>
                        <td className="pl-1.5 py-2">-en / -en / -en</td>
                      </tr>
                      <tr className="bg-stone-50/70">
                        <td className="py-2 pr-1 font-bold">Gen.</td>
                        <td className="px-1.5 py-2">-en / -en / -en</td>
                        <td className="px-1.5 py-2">-en / -en / -er</td>
                        <td className="px-1.5 py-2">-en / -en / -en</td>
                        <td className="pl-1.5 py-2">-en / -en / -er</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: 60 IRREGULAR VERBS */}
          {tab === 'verbs' && (
            <div className="space-y-3 pb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={verbQuery}
                  onChange={(e) => setVerbQuery(e.target.value)}
                  placeholder="Search verb, past form, or English..."
                  className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pr-4 pl-10 text-xs font-medium text-slate-900 placeholder:text-stone-400 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <p className="text-[11px] font-semibold text-stone-500">
                Showing {filteredVerbs.length} of {IRREGULAR_VERBS.length} strong &amp; mixed verbs
              </p>

              <div className="space-y-2">
                {filteredVerbs.map((v) => (
                  <div
                    key={v.infinitive}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-3.5 py-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-slate-950">
                          {v.infinitive}
                        </span>
                        <span className="truncate text-xs text-stone-500">{v.meaning}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-blue-800">
                        {v.praesens} <span className="text-stone-300">·</span> {v.praeteritum}{' '}
                        <span className="text-stone-300">·</span>{' '}
                        <span className="text-emerald-800">{v.perfekt}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void speakGerman(
                          `${v.infinitive}, ${v.praesens}, ${v.praeteritum}, ${v.perfekt}`,
                        )
                      }
                      aria-label={`Pronounce ${v.infinitive}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-800 active:scale-90"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PREPOSITIONS & CONNECTORS */}
          {tab === 'preps' && (
            <div className="space-y-4 pb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Prepositions by Case
              </h3>
              {PREPOSITION_GROUPS.map((group) => (
                <section
                  key={group.title}
                  className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs"
                >
                  <span
                    className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${group.badge}`}
                  >
                    {group.title}
                  </span>
                  <p className="mt-1.5 text-[11px] font-semibold text-stone-500">
                    {group.mnemonic}
                  </p>
                  <div className="mt-2.5 divide-y divide-stone-100">
                    {group.items.map((item) => (
                      <div key={item.de} className="py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-950">{item.de}</span>
                          <span className="text-[11px] font-medium text-stone-500">{item.en}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-700">{item.ex}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <h3 className="pt-2 text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Word-Order Connectors (V2 vs. Verb-Final)
              </h3>
              {CONNECTOR_GROUPS.map((group) => (
                <section
                  key={group.title}
                  className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs"
                >
                  <span
                    className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${group.badge}`}
                  >
                    {group.title}
                  </span>
                  <p className="mt-1.5 rounded-lg bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                    {group.rule}
                  </p>
                  <div className="mt-2 divide-y divide-stone-100">
                    {group.items.map((item) => (
                      <div key={item.de} className="py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-950">{item.de}</span>
                          <span className="text-[11px] font-medium text-stone-500">{item.en}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-700">{item.ex}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* TAB 4: AI TUTOR SETTINGS (BYOK) */}
          {tab === 'ai' && (
            <div className="space-y-4 pb-4">
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      AI Tutor Settings (BYOK)
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                      Optional Gemini API key stored locally in your browser/device{' '}
                      <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">localStorage</code>.
                      Supports Google AI Studio <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">AQ.</code> &amp;{' '}
                      <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">AIza</code> keys.
                    </p>
                  </div>

                  {/* Status Pill */}
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
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      {testingConn && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
                    onChange={(e) => handleModelChange(e.target.value as GeminiModelId)}
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

              {/* Feature C: Backup Custom Words (Export / Import JSON) */}
              <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                      Backup Custom Words
                    </h4>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {customCount} custom AI word{customCount === 1 ? '' : 's'} saved locally
                    </p>
                  </div>
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

              <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xs">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                  What AI Tutor unlocks
                </h4>
                <ul className="mt-2 space-y-1.5 text-[11px] text-stone-600">
                  <li>
                    <strong>✨ AI Drill (10) in Satzbau:</strong> Generates 10 fresh exercises tailored to your Mistake Notebook &amp; CEFR level.
                  </li>
                  <li>
                    <strong>Smart Grammar Check:</strong> Recognizes valid alternative German word order in Self-Type &amp; explains missed rules in Fall-Training.
                  </li>
                  <li>
                    <strong>100% Offline-First:</strong> Without a key, all 120 offline Satzbau sentences and 45 Fall-Training drills run locally.
                  </li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
