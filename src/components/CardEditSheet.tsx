import React, { useEffect, useState } from 'react';
import { X, Wand2 } from 'lucide-react';
import {
  db,
  type CefrLevel,
  type GermanArticle,
  type PartOfSpeech,
  type VocabItem,
} from '../db/database';
import { previewEnrichFields } from '../services/cardEnrichService';
import { AiEnrichIconButton, type EnrichButtonState } from './CardIconButtons';

interface CardEditSheetProps {
  open: boolean;
  card: VocabItem | null;
  onClose: () => void;
  onSaved?: (updated: VocabItem) => void;
}

const KNOWN_INFLECTIONS: Record<
  string,
  { lemma: string; article: GermanArticle; plural: string }
> = {
  häuser: { lemma: 'Haus', article: 'das', plural: 'die Häuser' },
  bücher: { lemma: 'Buch', article: 'das', plural: 'die Bücher' },
  kinder: { lemma: 'Kind', article: 'das', plural: 'die Kinder' },
  männer: { lemma: 'Mann', article: 'der', plural: 'die Männer' },
  frauen: { lemma: 'Frau', article: 'die', plural: 'die Frauen' },
  leute: { lemma: 'Leute', article: 'die', plural: 'die Leute' },
  äpfel: { lemma: 'Apfel', article: 'der', plural: 'die Äpfel' },
  züge: { lemma: 'Zug', article: 'der', plural: 'die Züge' },
  städte: { lemma: 'Stadt', article: 'die', plural: 'die Städte' },
};

function toGender(article: GermanArticle): string | undefined {
  if (article === 'der') return 'masc.';
  if (article === 'die') return 'fem.';
  if (article === 'das') return 'neut.';
  return undefined;
}

