import React from 'react';
import { Clock } from 'lucide-react';

export function SlotChips({ slots = [], onSelectSlot }) {
  if (!slots.length) return null;

  return (
    <div className="my-2.5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-brand-500" />
        Available Open Slots:
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start_time}
            onClick={() => onSelectSlot(slot)}
            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 transition-all shadow-sm active:scale-95"
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}

