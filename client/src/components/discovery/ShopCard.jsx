import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, ArrowRight, Store } from 'lucide-react';
import { RatingStars } from '../ui/RatingStars.jsx';
import { OpenNowBadge } from './OpenNowBadge.jsx';
import { Button } from '../ui/Button.jsx';

export function ShopCard({ shop }) {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
      {/* Cover Image / Category Header */}
      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {shop.cover_image_url ? (
          <img
            src={shop.cover_image_url}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white/40">
            <Store className="w-16 h-16" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-sm">
            {shop.categories?.name || 'Local Shop'}
          </span>
          <OpenNowBadge hours={shop.business_hours} timezone={shop.timezone} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link
            to={`/shops/${shop.id || shop.slug}`}
            className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
          >
            {shop.name}
          </Link>
        </div>

        <div className="mb-2.5">
          <RatingStars rating={shop.rating_avg} count={shop.rating_count} />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{shop.address_line ? `${shop.address_line}, ` : ''}{shop.city}</span>
        </p>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4 flex-1">
          {shop.description || 'Quality local services with guaranteed appointment slots.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link to={`/book/${shop.id}`} className="flex-1">
            <Button size="sm" variant="primary" className="w-full text-xs py-2">
              Book Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
          <Link to={`/assistant?shopId=${shop.id}`}>
            <Button size="sm" variant="outline" className="px-2.5" title="Ask AI about this shop">
              <Sparkles className="w-4 h-4 text-accent-500" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

