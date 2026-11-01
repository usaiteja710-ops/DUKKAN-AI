import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient.js';
import { KpiCards } from '../../components/owner/KpiCards.jsx';
import { AiInsightsCard } from '../../components/owner/AiInsightsCard.jsx';
import { WalkInBookingModal } from '../../components/owner/WalkInBookingModal.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { formatLocalTime, formatCurrency } from '../../lib/formatters.js';
import { Calendar, UserPlus, Clock, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export function Overview() {
  const { shop } = useOutletContext();
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

  // Fetch 30d analytics and AI insights
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['owner-analytics', '30d'],
    queryFn: () => api.get('/owner/analytics?range=30d'),
  });

  // Fetch today's bookings
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const {
    data: todayBookings = [],
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['owner-today-bookings', todayStr],
    queryFn: () =>
      api.get(`/owner/bookings?from=${todayStr}T00:00:00Z&to=${todayStr}T23:59:59Z`),
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

  return (
    <div className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time operations for <strong>{shop?.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setIsWalkInOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            New Walk-in Booking
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      {analyticsLoading ? (
        <div className="py-6 flex items-center justify-center">
          <Spinner size="md" className="text-brand-600" />
        </div>
      ) : (
        <KpiCards kpis={analyticsData?.kpis} />
      )}

      {/* AI Business Insights Card */}
      {analyticsData?.aiInsights && (
        <AiInsightsCard insights={analyticsData.aiInsights} />
      )}

      {/* Today's Schedule & Bookings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today's Scheduled Appointments ({todayBookings.length})
            </h2>
          </div>
          <Link
            to="/dashboard/bookings"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
          >
            All Bookings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="py-8 flex justify-center">
            <Spinner size="md" className="text-brand-600" />
          </div>
        ) : todayBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments scheduled today"
            description="When customers book appointments, they will appear here in chronological order."
            actionLabel="Add Walk-in Booking"
            onAction={() => setIsWalkInOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600">
                      {b.reference_code}
                    </span>
                    <Badge variant={b.status}>{b.status}</Badge>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatLocalTime(b.start_time, shop?.timezone)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {b.services?.name} •{' '}
                    <span className="font-normal text-slate-500">
                      Client: {b.customer_name} ({b.customer_phone})
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatCurrency(b.price_at_booking)}
                  </span>
                  <Link to="/dashboard/bookings">
                    <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                      Manage
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WalkIn Booking Modal */}
      <WalkInBookingModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        services={services}
        staff={staff}
        onSuccess={() => refetchBookings()}
      />
    </div>
  );
}

