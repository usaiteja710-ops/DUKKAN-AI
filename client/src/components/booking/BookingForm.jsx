import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { ShieldCheck } from 'lucide-react';

const formSchema = z.object({
  customer_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  customer_phone: z
    .string()
    .trim()
    .min(10, 'Please enter a valid 10-digit mobile number')
    .max(15),
  customer_email: z.string().trim().email('Please enter a valid email address'),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
  agree_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the appointment policy to proceed' }),
  }),
});

export function BookingForm({ onSubmit, isLoading = false, cancellationWindowHours = 2 }) {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: user?.full_name || '',
      customer_email: user?.email || '',
      customer_phone: user?.phone || '',
      notes: '',
      agree_terms: true,
    },
  });

  React.useEffect(() => {
    if (user) {
      reset({
        customer_name: user.full_name || '',
        customer_email: user.email || '',
        customer_phone: user.phone || '',
        notes: '',
        agree_terms: true,
      });
    }
  }, [user, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('customer_name')}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${
              errors.customer_name
                ? 'border-rose-400 dark:border-rose-600'
                : 'border-slate-300 dark:border-slate-700'
            }`}
            placeholder="e.g. Priya Rao"
          />
          {errors.customer_name && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.customer_name.message}</p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Phone Number (for SMS updates) <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            {...register('customer_phone')}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${
              errors.customer_phone
                ? 'border-rose-400 dark:border-rose-600'
                : 'border-slate-300 dark:border-slate-700'
            }`}
            placeholder="e.g. 9876543210"
          />
          {errors.customer_phone && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.customer_phone.message}</p>
          )}
        </div>
      </div>

      {/* Customer Email */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Email Address (for instant confirmation & receipt) <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          {...register('customer_email')}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${
            errors.customer_email
              ? 'border-rose-400 dark:border-rose-600'
              : 'border-slate-300 dark:border-slate-700'
          }`}
          placeholder="e.g. priya@example.com"
        />
        {errors.customer_email && (
          <p className="text-[11px] text-rose-500 mt-1">{errors.customer_email.message}</p>
        )}
      </div>

      {/* Appointment Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Special Requests or Notes (Optional)
        </label>
        <textarea
          rows={3}
          {...register('notes')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
          placeholder="Any specific requests or instructions for your specialist..."
        />
      </div>

      {/* Consent Checkbox */}
      <div className="pt-2">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            {...register('agree_terms')}
            className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            I confirm that I will arrive on time. I understand I can reschedule or cancel free of charge up to{' '}
            <strong className="text-slate-900 dark:text-slate-200">{cancellationWindowHours} hours</strong> before the appointment.
          </span>
        </label>
        {errors.agree_terms && (
          <p className="text-[11px] text-rose-500 mt-1">{errors.agree_terms.message}</p>
        )}
      </div>

      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          <ShieldCheck className="w-5 h-5 mr-2" />
          Confirm & Book Appointment
        </Button>
      </div>
    </form>
  );
}

