import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { User, Mail, Phone, Bell, Shield, Trash2, CheckCircle2 } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  phone: z.string().trim().min(10, 'Valid 10-digit mobile number required'),
  email_notifications: z.boolean(),
});

export function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      email_notifications: user?.email_notifications !== false,
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateProfile(data);
      toast.success('Profile preferences updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Account Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your contact details, privacy options, and notification preferences
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register('full_name')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.full_name && <p className="text-[11px] text-rose-500 mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Login Identity)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Email addresses cannot be changed directly to protect account security.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+919876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone.message}</p>}
          </div>

          {/* Email Notification & Reminder Preference */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                {...register('email_notifications')}
                className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Email Confirmations & Appointment Reminders
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  Receive immediate booking confirmation receipts and automated reminders 24 hours prior to visits.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" size="md" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>

        {/* Account Deletion & Privacy section */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Privacy & Rights</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You can request complete erasure of your personal data, chat transcripts, and upcoming bookings in compliance with the DPDP Act 2023.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link to="/data-deletion">
              <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Data Deletion Request
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

