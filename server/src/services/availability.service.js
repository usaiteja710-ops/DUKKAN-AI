import { addMinutes, isBefore, isAfter, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatZoned } from 'date-fns-tz';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { DEFAULT_TIMEZONE, formatSlotTime } from '../utils/time.js';

/**
 * Pure function: Computes available time slots given shop, service, staff, hours, timeOff, and existing bookings.
 * Fully deterministic and unit-testable.
 *
 * @param {Object} params
 * @param {Object} params.shop - Shop settings (timezone, slot_interval_minutes, min_notice_hours, max_advance_days)
 * @param {Object} params.service - Service settings (duration_minutes, buffer_minutes, price)
 * @param {Array<Object>} params.staffMembers - Array of active staff { id, name, is_default }
 * @param {Array<Object>} params.businessHours - Array of { day_of_week, open_time, close_time }
 * @param {Array<Object>} params.timeOffList - Array of { staff_id, starts_at, ends_at }
 * @param {Array<Object>} params.existingBookings - Array of { staff_id, start_time, occupied_until, status }
 * @param {string} params.targetDate - YYYY-MM-DD
 * @param {string} [params.requestedStaffId] - Optional specific staff ID filter
 * @param {Date} [params.currentDateTime] - Reference "now" (defaults to new Date())
 * @returns {Array<{ start_time: string, end_time: string, occupied_until: string, label: string, staff_id: string, staff_name: string }>}
 */
export function computeAvailableSlots({
  shop,
  service,
  staffMembers = [],
  businessHours = [],
  timeOffList = [],
  existingBookings = [],
  targetDate,
  requestedStaffId = null,
  currentDateTime = new Date(),
}) {
  const timeZone = shop.timezone || DEFAULT_TIMEZONE;
  const intervalMinutes = shop.slot_interval_minutes || 30;
  const minNoticeHours = shop.min_notice_hours ?? 1;
  const maxAdvanceDays = shop.max_advance_days ?? 60;
  const serviceDuration = service.duration_minutes;
  const serviceBuffer = service.buffer_minutes || 0;

  // Filter staff members
  let eligibleStaff = staffMembers.filter((s) => s.is_active !== false);
  if (requestedStaffId) {
    eligibleStaff = eligibleStaff.filter((s) => s.id === requestedStaffId);
  }
  if (eligibleStaff.length === 0) {
    return [];
  }

  // Parse target date in shop's timezone
  // targetDate is 'YYYY-MM-DD'. A reference noon date in local timezone:
  const localNoon = new Date(`${targetDate}T12:00:00`);
  // Get day of week in shop timezone (0 = Sunday, ... 6 = Saturday)
  const zonedNoon = toZonedTime(localNoon, timeZone);
  const dayOfWeek = zonedNoon.getDay();

  // Find business hours for this day of week
  const dayHours = businessHours
    .filter((h) => h.day_of_week === dayOfWeek)
    .sort((a, b) => a.open_time.localeCompare(b.open_time));

  if (dayHours.length === 0) {
    return []; // Closed on this day
  }

  const noticeThreshold = addMinutes(currentDateTime, minNoticeHours * 60);
  const maxAdvanceThreshold = addMinutes(currentDateTime, maxAdvanceDays * 24 * 60);

  const availableSlotsMap = new Map(); // key: start_time ISO -> slot object

  // Normalize existing bookings (only active pending or confirmed)
  const activeBookings = existingBookings
    .filter((b) => ['pending', 'confirmed'].includes(b.status))
    .map((b) => ({
      staff_id: b.staff_id,
      startsAt: typeof b.start_time === 'string' ? parseISO(b.start_time) : b.start_time,
      occupiedUntil: typeof b.occupied_until === 'string' ? parseISO(b.occupied_until) : b.occupied_until,
    }));

  // Normalize time off
  const normalizedTimeOff = timeOffList.map((t) => ({
    staff_id: t.staff_id,
    startsAt: typeof t.starts_at === 'string' ? parseISO(t.starts_at) : t.starts_at,
    endsAt: typeof t.ends_at === 'string' ? parseISO(t.ends_at) : t.ends_at,
  }));

  for (const window of dayHours) {
    // Construct local window start and end
    // open_time / close_time format: "HH:MM:SS" or "HH:MM"
    const openTimeParts = window.open_time.split(':');
    const closeTimeParts = window.close_time.split(':');

    const openHour = parseInt(openTimeParts[0], 10);
    const openMinute = parseInt(openTimeParts[1], 10);
    const closeHour = parseInt(closeTimeParts[0], 10);
    const closeMinute = parseInt(closeTimeParts[1], 10);

    // Convert local window time to UTC Date
    const localStartStr = `${targetDate}T${String(openHour).padStart(2, '0')}:${String(openMinute).padStart(2, '0')}:00`;
    const localEndStr = `${targetDate}T${String(closeHour).padStart(2, '0')}:${String(closeMinute).padStart(2, '0')}:00`;

    const windowStartUtc = fromZonedTime(localStartStr, timeZone);
    const windowEndUtc = fromZonedTime(localEndStr, timeZone);

    let candidateStartUtc = new Date(windowStartUtc.getTime());

    while (true) {
      const candidateEndUtc = addMinutes(candidateStartUtc, serviceDuration);
      const candidateOccupiedUntilUtc = addMinutes(candidateEndUtc, serviceBuffer);

      // Must fit fully within the business hours window
      if (candidateOccupiedUntilUtc > windowEndUtc) {
        break;
      }

      // Check min notice & max advance
      if (isAfter(candidateStartUtc, noticeThreshold) && isBefore(candidateStartUtc, maxAdvanceThreshold)) {
        // Find first eligible staff member free during [candidateStartUtc, candidateOccupiedUntilUtc)
        for (const staff of eligibleStaff) {
          // Check time off overlap: max(start1, start2) < min(end1, end2)
          const hasTimeOff = normalizedTimeOff.some((to) => {
            if (to.staff_id && to.staff_id !== staff.id) return false;
            return Math.max(candidateStartUtc.getTime(), to.startsAt.getTime()) <
                   Math.min(candidateOccupiedUntilUtc.getTime(), to.endsAt.getTime());
          });

          if (hasTimeOff) continue;

          // Check booking overlap: max(start1, start2) < min(end1, end2)
          const hasBookingConflict = activeBookings.some((b) => {
            if (b.staff_id !== staff.id) return false;
            return Math.max(candidateStartUtc.getTime(), b.startsAt.getTime()) <
                   Math.min(candidateOccupiedUntilUtc.getTime(), b.occupiedUntil.getTime());
          });

          if (!hasBookingConflict) {
            const isoKey = candidateStartUtc.toISOString();
            if (!availableSlotsMap.has(isoKey)) {
              availableSlotsMap.set(isoKey, {
                start_time: candidateStartUtc.toISOString(),
                end_time: candidateEndUtc.toISOString(),
                occupied_until: candidateOccupiedUntilUtc.toISOString(),
                label: formatSlotTime(candidateStartUtc, timeZone),
                staff_id: staff.id,
                staff_name: staff.name,
              });
            }
            break; // Staff assigned for this slot
          }
        }
      }

      // Step by slot interval
      candidateStartUtc = addMinutes(candidateStartUtc, intervalMinutes);
    }
  }

  // Return slots sorted chronologically
  return Array.from(availableSlotsMap.values()).sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}

