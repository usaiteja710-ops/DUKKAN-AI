import React from 'react';
import { toZonedTime } from 'date-fns-tz';

export function OpenNowBadge({ hours = [], timezone = 'Asia/Kolkata' }) {
  if (!hours || hours.length === 0) return null;

  try {
    const nowLocal = toZonedTime(new Date(), timezone);
    const dayOfWeek = nowLocal.getDay();
    const currentMinutes = nowLocal.getHours() * 60 + nowLocal.getMinutes();

    const todayWindows = hours.filter((h) => h.day_of_week === dayOfWeek);
    let isOpen = false;

    for (const w of todayWindows) {
      const [oH, oM] = w.open_time.split(':').map(Number);
      const [cH, cM] = w.close_time.split(':').map(Number);
      const openTotal = oH * 60 + oM;
      const closeTotal = cH * 60 + cM;

      if (currentMinutes >= openTotal && currentMinutes < closeTotal) {
        isOpen = true;
        break;
      }
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          isOpen
            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
        />
        {isOpen ? 'Open Now' : 'Closed'}
      </span>
    );
  } catch {
    return null;
  }
}

