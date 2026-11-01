import React from 'react';
import { Calendar, DollarSign, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatCurrency } from '../../lib/formatters.js';

export function ConfirmationCard({ confirmation, onConfirm, onCancel, isLoading = false }) {
  if (!confirmation) return null;

  return (
    <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 my-3 text-left shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <span>Please Confirm Your Booking Details</span>
      </div>

      <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
        <div className="font-semibold text-sm text-slate-900 dark:text-white">
          {confirmation.shop_name}
        </div>
        <div>
          <span className="text-slate-500">Service:</span>{' '}
          <strong className="text-slate-900 dark:text-slate-100">{confirmation.service_name}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{confirmation.when_label}</span>
        </div>
        {confirmation.price !== undefined && (
          <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-semibold">
            <span>Price:</span> {formatCurrency(confirmation.price)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button
          size="sm"
          variant="primary"
          onClick={() => onConfirm(confirmation.token)}
          isLoading={isLoading}
          className="flex-1"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Confirm Appointment
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Change
        </Button>
      </div>
    </div>
  );
}

