import React, { useMemo, useState } from 'react';
import { X, Search, Volume2, Table2, BookMarked, GitFork } from 'lucide-react';
import {
  CONNECTOR_GROUPS,
  IRREGULAR_VERBS,
  PREPOSITION_GROUPS,
} from '../data/referenceData';
import { speakGerman } from '../utils/german';

interface ReferenceModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: ReferenceTab;
}

export type ReferenceTab = 'cases' | 'verbs' | 'preps';

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  open,
  onClose,
  initialTab = 'cases',
}) => {
  const [tab, setTab] = useState<ReferenceTab>(initialTab);
  const [verbQuery, setVerbQuery] = useState('');

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

          {/* 3 Tabs */}
          <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1">
            {(
              [
                { id: 'cases', label: 'Cases', icon: Table2 },
                { id: 'verbs', label: '60 Verbs', icon: BookMarked },
                { id: 'preps', label: 'Preps & Link', icon: GitFork },
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
        </div>
      </div>
    </div>
  );
};
