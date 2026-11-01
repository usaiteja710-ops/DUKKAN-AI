import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, ArrowRight, Store, ShieldCheck } from 'lucide-react';
import { RatingStars } from '../ui/RatingStars.jsx';
import { OpenNowBadge } from './OpenNowBadge.jsx';
import { Button } from '../ui/Button.jsx';

const DEFAULT_SHOP_IMG = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';

export function ShopCard({ shop }) {
  const [imgSrc, setImgSrc] = useState(shop.cover_image_url || DEFAULT_SHOP_IMG);

  return (
    <div className="flex flex-col glass-card-hover overflow-hidden group">
      {/* Cover Image / Category Header */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-dukkan-steel overflow-hidden">
        <img
          src={imgSrc}
          alt={shop.name}
          onError={() => setImgSrc(DEFAULT_SHOP_IMG)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/90 dark:bg-dukkan-midnight/90 text-dukkan-navy dark:text-dukkan-sky backdrop-blur-md shadow-sm border border-white/20">
            {shop.categories?.name || 'Local Shop'}
          </span>
          <OpenNowBadge hours={shop.business_hours} timezone={shop.timezone} />
        </div>

        {/* Verified shop badge */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Dukkan Partner</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link
            to={`/shops/${shop.id || shop.slug}`}
            className="text-base font-bold text-slate-900 dark:text-white hover:text-dukkan-azure dark:hover:text-dukkan-sky transition-colors line-clamp-1"
          >
            {shop.name}
          </Link>
        </div>

        <div className="mb-2.5">
          <RatingStars rating={shop.rating_avg} count={shop.rating_count} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-dukkan-azure flex-shrink-0" />
          <span className="truncate">{shop.address_line ? `${shop.address_line}, ` : ''}{shop.city}</span>
        </p>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4 flex-1">
          {shop.description || 'Verified local shop offering guaranteed appointments and transparent pricing.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-200/50 dark:border-white/10">
          <Link to={`/book/${shop.id}`} className="flex-1">
            <Button size="sm" variant="primary" className="w-full text-xs py-2 bg-gradient-to-r from-dukkan-navy to-dukkan-azure hover:from-dukkan-midnight hover:to-dukkan-navy text-white shadow-sm">
              Book Appointment <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
          <Link to={`/assistant?shopId=${shop.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="px-2.5 border-dukkan-azure/30 text-dukkan-azure dark:text-dukkan-sky hover:bg-dukkan-azure/10"
              title="Ask Dukkan AI about this shop"
            >
              <Sparkles className="w-4 h-4 text-dukkan-azure dark:text-dukkan-sky" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
