import React from 'react';
import { Sparkles } from 'lucide-react';

export function SuggestedReplies({ suggestions = [], onSelect }) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
      <Sparkles className="w-3.5 h-3.5 text-accent-500 ml-1 mr-0.5 flex-shrink-0" />
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion)}
          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-slate-700 transition-all truncate max-w-[200px]"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

