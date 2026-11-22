import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../db/database';
import { addCustomWords } from '../services/customWords';
import { generateAiWordPack } from '../services/geminiTutor';

interface AiWordPackModalProps {
  open: boolean;
  onClose: () => void;
  existingTopics?: string[];
  onWordsAdded: (addedCount: number, level: 'A1' | 'A2' | 'B1', topic: string) => void;
}

const PRESET_THEMES = [
  'Daily Conversation',
  'University & Tech',
  'Travel',
  'Work & Career',
  'Health & Doctor',
  'Food & Dining',
];

export const AiWordPackModal: React.FC<AiWordPackModalProps> = ({
  open,
  onClose,
  existingTopics = [],
  onWordsAdded,
}) => {
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1'>('A2');
  const [topic, setTopic] = useState('Daily Conversation');
  const [count, setCount] = useState<10 | 20>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const quickTopics = Array.from(
    new Set([...PRESET_THEMES, ...existingTopics.slice(0, 6)]),
  ).slice(0, 8);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topic.trim() || 'Daily Conversation';
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const existingVocab = await db.vocab.toArray();
      const existingWordSet = new Set(
        existingVocab.map((v) => (v.word ?? v.german).trim().toLowerCase()),
      );
      const topicLower = cleanTopic.toLowerCase();
      const topicWords = existingVocab
        .filter((v) => v.topic && v.topic.toLowerCase() === topicLower)
        .map((v) => v.word ?? v.german)
        .slice(0, 20);

      const generated = await generateAiWordPack({
        level,
        topic: cleanTopic,
        count,
        topicWords,
        existingWordSet,
      });

      const { added } = await addCustomWords(generated);
      onWordsAdded(added.length, level, cleanTopic);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate AI word pack.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px]"
      onClick={() => !isGenerating && onClose()}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-paper shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="rounded-t-3xl border-b border-stone-200 bg-white px-5 pt-3 pb-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
                <Sparkles className="h-3 w-3" />
                Gemini AI Deck Builder
              </p>
              <h2 className="font-editorial text-xl font-bold text-slate-950">
                Add AI Word Pack
              </h2>
            </div>
            <button
              type="button"
              disabled={isGenerating}
              onClick={onClose}
              aria-label="Close AI word pack generator"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-700 active:scale-90 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => void handleGenerate(e)} className="space-y-4 px-5 py-4">
          {/* CEFR Level */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              CEFR Level
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(['A1', 'A2', 'B1'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setLevel(lvl)}
                  className={`rounded-2xl border py-2.5 text-xs font-extrabold transition active:scale-95 ${
                    level === lvl
                      ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                      : 'border-stone-200 bg-white text-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Topic / Custom Theme */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              Topic or Custom Theme
            </label>
            <input
              type="text"
              disabled={isGenerating}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. University & Tech, Travel, Daily Conversation..."
              className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 placeholder:text-stone-400 focus:border-blue-700 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setTopic(t)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                    topic === t
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              Word Count
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([10, 20] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setCount(n)}
                  className={`rounded-2xl border py-2.5 text-xs font-extrabold transition active:scale-95 ${
                    count === n
                      ? 'border-blue-700 bg-blue-50 text-blue-900'
                      : 'border-stone-200 bg-white text-slate-700'
                  }`}
                >
                  {n} Words
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:bg-stone-300"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {count} {level} Words...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate &amp; Save {count} Words
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
