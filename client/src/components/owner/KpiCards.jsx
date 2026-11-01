import React from 'react';
import { Calendar, DollarSign, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters.js';

export function KpiCards({ kpis }) {
  if (!kpis) return null;

  const cards = [
    {
      title: 'Total Bookings',
      value: kpis.totalBookings || 0,
      icon: Calendar,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950/60',
    },
    {
      title: 'Estimated Revenue',
      value: formatCurrency(kpis.estimatedRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      title: 'Completed Visits',
      value: kpis.completedCount || 0,
      icon: CheckCircle2,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/60',
    },
    {
      title: 'No-Show Rate',
      value: `${kpis.noShowRate ?? 0}%`,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{c.title}</span>
              <div className={`p-2 rounded-xl ${c.bg} ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

