import React, { useEffect, useState } from 'react';
import { StickyNote, Check, Plus } from 'lucide-react';
import { db, updateMistakeNote } from '../db/database';

interface InlineMistakeNoteProps {
  mistakeId: number | null;
}

export const InlineMistakeNote: React.FC<InlineMistakeNoteProps> = ({ mistakeId }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOpen(false);
    setSaved(false);
    setNote('');
    if (!mistakeId) return;
    let active = true;
    void db.mistakeLogs.get(mistakeId).then((row) => {
      if (active && row?.userNote) {
        setNote(row.userNote);
      }
    });
    return () => {
      active = false;
    };
  }, [mistakeId]);

  if (!mistakeId) return null;

  const handleSave = async () => {
    await updateMistakeNote(mistakeId, note);
    setSaved(true);
    setOpen(false);
  };

  return (
    <div className="mt-2 border-t border-red-200/70 pt-2 text-left">
      {!open ? (
        <div className="flex items-center justify-between gap-2">
          {note ? (
            <p className="truncate text-[11px] font-medium text-red-900/90">
              <StickyNote className="mr-1 inline h-3 w-3 text-amber-700" />
              {note}
            </p>
          ) : (
            <span className="text-[11px] font-medium text-red-800/80">
              Saved to Mistake Notebook
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[11px] font-extrabold text-red-800 shadow-2xs transition active:scale-95"
          >
            {saved || note ? (
              <>
                <StickyNote className="h-3 w-3" />
                Edit Note
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                Note
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a personal mnemonic..."
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 placeholder:text-stone-400 focus:border-blue-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      )}
    </div>
  );
};
