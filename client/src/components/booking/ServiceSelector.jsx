import React from 'react';
import { Clock, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters.js';

export function ServiceSelector({ services = [], selectedServiceId, onSelectService }) {
  if (!services.length) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        No active services listed for this shop yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {services.map((svc) => {
        const isSelected = selectedServiceId === svc.id;

        return (
          <div
            key={svc.id}
            onClick={() => onSelectService(svc)}
            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {svc.name}
                </h4>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {svc.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {svc.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs mt-2">
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {svc.duration_minutes} mins
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(svc.price)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

