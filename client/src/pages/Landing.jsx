import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Store,
  ChevronDown,
  ArrowRight,
  Star,
  Users,
  Compass,
} from 'lucide-react';
import { api } from '../lib/apiClient.js';
import { SearchBar } from '../components/discovery/SearchBar.jsx';
import { CategoryGrid } from '../components/discovery/CategoryGrid.jsx';
import { ShopCard } from '../components/discovery/ShopCard.jsx';
import { ShopCardSkeleton } from '../components/ui/Skeleton.jsx';
import { Button } from '../components/ui/Button.jsx';

export function Landing() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  // Fetch featured published shops
  const { data: shopsData, isLoading: shopsLoading } = useQuery({
    queryKey: ['featured-shops'],
    queryFn: () => api.get('/shops?limit=6&sort=rating'),
  });

  const featuredShops = shopsData?.shops || [];

  const handleSearch = ({ query, city }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    navigate(`/shops?${params.toString()}`);
  };

  const faqs = [
    {
      q: 'How does BookWise Local guarantee no double-bookings?',
      a: 'We enforce PostgreSQL exclusion constraints at the database level and transactional locking. Once a time slot is booked, it is mathematically blocked across all interfaces and our AI assistant in real-time.',
    },
    {
      q: 'Are there any hidden fees or surge pricing?',
      a: 'Zero. BookWise Local does not add hidden convenience charges, booking fees, or surge commissions. You pay the direct shop price listed upon arrival.',
    },
    {
      q: 'Can I reschedule or cancel my appointment?',
      a: 'Yes! You can reschedule or cancel free of charge up to 2 hours before your appointment start time directly from the My Bookings page.',
    },
    {
      q: 'How does the AI Booking Assistant work?',
      a: 'Our AI Booking Assistant is powered by Google Gemini server-side. It queries live database availability tools and helps you find shops, check open slots, and confirm appointments via natural conversation.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-brand-50/60 via-slate-50 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <span>AI-Powered Local Appointments Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Book Top Local Shops in{' '}
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              Under 60 Seconds
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover verified neighborhood barbers, salons, dental clinics, auto garages, and spas. See truly open time slots and book instantly via form or conversational AI.
          </p>

          {/* Search Bar Component */}
          <div className="max-w-3xl mx-auto pt-4">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero Double-Booking Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Real-Time Calendar Slots</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>100% Genuine Customer Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Browse by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a domain to discover specialized local service providers
            </p>
          </div>
          <Link
            to="/shops"
            className="text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            All categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      {/* 3. Featured Verified Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Featured Local Businesses
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-rated neighborhood establishments accepting online bookings today
            </p>
          </div>
          <Link
            to="/shops"
            className="text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            Explore all shops <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <ShopCardSkeleton key={n} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>

      {/* 4. AI Assistant Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-tr from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-14 overflow-hidden shadow-2xl border border-brand-900/60">
          <div className="relative z-10 max-w-2xl space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-950/80 border border-accent-800 text-accent-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Conversational Scheduling</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Prefer to Book by Chatting? Talk to BookWise AI.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Just say: <em>"Find a haircut near Siripuram tomorrow evening under ₹500"</em> and our assistant will verify live slot availability, answer shop FAQs, and confirm your booking instantly.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link to="/assistant">
                <Button size="lg" variant="primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try AI Assistant Now
                </Button>
              </Link>
              <Link to="/shops">
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                  Browse Shops by Form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          How BookWise Local Works
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-12 max-w-md mx-auto">
          Skip endless phone calls and waiting in line. Direct appointment booking in 3 easy steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Discover & Compare</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find verified barbers, salons, clinics, and auto garages near your area. View clear transparent service pricing and working hours.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pick Open Slots</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our availability engine only displays truly free slots, computing buffers and staff schedules so your time is 100% reserved.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Instant Confirmation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get an instant reference code and confirmation email. Arrive on time, enjoy zero queue waiting, and pay directly at the shop.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Expandable FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 text-center mb-8">
          Everything you need to know about scheduling appointments with BookWise Local
        </p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Shopkeeper CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Own a Salon, Clinic, Garage, or Local Shop?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Eliminate missed walk-ins, phone tag, and scheduling conflicts. Get your shop listed on BookWise Local in 5 minutes with our onboarding wizard.
          </p>
          <div className="pt-2">
            <Link to="/signup?role=shopkeeper">
              <Button size="lg" variant="primary">
                Register Your Business for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

