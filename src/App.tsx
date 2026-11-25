import React, { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import { seedDatabaseIfNeeded } from './db/seed';
import { BottomNav, type TabId } from './components/BottomNav';
import { ReferenceModal } from './components/ReferenceModal';
import { MistakeNotebookModal } from './components/MistakeNotebookModal';
import { SettingsModal } from './components/SettingsModal';
import { SpiderVerseToast } from './components/SpiderVerseToast';
import { LearnedWordsModal } from './components/LearnedWordsModal';
import type { CefrLevel, VocabItem } from './db/database';
import { HomeView } from './views/HomeView';
import { LearnView } from './views/LearnView';
import { VocabCheckView } from './views/VocabCheckView';
import { MilestonesView } from './views/MilestonesView';
import { DictionaryView } from './views/DictionaryView';
import {
  loadReminderPreferences,
  registerNotificationActionListener,
  scheduleDailyReminder,
} from './services/notificationService';

export const App: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [pendingMilestoneCode, setPendingMilestoneCode] = useState<string | null>(null);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [mistakesOpen, setMistakesOpen] = useState(false);
  const [mistakesAutoDrill, setMistakesAutoDrill] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [spiderToastWord, setSpiderToastWord] = useState<VocabItem | null>(null);
  const [focusLearnWordId, setFocusLearnWordId] = useState<number | null>(null);
  const [learnedModalLevel, setLearnedModalLevel] = useState<CefrLevel | null>(null);
  const [pendingLearnLevel, setPendingLearnLevel] = useState<CefrLevel | null>(null);
  const [pendingTestLevel, setPendingTestLevel] = useState<CefrLevel | null>(null);

  useEffect(() => {
    seedDatabaseIfNeeded()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Failed to initialize DeutschPfad database:', err?.name, err?.message, err);
        setError('Could not initialize local offline database.');
      });
  }, []);

  useEffect(() => {
    if (!ready) return;

    let cleanup: (() => void) | null = null;
    void registerNotificationActionListener((route, vocabId) => {
      if (route === 'mistakes') {
        setMistakesAutoDrill(true);
        setMistakesOpen(true);
      } else if (route === 'vocab-check') {
        setActiveTab('vocab-check');
      } else {
        if (vocabId) setFocusLearnWordId(vocabId);
        setActiveTab('learn');
      }
    }).then((remove) => {
      cleanup = remove;
    });

    const prefs = loadReminderPreferences();
    if (prefs.enabled) {
      void scheduleDailyReminder(prefs.hour, prefs.minute).catch(() => {});
    }

    return () => {
      cleanup?.();
    };
  }, [ready]);

  const dueCount =
    useLiveQuery(async () => {
      if (!ready) return 0;
      const now = Date.now();
      return db.vocab
        .where('status')
        .anyOf('learning', 'mastered')
        .filter((v) => v.nextReviewAt <= now)
        .count();
    }, [ready]) ?? 0;

  const activeMistakesCount =
    useLiveQuery(async () => {
      if (!ready) return 0;
      return db.mistakeLogs.where('status').equals('active').count();
    }, [ready]) ?? 0;

  const handleOpenMilestone = useCallback((code: string) => {
    setPendingMilestoneCode(code);
    setActiveTab('milestones');
  }, []);

  const handleClearInitialMilestone = useCallback(() => {
    setPendingMilestoneCode(null);
  }, []);

  const handleOpenReference = useCallback(() => {
    setReferenceOpen(true);
  }, []);

  const handleOpenMistakes = useCallback((autoStartDrill: boolean = false) => {
    setMistakesAutoDrill(autoStartDrill);
    setMistakesOpen(true);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper p-6 text-center">
        <div className="max-w-xs rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-base font-bold text-red-700">Storage Error</p>
          <p className="mt-1 text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 flex-col overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-900/10">
            <div className="flex-1 bg-slate-950" />
            <div className="flex-1 bg-red-600" />
            <div className="flex-1 bg-amber-400" />
          </div>
          <p className="font-editorial text-base font-bold text-slate-900">DeutschPfad</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-[#f1efe9]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper shadow-xl ring-1 ring-stone-900/10 pt-safe">
        <main className="flex-1 pb-nav-safe">
          <div key={activeTab} className="tab-view-enter">
            {activeTab === 'home' && (
              <HomeView
                onNavigate={setActiveTab}
                onOpenMilestone={handleOpenMilestone}
                onOpenReference={handleOpenReference}
                onOpenMistakes={handleOpenMistakes}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenLevelModal={(lvl) => setLearnedModalLevel(lvl)}
                activeMistakesCount={activeMistakesCount}
              />
            )}
            {activeTab === 'learn' && (
              <LearnView
                focusWordId={focusLearnWordId}
                onClearFocusWord={() => setFocusLearnWordId(null)}
                initialLevel={pendingLearnLevel}
                onClearInitialLevel={() => setPendingLearnLevel(null)}
              />
            )}
            {activeTab === 'vocab-check' && (
              <VocabCheckView
                activeMistakesCount={activeMistakesCount}
                onOpenMistakes={() => handleOpenMistakes(false)}
                initialLevel={pendingTestLevel}
                onClearInitialLevel={() => setPendingTestLevel(null)}
              />
            )}
            {activeTab === 'milestones' && (
              <MilestonesView
                initialMilestoneCode={pendingMilestoneCode}
                onClearInitialMilestone={handleClearInitialMilestone}
                onOpenReference={handleOpenReference}
              />
            )}
            {activeTab === 'dictionary' && <DictionaryView />}
          </div>
        </main>

        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dueCount={dueCount}
          activeMistakesCount={activeMistakesCount}
        />

        <LearnedWordsModal
          open={Boolean(learnedModalLevel)}
          initialLevel={learnedModalLevel ?? 'A0'}
          onClose={() => setLearnedModalLevel(null)}
          onStartLearningLevel={(lvl) => {
            setPendingLearnLevel(lvl);
            setActiveTab('learn');
          }}
          onPracticeLevel={(lvl) => {
            setPendingTestLevel(lvl);
            setActiveTab('vocab-check');
          }}
        />
        <ReferenceModal open={referenceOpen} onClose={() => setReferenceOpen(false)} />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onTriggerSpiderToast={(word) => {
            setSettingsOpen(false);
            setSpiderToastWord(word);
          }}
        />
        <SpiderVerseToast
          word={spiderToastWord}
          onDismiss={() => setSpiderToastWord(null)}
          onDrill={(word) => {
            setSpiderToastWord(null);
            if (word.id) setFocusLearnWordId(word.id);
            setActiveTab('learn');
          }}
        />
        <MistakeNotebookModal
          open={mistakesOpen}
          autoStartDrill={mistakesAutoDrill}
          onClose={() => {
            setMistakesOpen(false);
            setMistakesAutoDrill(false);
          }}
        />
      </div>
    </div>
  );
};

export default App;
