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
import { formatCurrency } from '../../lib/formatters.js';
import { Sparkles, Plus, Clock, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().trim().max(1000).optional(),
  duration_minutes: z.coerce.number().min(5, 'Minimum 5 minutes').max(480, 'Maximum 480 minutes'),
  buffer_minutes: z.coerce.number().min(0).max(60).default(0),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  is_active: z.boolean().default(true),
});

export function Services() {
  const toast = useToast();
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [editingService, setEditingService] = useState(null);

  const {
    data: services = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['owner-services'],
    queryFn: () => api.get('/owner/services'),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 30,
      buffer_minutes: 5,
      price: 299,
      is_active: true,
    },
  });

  const openCreateModal = () => {
    reset({
      name: '',
      description: '',
      duration_minutes: 30,
      buffer_minutes: 0,
      price: 299,
      is_active: true,
    });
    setEditingService(null);
    setModalMode('create');
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    reset({
      name: svc.name,
      description: svc.description || '',
      duration_minutes: svc.duration_minutes,
      buffer_minutes: svc.buffer_minutes || 0,
      price: Number(svc.price),
      is_active: svc.is_active,
    });
    setModalMode('edit');
  };

  const onSubmit = async (data) => {
    try {
      if (modalMode === 'create') {
        await api.post('/owner/services', data);
        toast.success('Service created successfully!');
      } else if (modalMode === 'edit') {
        await api.patch(`/owner/services/${editingService.id}`, data);
        toast.success('Service updated successfully!');
      }
      setModalMode(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete or deactivate this service?')) return;
    try {
      await api.delete(`/owner/services/${serviceId}`);
      toast.success('Service updated/removed');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to remove service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Services & Pricing Menu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure the offerings, durations, buffer times, and rates displayed to customers
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Service
        </Button>
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No services added yet"
          description="Add your first service to enable customers to schedule appointments."
          actionLabel="Create Service"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                svc.is_active
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {svc.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      svc.is_active
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {svc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {svc.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {svc.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    {svc.duration_minutes} mins
                  </span>
                  {svc.buffer_minutes > 0 && (
                    <span>(+{svc.buffer_minutes}m buffer)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(svc.price)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(svc)}
                    className="p-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(svc.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Modal (Create & Edit) */}
      <Modal
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Add New Service' : 'Edit Service'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Classic Haircut"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              {...register('description')}
              placeholder="Details on what this service includes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                {...register('duration_minutes')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.duration_minutes && <p className="text-[11px] text-rose-500 mt-1">{errors.duration_minutes.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Buffer (Mins)
              </label>
              <input
                type="number"
                {...register('buffer_minutes')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.buffer_minutes && <p className="text-[11px] text-rose-500 mt-1">{errors.buffer_minutes.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price (₹ INR)
              </label>
              <input
                type="number"
                {...register('price')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.price && <p className="text-[11px] text-rose-500 mt-1">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active & Visible for Bookings
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalMode(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Service' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

