import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, MapPin, ArrowRight, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../ui/Button.jsx';
import { formatCurrency, formatLocalDateTime } from '../../lib/formatters.js';

export function BookingConfirmation({ booking, shop, service }) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 animate-slide-up">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Booking Confirmed!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your appointment has been reserved. A confirmation email has been dispatched.
        </p>
      </div>

      {/* Reference Code Ticket */}
      <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-center">
        <span className="text-[11px] uppercase tracking-wider text-brand-700 dark:text-brand-300 font-bold">
          Appointment Reference Code
        </span>
        <div className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-brand-600 dark:text-brand-400 mt-1">
          {booking.reference_code}
        </div>
      </div>

      {/* Summary Details Card */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs sm:text-sm">
        <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Shop</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{shop?.name}</span>
        </div>

        <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Service</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{service?.name}</span>
        </div>

        <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Date & Time</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatLocalDateTime(booking.start_time, shop?.timezone)}
          </span>
        </div>

        <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Duration</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {service?.duration_minutes} minutes
          </span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-slate-500 font-medium">Amount to Pay at Shop</span>
          <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {formatCurrency(booking.price_at_booking)}
          </span>
        </div>
      </div>

      {/* Location reminder */}
      <div className="flex items-start gap-2.5 text-xs text-slate-500 text-left p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Address:</strong> {shop?.address_line}, {shop?.city} • Ph: {shop?.phone}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 no-print">
        <Link to="/my-bookings" className="w-full sm:flex-1">
          <Button size="md" variant="primary" className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Go to My Bookings
          </Button>
        </Link>
        <Button size="md" variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
          <Printer className="w-4 h-4 mr-1.5" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}

