import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8">
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Personal Data Protection (DPDP) Act & GDPR Compliant</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: November 1, 2026 • Effective Immediately
          </p>
        </div>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Our Commitment to Your Privacy</h2>
          <p>
            At <strong>BookWise Local Technologies Pvt. Ltd.</strong> ("BookWise", "we", "us"), we believe in radical transparency. We operate an online appointment booking platform connecting Indian consumers with local small businesses. We collect only the minimal data necessary to confirm and service your appointments.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. What Data We Collect & Why</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account & Contact Information:</strong> Name, verified email address, and phone number. This is required to create your appointment, send booking confirmations, and alert you if the shop needs to reschedule.
            </li>
            <li>
              <strong>Appointment Details:</strong> Selected shop, chosen service, preferred time slot, and any special requests you provide.
            </li>
            <li>
              <strong>Conversational AI Data:</strong> Chat messages exchanged with the BookWise AI Assistant. These messages are processed securely server-side strictly to extract search filters and execute booking tools.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Third-Party Services & Zero Client-Side AI Keys</h2>
          <p>
            We take your security seriously:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Google Gemini API:</strong> Executed strictly server-side through isolated API proxies. Your personal phone number, password, and sensitive tokens are redacted from logging.
            </li>
            <li>
              <strong>Supabase:</strong> Hosted PostgreSQL database with Row Level Security (RLS) ensuring customers cannot view each other's data, and shopkeepers only access contact details for appointments booked at their shop.
            </li>
            <li>
              <strong>Zero Advertising Trackers:</strong> We do not use third-party behavioral advertising SDKs or data brokers.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Your Data Rights & Right to Erasure</h2>
          <p>
            Under the Digital Personal Data Protection Act (DPDP Act 2023) and GDPR, you have the right to access, rectify, or request complete erasure of your data at any time. You can trigger an automated deletion request via your <a href="/data-deletion" className="text-brand-600 font-semibold underline">Data Deletion Portal</a> or email our Data Protection Officer at <a href="mailto:privacy@bookwise.local" className="text-brand-600 font-semibold underline">privacy@bookwise.local</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

