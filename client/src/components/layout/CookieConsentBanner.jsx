import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('dukkan_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('dukkan_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('dukkan_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 glass-panel border-t border-white/20 dark:border-white/10 shadow-2xl transition-all animate-slide-up"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-dukkan-azure/10 text-dukkan-azure dark:text-dukkan-sky flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              We respect your privacy & data choices on DUKKAN AI
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              DUKKAN AI uses essential cookies for secure authentication and real-time appointment scheduling. We comply with the DPDP Act 2023 and do not sell your personal data. Read our{' '}
              <Link to="/cookies" className="underline font-medium text-dukkan-azure dark:text-dukkan-sky hover:underline">
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline font-medium text-dukkan-azure dark:text-dukkan-sky hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRejectNonEssential}
            className="text-xs w-full md:w-auto"
          >
            Essential Only
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAcceptAll}
            className="text-xs w-full md:w-auto bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
