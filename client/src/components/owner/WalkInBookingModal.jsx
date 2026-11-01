import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { format } from 'date-fns';

const walkInSchema = z.object({
  service_id: z.string().uuid('Please select a service'),
  staff_id: z.string().uuid().optional().or(z.literal('')),
  start_time: z.string().min(1, 'Start time is required'),
  customer_name: z.string().trim().min(2, 'Name is required').max(80),
  customer_phone: z.string().trim().min(10, 'Valid 10-digit phone number is required'),
  customer_email: z.string().trim().email('Valid email is required'),
  notes: z.string().trim().max(500).optional(),
});

export function WalkInBookingModal({ isOpen, onClose, services = [], staff = [], onSuccess }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      service_id: services[0]?.id || '',
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      customer_name: '',
      customer_phone: '',
      customer_email: 'walkin@customer.local',
      notes: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      // Convert local datetime-local to UTC ISO string
      const utcStart = new Date(data.start_time).toISOString();

      await api.post('/owner/bookings', {
        ...data,
        start_time: utcStart,
        staff_id: data.staff_id || undefined,
      });

      toast.success('Walk-in booking created successfully!');
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create walk-in booking');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Walk-In Booking" maxWidth="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Service
          </label>
          <select
            {...register('service_id')}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes}m - ₹{s.price})
              </option>
            ))}
          </select>
          {errors.service_id && <p className="text-[11px] text-rose-500 mt-0.5">{errors.service_id.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assigned Specialist (Optional)
          </label>
          <select
            {...register('staff_id')}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">First Available Active Staff</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            {...register('start_time')}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.start_time && <p className="text-[11px] text-rose-500 mt-0.5">{errors.start_time.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            {...register('customer_name')}
            placeholder="Walk-in Client Name"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.customer_name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.customer_name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              {...register('customer_phone')}
              placeholder="9876543210"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.customer_phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.customer_phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('customer_email')}
              placeholder="client@mail.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.customer_email && <p className="text-[11px] text-rose-500 mt-0.5">{errors.customer_email.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            placeholder="Special requests or payment notes"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Create Walk-In
          </Button>
        </div>
      </form>
    </Modal>
  );
}

