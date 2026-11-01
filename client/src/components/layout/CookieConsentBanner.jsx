import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bookwise_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('bookwise_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('bookwise_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all animate-slide-up"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              We respect your privacy & data choices
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              BookWise Local uses essential cookies for secure authentication and appointment scheduling. We do not sell your personal data or track you across external websites. Read our{' '}
              <Link to="/cookies" className="underline font-medium text-brand-600 hover:text-brand-700">
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline font-medium text-brand-600 hover:text-brand-700">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={handleRejectNonEssential}>
            Essential Only
          </Button>
          <Button variant="primary" size="sm" onClick={handleAcceptAll}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

