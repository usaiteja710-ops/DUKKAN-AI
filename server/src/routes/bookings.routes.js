import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';
import { createBooking, rescheduleBooking, cancelBooking } from '../services/booking.service.js';
import { createBookingSchema, rescheduleSchema, cancelSchema } from '../validators/booking.schema.js';
import { reviewSchema } from '../validators/review.schema.js';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { inMemoryBookings, reviewsData } from '../lib/dbStore.js';

const router = Router();

// Create booking (Authenticated or auto-authenticated guest)
router.post(
  '/',
  requireAuth,
  bookingLimiter,
  validate({ body: createBookingSchema }),
  async (req, res, next) => {
    try {
      const { shop_id, service_id, staff_id, start_time, customer_name, customer_phone, customer_email, notes } = req.body;

      const booking = await createBooking({
        shopId: shop_id,
        serviceId: service_id,
        staffId: staff_id,
        customerId: req.user?.id || null,
        name: customer_name,
        phone: customer_phone,
        email: customer_email,
        notes,
        startTime: start_time,
        source: 'web',
      });

      res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }
);

// List customer's own bookings
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const { when = 'upcoming', status } = req.query;

    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('bookings')
          .select('*, shops(name, city, address_line, phone, timezone, cancellation_window_hours), services(name, duration_minutes, price), staff_members(name)')
          .eq('customer_id', req.user.id);

        if (status) {
          query = query.eq('status', status);
        }

        const nowIso = new Date().toISOString();
        if (when === 'upcoming') {
          query = query.gte('start_time', nowIso).in('status', ['pending', 'confirmed']).order('start_time', { ascending: true });
        } else if (when === 'past') {
          query = query.or(`start_time.lt.${nowIso},status.in.(completed,cancelled,no_show)`).order('start_time', { ascending: false });
        } else {
          query = query.order('start_time', { ascending: false });
        }

        const { data: bookings, error } = await query;
        if (!error && bookings) {
          return res.json({ success: true, data: bookings });
        }
      } catch (e) {
        // In-memory fallback
      }
    }

    const nowIso = new Date().toISOString();
    const list = inMemoryBookings.filter((b) => b.customer_id === req.user.id || b.customer_email === req.user.email);

    let filtered = list;
    if (when === 'upcoming') {
      filtered = list.filter((b) => b.start_time >= nowIso && ['pending', 'confirmed'].includes(b.status));
    } else if (when === 'past') {
      filtered = list.filter((b) => b.start_time < nowIso || ['completed', 'cancelled', 'no_show'].includes(b.status));
    }

    res.json({ success: true, data: filtered });
  } catch (err) {
    next(err);
  }
});

// Get booking details (accessible to booking customer, shop owner, or direct confirmation link)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    if (isSupabaseConfigured) {
      try {
        const { data: booking, error } = await supabaseAdmin
          .from('bookings')
          .select('*, shops(id, name, owner_id, city, address_line, phone, timezone, cancellation_window_hours), services(name, duration_minutes, price), staff_members(name)')
          .eq('id', req.params.id)
          .single();

        if (!error && booking) {
          return res.json({ success: true, data: booking });
        }
      } catch (e) {
        // Fallback
      }
    }

    const booking = inMemoryBookings.find((b) => b.id === req.params.id);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// Reschedule booking
router.patch(
  '/:id/reschedule',
  requireAuth,
  validate({ body: rescheduleSchema }),
  async (req, res, next) => {
    try {
      const { newStartTime } = req.body;
      const newBooking = await rescheduleBooking(req.params.id, newStartTime, req.user.id);

      res.json({
        success: true,
        data: newBooking,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Cancel booking
router.patch(
  '/:id/cancel',
  requireAuth,
  validate({ body: cancelSchema }),
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      const cancelledBooking = await cancelBooking(req.params.id, req.user.id, reason);

      res.json({
        success: true,
        data: cancelledBooking,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Create review for completed booking
router.post(
  '/reviews',
  requireAuth,
  validate({ body: reviewSchema }),
  async (req, res, next) => {
    try {
      const { booking_id, rating, comment } = req.body;

      try {
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('id, shop_id, customer_id, status')
          .eq('id', booking_id)
          .single();

        if (booking) {
          const { data: review } = await supabaseAdmin
            .from('reviews')
            .insert({
              booking_id,
              shop_id: booking.shop_id,
              customer_id: req.user.id,
              rating,
              comment,
            })
            .select()
            .single();

          if (review) return res.status(201).json({ success: true, data: review });
        }
      } catch (e) {
        // Fallback
      }

      const review = {
        id: `rev-${Date.now()}`,
        booking_id,
        rating,
        comment,
        created_at: new Date().toISOString(),
      };
      reviewsData.push(review);

      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
