import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Clock, Calendar, Plus, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatLocalDateTime } from '../../lib/formatters.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Schedule() {
  const toast = useToast();

  // Fetch business hours
  const {
    data: hours = [],
    isLoading: hoursLoading,
    refetch: refetchHours,
  } = useQuery({
    queryKey: ['owner-hours'],
    queryFn: () => api.get('/owner/hours'),
  });

  // Fetch time off blocks
  const {
    data: timeOffList = [],
    isLoading: timeOffLoading,
    refetch: refetchTimeOff,
  } = useQuery({
    queryKey: ['owner-time-off'],
    queryFn: () => api.get('/owner/time-off'),
  });

  // Time off form state
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isAddingTimeOff, setIsAddingTimeOff] = useState(false);

  const handleAddTimeOff = async (e) => {
    e.preventDefault();
    if (!newStartsAt || !newEndsAt) return;

    try {
      setIsAddingTimeOff(true);
      const res = await api.post('/owner/time-off', {
        starts_at: new Date(newStartsAt).toISOString(),
        ends_at: new Date(newEndsAt).toISOString(),
        reason: newReason || 'Shop Holiday / Break',
      });

      if (res?.warning) {
        toast.info(res.warning);
      } else {
        toast.success('Blocked period added successfully.');
      }

      setNewStartsAt('');
      setNewEndsAt('');
      setNewReason('');
      refetchTimeOff();
    } catch (err) {
      toast.error(err.message || 'Failed to block time slot');
    } finally {
      setIsAddingTimeOff(false);
    }
  };

  const handleDeleteTimeOff = async (id) => {
    try {
      await api.delete(`/owner/time-off/${id}`);
      toast.success('Blocked time removed');
      refetchTimeOff();
    } catch (err) {
      toast.error(err.message || 'Failed to remove block');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Working Hours & Blocked Time
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Define weekly shift windows, lunch breaks, and schedule shop holidays
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Weekly Working Hours */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Weekly Business Schedule</span>
            </h2>
          </div>

          <p className="text-xs text-slate-500">
            Open slots are generated within these hours. Split windows (e.g. 10:00-13:00 and 14:00-20:00) automatically protect lunch breaks from customer bookings.
          </p>

          {hoursLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" className="text-brand-600" />
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {DAYS.map((dayName, dayIdx) => {
                const windows = hours.filter((h) => h.day_of_week === dayIdx);
                const isClosed = windows.length === 0;

                return (
                  <div key={dayName} className="flex items-center justify-between pt-2.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 w-24">
                      {dayName}
                    </span>
                    <div className="flex-1 text-right">
                      {isClosed ? (
                        <span className="text-slate-400 font-medium">Closed</span>
                      ) : (
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                          {windows
                            .map((w) => `${w.open_time.slice(0, 5)} - ${w.close_time.slice(0, 5)}`)
                            .join(' & ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Holiday & Time Off Manager */}
        <div className="space-y-6">
          {/* Add Block Form */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Block Time Off / Holiday</span>
            </h2>

            <form onSubmit={handleAddTimeOff} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartsAt}
                    onChange={(e) => setNewStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ends At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndsAt}
                    onChange={(e) => setNewEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Block
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festival Holiday, Maintenance, Doctor Visit"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                isLoading={isAddingTimeOff}
                disabled={!newStartsAt || !newEndsAt}
                className="w-full"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Block Off Period
              </Button>
            </form>
          </div>

          {/* Active Time Off List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scheduled Blocked Periods ({timeOffList.length})
            </h3>

            {timeOffLoading ? (
              <div className="py-4 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : timeOffList.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No holidays or blocked times scheduled.
              </p>
            ) : (
              <div className="space-y-2">
                {timeOffList.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {t.reason || 'Blocked Time'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatLocalDateTime(t.starts_at)} → {formatLocalDateTime(t.ends_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTimeOff(t.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                      aria-label="Remove blocked time"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

