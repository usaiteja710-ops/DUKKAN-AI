import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { UserCheck, Plus, Check, Star } from 'lucide-react';

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export function Staff() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: staffList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: () => api.get('/owner/staff'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      is_default: false,
      is_active: true,
    },
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/owner/staff', data);
      toast.success('Staff specialist added successfully!');
      setIsModalOpen(false);
      reset();
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to add staff');
    }
  };

  const handleToggleActive = async (staffMember) => {
    try {
      await api.patch(`/owner/staff/${staffMember.id}`, {
        is_active: !staffMember.is_active,
      });
      toast.success(
        `Staff specialist ${staffMember.is_active ? 'deactivated' : 'activated'}`
      );
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update staff status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Staff & Specialists
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your shop's stylists, technicians, or specialists and assign individual schedules
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No staff members listed"
          description="Add your first staff specialist to assign client bookings."
          actionLabel="Add Staff"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((member) => (
            <div
              key={member.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                member.is_active
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {member.name}
                      </h4>
                      {member.is_default && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                          Primary Specialist
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-xs">
                <span
                  className={`font-semibold ${
                    member.is_active ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {member.is_active ? 'Accepting Appointments' : 'Inactive'}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(member)}
                  className="text-xs py-1 px-2.5"
                >
                  {member.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Staff Member"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Staff Specialist Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_default')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Set as Primary / Default Staff Member
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active & Free for Booking
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Add Specialist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

