import React from 'react';
import { Home, BookOpen, CheckCircle2, Flag, BookA } from 'lucide-react';

export type TabId = 'home' | 'learn' | 'vocab-check' | 'milestones' | 'dictionary';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  dueCount: number;
  activeMistakesCount: number;
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'vocab-check', label: 'Vocab Check', icon: CheckCircle2 },
  { id: 'milestones', label: 'Milestones', icon: Flag },
  { id: 'dictionary', label: 'Dictionary', icon: BookA },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  dueCount,
  activeMistakesCount,
}) => {
  const vocabBadgeCount = dueCount + activeMistakesCount;

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-stone-200 bg-white/95 backdrop-blur-md pb-safe"
    >
      <div className="grid grid-cols-5 px-1 pt-1.5 pb-1.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-all active:scale-95 ${
                isActive ? 'text-slate-950' : 'text-stone-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`relative flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-transparent'
                }`}
              >
                <Icon className={`h-[17px] w-[17px] ${isActive ? 'stroke-[2.3]' : 'stroke-[1.9]'}`} />
                {id === 'vocab-check' && vocabBadgeCount > 0 && (
                  <span
                    title={`${dueCount} due · ${activeMistakesCount} active mistakes`}
                    className={`absolute -top-1 -right-0.5 flex h-4 min-w-[15px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-white ${
                      activeMistakesCount > 0 ? 'bg-red-700' : 'bg-blue-700'
                    }`}
                  >
                    {vocabBadgeCount > 99 ? '99+' : vocabBadgeCount}
                  </span>
                )}
              </span>
              <span
                className={`max-w-full truncate text-[10px] leading-tight ${
                  isActive ? 'font-bold text-slate-950' : 'font-medium text-stone-500'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
