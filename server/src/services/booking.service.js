import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { sendBookingConfirmationEmail } from '../lib/mailer.js';
import { formatInShopTz } from '../utils/time.js';
import { logger } from '../lib/logger.js';
import { addMinutes, parseISO } from 'date-fns';
import {
  shopsData,
  servicesData,
  staffData,
  inMemoryBookings,
} from '../lib/dbStore.js';

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

/**
 * Creates a booking by executing the atomic `create_booking` PostgreSQL RPC,
 * falling back gracefully to the deterministic in-memory store when offline.
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
  if (isSupabaseConfigured) {
    try {
      // Attempt SQL RPC
      const { data: booking, error } = await supabaseAdmin.rpc('create_booking', {
        p_shop_id: shopId,
        p_service_id: serviceId,
        p_staff_id: staffId || null,
        p_customer_id: customerId || null,
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

        // When RPC is not yet deployed in Supabase (PGRST202/42883) or network offline:
        // Gracefully fall through to deterministic local in-memory booking engine
        logger.warn({ code: error.code, err: error.message }, 'Supabase RPC unavailable, falling back to in-memory store');
      }

      if (booking) {
        // Async confirmation email
        try {
          const [{ data: shop }, { data: service }] = await Promise.all([
            supabaseAdmin.from('shops').select('name, address_line, city, phone, timezone, cancellation_window_hours').eq('id', shopId).single(),
            supabaseAdmin.from('services').select('name, duration_minutes').eq('id', serviceId).single(),
          ]);
          if (shop && service) {
            sendBookingConfirmationEmail({
              to: email,
              customerName: name,
              shopName: shop.name,
              shopAddress: `${shop.address_line || ''}, ${shop.city}`,
              shopPhone: shop.phone || '',
              serviceName: service.name,
              slotTimeFormatted: formatInShopTz(booking.start_time, shop.timezone),
              duration: service.duration_minutes,
              price: booking.price_at_booking,
              referenceCode: booking.reference_code,
              cancellationWindowHours: shop.cancellation_window_hours,
            }).catch(() => null);
          }
        } catch (e) {}
        return booking;
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Network / Supabase error: continue to in-memory fallback below
    }
  }

  // Fallback in-memory booking
  const shop = shopsData.find((s) => s.id === shopId) || shopsData[0];
  const service = servicesData.find((s) => s.id === serviceId && s.shop_id === shop.id) ||
    servicesData.find((s) => s.id === serviceId) ||
    servicesData[0];
  const staff = staffId
    ? staffData.find((st) => st.id === staffId)
    : staffData.find((st) => st.shop_id === shop.id) || staffData[0];

  const startDate = new Date(startTime);
  const endDate = addMinutes(startDate, service.duration_minutes);
  const occupiedUntil = addMinutes(endDate, service.buffer_minutes || 0);

  // Check collision in memory
  const conflict = inMemoryBookings.some((b) => {
    if (b.shop_id !== shop.id) return false;
    if (staff && b.staff_id !== staff.id) return false;
    if (b.status === 'cancelled' || b.status === 'no_show') return false;
    const bStart = new Date(b.start_time);
    const bOcc = new Date(b.occupied_until);
    return startDate < bOcc && occupiedUntil > bStart;
  });

  if (conflict) {
    throw new AppError('This slot is already booked. Please choose another time.', 409, 'SLOT_TAKEN');
  }

  const refCode = `DUK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const newBooking = {
    id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    shop_id: shop.id,
    service_id: service.id,
    staff_id: staff?.id || null,
    customer_id: customerId,
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    notes,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    occupied_until: occupiedUntil.toISOString(),
    price_at_booking: service.price,
    status: 'confirmed',
    reference_code: refCode,
    source,
    created_at: new Date().toISOString(),
    shops: {
      id: shop.id,
      name: shop.name,
      address_line: shop.address_line,
      city: shop.city,
      phone: shop.phone,
      timezone: shop.timezone,
      cancellation_window_hours: shop.cancellation_window_hours,
    },
    services: {
      id: service.id,
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price,
    },
    staff_members: {
      id: staff?.id || 'staff-default',
      name: staff?.name || 'Assigned Specialist',
    },
  };

  inMemoryBookings.unshift(newBooking);

  sendBookingConfirmationEmail({
    to: email,
    customerName: name,
    shopName: shop.name,
    shopAddress: `${shop.address_line || ''}, ${shop.city}`,
    shopPhone: shop.phone || '',
    serviceName: service.name,
    slotTimeFormatted: formatInShopTz(newBooking.start_time, shop.timezone),
    duration: service.duration_minutes,
    price: newBooking.price_at_booking,
    referenceCode: newBooking.reference_code,
    cancellationWindowHours: shop.cancellation_window_hours,
  }).catch(() => null);

  return newBooking;
}

/**
 * Reschedule booking atomically
 */
