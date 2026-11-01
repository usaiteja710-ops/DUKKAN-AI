import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { sendBookingConfirmationEmail } from '../lib/mailer.js';
import { formatInShopTz } from '../utils/time.js';
import { logger } from '../lib/logger.js';
import { addMinutes, parseISO } from 'date-fns';

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

/**
 * Creates a booking by executing the atomic `create_booking` PostgreSQL RPC.
 */
export async function createBooking({
  shopId,
  serviceId,
  staffId = null,
  customerId = null,
  name,
  phone,
  email,
  notes = '',
  startTime,
  source = 'web',
}) {
  // Call the atomic SQL RPC
  const { data: booking, error } = await supabaseAdmin.rpc('create_booking', {
    p_shop_id: shopId,
    p_service_id: serviceId,
    p_staff_id: staffId,
    p_customer_id: customerId,
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_notes: notes,
    p_start: startTime,
    p_source: source,
  });

  if (error) {
    if (error.code === '23P01' || error.message?.includes('SLOT_TAKEN')) {
      throw new AppError('This slot is already booked. Please choose another time.', 409, 'SLOT_TAKEN');
    }
    if (error.message?.includes('SLOT_BLOCKED')) {
      throw new AppError('This time slot is blocked or falls on a scheduled break.', 409, 'SLOT_BLOCKED');
    }
    if (error.message?.includes('TOO_SOON')) {
      throw new AppError('Appointment cannot be booked on such short notice.', 400, 'TOO_SOON');
    }
    if (error.message?.includes('TOO_FAR')) {
      throw new AppError('Appointment is too far in advance.', 400, 'TOO_FAR');
    }
    throw new AppError(error.message || 'Failed to create booking', 400, error.code || 'BOOKING_FAILED');
  }

  // Fetch shop & service details for the confirmation email
  try {
    const [{ data: shop }, { data: service }] = await Promise.all([
      supabaseAdmin.from('shops').select('name, address_line, city, phone, timezone, cancellation_window_hours').eq('id', shopId).single(),
      supabaseAdmin.from('services').select('name, duration_minutes').eq('id', serviceId).single(),
    ]);

    if (shop && service) {
      const slotTimeFormatted = formatInShopTz(booking.start_time, shop.timezone);
      sendBookingConfirmationEmail({
        to: email,
        customerName: name,
        shopName: shop.name,
        shopAddress: `${shop.address_line || ''}, ${shop.city}`,
        shopPhone: shop.phone || '',
        serviceName: service.name,
        slotTimeFormatted,
        duration: service.duration_minutes,
        price: booking.price_at_booking,
        referenceCode: booking.reference_code,
        cancellationWindowHours: shop.cancellation_window_hours,
      }).catch((err) => logger.error({ err }, 'Async email dispatch failed'));
    }
  } catch (emailErr) {
    logger.warn({ emailErr }, 'Failed to fetch details for confirmation email');
  }

  return booking;
}

/**
 * Reschedule booking atomically using SQL RPC
 */
export async function rescheduleBooking(bookingId, newStartTime, actorId) {
  const { data: newBooking, error } = await supabaseAdmin.rpc('reschedule_booking', {
    p_booking_id: bookingId,
    p_new_start: newStartTime,
    p_actor_id: actorId,
  });

  if (error) {
    if (error.code === '23P01' || error.message?.includes('SLOT_TAKEN')) {
      throw new AppError('The requested new slot is not available.', 409, 'SLOT_TAKEN');
    }
    if (error.message?.includes('INSIDE_CANCELLATION_WINDOW')) {
      throw new AppError('Cannot reschedule inside the cancellation policy window.', 400, 'INSIDE_CANCELLATION_WINDOW');
    }
    throw new AppError(error.message || 'Failed to reschedule booking', 400, error.code || 'RESCHEDULE_FAILED');
  }

  return newBooking;
}

/**
 * Cancel a booking enforcing cancellation policy window
 */
export async function cancelBooking(bookingId, actorId, reason = 'Cancelled by user') {
  // 1. Fetch booking with shop policy
  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('*, shops(cancellation_window_hours, name, timezone)')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (['cancelled', 'completed'].includes(booking.status)) {
    throw new AppError(`Booking is already ${booking.status}`, 400, 'CANNOT_CANCEL');
  }

  // 2. Check cancellation policy window
  const windowHours = booking.shops?.cancellation_window_hours ?? 2;
  const now = new Date();
  const startTime = new Date(booking.start_time);
  const cutoffTime = new Date(startTime.getTime() - windowHours * 60 * 60 * 1000);

  if (now > cutoffTime) {
    throw new AppError(
      `Cannot cancel within ${windowHours} hours of appointment start time.`,
      400,
      'INSIDE_CANCELLATION_WINDOW'
    );
  }

  // 3. Update status
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateErr) {
    throw new AppError('Failed to cancel booking', 400, 'UPDATE_FAILED');
  }

  // 4. Log event
  await supabaseAdmin.from('booking_events').insert({
    booking_id: bookingId,
    actor_id: actorId,
    from_status: booking.status,
    to_status: 'cancelled',
    note: reason,
  });

  return updated;
}

/**
 * Shopkeeper booking status update with strict state-machine validation
 */
export async function updateBookingStatus(bookingId, targetStatus, actorId, note = '') {
  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  const currentStatus = booking.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    throw new AppError(
      `Invalid transition: cannot move booking from '${currentStatus}' to '${targetStatus}'.`,
      409,
      'INVALID_TRANSITION'
    );
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateErr) {
    throw new AppError('Failed to update booking status', 400, 'UPDATE_FAILED');
  }

  await supabaseAdmin.from('booking_events').insert({
    booking_id: bookingId,
    actor_id: actorId,
    from_status: currentStatus,
    to_status: targetStatus,
    note: note || `Status changed from ${currentStatus} to ${targetStatus}`,
  });

  return updated;
}

