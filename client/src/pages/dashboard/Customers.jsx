import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { formatCurrency, formatLocalDateTime } from '../../lib/formatters.js';
import { Users, Phone, Mail, FileText, Calendar, Edit3 } from 'lucide-react';

export function Customers() {
  const toast = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const {
    data: customers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['owner-customers'],
    queryFn: () => api.get('/owner/customers'),
  });

  const openNoteModal = (customer) => {
    setSelectedCustomer(customer);
    setNoteText(customer.privateNote || '');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setIsSavingNote(true);
      await api.put(`/owner/customers/${encodeURIComponent(selectedCustomer.email)}/note`, {
        note: noteText,
      });
      toast.success('Private customer note saved!');
      setSelectedCustomer(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Customer Directory & Notes
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track customer visit frequency, client preferences, and private staff notes
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customer history yet"
          description="As customers book and complete appointments at your shop, their visit history will be aggregated here."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Visits</th>
                  <th className="px-6 py-4">Total Spent</th>
                  <th className="px-6 py-4">Private Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {customers.map((c) => (
                  <tr key={c.email} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {c.name}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Last visit: {formatLocalDateTime(c.lastVisit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`tel:${c.phone}`} className="hover:underline">
                          {c.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {c.visitCount} visits
                    </td>
                    <td className="px-6 py-4 font-black text-brand-600 dark:text-brand-400 text-sm">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {c.privateNote ? (
                        <p className="line-clamp-2 italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg">
                          "{c.privateNote}"
                        </p>
                      ) : (
                        <span className="text-slate-400 italic">No notes</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openNoteModal(c)}
                        className="text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit Note
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Private Customer Note"
        description={`Add internal staff notes about ${selectedCustomer?.name} (e.g. hair preferences, allergies, VIP)`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Prefers low-fade cut, sensitive skin on neckline, likes quiet appointments."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Note: Customer notes are completely private and only visible to authorized shop staff.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedCustomer(null)}
              disabled={isSavingNote}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingNote}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

