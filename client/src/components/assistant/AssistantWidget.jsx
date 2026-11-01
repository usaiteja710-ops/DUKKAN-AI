import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow.jsx';

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // If already on the dedicated full-page assistant route `/assistant`, do not show floating launcher
  if (location.pathname === '/assistant') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 floating-widget">
      {isOpen ? (
        <div className="animate-slide-up origin-bottom-right">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open DUKKAN AI Assistant"
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-dukkan-navy via-dukkan-azure to-dukkan-plum text-white shadow-glass-glow hover:shadow-glass-hover hover:scale-105 active:scale-95 transition-all duration-300 border border-white/30 backdrop-blur-md"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-dukkan-sky animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight pr-1">
            DUKKAN AI Assistant
          </span>
        </button>
      )}
    </div>
  );
}
