import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Store, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Shop name must be at least 2 characters').max(120),
  category_id: z.string().uuid('Please select a category'),
  description: z.string().trim().max(1000).optional(),
  phone: z.string().trim().min(10, 'Valid 10-digit phone number is required'),
  email: z.string().trim().email().optional().or(z.literal('')),
  address_line: z.string().trim().min(2, 'Address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  slot_interval_minutes: z.coerce.number().default(30),
  min_notice_hours: z.coerce.number().default(1),
  max_advance_days: z.coerce.number().default(60),
  cancellation_window_hours: z.coerce.number().default(2),
  auto_confirm: z.boolean().default(true),

  // Initial Service Fields
  service_name: z.string().trim().min(2, 'Service name is required'),
  service_duration: z.coerce.number().min(5).max(480).default(30),
  service_price: z.coerce.number().min(0).default(299),
});

export function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);

  // Fetch categories
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      category_id: '',
      description: '',
      phone: '',
      email: '',
      address_line: '',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      timezone: 'Asia/Kolkata',
      slot_interval_minutes: 30,
      min_notice_hours: 1,
      max_advance_days: 60,
      cancellation_window_hours: 2,
      auto_confirm: true,
      service_name: 'Standard Haircut / Service',
      service_duration: 30,
      service_price: 299,
    },
  });

  const onSubmit = async (data) => {
    try {
      // 1. Create shop profile
      const shop = await api.post('/owner/shop', {
        name: data.name,
        category_id: data.category_id,
        description: data.description || '',
        phone: data.phone,
        email: data.email || undefined,
        address_line: data.address_line,
        city: data.city,
        state: data.state || '',
        timezone: data.timezone,
        slot_interval_minutes: data.slot_interval_minutes,
        min_notice_hours: data.min_notice_hours,
        max_advance_days: data.max_advance_days,
        cancellation_window_hours: data.cancellation_window_hours,
        auto_confirm: data.auto_confirm,
      });

      // 2. Add first service
      await api.post('/owner/services', {
        name: data.service_name,
        duration_minutes: data.service_duration,
        price: data.service_price,
        description: 'First service created during onboarding',
        buffer_minutes: 0,
        is_active: true,
      });

      // 3. Setup standard Monday-Saturday business hours (10:00 - 13:00, 14:00 - 20:00)
      const standardHours = [];
      for (let day = 1; day <= 6; day++) {
        standardHours.push({ day_of_week: day, open_time: '10:00:00', close_time: '13:00:00' });
        standardHours.push({ day_of_week: day, open_time: '14:00:00', close_time: '20:00:00' });
      }
      await api.put('/owner/hours', { hours: standardHours });

      // 4. Publish shop
      await api.patch('/owner/shop/publish');

      toast.success('Congratulations! Your shop is now live and published on BookWise Local.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Onboarding failed');
    }
  };

  if (catLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-xl space-y-6">
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Store className="w-4 h-4" />
            <span>Shopkeeper Setup Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Set Up Your Storefront
          </h1>
          <p className="text-xs text-slate-500">
            Provide your shop details and primary service to launch your digital booking calendar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Shop Profile Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>1. Business Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Royal Look Barber Lounge"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('category_id')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-[11px] text-rose-500 mt-1">{errors.category_id.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description (Max 1000 characters)
              </label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Highlight your specialties, sanitation standards, and experience..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shop Contact Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="e.g. Visakhapatnam, Hyderabad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.city && <p className="text-[11px] text-rose-500 mt-1">{errors.city.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('address_line')}
                placeholder="Shop No. 4, Main Road, Landmark"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.address_line && <p className="text-[11px] text-rose-500 mt-1">{errors.address_line.message}</p>}
            </div>
          </div>

          {/* First Service */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>2. Add Your First Service</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('service_name')}
                  placeholder="e.g. Haircut & Wash"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  {...register('service_duration')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  {...register('service_price')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete Onboarding & Publish Shop
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

