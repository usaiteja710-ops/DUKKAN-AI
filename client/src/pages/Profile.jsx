import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { User, Mail, Phone, Bell, Shield, Trash2, Camera, CheckCircle2, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
];

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  phone: z.string().trim().min(10, 'Valid 10-digit mobile number required'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  email_notifications: z.boolean(),
});

export function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const toast = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || AVATAR_OPTIONS[0]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      avatar_url: user?.avatar_url || AVATAR_OPTIONS[0],
      email_notifications: user?.email_notifications !== false,
    },
  });

  // Keep form reactive when user loads or updates
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || selectedAvatar,
        email_notifications: user.email_notifications !== false,
      });
      if (user.avatar_url) setSelectedAvatar(user.avatar_url);
    }
  }, [user, reset]);

  const handleSelectAvatar = (url) => {
    setSelectedAvatar(url);
    setValue('avatar_url', url, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      await updateProfile({
        ...data,
        avatar_url: selectedAvatar,
      });
      toast.success('Profile preferences & photo updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-dukkan-azure/10 dark:bg-dukkan-azure/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-dukkan-plum/10 dark:bg-dukkan-plum/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-dukkan-azure dark:text-dukkan-sky flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> DUKKAN AI User Profile
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Account Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal contact details, choose your profile photo, and set booking notifications.
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8">
          {/* Avatar Selector Section */}
          <div className="space-y-3 pb-6 border-b border-slate-200/60 dark:border-white/10">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Profile Avatar & Photo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <img
                  src={selectedAvatar}
                  alt="Current Profile Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white/60 dark:border-dukkan-azure/40 shadow-glass-hover"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose an avatar from our curated gallery or paste a custom image URL:
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  {AVATAR_OPTIONS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAvatar(url)}
                      className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedAvatar === url
                          ? 'border-dukkan-azure scale-110 shadow-glass-glow'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-dukkan-azure/30 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                {...register('full_name')}
                placeholder="e.g. Priya Rao"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm outline-none"
              />
              {errors.full_name && <p className="text-[11px] text-rose-500 mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address (Account Identity)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 text-sm bg-slate-100/60 dark:bg-white/5 text-slate-400 cursor-not-allowed outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Primary email cannot be edited directly to protect your booking security.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number (For Booking SMS/WhatsApp confirmations)
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+919876543210"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm outline-none"
              />
              {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Email Notification & Reminder Preference */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  {...register('email_notifications')}
                  className="mt-0.5 w-4 h-4 rounded text-dukkan-azure focus:ring-dukkan-azure border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    Email Confirmations & Appointment Reminders
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Receive immediate booking receipts and automated reminder notices 24 hours prior to visits.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                size="md"
                isLoading={isSubmitting}
                className="w-full sm:w-auto px-8 bg-gradient-to-r from-dukkan-navy to-dukkan-azure text-white shadow-glass-glow"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>

          {/* Account Deletion & Privacy section */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-dukkan-azure" />
              <span>Privacy & Legal Rights</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              In accordance with the Digital Personal Data Protection (DPDP) Act 2023, you have full ownership over your personal data. You can request irreversible data erasure anytime.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Link to="/data-deletion">
                <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50">
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
    </div>
  );
}
