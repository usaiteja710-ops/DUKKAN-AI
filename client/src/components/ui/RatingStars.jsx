import React from 'react';
import { Star } from 'lucide-react';

export function RatingStars({ rating = 0, count = null, size = 'sm', className = '' }) {
  const numRating = Number(rating) || 0;
  const starSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSizes[size] || starSizes.sm} ${
              numRating >= star
                ? 'fill-amber-400 text-amber-400'
                : numRating >= star - 0.5
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {numRating > 0 ? numRating.toFixed(1) : 'New'}
      </span>
      {count !== null && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          ({count})
        </span>
      )}
    </div>
  );
}

