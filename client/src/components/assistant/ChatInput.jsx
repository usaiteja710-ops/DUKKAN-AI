import React, { useState } from 'react';
import { Send } from 'lucide-react';

export function ChatInput({ onSendMessage, disabled = false, placeholder = 'Ask anything or say "Book a haircut"...' }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        maxLength={1000}
        placeholder={placeholder}
        className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 transition-all outline-none"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 text-white transition-all shadow-sm active:scale-95 flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

