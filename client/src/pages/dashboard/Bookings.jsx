import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient.js';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { WalkInBookingModal } from '../../components/owner/WalkInBookingModal.jsx';
import { formatCurrency, formatLocalDateTime } from '../../lib/formatters.js';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  Filter,
} from 'lucide-react';

export function Bookings() {
  const { shop } = useOutletContext();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch shop bookings
  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['owner-bookings', shop?.id, statusFilter],
    queryFn: () => {
      const endpoint = statusFilter
        ? `/owner/bookings?status=${statusFilter}`
        : '/owner/bookings';
      return api.get(endpoint);
    },
    enabled: !!shop?.id,
  });

  // Fetch services and staff for walk-in modal
  const { data: services = [] } = useQuery({
    queryKey: ['owner-services'],
    queryFn: () => api.get('/owner/services'),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: () => api.get('/owner/staff'),
  });

  // Supabase Realtime subscription for live incoming bookings
  useEffect(() => {
    if (!shop?.id) return;

    const channel = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `shop_id=eq.${shop.id}`,
        },
        (payload) => {
          toast.booking(
            `New appointment booked! Reference: ${payload.new.reference_code}`,
            'Live Booking Received'
          );
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop?.id, toast, refetch]);

  // Handle status update (State-Machine transition)
  const handleStatusChange = async (bookingId, targetStatus) => {
    try {
      setUpdatingId(bookingId);
      await api.patch(`/owner/bookings/${bookingId}/status`, {
        status: targetStatus,
      });
      toast.success(`Booking status changed to ${targetStatus}`);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Status transition failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bookings & Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage upcoming client appointments, walk-ins, and attendance status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setIsWalkInOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Walk-in
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['', 'confirmed', 'completed', 'pending', 'cancelled', 'no_show'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-brand-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st ? st.replace('_', ' ').toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total: {bookings.length}
        </span>
      </div>

      {/* Bookings Table / Cards */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings match your filter"
          description="Try selecting a different status filter or create a walk-in booking."
          actionLabel="Clear Filter"
          onAction={() => setStatusFilter('')}
        />
      ) : (
        <div className="space-y-3.5">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300">
                    {b.reference_code}
                  </span>
                  <Badge variant={b.status}>{b.status}</Badge>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {b.source}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {b.services?.name}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    {formatLocalDateTime(b.start_time, shop?.timezone)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {b.customer_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${b.customer_phone}`} className="hover:underline">
                      {b.customer_phone}
                    </a>
                  </span>
                </div>

                {b.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mt-1">
                    Client Note: {b.notes}
                  </p>
                )}
              </div>

              {/* Price & State-Machine Actions */}
              <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Amount</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(b.price_at_booking)}
                  </span>
                </div>

                {/* Valid State Machine Actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {b.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={updatingId === b.id}
                        onClick={() => handleStatusChange(b.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600"
                        isLoading={updatingId === b.id}
                        onClick={() => handleStatusChange(b.id, 'cancelled')}
                      >
                        Decline
                      </Button>
                    </>
                  )}

                  {b.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        isLoading={updatingId === b.id}
                        onClick={() => handleStatusChange(b.id, 'completed')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        isLoading={updatingId === b.id}
                        onClick={() => handleStatusChange(b.id, 'no_show')}
                      >
                        No-Show
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        isLoading={updatingId === b.id}
                        onClick={() => handleStatusChange(b.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WalkIn Modal */}
      <WalkInBookingModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        services={services}
        staff={staff}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

