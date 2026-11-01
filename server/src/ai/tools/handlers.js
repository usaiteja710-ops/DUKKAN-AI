import { searchShops, getShopDetail } from '../../services/shop.service.js';
import { getShopAvailability } from '../../services/availability.service.js';
import { createBooking, rescheduleBooking, cancelBooking } from '../../services/booking.service.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { createConfirmationToken, consumeConfirmationToken } from '../confirmation.js';
import { formatInShopTz, formatSlotTime } from '../../utils/time.js';
import { logger } from '../../lib/logger.js';
import {
  searchShopsToolSchema,
  getShopInfoToolSchema,
  checkAvailabilityToolSchema,
  prepareBookingToolSchema,
  createBookingToolSchema,
  listMyBookingsToolSchema,
  prepareRescheduleToolSchema,
  rescheduleBookingToolSchema,
  prepareCancelToolSchema,
  cancelBookingToolSchema,
} from '../../validators/assistant.schema.js';

export async function executeTool(name, rawArgs, context) {
  const { user, uiAccumulator } = context;

  logger.info({ tool: name, userId: user?.id }, 'Executing AI tool call');

  try {
    switch (name) {
      case 'search_shops': {
        const args = searchShopsToolSchema.parse(rawArgs);
        const { shops } = await searchShops({
          q: args.query || '',
          category: args.category_slug || '',
          city: args.city || '',
          minRating: args.min_rating || 0,
          limit: 5,
        });

        // Push to uiAccumulator
        uiAccumulator.shops = shops.map((s) => ({
          shop_id: s.id,
          name: s.name,
          category: s.categories?.name,
          rating: Number(s.rating_avg),
          city: s.city,
          address: s.address_line,
        }));

        return {
          ok: true,
          count: shops.length,
          shops: shops.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.categories?.name,
            city: s.city,
            rating: s.rating_avg,
            address: s.address_line,
            description: s.description,
          })),
        };
      }

      case 'get_shop_info': {
        const args = getShopInfoToolSchema.parse(rawArgs);
        const shop = await getShopDetail(args.shop_id);

        return {
          ok: true,
          id: shop.id,
          name: shop.name,
          description: shop.description,
          address: `${shop.address_line || ''}, ${shop.city}, ${shop.state || ''}`,
          phone: shop.phone,
          cancellation_window_hours: shop.cancellation_window_hours,
          timezone: shop.timezone,
          services: shop.services.map((svc) => ({
            id: svc.id,
            name: svc.name,
            duration_minutes: svc.duration_minutes,
            price: svc.price,
            description: svc.description,
          })),
          hours: shop.business_hours.map((h) => ({
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
          })),
        };
      }

      case 'check_availability': {
        const args = checkAvailabilityToolSchema.parse(rawArgs);
        let slots = await getShopAvailability(args.shop_id, args.service_id, args.date);

        // Filter by time window if specified
        if (args.time_window && args.time_window !== 'any') {
          slots = slots.filter((s) => {
            const hour = new Date(s.start_time).getUTCHours();
            // Note: rough UTC check or local label check
            if (args.time_window === 'morning') return s.label.includes('AM');
            if (args.time_window === 'afternoon') {
              const h = parseInt(s.label.split(':')[0], 10);
              return s.label.includes('PM') && (h === 12 || h < 5);
            }
            if (args.time_window === 'evening') {
              const h = parseInt(s.label.split(':')[0], 10);
              return s.label.includes('PM') && (h >= 5 && h <= 9);
            }
            return true;
          });
        }

        // Limit to max 5 slots
        const topSlots = slots.slice(0, 5);

        uiAccumulator.slots = topSlots.map((s) => ({
          start_time: s.start_time,
          label: s.label,
        }));

        return {
          ok: true,
          date: args.date,
          available_slot_count: slots.length,
          slots: topSlots.map((s) => ({
            start_time: s.start_time,
            end_time: s.end_time,
            time_label: s.label,
          })),
        };
      }

      case 'prepare_booking': {
        const args = prepareBookingToolSchema.parse(rawArgs);

        // Verify shop and service exist
        const [{ data: shop }, { data: service }] = await Promise.all([
          supabaseAdmin.from('shops').select('id, name, timezone').eq('id', args.shop_id).single(),
          supabaseAdmin.from('services').select('id, name, price, duration_minutes').eq('id', args.service_id).single(),
        ]);

        if (!shop || !service) {
          return { ok: false, error_code: 'NOT_FOUND', message: 'Shop or service not found' };
        }

        const token = createConfirmationToken(
          'book',
          {
            shopId: args.shop_id,
            serviceId: args.service_id,
            startTime: args.start_time,
            notes: args.notes || '',
            customerId: user.id,
            name: user.full_name || 'Customer',
            email: user.email,
            phone: user.phone || '+919999999999',
          },
          user.id
        );

        const whenLabel = formatInShopTz(args.start_time, shop.timezone);

        uiAccumulator.confirmation = {
          token,
          action: 'book',
          shop_name: shop.name,
          service_name: service.name,
          when_label: whenLabel,
          price: service.price,
        };

        return {
          ok: true,
          confirmation_token: token,
          summary: {
            shop_name: shop.name,
            service_name: service.name,
            time_label: whenLabel,
            price: service.price,
            duration: service.duration_minutes,
          },
          instructions: 'Ask the user explicitly to confirm booking this appointment. Only call create_booking if they confirm.',
        };
      }

      case 'create_booking': {
        const args = createBookingToolSchema.parse(rawArgs);
        const proposal = consumeConfirmationToken(args.confirmation_token, user.id, 'book');

        if (!proposal) {
          return {
            ok: false,
            error_code: 'CONFIRMATION_REQUIRED',
            message: 'Booking not confirmed by user or confirmation token expired. Please ask user to confirm.',
          };
        }

        const booking = await createBooking({
          shopId: proposal.shopId,
          serviceId: proposal.serviceId,
          customerId: proposal.customerId,
          name: proposal.name,
          phone: proposal.phone,
          email: proposal.email,
          notes: proposal.notes,
          startTime: proposal.startTime,
          source: 'ai_assistant',
        });

        uiAccumulator.booking = {
          reference_code: booking.reference_code,
          status: booking.status,
        };

        return {
          ok: true,
          reference_code: booking.reference_code,
          status: booking.status,
          start_time: booking.start_time,
          message: 'Appointment successfully booked!',
        };
      }

      case 'list_my_bookings': {
        const args = listMyBookingsToolSchema.parse(rawArgs);
        let query = supabaseAdmin
          .from('bookings')
          .select('*, shops(name, city, timezone), services(name, duration_minutes)')
          .eq('customer_id', user.id)
          .order('start_time', { ascending: args.when === 'past' ? false : true });

        const nowIso = new Date().toISOString();
        if (args.when === 'upcoming') {
          query = query.gte('start_time', nowIso).in('status', ['pending', 'confirmed']);
        } else if (args.when === 'past') {
          query = query.lt('start_time', nowIso);
        }

        const { data: bookings = [] } = await query.limit(5);

        return {
          ok: true,
          count: bookings.length,
          bookings: bookings.map((b) => ({
            id: b.id,
            reference_code: b.reference_code,
            shop_name: b.shops?.name,
            service_name: b.services?.name,
            status: b.status,
            when: formatInShopTz(b.start_time, b.shops?.timezone),
            price: b.price_at_booking,
          })),
        };
      }

      case 'prepare_reschedule': {
        const args = prepareRescheduleToolSchema.parse(rawArgs);
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('*, shops(name, timezone), services(name, price)')
          .eq('id', args.booking_id)
          .eq('customer_id', user.id)
          .single();

        if (!booking) {
          return { ok: false, error_code: 'NOT_FOUND', message: 'Booking not found' };
        }

        const token = createConfirmationToken(
          'reschedule',
          {
            bookingId: args.booking_id,
            newStartTime: args.new_start_time,
            actorId: user.id,
          },
          user.id
        );

        const whenLabel = formatInShopTz(args.new_start_time, booking.shops?.timezone);

        uiAccumulator.confirmation = {
          token,
          action: 'reschedule',
          shop_name: booking.shops?.name,
          service_name: booking.services?.name,
          when_label: whenLabel,
          price: booking.services?.price,
          booking_id: booking.id,
        };

        return {
          ok: true,
          confirmation_token: token,
          new_time_label: whenLabel,
          instructions: 'Ask the user explicitly to confirm rescheduling to this new time.',
        };
      }

      case 'reschedule_booking': {
        const args = rescheduleBookingToolSchema.parse(rawArgs);
        const proposal = consumeConfirmationToken(args.confirmation_token, user.id, 'reschedule');

        if (!proposal) {
          return { ok: false, error_code: 'CONFIRMATION_REQUIRED', message: 'Reschedule was not confirmed or token expired.' };
        }

        const updated = await rescheduleBooking(proposal.bookingId, proposal.newStartTime, user.id);

        uiAccumulator.booking = {
          reference_code: updated.reference_code,
          status: updated.status,
        };

        return {
          ok: true,
          reference_code: updated.reference_code,
          status: updated.status,
          message: 'Appointment successfully rescheduled!',
        };
      }

      case 'prepare_cancel': {
        const args = prepareCancelToolSchema.parse(rawArgs);
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('*, shops(name, cancellation_window_hours)')
          .eq('id', args.booking_id)
          .eq('customer_id', user.id)
          .single();

        if (!booking) {
          return { ok: false, error_code: 'NOT_FOUND', message: 'Booking not found' };
        }

        const token = createConfirmationToken(
          'cancel',
          {
            bookingId: args.booking_id,
            reason: args.reason || 'Cancelled via AI Assistant',
            actorId: user.id,
          },
          user.id
        );

        uiAccumulator.confirmation = {
          token,
          action: 'cancel',
          shop_name: booking.shops?.name,
          booking_id: booking.id,
        };

        return {
          ok: true,
          confirmation_token: token,
          instructions: 'Ask the user explicitly to confirm cancellation of this appointment.',
        };
      }

      case 'cancel_booking': {
        const args = cancelBookingToolSchema.parse(rawArgs);
        const proposal = consumeConfirmationToken(args.confirmation_token, user.id, 'cancel');

        if (!proposal) {
          return { ok: false, error_code: 'CONFIRMATION_REQUIRED', message: 'Cancellation was not confirmed or token expired.' };
        }

        const cancelled = await cancelBooking(proposal.bookingId, user.id, proposal.reason);

        return {
          ok: true,
          reference_code: cancelled.reference_code,
          status: cancelled.status,
          message: 'Booking has been cancelled.',
        };
      }

      default:
        return { ok: false, error_code: 'UNKNOWN_TOOL', message: `Tool ${name} not found` };
    }
  } catch (err) {
    logger.error({ err: err.message, tool: name }, 'Tool execution error');
    return { ok: false, error_code: 'EXECUTION_ERROR', message: err.message };
  }
}

