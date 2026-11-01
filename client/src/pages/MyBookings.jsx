import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { formatCurrency, formatLocalDateTime } from '../lib/formatters.js';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  AlertCircle,
  RotateCcw,
  XCircle,
  Star,
  CheckCircle2,
} from 'lucide-react';

export function MyBookings() {
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');

  // Reschedule & Cancel modals state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-bookings', tab],
    queryFn: () => api.get(`/bookings/mine?when=${tab}`),
  });

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      await api.patch(`/bookings/${cancelTarget.id}/cancel`, {
        reason: 'Cancelled by customer',
      });
      toast.success('Appointment cancelled successfully.');
      setCancelTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !newTimeInput) return;
    try {
      setIsRescheduling(true);
      const utcStart = new Date(newTimeInput).toISOString();
      await api.patch(`/bookings/${rescheduleTarget.id}/reschedule`, {
        newStartTime: utcStart,
      });
      toast.success('Appointment rescheduled successfully!');
      setRescheduleTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to reschedule appointment');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;
    try {
      setIsReviewing(true);
      await api.post('/bookings/reviews', {
        booking_id: reviewTarget.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Thank you! Your review has been recorded.');
      setReviewTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Background ambient lighting */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-dukkan-azure/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-dukkan-azure dark:text-dukkan-sky flex items-center gap-1.5 mb-1">
          <Calendar className="w-3.5 h-3.5" /> Appointments Manager
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          My Appointments
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your scheduled visits, reschedule, or cancel prior to appointment start time.
        </p>
      </div>

      {/* Glass Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-card max-w-sm">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'upcoming'
              ? 'bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Upcoming Bookings
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'past'
              ? 'bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Past & Cancelled
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size="lg" className="text-dukkan-azure" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past bookings found'}
          description={
            tab === 'upcoming'
              ? 'You have no appointments scheduled. Explore local shops to book your next service!'
              : 'Completed and past appointments will appear here.'
          }
          actionLabel={tab === 'upcoming' ? 'Discover Shops' : undefined}
          onAction={tab === 'upcoming' ? () => window.location.assign('/shops') : undefined}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="glass-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-dukkan-azure/40 transition-all duration-300"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-dukkan-azure/10 text-dukkan-azure dark:text-dukkan-sky border border-dukkan-azure/20">
                    {b.reference_code}
                  </span>
                  <Badge variant={b.status}>{b.status}</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {b.services?.name}
                </h3>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-dukkan-azure" />
                  <span>{formatLocalDateTime(b.start_time, b.shops?.timezone)}</span>
                  <span className="text-slate-400 font-normal">
                    ({b.services?.duration_minutes} mins)
                  </span>
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-dukkan-azure" />
                  <span>
                    <strong>{b.shops?.name}</strong> • {b.shops?.city}
                  </span>
                </p>

                {b.notes && (
                  <p className="text-xs text-slate-500 italic bg-white/40 dark:bg-white/5 p-2 rounded-xl max-w-lg border border-white/20">
                    Notes: {b.notes}
                  </p>
                )}
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/50 dark:border-white/10">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Due</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(b.price_at_booking)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['pending', 'confirmed'].includes(b.status) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRescheduleTarget(b);
                          setNewTimeInput('');
                        }}
                        className="border-slate-300 dark:border-white/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1 text-dukkan-azure" />
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => setCancelTarget(b)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {b.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReviewTarget(b);
                        setReviewRating(5);
                        setReviewComment('');
                      }}
                    >
                      <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-400" />
                      Leave Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel your ${cancelTarget?.services?.name} appointment with ${cancelTarget?.shops?.name}? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Appointment"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => setCancelTarget(null)}
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose a new date and time for <strong>{rescheduleTarget?.services?.name}</strong> at{' '}
            <strong>{rescheduleTarget?.shops?.name}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Appointment Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={newTimeInput}
              onChange={(e) => setNewTimeInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-dukkan-azure"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRescheduleTarget(null)}
            >
              Back
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isRescheduling}
              className="bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white"
            >
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Review Your Experience"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            How was your service at <strong>{reviewTarget?.shops?.name}</strong>? Your feedback helps the local community discover top businesses.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share details about staff punctuality, cleanliness, quality..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-dukkan-azure"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReviewTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isReviewing}
              className="bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white"
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