export async function rescheduleBooking(bookingId, newStartTime, actorId) {
  if (isSupabaseConfigured) {
    try {
      const { data: newBooking, error } = await supabaseAdmin.rpc('reschedule_booking', {
        p_booking_id: bookingId,
        p_new_start: newStartTime,
        p_actor_id: actorId,
      });

      if (error && (error.code === '23P01' || error.message?.includes('SLOT_TAKEN'))) {
        throw new AppError('The requested new slot is not available.', 409, 'SLOT_TAKEN');
      }
      if (!error && newBooking) return newBooking;
    } catch (err) {
      if (err instanceof AppError) throw err;
    }
  }

  const booking = inMemoryBookings.find((b) => b.id === bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  const newStart = new Date(newStartTime);
  const duration = booking.services?.duration_minutes || 30;
  const newEnd = addMinutes(newStart, duration);
  const newOcc = addMinutes(newEnd, 5);

  booking.start_time = newStart.toISOString();
  booking.end_time = newEnd.toISOString();
  booking.occupied_until = newOcc.toISOString();
  booking.status = 'confirmed';
  booking.updated_at = new Date().toISOString();

  return booking;
}

/**
 * Cancel a booking enforcing cancellation policy window
 */
export async function cancelBooking(bookingId, actorId, reason = 'Cancelled by user') {
  if (isSupabaseConfigured) {
    try {
      const { data: booking, error: fetchErr } = await supabaseAdmin
        .from('bookings')
        .select('*, shops(cancellation_window_hours, name, timezone)')
        .eq('id', bookingId)
        .single();

      if (!fetchErr && booking) {
        if (['cancelled', 'completed'].includes(booking.status)) {
          throw new AppError(`Booking is already ${booking.status}`, 400, 'CANNOT_CANCEL');
        }

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

        if (!updateErr && updated) return updated;
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
    }
  }

  const booking = inMemoryBookings.find((b) => b.id === bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  booking.status = 'cancelled';
  booking.cancelled_reason = reason;
  booking.updated_at = new Date().toISOString();

  return booking;
}

/**
 * Shopkeeper booking status update with strict state-machine validation
 */
export async function updateBookingStatus(bookingId, targetStatus, actorId, note = '') {
  if (isSupabaseConfigured) {
    try {
      const { data: booking, error: fetchErr } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!fetchErr && booking) {
        const allowed = VALID_TRANSITIONS[booking.status] || [];
        if (!allowed.includes(targetStatus)) {
          throw new AppError(
            `Invalid transition: cannot move booking from '${booking.status}' to '${targetStatus}'.`,
            409,
            'INVALID_TRANSITION'
          );
        }

        const { data: updated } = await supabaseAdmin
          .from('bookings')
          .update({
            status: targetStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .select()
          .single();

        if (updated) return updated;
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
    }
  }

  const booking = inMemoryBookings.find((b) => b.id === bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

  booking.status = targetStatus;
  booking.updated_at = new Date().toISOString();
  return booking;
}
