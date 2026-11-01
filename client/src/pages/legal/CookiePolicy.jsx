import React from 'react';

export function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last Updated: November 1, 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. What are Cookies?</h2>
          <p>
            Cookies and local storage tokens are small text records stored on your device that allow us to maintain your login session, remember your dark mode preference, and protect against Cross-Site Request Forgery (CSRF).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Categories of Cookies We Use</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Essential & Authentication Cookies (Required)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Used by Supabase Auth to securely verify your identity and protect user accounts. These cannot be disabled as the site cannot function securely without them.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Preference Cookies</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Used to save your theme selection (Dark / Light mode) and cookie consent status.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Zero Advertising or Tracking Cookies</h2>
          <p>
            We do not use advertising cookies, social media trackers, or third-party behavioral pixels.
          </p>
        </section>
      </div>
    </div>
  );
}