export const CardEditSheet: React.FC<CardEditSheetProps> = ({
  open,
  card,
  onClose,
  onSaved,
}) => {
  const [german, setGerman] = useState('');
  const [pos, setPos] = useState<PartOfSpeech>('noun');
  const [level, setLevel] = useState<CefrLevel>('A1');
  const [article, setArticle] = useState<GermanArticle>('none');
  const [plural, setPlural] = useState('');
  const [verbAux, setVerbAux] = useState<'haben' | 'sein'>('haben');
  const [verbForms, setVerbForms] = useState('');
  const [meaning, setMeaning] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [exampleDe, setExampleDe] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [grammarNote, setGrammarNote] = useState('');
  const [normalizedMode, setNormalizedMode] = useState(false);

  const [aiState, setAiState] = useState<EnrichButtonState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !card) return;
    setGerman(card.german || '');
    setPos(card.partOfSpeech || 'noun');
    setLevel(card.level || 'A1');
    setArticle(card.article || 'none');
    setPlural(card.plural || '');
    const vf = card.verbForms || '';
    setVerbAux(vf.toLowerCase().includes('ist ') ? 'sein' : 'haben');
    setVerbForms(vf);
    setMeaning(card.meaning || '');
    setMeaningVi(card.meaningVi || '');
    setExampleDe(card.exampleDe || '');
    setExampleEn(card.exampleEn || '');
    setGrammarNote(card.grammarNote || '');
    setNormalizedMode(false);
    setAiState('idle');
    setErrorMsg(null);
  }, [open, card]);

  if (!open || !card) return null;

  const handleToggleNormalize = () => {
    const raw = german.trim();
    const withoutArticle = raw.replace(/^(der|die|das)\s+/i, '').trim();
    const lookup = KNOWN_INFLECTIONS[withoutArticle.toLowerCase()];
    if (!normalizedMode && lookup) {
      setGerman(lookup.lemma);
      setArticle(lookup.article);
      setPlural(lookup.plural);
      setPos('noun');
      setNormalizedMode(true);
      return;
    }
    if (!normalizedMode && withoutArticle !== raw) {
      const matchArt = raw.match(/^(der|die|das)\s+/i)?.[1].toLowerCase() as
        | GermanArticle
        | undefined;
      setGerman(withoutArticle);
      if (matchArt) setArticle(matchArt);
      setNormalizedMode(true);
      return;
    }
    setGerman(card.german);
    setNormalizedMode(false);
  };

  const handleAiAutoFill = async () => {
    setAiState('loading');
    setErrorMsg(null);
    try {
      const filled = await previewEnrichFields({
        german: german.trim() || card.german,
        article,
        meaning,
        partOfSpeech: pos,
      });
      setGerman(filled.lemma);
      setPos(filled.partOfSpeech);
      setArticle(filled.article);
      setPlural(filled.plural);
      if (filled.verbForms) {
        setVerbForms(filled.verbForms);
        setVerbAux(
          filled.verbForms.toLowerCase().includes('ist ') ? 'sein' : 'haben',
        );
      }
      setMeaning(filled.meaningEn);
      setMeaningVi(filled.meaningVi);
      setLevel(filled.level);
      setExampleDe(filled.exampleDe);
      setExampleEn(filled.exampleEn);
      setAiState('success');
      setTimeout(() => setAiState('idle'), 1400);
    } catch (err) {
      setAiState('idle');
      setErrorMsg(err instanceof Error ? err.message : 'AI auto-fill failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!german.trim()) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const finalVerbForms =
        pos === 'verb'
          ? verbForms.trim() || `${verbAux} + Partizip II`
          : undefined;
      const finalArticle: GermanArticle = pos === 'noun' ? article : 'none';

      const updates: Partial<VocabItem> = {
        german: german.trim(),
        word: german.trim(),
        partOfSpeech: pos,
        level,
        article: finalArticle,
        gender: toGender(finalArticle),
        plural: pos === 'noun' ? plural.trim() || '—' : '—',
        verbForms: finalVerbForms,
        meaning: meaning.trim(),
        meaningVi: meaningVi.trim() || undefined,
        exampleDe: exampleDe.trim(),
        exampleEn: exampleEn.trim(),
        grammarNote: grammarNote.trim() || undefined,
        enriched: Boolean(meaning.trim() && exampleDe.trim()),
      };

      if (card.id !== undefined) {
        await db.vocab.update(card.id, updates);
      }

      onSaved?.({ ...card, ...updates });
      onClose();
    } catch {
      setErrorMsg('Failed to save card changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[#faf9f6] shadow-2xl ring-1 ring-stone-900/10 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3.5">
          <div>
            <h2 className="font-editorial text-lg font-bold text-slate-950">
              Edit Card
            </h2>
            <p className="text-[11px] font-medium text-stone-500">
              Fix lemma, grammar, meaning &amp; example
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <AiEnrichIconButton
              state={aiState}
              onClick={() => void handleAiAutoFill()}
              title="Auto-fill fields"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-3.5 overflow-y-auto p-5">
          {errorMsg && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              {errorMsg}
            </p>
          )}

          {/* Word / Lemma + 1-tap Normalize toggle */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Word / Lemma
              </label>
              <button
                type="button"
                onClick={handleToggleNormalize}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition ${
                  normalizedMode
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Wand2 className="h-3 w-3" />
                {normalizedMode ? 'Normalized' : 'Normalize form'}
              </button>
            </div>
            <input
              type="text"
              value={german}
              onChange={(e) => setGerman(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 font-editorial text-base font-bold text-slate-950 outline-none focus:border-blue-700"
            />
          </div>

          {/* POS & CEFR Pills */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                POS
              </p>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'noun', label: 'Noun' },
                    { id: 'verb', label: 'Verb' },
                    { id: 'adjective', label: 'Adj' },
                    { id: 'phrase', label: 'Other' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPos(item.id)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                      pos === item.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                CEFR
              </p>
              <div className="flex flex-wrap gap-1">
                {(['A0', 'A1', 'A2', 'B1'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                      level === lvl
                        ? 'border-blue-800 bg-blue-800 text-white'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grammar Fields */}
          {pos === 'noun' && (
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Article
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['der', 'die', 'das'] as const).map((art) => (
                    <button
                      key={art}
                      type="button"
                      onClick={() => setArticle(art)}
                      className={`rounded-lg border py-1.5 text-[11px] font-extrabold transition ${
                        article === art
                          ? art === 'der'
                            ? 'border-blue-800 bg-blue-700 text-white'
                            : art === 'die'
                              ? 'border-red-800 bg-red-700 text-white'
                              : 'border-emerald-800 bg-emerald-700 text-white'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      {art}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Plural
                </label>
                <input
                  type="text"
                  value={plural}
                  onChange={(e) => setPlural(e.target.value)}
                  placeholder="die Häuser"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
                />
              </div>
            </div>
          )}

          {pos === 'verb' && (
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Auxiliary
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {(['haben', 'sein'] as const).map((aux) => (
                    <button
                      key={aux}
                      type="button"
                      onClick={() => setVerbAux(aux)}
                      className={`rounded-lg border py-1.5 text-[11px] font-bold transition ${
                        verbAux === aux
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      {aux}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Conjugation
                </label>
                <input
                  type="text"
                  value={verbForms}
                  onChange={(e) => setVerbForms(e.target.value)}
                  placeholder="spricht · sprach · hat gesprochen"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
                />
              </div>
            </div>
          )}

          {/* Meaning (EN / VI) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Meaning (EN)
              </label>
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="house"
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Meaning (VI)
              </label>
              <input
                type="text"
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                placeholder="ngôi nhà"
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Example Sentence + Translation & Note */}
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Example (DE)
              </label>
              <input
                type="text"
                value={exampleDe}
                onChange={(e) => setExampleDe(e.target.value)}
                placeholder="Das Haus ist sehr groß."
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Translation (EN)
              </label>
              <input
                type="text"
                value={exampleEn}
                onChange={(e) => setExampleEn(e.target.value)}
                placeholder="The house is very big."
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Personal Note
              </label>
              <input
                type="text"
                value={grammarNote}
                onChange={(e) => setGrammarNote(e.target.value)}
                placeholder="Optional memory hook or grammar note..."
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !german.trim()}
            className="w-full rounded-2xl bg-blue-800 py-3 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
