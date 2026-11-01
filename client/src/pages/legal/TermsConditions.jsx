import React from 'react';

export function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last Updated: November 1, 2026 • BookWise Local Platform Terms
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Platform Services</h2>
          <p>
            BookWise Local acts as a discovery and real-time scheduling intermediary connecting registered customers with independent local shop owners and service providers. We provide tools for live calendar slot computation and AI-assisted conversational booking.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. No Hidden Fees & Transparent Billing</h2>
          <p>
            BookWise Local operates with zero hidden convenience fees for consumers. The price displayed during booking represents the full amount payable directly to the service provider at the shop.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Customer Commitments</h2>
          <p>
            When you schedule an appointment, a staff member and facility time are reserved exclusively for you. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Arrive on or slightly before your scheduled start time.</li>
            <li>Cancel or reschedule at least 2 hours in advance (or within the shop's specified window) if you cannot attend.</li>
            <li>Avoid repetitive no-shows, which may result in temporary account restrictions.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Shopkeeper Obligations</h2>
          <p>
            Registered shops agree to maintain up-to-date service prices, honest working hours, and honor booked appointments promptly without double-booking walk-ins.
          </p>
        </section>
      </div>
    </div>
  );
}

