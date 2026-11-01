import React, { useState } from 'react';
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
  Users,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SHOP_IMG = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80';

export function ShopDetail() {
  const { shopId } = useParams();
  const [imgSrc, setImgSrc] = useState(null);

  const {
    data: shop,
    isLoading,
    isError,
    error,
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
        <Spinner size="lg" className="text-dukkan-azure" />
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

  const currentCover = imgSrc || shop.cover_image_url || DEFAULT_SHOP_IMG;

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Ambient background glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-dukkan-azure/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 right-10 w-80 h-80 bg-dukkan-plum/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Header Hero Card with Full Photography */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-glass-hover border border-white/30 dark:border-white/10">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-100 dark:bg-dukkan-steel">
          <img
            src={currentCover}
            alt={shop.name}
            onError={() => setImgSrc(DEFAULT_SHOP_IMG)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          {/* Badges Overlay */}
          <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-dukkan-midnight/90 text-dukkan-navy dark:text-dukkan-sky backdrop-blur-md shadow-sm">
              {shop.categories?.name || 'Local Shop'}
            </span>
            <OpenNowBadge hours={shop.business_hours} timezone={shop.timezone} />
          </div>

          {/* Floating Hero Info */}
          <div className="absolute bottom-6 inset-x-4 sm:inset-x-8 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Dukkan Partner
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                {shop.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200">
                <RatingStars rating={shop.rating_avg} count={shop.rating_count} size="md" />
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-dukkan-sky" />
                  {shop.address_line ? `${shop.address_line}, ` : ''}{shop.city}, {shop.state || ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/book/${shop.id}`}>
                <Button size="lg" className="bg-gradient-to-r from-dukkan-azure to-dukkan-sky text-white font-bold shadow-glass-glow hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4 mr-2" /> Book Now
                </Button>
              </Link>
              <Link to={`/assistant?shopId=${shop.id}`}>
                <Button size="lg" variant="outline" className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                  <Sparkles className="w-4 h-4 mr-1.5 text-dukkan-sky" /> Ask AI
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Description Banner */}
        <div className="p-6 sm:p-8 bg-white/60 dark:bg-dukkan-midnight/60 backdrop-blur-md">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
            {shop.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Services Menu & Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* Services Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Available Services</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-dukkan-azure/10 text-dukkan-azure dark:text-dukkan-sky font-bold">
                  {shop.services?.length || 0}
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {shop.services?.map((svc) => (
                <div
                  key={svc.id}
                  className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-dukkan-azure/40 transition-all duration-300"
                >
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {svc.name}
                    </h3>
                    {svc.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                        {svc.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-dukkan-azure" /> {svc.duration_minutes} mins session
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-white/10">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(svc.price)}
                    </span>
                    <Link to={`/book/${shop.id}?serviceId=${svc.id}`}>
                      <Button size="sm" variant="primary" className="bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white">
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
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Authentic Customer Reviews ({reviews.length})
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="glass-card p-6 text-center text-xs text-slate-500">
                No reviews submitted for this shop yet. Be the first to book and share your experience!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="glass-card p-5 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                          alt={rev.profiles?.full_name || 'Customer'}
                          className="w-7 h-7 rounded-full object-cover border border-white/40"
                        />
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {rev.profiles?.full_name || 'Verified Customer'}
                        </span>
                      </div>
                      <RatingStars rating={rev.rating} />
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
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
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-dukkan-azure" />
              <span>Weekly Business Hours</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-200/50 dark:divide-white/10">
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
          <div className="glass-card p-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Shop Booking Policies</h3>
            <p>
              <strong>Cancellation Policy:</strong> Free rescheduling or cancellation up to{' '}
              <strong className="text-slate-900 dark:text-white">{shop.cancellation_window_hours} hours</strong> before your appointment.
            </p>
            <p>
              <strong>Advance Notice:</strong> Requires at least{' '}
              {shop.min_notice_hours} hour(s) advance booking.
            </p>
            <p>
              <strong>Timezone:</strong> {shop.timezone}
            </p>

            <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-2">
              {shop.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-dukkan-azure" />
                  <a href={`tel:${shop.phone}`} className="font-semibold text-dukkan-azure dark:text-dukkan-sky hover:underline">
                    {shop.phone}
                  </a>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-dukkan-azure" />
                  <a href={`mailto:${shop.email}`} className="font-semibold text-dukkan-azure dark:text-dukkan-sky hover:underline truncate">
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
