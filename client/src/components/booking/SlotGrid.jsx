import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { api } from '../../lib/apiClient.js';
import { Spinner } from '../ui/Spinner.jsx';
import { Calendar, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function SlotGrid({
  shopId,
  serviceId,
  selectedSlot,
  onSelectSlot,
  maxAdvanceDays = 60,
}) {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), maxAdvanceDays), 'yyyy-MM-dd');

  // Fetch live availability from deterministic backend
  const {
    data: availabilityData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['availability', shopId, serviceId, selectedDate],
    queryFn: () =>
      api.get(`/shops/${shopId}/availability?serviceId=${serviceId}&date=${selectedDate}`),
    enabled: !!shopId && !!serviceId && !!selectedDate,
  });

  const slots = availabilityData?.slots || [];

  return (
    <div className="space-y-5">
      {/* Date selector header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Select Date</h4>
            <p className="text-xs text-slate-500">Pick an appointment date</p>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            onSelectSlot(null); // Reset chosen slot on date switch
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
        />
      </div>

      {/* Available Slots Grid */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-500" />
          Available Time Slots ({slots.length})
        </h4>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Spinner size="md" className="text-brand-600" />
            <p className="text-xs text-slate-400">Verifying real-time slot availability...</p>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{error?.message || 'Failed to check availability.'}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No slots open on {selectedDate}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                The shop may be closed on this day, or all available appointments have been reserved.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const nextDay = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
                setSelectedDate(nextDay);
              }}
            >
              Check Next Day →
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.start_time === slot.start_time;

              return (
                <button
                  key={slot.start_time}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-500/20 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-600 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-sm tracking-tight">{slot.label}</div>
                  <div
                    className={`flex items-center gap-1 text-[11px] mt-1.5 truncate ${
                      isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{slot.staff_name || 'Staff Member'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

