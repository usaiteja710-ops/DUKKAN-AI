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
  MessageSquare,
  Zap,
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
      q: 'How does DUKKAN AI guarantee zero double-bookings?',
      a: 'We enforce PostgreSQL exclusion constraints at the database level and transactional locking. Once a time slot is reserved, it is mathematically blocked across all interfaces and our AI agent simultaneously.',
    },
    {
      q: 'Are there any hidden fees or surge pricing?',
      a: 'Zero. DUKKAN AI does not add hidden convenience charges, booking fees, or surge commissions. You pay the exact shop price listed upon visit.',
    },
    {
      q: 'Can I reschedule or cancel my appointment?',
      a: 'Yes! You can reschedule or cancel free of charge directly from your My Bookings dashboard, respecting each local shop’s clear cancellation window.',
    },
    {
      q: 'How does the DUKKAN AI Booking Assistant work?',
      a: 'Our autonomous AI Assistant can discover shops, compare prices, check live open calendar slots, and confirm appointments through friendly natural conversation, complete with instant email receipts.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section with Colorful Ambient Blur & Glassmorphism */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Ambient Glowing Spheres using User Palette */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-dukkan-azure/20 dark:bg-dukkan-azure/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-slow" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-dukkan-plum/20 dark:bg-dukkan-plum/20 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-60 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-dukkan-cyan/20 dark:bg-dukkan-navy/30 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-bold shadow-glass-glow text-dukkan-navy dark:text-dukkan-sky border border-white/40 dark:border-white/10">
            <Sparkles className="w-4 h-4 text-dukkan-azure animate-pulse" />
            <span>DUKKAN AI — Next-Gen Local Shop Booking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Book Top Local Shops with{' '}
            <span className="bg-gradient-to-r from-dukkan-navy via-dukkan-azure to-dukkan-plum dark:from-dukkan-sky dark:via-dukkan-azure dark:to-dukkan-dustyRose bg-clip-text text-transparent">
              Autonomous AI Speed
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover verified neighborhood barbers, salons, dental clinics, auto garages, and wellness spas. See live open slots and lock in your appointment in under 60 seconds.
          </p>

          {/* Search Bar Component */}
          <div className="max-w-3xl mx-auto pt-2">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Quick Metrics */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero Double-Booking Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-dukkan-azure" />
              <span>Deterministic Real-Time Slots</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>100% Verified Customer Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Popular Service Categories</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a domain to discover specialized local professionals
            </p>
          </div>
          <Link
            to="/shops"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-dukkan-azure dark:text-dukkan-sky hover:underline"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <CategoryGrid
          categories={categories}
          onSelectCategory={(slug) => navigate(`/shops?category=${slug}`)}
        />
      </section>

      {/* 3. Featured Verified Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Featured Verified Shops
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-rated neighborhood businesses with open calendar slots
            </p>
          </div>
          <Link
            to="/shops"
            className="flex items-center gap-1.5 text-xs font-bold text-dukkan-azure dark:text-dukkan-sky hover:underline"
          >
            <span>View All ({featuredShops.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ShopCardSkeleton key={i} />
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

      {/* 4. DUKKAN AI Assistant Showcase Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-glass-hover border border-white/40 dark:border-white/10">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tr from-dukkan-azure to-dukkan-plum rounded-full opacity-20 blur-3xl" />

          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-dukkan-azure dark:text-dukkan-sky flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Conversational AI Scheduling
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Meet DUKKAN AI, Your Personal Booking Concierge
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              No need to browse dozens of pages or call busy phone lines. Just tell DUKKAN AI what you need—e.g. <em>"Book a haircut tomorrow evening in Siripuram"</em>—and let it verify open slots and prepare your booking instantly.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/assistant">
                <Button size="md" className="bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white shadow-glass-glow">
                  <MessageSquare className="w-4 h-4 mr-2" /> Open AI Assistant
                </Button>
              </Link>
              <Link to="/shops">
                <Button size="md" variant="outline" className="border-dukkan-azure/30 text-dukkan-azure dark:text-dukkan-sky">
                  Browse Shops Directly
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to know about scheduling appointments on DUKKAN AI
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-dukkan-azure transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                    openFaqIndex === idx ? 'rotate-180 text-dukkan-azure' : ''
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/40 dark:border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Shopkeeper CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-dukkan-midnight via-dukkan-navy to-dukkan-steel text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-dukkan-azure/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Are You a Local Shop Owner? Digitize Your Appointments with DUKKAN AI.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Eliminate phone interruptions, stop double-bookings, and welcome new customers around the clock with your automated booking calendar.
          </p>
          <div>
            <Link to="/signup?role=shopkeeper">
              <Button size="lg" className="bg-dukkan-azure hover:bg-dukkan-sky text-white font-bold shadow-glass-glow">
                Register Your Shop for Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
