import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Flame,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  Flag,
  AlertCircle,
  Volume2,
  StickyNote,
  Sparkles,
  Zap,
  Settings,
} from 'lucide-react';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useTheme } from '../context/ThemeContext';
import {
  db,
  getTodayDateString,
  recordStudyActivity,
  type CefrLevel,
  type VocabItem,
} from '../db/database';
import type { TabId } from '../components/BottomNav';
import {
  CEFR_ORDER,
  formatWordWithArticle,
  getArticleStyle,
  getLevelStyle,
  speakGerman,
} from '../utils/german';

interface HomeViewProps {
  onNavigate: (tab: TabId) => void;
  onOpenMilestone: (code: string) => void;
  onOpenReference?: () => void;
  onOpenMistakes: (autoStartDrill?: boolean) => void;
  onOpenSettings: () => void;
  onOpenLevelModal: (level: CefrLevel) => void;
  activeMistakesCount: number;
}

function hashDateKey(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenMilestone,
  onOpenMistakes,
  onOpenSettings,
  onOpenLevelModal,
  activeMistakesCount,
}) => {
  const vocab = useLiveQuery(() => db.vocab.toArray(), []);
  const milestones = useLiveQuery(() => db.milestones.orderBy('orderIndex').toArray(), []);
  const studyLogs = useLiveQuery(() => db.studyLogs.toArray(), []);
  const activeMistakes = useLiveQuery(
    () => db.mistakeLogs.where('status').equals('active').toArray(),
    [],
  );

  const { theme } = useTheme();
  const isSpider = theme === 'spiderverse';
  const [spotlightToggle, setSpotlightToggle] = useState<'auto' | 'today'>('auto');
  const [learnedToast, setLearnedToast] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  const stats = useMemo(() => {
    const vList = vocab ?? [];
    const mList = milestones ?? [];
    const now = Date.now();

    const dueCount = vList.filter(
      (v) => v.status !== 'new' && v.nextReviewAt <= now,
    ).length;
    const newCount = vList.filter((v) => v.status === 'new').length;

    const cefrLevels: CefrLevel[] = ['A0', 'A1', 'A2', 'B1'];
    const cefrProgress = cefrLevels.map((lvl) => {
      const lvlVocab = vList.filter((v) => v.level === lvl);
      const lvlMilestones = mList.filter((m) => m.level === lvl);
      const vocabLearned = lvlVocab.filter((v) => v.status !== 'new').length;
      const vocabTotal = lvlVocab.length;
      const pct = vocabTotal > 0 ? Math.round((vocabLearned / vocabTotal) * 100) : 0;
      return {
        level: lvl,
        pct,
        vocabLearned,
        vocabTotal,
        msDone: lvlMilestones.filter((m) => m.completed).length,
        msTotal: lvlMilestones.length,
      };
    });

    const totalLearnedAll = vList.filter((v) => v.status !== 'new').length;
    const totalVocabAll = vList.length;
    const overallPct =
      totalVocabAll > 0 ? Math.round((totalLearnedAll / totalVocabAll) * 100) : 0;

    const logMap = new Map((studyLogs ?? []).map((l) => [l.date, l]));
    const todayLog = logMap.get(todayStr) ?? {
      date: todayStr,
      minutesStudied: 0,
      wordsLearned: 0,
      reviewsCompleted: 0,
    };

    // Streak calculation
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = getTodayDateString(cursor);
      const entry = logMap.get(key);
      const active =
        entry &&
        (entry.minutesStudied > 0 || entry.wordsLearned > 0 || entry.reviewsCompleted > 0);
      if (active) {
        streak++;
      } else if (i > 0) {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    // 30-day consistency heatmap
    const heatmap: {
      date: string;
      intensity: 0 | 1 | 2 | 3 | 4;
      isToday: boolean;
      minutes: number;
    }[] = [];
    let activeDays30 = 0;
    for (let offset = 29; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const key = getTodayDateString(d);
      const entry = logMap.get(key);
      const score = entry
        ? entry.minutesStudied + entry.wordsLearned * 3 + entry.reviewsCompleted
        : 0;
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (score >= 45) intensity = 4;
      else if (score >= 20) intensity = 3;
      else if (score >= 8) intensity = 2;
      else if (score > 0) intensity = 1;
      if (intensity > 0) activeDays30++;
      heatmap.push({
        date: key,
        intensity,
        isToday: key === todayStr,
        minutes: entry?.minutesStudied ?? 0,
      });
    }

    const nextMilestone =
      mList.find((m) => m.isUnlocked && !m.completed) ??
      mList.find((m) => m.isUnlocked) ??
      mList[0];

    // Top Missed Word (highest errorCount among active mistakes)
    const sortedMistakes = [...(activeMistakes ?? [])].sort(
      (a, b) => b.errorCount - a.errorCount || b.updatedAt - a.updatedAt,
    );
    const topMistake = sortedMistakes[0] ?? null;

    let topMistakeVocab: VocabItem | null = null;
    if (topMistake) {
      if (topMistake.vocabId !== null) {
        topMistakeVocab = vList.find((v) => v.id === topMistake.vocabId) ?? null;
      }
      if (!topMistakeVocab) {
        const bare = topMistake.itemTitle.replace(/^(der|die|das)\s+/i, '').trim().toLowerCase();
        topMistakeVocab = vList.find((v) => v.german.toLowerCase() === bare) ?? null;
      }
    }

    // Today's Word: consistent per YYYY-MM-DD, picking from unlearned A0 words first
    const unlearnedA0 = vList.filter((v) => v.status === 'new' && v.level === 'A0');
    const unlearnedAny = vList
      .filter((v) => v.status === 'new')
      .sort((a, b) => CEFR_ORDER[a.level] - CEFR_ORDER[b.level]);
    const todayPool =
      unlearnedA0.length > 0 ? unlearnedA0 : unlearnedAny.length > 0 ? unlearnedAny : vList;
    const todaysWord =
      todayPool.length > 0 ? todayPool[hashDateKey(todayStr) % todayPool.length] : null;

    return {
      dueCount,
      newCount,
      cefrProgress,
      overallPct,
      todayLog,
      streak,
      heatmap,
      activeDays30,
      nextMilestone,
      topMistake,
      topMistakeVocab,
      todaysWord,
    };
  }, [vocab, milestones, studyLogs, activeMistakes, todayStr]);

  const showMistakeSpotlight = Boolean(stats.topMistake) && spotlightToggle !== 'today';

  const handleLearnTodaysWord = async (word: VocabItem) => {
    if (!word.id) return;
    const label = formatWordWithArticle(word.article, word.german);
    await db.vocab.update(word.id, {
      status: 'learning',
      intervalDays: 0,
      nextReviewAt: Date.now(),
    });
    await recordStudyActivity({ wordsLearned: 1, minutesStudied: 1 });
    setLearnedToast(label);
    window.setTimeout(() => {
      setLearnedToast((cur) => (cur === label ? null : cur));
    }, 2400);
  };

  const heatmapCellColor = (intensity: 0 | 1 | 2 | 3 | 4): string => {
    switch (intensity) {
      case 0:
        return 'bg-stone-200/75';
      case 1:
        return 'bg-emerald-200';
      case 2:
        return 'bg-emerald-400';
      case 3:
        return 'bg-emerald-600';
      case 4:
        return 'bg-emerald-800';
    }
  };

  return (
    <div className="space-y-4 px-4 pt-4 pb-6">
      {/* Warm Editorial Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isSpider ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A0A0C] shadow-xs ring-1 ring-[#3A0D11]">
              <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
                <ellipse
                  cx="18"
                  cy="18"
                  rx="11"
                  ry="13"
                  fill="#111113"
                  stroke="#C81D25"
                  strokeWidth="2.2"
                />
                <path
                  d="M16.5 17.5L10.5 13C10 17.5 12.2 21 16 20Z"
                  fill="#FFFFFF"
                />
                <path
                  d="M19.5 17.5L25.5 13C26 17.5 23.8 21 20 20Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
          ) : (
            <div className="flex h-9 w-9 flex-col overflow-hidden rounded-xl shadow-xs ring-1 ring-slate-900/15">
              <div className="flex-1 bg-slate-950" />
              <div className="flex-1 bg-red-600" />
              <div className="flex-1 bg-amber-400" />
            </div>
          )}
          <div>
            <h1 className="font-editorial text-xl font-bold tracking-tight text-slate-950 leading-none">
              DeutschPfad
            </h1>
            <p className="mt-1 text-[11px] font-medium text-stone-500">
              Daily German · A0 to B1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-bold shadow-2xs ${
              isSpider
                ? 'border-[#3A0D11] bg-[#161618] text-[#EF4444]'
                : 'border-stone-200 bg-white text-slate-800'
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${isSpider ? 'text-[#EF4444]' : 'text-amber-500'}`}
            />
            {stats.streak}d
          </span>
          <ThemeToggleButton />
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open Settings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 shadow-2xs transition hover:bg-stone-50 active:scale-95"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Daily Focus / Mistake Spotlight Hero Card */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
        {/* Card Header + Subtle Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {showMistakeSpotlight ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-red-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Mistake Spotlight
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                <Sparkles className="h-3.5 w-3.5" />
                Today&apos;s Word
              </span>
            )}
          </div>

          {stats.topMistake && (
            <div className="inline-flex rounded-full border border-stone-200 bg-stone-100 p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setSpotlightToggle('auto')}
                className={`rounded-full px-2.5 py-1 transition ${
                  showMistakeSpotlight
                    ? 'bg-white text-red-800 shadow-2xs'
                    : 'text-stone-500'
                }`}
              >
                Top Mistake
              </button>
              <button
                type="button"
                onClick={() => setSpotlightToggle('today')}
                className={`rounded-full px-2.5 py-1 transition ${
                  !showMistakeSpotlight
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-stone-500'
                }`}
              >
                Today&apos;s Word
              </button>
            </div>
          )}
        </div>

        {/* SPOTLIGHT MODE A: TOP MISSED WORD */}
        {showMistakeSpotlight && stats.topMistake && (
          <div className="mt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {stats.topMistakeVocab && stats.topMistakeVocab.article !== 'none' && (
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getArticleStyle(stats.topMistakeVocab.article).solid}`}
                    >
                      {stats.topMistakeVocab.article}
                    </span>
                  )}
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-extrabold text-red-800">
                    Missed {stats.topMistake.errorCount}× · {stats.topMistake.mistakeType}
                  </span>
                </div>

                <h2 className="font-editorial mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {stats.topMistakeVocab
                    ? formatWordWithArticle(
                        stats.topMistakeVocab.article,
                        stats.topMistakeVocab.german,
                      )
                    : stats.topMistake.itemTitle}
                </h2>

                {stats.topMistakeVocab ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className="font-semibold text-slate-700">
                      {stats.topMistakeVocab.meaning}
                    </span>
                    {stats.topMistakeVocab.plural && stats.topMistakeVocab.plural !== '—' && (
                      <span className="text-stone-500">
                        · Plural: <strong className="text-slate-800">{stats.topMistakeVocab.plural}</strong>
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-semibold text-emerald-800">
                    Correct: {stats.topMistake.correctAnswer}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void speakGerman(
                    stats.topMistakeVocab
                      ? formatWordWithArticle(
                          stats.topMistakeVocab.article,
                          stats.topMistakeVocab.german,
                        )
                      : stats.topMistake!.correctAnswer,
                  )
                }
                aria-label="Pronounce word"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            {stats.topMistake.userNote && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-950">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span className="font-medium">{stats.topMistake.userNote}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenMistakes(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              <Zap className="h-4 w-4 fill-current" />
              Quick Drill
            </button>
          </div>
        )}

        {/* SPOTLIGHT MODE B: TODAY'S WORD */}
        {!showMistakeSpotlight && stats.todaysWord && (
          <div className="mt-3.5">
            {learnedToast && (
              <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                Added {learnedToast} to your review queue!
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {stats.todaysWord.article !== 'none' && (
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getArticleStyle(stats.todaysWord.article).solid}`}
                    >
                      {stats.todaysWord.article}
                    </span>
                  )}
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${getLevelStyle(stats.todaysWord.level)}`}
                  >
                    {stats.todaysWord.level}
                  </span>
                  <span className="text-[11px] font-medium text-stone-400">
                    {stats.todaysWord.topic}
                  </span>
                </div>

                <h2 className="font-editorial mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {stats.todaysWord.article !== 'none' && (
                    <span className={`mr-1.5 ${getArticleStyle(stats.todaysWord.article).text}`}>
                      {stats.todaysWord.article}
                    </span>
                  )}
                  {stats.todaysWord.german}
                </h2>
                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                  {stats.todaysWord.meaning}
                </p>

                {stats.todaysWord.plural && stats.todaysWord.plural !== '—' && (
                  <p className="mt-1 text-xs text-stone-500">
                    Plural: <strong className="text-slate-800">{stats.todaysWord.plural}</strong>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void speakGerman(
                    formatWordWithArticle(stats.todaysWord!.article, stats.todaysWord!.german),
                  )
                }
                aria-label="Pronounce today's word"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-900 active:scale-90"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-200/80 bg-stone-50/75 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold leading-relaxed text-slate-900">
                    {stats.todaysWord.exampleDe}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {stats.todaysWord.exampleEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void speakGerman(stats.todaysWord!.exampleDe)}
                  aria-label="Pronounce example"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 active:scale-90"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {stats.todaysWord.status === 'new' ? (
              <button
                type="button"
                onClick={() => void handleLearnTodaysWord(stats.todaysWord!)}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white shadow-xs transition active:scale-[0.98]"
              >
                <BookOpen className="h-4 w-4 text-amber-400" />
                Learn Word
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 py-3 text-xs font-bold text-slate-900 active:scale-[0.98]"
              >
                Explore More Words
              </button>
            )}
          </div>
        )}
      </section>

      {/* Due Review Counter & Quick Actions */}
      <section className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('vocab-check')}
          className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-xs transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <ChevronRight className="h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-slate-950">
              {stats.dueCount}
            </p>
            <p className="text-xs font-bold text-slate-800">Due Reviews</p>
            <p className="text-[11px] text-stone-500">
              {stats.todayLog.reviewsCompleted} done today
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('learn')}
          className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-xs transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <BookOpen className="h-5 w-5" />
            </span>
            <ChevronRight className="h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold tracking-tight text-slate-950">
              {stats.newCount}
            </p>
            <p className="text-xs font-bold text-slate-800">New Words</p>
            <p className="text-[11px] text-stone-500">
              {stats.todayLog.wordsLearned} learned today
            </p>
          </div>
        </button>
      </section>

      {/* Mistake Notebook Summary Card */}
      <button
        type="button"
        onClick={() => onOpenMistakes(false)}
        className="flex w-full items-center justify-between rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-xs transition active:scale-[0.985]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              activeMistakesCount > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-extrabold text-slate-950">Mistake Notebook</p>
              {activeMistakesCount > 0 && (
                <span className="rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {activeMistakesCount} active
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {activeMistakesCount > 0
                ? 'Review personal notes & drill your weak spots'
                : 'No active mistakes · errors are captured automatically'}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
      </button>

      {/* CEFR Level Progress Bar (A0 → A1 → A2 → B1) */}
      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
            CEFR Level Progress
          </h2>
          <span className="text-xs font-extrabold text-slate-950">{stats.overallPct}% overall</span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {stats.cefrProgress.map((band) => {
            const barColor =
              band.level === 'A0'
                ? 'bg-teal-600'
                : band.level === 'A1'
                  ? 'bg-emerald-600'
                  : band.level === 'A2'
                    ? 'bg-blue-700'
                    : 'bg-amber-600';
            return (
              <button
                key={band.level}
                type="button"
                onClick={() => onOpenLevelModal(band.level)}
                className="cursor-pointer rounded-2xl border border-stone-100 bg-stone-50 p-2 text-left transition hover:border-red-500/60 active:scale-[0.98]"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-extrabold text-slate-950">{band.level}</span>
                  <span className="text-[10px] font-bold text-stone-600">{band.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${band.pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[9px] font-semibold text-stone-500">
                  {band.vocabLearned}/{band.vocabTotal}w
                </p>
              </button>
            );
          })}
        </div>

        {stats.nextMilestone && (
          <button
            type="button"
            onClick={() => onOpenMilestone(stats.nextMilestone!.code)}
            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 text-left transition active:scale-[0.985]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Flag className="h-4 w-4 shrink-0 text-blue-700" />
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Next Milestone · {stats.nextMilestone.code}
                </span>
                <p className="truncate text-xs font-bold text-slate-900">
                  {stats.nextMilestone.title}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
          </button>
        )}
      </section>

      {/* Compact 30-Day Consistency Heatmap */}
      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
              30-Day Consistency
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              <strong className="text-slate-900">{stats.activeDays30}</strong> active day
              {stats.activeDays30 === 1 ? '' : 's'} in the last 30 days
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-stone-400">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <span key={lvl} className={`h-2.5 w-2.5 rounded-[3px] ${heatmapCellColor(lvl)}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {stats.heatmap.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.minutes}m studied`}
              className={`aspect-square rounded-md transition-colors ${heatmapCellColor(cell.intensity)} ${
                cell.isToday ? 'ring-2 ring-slate-950 ring-offset-1' : ''
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
