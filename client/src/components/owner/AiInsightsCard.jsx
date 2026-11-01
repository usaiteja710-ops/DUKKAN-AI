import React from 'react';
import { Sparkles, ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

export function AiInsightsCard({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-500 to-brand-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">AI Business Insights</h3>
            <p className="text-[11px] text-slate-400">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-accent-400 bg-accent-950/80 px-2.5 py-1 rounded-full border border-accent-800">
          Live Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between space-y-2 hover:border-slate-600 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {item.title}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    item.priority === 'high'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : item.priority === 'medium'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{item.detail}</p>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-semibold text-brand-400">
              <span>{item.action}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

