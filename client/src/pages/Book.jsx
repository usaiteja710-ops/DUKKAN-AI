import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BookingStepper } from '../components/booking/BookingStepper.jsx';
import { ServiceSelector } from '../components/booking/ServiceSelector.jsx';
import { SlotGrid } from '../components/booking/SlotGrid.jsx';
import { BookingForm } from '../components/booking/BookingForm.jsx';
import { BookingConfirmation } from '../components/booking/BookingConfirmation.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatCurrency, formatLocalDateTime } from '../lib/formatters.js';
import { ArrowLeft, Clock, Calendar, Check, AlertCircle } from 'lucide-react';

export function Book() {
  const { shopId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch shop details and active services
  const {
    data: shop,
    isLoading: shopLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['book-shop', shopId],
    queryFn: () => api.get(`/shops/${shopId}`),
  });

  // Pre-select service if passed in URL query
  useEffect(() => {
    const preselectedServiceId = searchParams.get('serviceId');
    if (shop?.services && preselectedServiceId) {
      const match = shop.services.find((s) => s.id === preselectedServiceId);
      if (match) {
        setSelectedService(match);
        setCurrentStep(2); // Jump to slot selection
      }
    }
  }, [shop, searchParams]);

  if (shopLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <EmptyState
          title="Shop unavailable"
          description={error?.message || 'Cannot book appointments for this shop.'}
          actionLabel="Browse shops"
          onAction={() => navigate('/shops')}
        />
      </div>
    );
  }

  // Handle final submission
  const handleBookingSubmit = async (formData) => {
    if (!selectedService || !selectedSlot) {
      toast.error('Please select a service and time slot first');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please sign in or create an account to secure your booking');
      navigate('/login', { state: { from: `/book/${shop.id}?serviceId=${selectedService.id}` } });
      return;
    }

    try {
      setSubmitting(true);
      const booking = await api.post('/bookings', {
        shop_id: shop.id,
        service_id: selectedService.id,
        staff_id: selectedSlot.staff_id || undefined,
        start_time: selectedSlot.start_time,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        notes: formData.notes || '',
      });

      setConfirmedBooking(booking);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      if (err.code === 'SLOT_TAKEN' || err.status === 409) {
        toast.error('That slot was just reserved by someone else! Please pick another time.');
        setSelectedSlot(null);
        setCurrentStep(2); // Send back to slot picker
      } else {
        toast.error(err.message || 'Failed to complete booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // If booking complete, show Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BookingConfirmation
          booking={confirmedBooking}
          shop={shop}
          service={selectedService}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (currentStep > 1) setCurrentStep((prev) => prev - 1);
            else navigate(`/shops/${shop.id}`);
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep > 1 ? 'Previous Step' : `Back to ${shop.name}`}</span>
        </button>

        <span className="text-xs text-slate-400">
          Booking with <strong>{shop.name}</strong> ({shop.city})
        </span>
      </div>

      {/* Booking Stepper */}
      <BookingStepper currentStep={currentStep} />

      {/* Selected Choices Bar */}
      {(selectedService || selectedSlot) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {selectedService && (
              <span className="font-semibold text-brand-900 dark:text-brand-200">
                Service: <strong>{selectedService.name}</strong> ({formatCurrency(selectedService.price)})
              </span>
            )}
            {selectedSlot && (
              <span className="font-semibold text-brand-900 dark:text-brand-200">
                Slot: <strong>{formatLocalDateTime(selectedSlot.start_time, shop.timezone)}</strong>
              </span>
            )}
          </div>
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="text-[11px] font-bold uppercase tracking-wider text-brand-600 hover:underline"
            >
              Change Service
            </button>
          )}
        </div>
      )}

      {/* Step 1: Select Service */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              1. Choose a Service
            </h2>
            <p className="text-xs text-slate-500">
              Select the service you wish to schedule
            </p>
          </div>

          <ServiceSelector
            services={shop.services}
            selectedServiceId={selectedService?.id}
            onSelectService={(svc) => {
              setSelectedService(svc);
              setCurrentStep(2);
            }}
          />
        </div>
      )}

      {/* Step 2: Date & Available Slots */}
      {currentStep === 2 && selectedService && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              2. Select Appointment Date & Time
            </h2>
            <p className="text-xs text-slate-500">
              Times shown are verified real-time openings in {shop.timezone}
            </p>
          </div>

          <SlotGrid
            shopId={shop.id}
            serviceId={selectedService.id}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              if (slot) setCurrentStep(3);
            }}
            maxAdvanceDays={shop.max_advance_days}
          />
        </div>
      )}

      {/* Step 3: Customer Details & Confirmation Form */}
      {currentStep === 3 && selectedService && selectedSlot && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              3. Enter Customer Details
            </h2>
            <p className="text-xs text-slate-500">
              We'll send your instant booking confirmation to this email
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <BookingForm
              onSubmit={handleBookingSubmit}
              isLoading={submitting}
              cancellationWindowHours={shop.cancellation_window_hours}
            />
          </div>
        </div>
      )}
    </div>
  );
}

