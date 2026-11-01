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
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past'

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          My Appointments
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your scheduled visits, reschedule, or cancel prior to appointment start
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'upcoming'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Upcoming Bookings
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'past'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Past & Cancelled
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
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
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400">
                    {b.reference_code}
                  </span>
                  <Badge variant={b.status}>{b.status}</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {b.services?.name}
                </h3>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-500" />
                  <span>{formatLocalDateTime(b.start_time, b.shops?.timezone)}</span>
                  <span className="text-slate-400 font-normal">
                    ({b.services?.duration_minutes} mins)
                  </span>
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong>{b.shops?.name}</strong> • {b.shops?.city}
                  </span>
                </p>

                {b.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg max-w-lg">
                    Notes: {b.notes}
                  </p>
                )}
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
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
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
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
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelBooking}
        isDestructive
        isLoading={isCancelling}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your appointment (${cancelTarget?.reference_code}) at ${cancelTarget?.shops?.name}?`}
        confirmLabel="Yes, Cancel Booking"
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment"
        description={`Pick a new date and time for ${rescheduleTarget?.services?.name}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={newTimeInput}
              onChange={(e) => setNewTimeInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <p className="text-xs text-slate-500">
            Rescheduling will atomically verify that the new slot is completely open before modifying your appointment.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRescheduleTarget(null)}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isRescheduling} disabled={!newTimeInput}>
              Save New Time
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Rate Your Experience"
        description={`Share feedback for ${reviewTarget?.shops?.name}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      reviewRating >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                {reviewRating} of 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Review & Comments
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was the service and punctuality?"
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewTarget(null)}
              disabled={isReviewing}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isReviewing}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

