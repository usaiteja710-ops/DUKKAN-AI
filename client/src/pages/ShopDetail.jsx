import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient.js';
import { formatCurrency } from '../lib/formatters.js';
import { RatingStars } from '../components/ui/RatingStars.jsx';
import { OpenNowBadge } from '../components/discovery/OpenNowBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Calendar,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ShopDetail() {
  const { shopId } = useParams();

  const {
    data: shop,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shop-detail', shopId],
    queryFn: () => api.get(`/shops/${shopId}`),
  });

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['shop-reviews', shopId],
    queryFn: () => api.get(`/shops/${shopId}/reviews`),
    enabled: !!shop?.id,
  });

  const reviews = reviewsData?.reviews || [];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <EmptyState
          title="Shop not found"
          description={error?.message || 'This shop does not exist or has been unpublished.'}
          actionLabel="Browse all shops"
          onAction={() => window.location.assign('/shops')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Header Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
              {shop.categories?.name || 'Local Shop'}
            </span>
            <OpenNowBadge hours={shop.business_hours} timezone={shop.timezone} />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {shop.name}
          </h1>

          <div className="flex items-center gap-3">
            <RatingStars rating={shop.rating_avg} count={shop.rating_count} size="md" />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{shop.address_line ? `${shop.address_line}, ` : ''}{shop.city}, {shop.state || ''}</span>
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl pt-2">
            {shop.description}
          </p>
        </div>

        {/* Quick CTA box */}
        <div className="w-full md:w-72 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 flex-shrink-0 text-center">
          <Link to={`/book/${shop.id}`} className="block">
            <Button size="lg" variant="primary" className="w-full shadow-md">
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
          <Link to={`/assistant?shopId=${shop.id}`} className="block">
            <Button size="md" variant="outline" className="w-full">
              <Sparkles className="w-4 h-4 mr-1.5 text-accent-500" />
              Ask AI About This Shop
            </Button>
          </Link>
          <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Instant Confirmation • Pay at Shop</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Services Menu & Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* Services Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Services & Pricing ({shop.services?.length || 0})
              </h2>
            </div>

            <div className="space-y-3">
              {shop.services?.map((svc) => (
                <div
                  key={svc.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {svc.name}
                    </h3>
                    {svc.description && (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                        {svc.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium pt-1">
                      <Clock className="w-3.5 h-3.5" /> {svc.duration_minutes} minutes
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(svc.price)}
                    </span>
                    <Link to={`/book/${shop.id}?serviceId=${svc.id}`}>
                      <Button size="sm" variant="primary">
                        Book Slot
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Verified Customer Reviews ({reviews.length})
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No reviews submitted for this shop yet. Be the first to book and share your experience!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {rev.profiles?.full_name || 'Verified Customer'}
                      </span>
                      <RatingStars rating={rev.rating} />
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Hours & Contact Details */}
        <div className="space-y-6">
          {/* Weekly Hours Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Weekly Business Hours</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {DAYS_OF_WEEK.map((dayName, dayIdx) => {
                const windows = (shop.business_hours || []).filter((h) => h.day_of_week === dayIdx);
                const isClosed = windows.length === 0;

                return (
                  <div key={dayName} className="flex items-center justify-between pt-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{dayName}</span>
                    <span className={isClosed ? 'text-slate-400' : 'font-semibold text-slate-900 dark:text-white'}>
                      {isClosed
                        ? 'Closed'
                        : windows.map((w) => `${w.open_time.slice(0, 5)} - ${w.close_time.slice(0, 5)}`).join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shop Policies & Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Shop Policies</h3>
            <p>
              <strong>Cancellation Policy:</strong> Free rescheduling or cancellation up to{' '}
              <strong className="text-slate-900 dark:text-white">{shop.cancellation_window_hours} hours</strong> before your appointment.
            </p>
            <p>
              <strong>Minimum Advance Notice:</strong> Requires at least{' '}
              {shop.min_notice_hours} hour(s) advance booking.
            </p>
            <p>
              <strong>Shop Timezone:</strong> {shop.timezone}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {shop.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${shop.phone}`} className="font-semibold text-brand-600 hover:underline">
                    {shop.phone}
                  </a>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${shop.email}`} className="font-semibold text-brand-600 hover:underline truncate">
                    {shop.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

