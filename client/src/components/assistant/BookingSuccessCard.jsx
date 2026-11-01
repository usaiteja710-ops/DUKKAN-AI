import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../ui/Button.jsx';

export function BookingSuccessCard({ booking }) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // safe fallback
    }
  }, []);

  if (!booking) return null;

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 my-3 text-left shadow-sm">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm mb-1.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <span>Booking Confirmed!</span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300">
        Reference Code:{' '}
        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm tracking-wider">
          {booking.reference_code}
        </span>
      </p>

      <p className="text-[11px] text-slate-500 mt-2">
        A confirmation has been recorded and an email notification sent. You can reschedule or cancel anytime up to 2 hours before the start time.
      </p>

      <div className="mt-3">
        <Link to="/my-bookings">
          <Button size="sm" variant="outline" className="w-full text-xs">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            View in My Bookings <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

