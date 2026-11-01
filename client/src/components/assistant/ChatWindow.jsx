import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, RotateCcw, AlertCircle } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { ShopResultCards } from './ShopResultCards.jsx';
import { SlotChips } from './SlotChips.jsx';
import { ConfirmationCard } from './ConfirmationCard.jsx';
import { BookingSuccessCard } from './BookingSuccessCard.jsx';
import { SuggestedReplies } from './SuggestedReplies.jsx';
import { ChatInput } from './ChatInput.jsx';

export function ChatWindow({ onClose, contextShopId = null, contextShopName = null, isFullPage = false }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestUi, setLatestUi] = useState(null);
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize or fetch active session
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      if (!isAuthenticated) {
        // Guest placeholder conversation
        setMessages([
          {
            id: 'welcome-guest',
            role: 'assistant',
            content: `Hello! I'm BookWise Assistant. Please sign in to check live slots and book appointments, or ask me about any local shops!`,
          },
        ]);
        return;
      }

      try {
        const title = contextShopName ? `Inquiry: ${contextShopName}` : 'Booking Assistant';
        const session = await api.post('/assistant/sessions', { title, contextShopId });
        if (mounted && session?.id) {
          setSessionId(session.id);
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: contextShopName
                ? `Hi ${user.full_name?.split(' ')[0] || 'there'}! I'm here to help you with ${contextShopName}. Would you like to check services, available open slots, or working hours?`
                : `Hello ${user.full_name?.split(' ')[0] || 'there'}! How can I help you discover shops or book an appointment today?`,
            },
          ]);
          setSuggestedReplies(
            contextShopName
              ? ['View active services', 'Check slots tomorrow', 'Shop working hours']
              : ['Find haircut shops in Siripuram', 'Top salons near me', 'My upcoming bookings']
          );
        }
      } catch (err) {
        console.warn('Session init fallback:', err);
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, contextShopId, contextShopName, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text, confirmToken = null) => {
    if (!text && !confirmToken) return;

    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: text || 'Confirmed via button',
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setLatestUi(null); // Reset transient card state

    if (!isAuthenticated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: 'assistant',
            content:
              'To search availability and book appointments, please log in with your customer account.',
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      let activeSession = sessionId;
      if (!activeSession) {
        const newSession = await api.post('/assistant/sessions', {
          title: 'Quick Chat',
          contextShopId,
        });
        activeSession = newSession.id;
        setSessionId(newSession.id);
      }

      const response = await api.post(`/assistant/sessions/${activeSession}/messages`, {
        content: text || 'Confirm',
        contextShopId,
        confirmToken,
      });

      const assistantMsg = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.reply,
        ui: response.ui,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLatestUi(response.ui || null);
      setSuggestedReplies(response.suggested_replies || []);
    } catch (err) {
      toast.error(err.message || 'Assistant encountered an error');
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content:
            "I'm experiencing a momentary connection issue. You can still view services and schedule appointments using the direct booking form on any shop's page!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = (token) => {
    handleSendMessage('Yes, please confirm the booking', token);
  };

  const handleCancelAction = () => {
    setLatestUi(null);
    handleSendMessage('I want to change the time or cancel this request');
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 overflow-hidden ${
        isFullPage
          ? 'h-full w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl'
          : 'h-[560px] w-[380px] sm:w-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-brand-600 to-accent-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">BookWise Assistant</h3>
            <p className="text-[11px] text-white/80 truncate max-w-[200px]">
              {contextShopName ? `Assisting with ${contextShopName}` : 'AI Booking Companion'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* In-turn UI Cards if returned */}
              {m.ui?.shops && (
                <ShopResultCards
                  shops={m.ui.shops}
                  onSelectShop={(s) =>
                    handleSendMessage(`Tell me about ${s.name} and its services`)
                  }
                />
              )}
              {m.ui?.slots && (
                <SlotChips
                  slots={m.ui.slots}
                  onSelectSlot={(slot) =>
                    handleSendMessage(`Please book the ${slot.label} slot`)
                  }
                />
              )}
              {m.ui?.confirmation && (
                <ConfirmationCard
                  confirmation={m.ui.confirmation}
                  onConfirm={handleConfirmAction}
                  onCancel={handleCancelAction}
                  isLoading={loading}
                />
              )}
              {m.ui?.booking && <BookingSuccessCard booking={m.ui.booking} />}
            </div>
          </div>
        ))}

        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested replies */}
      {!loading && suggestedReplies.length > 0 && (
        <SuggestedReplies
          suggestions={suggestedReplies}
          onSelect={(reply) => handleSendMessage(reply)}
        />
      )}

      {/* Input */}
      <ChatInput
        onSendMessage={(text) => handleSendMessage(text)}
        disabled={loading}
      />
    </div>
  );
}