/**
 * Service function: Fetches database entities and returns availability for a date.
 */
export async function getShopAvailability(shopId, serviceId, targetDate, requestedStaffId = null) {
  // 1. Fetch shop
  const { data: shop, error: shopErr } = await supabaseAdmin
    .from('shops')
    .select('id, timezone, slot_interval_minutes, min_notice_hours, max_advance_days, status')
    .eq('id', shopId)
    .single();

  if (shopErr || !shop) {
    throw new AppError('Shop not found', 404, 'SHOP_NOT_FOUND');
  }
  if (shop.status !== 'published') {
    throw new AppError('Shop is currently not accepting bookings', 400, 'SHOP_NOT_AVAILABLE');
  }

  // 2. Fetch service
  const { data: service, error: servErr } = await supabaseAdmin
    .from('services')
    .select('id, duration_minutes, buffer_minutes, price, is_active')
    .eq('id', serviceId)
    .eq('shop_id', shopId)
    .single();

  if (servErr || !service || !service.is_active) {
    throw new AppError('Service is not active or does not exist', 404, 'SERVICE_NOT_FOUND');
  }

  // 3. Fetch staff
  const { data: staffMembers } = await supabaseAdmin
    .from('staff_members')
    .select('id, name, is_default, is_active')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('is_default', { ascending: false });

  // 4. Fetch business hours
  const { data: businessHours } = await supabaseAdmin
    .from('business_hours')
    .select('day_of_week, open_time, close_time')
    .eq('shop_id', shopId);

  // 5. Fetch time off overlapping the target date
  const startOfDayUtc = fromZonedTime(`${targetDate}T00:00:00`, shop.timezone);
  const endOfDayUtc = fromZonedTime(`${targetDate}T23:59:59`, shop.timezone);

  const { data: timeOffList } = await supabaseAdmin
    .from('time_off')
    .select('staff_id, starts_at, ends_at')
    .eq('shop_id', shopId)
    .lte('starts_at', endOfDayUtc.toISOString())
    .gte('ends_at', startOfDayUtc.toISOString());

  // 6. Fetch existing bookings for this shop on the target date
  const { data: existingBookings } = await supabaseAdmin
    .from('bookings')
    .select('staff_id, start_time, occupied_until, status')
    .eq('shop_id', shopId)
    .in('status', ['pending', 'confirmed'])
    .lte('start_time', endOfDayUtc.toISOString())
    .gte('occupied_until', startOfDayUtc.toISOString());

  return computeAvailableSlots({
    shop,
    service,
    staffMembers: staffMembers || [],
    businessHours: businessHours || [],
    timeOffList: timeOffList || [],
    existingBookings: existingBookings || [],
    targetDate,
    requestedStaffId,
  });
}

