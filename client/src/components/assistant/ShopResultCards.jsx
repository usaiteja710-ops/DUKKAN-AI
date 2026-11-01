import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function ShopResultCards({ shops = [], onSelectShop }) {
  if (!shops.length) return null;

  return (
    <div className="flex flex-col gap-2.5 my-2">
      {shops.map((shop) => (
        <div
          key={shop.shop_id}
          className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 transition-all text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {shop.name}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {shop.rating ? Number(shop.rating).toFixed(1) : 'New'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {shop.city}
                </span>
              </div>
            </div>
            <Link to={`/shops/${shop.shop_id}`}>
              <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {onSelectShop && (
            <button
              onClick={() => onSelectShop(shop)}
              className="mt-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Ask about availability for {shop.name} →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

