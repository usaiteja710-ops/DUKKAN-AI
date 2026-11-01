import React from 'react';

export function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last Updated: November 1, 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Free Online Cancellations</h2>
          <p>
            You may cancel any upcoming appointment free of charge via your <strong>My Bookings</strong> dashboard up to the shop's specified cancellation window (default <strong>2 hours</strong> prior to your scheduled start time).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Free Rescheduling</h2>
          <p>
            You can reschedule your appointment to any other available slot at the same shop free of charge up to 2 hours before the appointment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Direct Shop Settlements</h2>
          <p>
            Because BookWise Local facilitates direct pay-at-shop appointments, no advance deposit is held by BookWise. Any prepaid packages or vouchers purchased directly from a shopkeeper are subject to that shop's direct refund terms.
          </p>
        </section>
      </div>
    </div>
  );
}

