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
        setMessages([
          {
            id: 'welcome-guest',
            role: 'assistant',
            content: `Hello! I'm **DUKKAN AI**, your personal local shop booking assistant. Please sign in or switch to customer mode to check live slots and book appointments, or ask me about any local shops!`,
          },
        ]);
        setSuggestedReplies(['Find salons near me', 'Show barbers in Siripuram', 'Top dental clinics']);
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
                ? `Hi ${user.full_name?.split(' ')[0] || 'there'}! I'm **DUKKAN AI**, here to help you with **${contextShopName}**. Would you like to check services, available open slots, or working hours?`
                : `Hello ${user.full_name?.split(' ')[0] || 'there'}! I'm **DUKKAN AI**. How can I help you discover shops or book an appointment today?`,
            },
          ]);
          setSuggestedReplies(
            contextShopName
              ? ['View active services', 'Check slots tomorrow', 'Shop working hours']
              : ['Find haircuts near Siripuram', 'Top salons near me', 'Check slots tomorrow']
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
    setLatestUi(null);

    if (!isAuthenticated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: 'assistant',
            content:
              'To check real-time availability and confirm bookings, please sign in or toggle to the customer demo mode in the top navigation bar!',
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
        activeSession = newSession?.id || `sess-${Date.now()}`;
        setSessionId(activeSession);
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
            "I'm here to assist you! You can ask me to find barbers, salons, clinics, or check appointment slots for any shop.",
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
      className={`flex flex-col glass-panel overflow-hidden ${
        isFullPage
          ? 'h-full w-full rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl'
          : 'h-[580px] w-[380px] sm:w-[430px] rounded-3xl border border-white/30 dark:border-white/10 shadow-glass-hover'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-dukkan-navy via-dukkan-azure to-dukkan-plum text-white flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-5 h-5 text-dukkan-sky animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>DUKKAN AI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                Live
              </span>
            </h3>
            <p className="text-[11px] text-white/80 truncate max-w-[210px]">
              {contextShopName ? `Dedicated to ${contextShopName}` : 'Conversational Booking Concierge'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close DUKKAN AI"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white rounded-br-sm shadow-md'
                  : 'glass-card text-slate-900 dark:text-slate-100 rounded-bl-sm border border-white/50 dark:border-white/10'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* In-turn UI Cards */}
              {(m.ui?.shops || m.ui?.data?.shops) && (
                <div className="mt-3">
                  <ShopResultCards
                    shops={m.ui.shops || m.ui.data.shops}
                    onSelectShop={(s) =>
                      handleSendMessage(`Tell me about ${s.name} and check available slots`)
                    }
                  />
                </div>
              )}
              {(m.ui?.slots || m.ui?.data?.slots) && (
                <div className="mt-3">
                  <SlotChips
                    slots={m.ui.slots || m.ui.data.slots}
                    onSelectSlot={(slot) =>
                      handleSendMessage(`Please book the ${slot.label} slot`)
                    }
                  />
                </div>
              )}
              {(m.ui?.confirmation || (m.ui?.type === 'booking_confirmation' && m.ui.data)) && (
                <div className="mt-3">
                  <ConfirmationCard
                    confirmation={m.ui.confirmation || m.ui.data}
                    onConfirm={handleConfirmAction}
                    onCancel={handleCancelAction}
                    isLoading={loading}
                  />
                </div>
              )}
              {(m.ui?.booking || (m.ui?.type === 'booking_success' && m.ui.data)) && (
                <div className="mt-3">
                  <BookingSuccessCard booking={m.ui.booking || m.ui.data} />
                </div>
              )}
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
