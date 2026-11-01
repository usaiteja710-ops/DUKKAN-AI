import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/apiClient.js';
import { Button } from '../../components/ui/Button.jsx';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function DataDeletion() {
  const { user, isAuthenticated, signOut } = useAuth();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!isAuthenticated) {
      toast.error('You must be signed in to request deletion of your account data.');
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete('/profile');
      toast.success('Your personal data and chat history have been permanently deleted.');
      setConfirmed(true);
      setTimeout(() => {
        signOut();
      }, 2500);
    } catch (err) {
      toast.error(err.message || 'Failed to process deletion request');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Data Deletion & Account Erasure
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Exercise your DPDP Act 2023 & GDPR Right to be Forgotten
            </p>
          </div>
        </div>

        {confirmed ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
              Data Successfully Anonymized & Removed
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              All your chat histories, personal identifiers, and upcoming bookings have been deleted from our database. Signing you out...
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              When you submit an account erasure request, BookWise Local immediately and irreversibly:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Permanently deletes all your AI Assistant chat sessions and conversational history.</li>
              <li>Cancels any pending or confirmed upcoming bookings.</li>
              <li>Anonymizes your profile name, contact phone number, and avatar image.</li>
              <li>Unsubscribes you from all future notification emails.</li>
            </ul>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>
                This action is permanent and cannot be reversed. If you have upcoming appointments, they will be automatically cancelled.
              </span>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {isAuthenticated ? (
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete My Personal Data
                </Button>
              ) : (
                <p className="text-xs text-slate-500">
                  Please log in with your account to authorize data erasure. Alternatively, you can email <a href="mailto:privacy@bookwise.local" className="underline font-semibold text-brand-600">privacy@bookwise.local</a> from your registered email address.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

