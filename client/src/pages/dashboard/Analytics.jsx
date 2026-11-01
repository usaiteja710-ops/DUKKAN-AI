import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient.js';
import { KpiCards } from '../../components/owner/KpiCards.jsx';
import { AiInsightsCard } from '../../components/owner/AiInsightsCard.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { formatCurrency } from '../../lib/formatters.js';
import { TrendingUp, Clock, Sparkles, BarChart3 } from 'lucide-react';

export function Analytics() {
  const [range, setRange] = useState('30d'); // '7d' | '30d' | '90d'

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['owner-analytics-detail', range],
    queryFn: () => api.get(`/owner/analytics?range=${range}`),
  });

  return (
    <div className="space-y-8">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Business Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Performance trends, revenue metrics, peak booking hours, and AI insights
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                range === r
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Summary Cards */}
          <KpiCards kpis={analytics?.kpis} />

          {/* AI Insights Card */}
          {analytics?.aiInsights && (
            <AiInsightsCard insights={analytics.aiInsights} />
          )}

          {/* Charts & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Peak Hours Distribution */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Peak Booking Hours</span>
              </h3>
              <p className="text-xs text-slate-500">
                Identify your busiest appointment windows to optimize staffing
              </p>

              {analytics?.peakHours?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No booking time data available for this timeframe.
                </p>
              ) : (
                <div className="space-y-2.5 pt-2">
                  {analytics?.peakHours?.slice(0, 6).map((ph) => {
                    const maxCount = Math.max(...analytics.peakHours.map((p) => p.count), 1);
                    const pct = Math.round((ph.count / maxCount) * 100);

                    return (
                      <div key={ph.hour} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{ph.label}</span>
                          <span className="text-slate-500">{ph.count} bookings</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Performing Services */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Top Services by Booking Volume</span>
              </h3>
              <p className="text-xs text-slate-500">
                Your most popular offerings requested by clients
              </p>

              {analytics?.topServices?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No service performance data available.
                </p>
              ) : (
                <div className="space-y-3 pt-2">
                  {analytics?.topServices?.map((svc, idx) => (
                    <div
                      key={svc.name}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-[11px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {svc.name}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-xl shadow-xs">
                        {svc.count} bookings
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

