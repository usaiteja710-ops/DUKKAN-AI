import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  shopCreateSchema,
  shopUpdateSchema,
  replaceBusinessHoursSchema,
  timeOffSchema,
  staffMemberSchema,
} from '../validators/shop.schema.js';
import { serviceCreateSchema, serviceUpdateSchema } from '../validators/service.schema.js';
import { ownerBookingStatusSchema, walkInBookingSchema } from '../validators/booking.schema.js';
import {
  getOwnerShop,
  createOwnerShop,
  updateOwnerShop,
  publishOwnerShop,
} from '../services/shop.service.js';
import { updateBookingStatus, createBooking } from '../services/booking.service.js';
import { getShopAnalytics } from '../services/analytics.service.js';
import { generateShopkeeperInsights } from '../ai/insights.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// Apply shopkeeper role check to all owner routes
router.use(requireAuth, requireRole('shopkeeper', 'admin'));

// Helper to get owner's shop and throw if missing
async function getRequiredOwnerShop(ownerId) {
  const shop = await getOwnerShop(ownerId);
  if (!shop) {
    throw new AppError('You must complete shop onboarding first', 404, 'SHOP_NOT_FOUND');
  }
  return shop;
}

// ----------------------------------------------------------------------------
// Shop Profile & Status
// ----------------------------------------------------------------------------
router.get('/shop', async (req, res, next) => {
  try {
    const shop = await getOwnerShop(req.user.id);
    res.json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
});

router.post('/shop', validate({ body: shopCreateSchema }), async (req, res, next) => {
  try {
    const shop = await createOwnerShop(req.user.id, req.body);
    res.status(201).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
});

router.patch('/shop', validate({ body: shopUpdateSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const updated = await updateOwnerShop(shop.id, req.user.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/shop/publish', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const published = await publishOwnerShop(shop.id, req.user.id);
    res.json({ success: true, data: published });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Services CRUD
// ----------------------------------------------------------------------------
router.get('/services', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: true });

    if (error) throw new AppError(error.message, 500, 'SERVICES_FETCH_FAILED');
    res.json({ success: true, data: services || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/services', validate({ body: serviceCreateSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert({
        ...req.body,
        shop_id: shop.id,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400, 'CREATE_SERVICE_FAILED');
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

router.patch('/services/:id', validate({ body: serviceUpdateSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('shop_id', shop.id)
      .select()
      .single();

    if (error || !service) throw new AppError('Service not found or update failed', 404, 'NOT_FOUND');
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

router.delete('/services/:id', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);

    // Check if bookings exist for this service
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', req.params.id);

    if (bookingCount && bookingCount > 0) {
      // Soft-delete to preserve booking history integrity
      await supabaseAdmin
        .from('services')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('shop_id', shop.id);

      return res.json({ success: true, message: 'Service deactivated (bookings exist)' });
    }

    // Hard-delete if no bookings
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', req.params.id)
      .eq('shop_id', shop.id);

    if (error) throw new AppError(error.message, 400, 'DELETE_FAILED');
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Weekly Business Hours
// ----------------------------------------------------------------------------
router.get('/hours', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: hours, error } = await supabaseAdmin
      .from('business_hours')
      .select('*')
      .eq('shop_id', shop.id)
      .order('day_of_week', { ascending: true })
      .order('open_time', { ascending: true });

    if (error) throw new AppError(error.message, 500, 'HOURS_FETCH_FAILED');
    res.json({ success: true, data: hours || [] });
  } catch (err) {
    next(err);
  }
});

router.put('/hours', validate({ body: replaceBusinessHoursSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { hours } = req.body;

    // Delete existing hours and insert new
    await supabaseAdmin.from('business_hours').delete().eq('shop_id', shop.id);

    const rowsToInsert = hours.map((h) => ({
      shop_id: shop.id,
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from('business_hours')
      .insert(rowsToInsert)
      .select();

    if (error) throw new AppError(error.message, 400, 'SAVE_HOURS_FAILED');
    res.json({ success: true, data: inserted });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Time-off / Holidays / Blocked slots
// ----------------------------------------------------------------------------
router.get('/time-off', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data, error } = await supabaseAdmin
      .from('time_off')
      .select('*, staff_members(name)')
      .eq('shop_id', shop.id)
      .order('starts_at', { ascending: true });

    if (error) throw new AppError(error.message, 500, 'TIMEOFF_FETCH_FAILED');
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/time-off', validate({ body: timeOffSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { starts_at, ends_at, staff_id, reason } = req.body;

    // Check if conflicting active bookings exist in this window
    let conflictQuery = supabaseAdmin
      .from('bookings')
      .select('id, reference_code, start_time')
      .eq('shop_id', shop.id)
      .in('status', ['pending', 'confirmed'])
      .lte('start_time', ends_at)
      .gte('occupied_until', starts_at);

    if (staff_id) {
      conflictQuery = conflictQuery.eq('staff_id', staff_id);
    }

    const { data: conflictingBookings } = await conflictQuery;

    const { data: inserted, error } = await supabaseAdmin
      .from('time_off')
      .insert({
        shop_id: shop.id,
        staff_id: staff_id || null,
        starts_at,
        ends_at,
        reason,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400, 'CREATE_TIMEOFF_FAILED');

    res.status(201).json({
      success: true,
      data: inserted,
      warning: conflictingBookings?.length
        ? `Warning: There are ${conflictingBookings.length} existing bookings during this blocked period.`
        : undefined,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/time-off/:id', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { error } = await supabaseAdmin
      .from('time_off')
      .delete()
      .eq('id', req.params.id)
      .eq('shop_id', shop.id);

    if (error) throw new AppError(error.message, 400, 'DELETE_TIMEOFF_FAILED');
    res.json({ success: true, message: 'Time off block removed' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Staff Management
// ----------------------------------------------------------------------------
router.get('/staff', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: staff, error } = await supabaseAdmin
      .from('staff_members')
      .select('*')
      .eq('shop_id', shop.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw new AppError(error.message, 500, 'STAFF_FETCH_FAILED');
    res.json({ success: true, data: staff || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/staff', validate({ body: staffMemberSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: newStaff, error } = await supabaseAdmin
      .from('staff_members')
      .insert({
        ...req.body,
        shop_id: shop.id,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400, 'CREATE_STAFF_FAILED');
    res.status(201).json({ success: true, data: newStaff });
  } catch (err) {
    next(err);
  }
});

router.patch('/staff/:id', validate({ body: staffMemberSchema.partial() }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { data: updated, error } = await supabaseAdmin
      .from('staff_members')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('shop_id', shop.id)
      .select()
      .single();

    if (error || !updated) throw new AppError('Staff member not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Bookings Dashboard & Management
// ----------------------------------------------------------------------------
router.get('/bookings', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { from, to, status, staffId } = req.query;

    let query = supabaseAdmin
      .from('bookings')
      .select('*, services(name, duration_minutes, price), staff_members(name)')
      .eq('shop_id', shop.id);

    if (from) query = query.gte('start_time', from);
    if (to) query = query.lte('start_time', to);
    if (status) query = query.eq('status', status);
    if (staffId) query = query.eq('staff_id', staffId);

    query = query.order('start_time', { ascending: false });

    const { data: bookings, error } = await query;
    if (error) throw new AppError(error.message, 500, 'BOOKINGS_FETCH_FAILED');

    res.json({ success: true, data: bookings || [] });
  } catch (err) {
    next(err);
  }
});

// Manual Walk-in booking creation
router.post('/bookings', validate({ body: walkInBookingSchema }), async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { service_id, staff_id, start_time, customer_name, customer_phone, customer_email, notes } = req.body;

    const booking = await createBooking({
      shopId: shop.id,
      serviceId: service_id,
      staffId: staff_id,
      customerId: null,
      name: customer_name,
      phone: customer_phone,
      email: customer_email,
      notes: notes ? `[Walk-in] ${notes}` : '[Walk-in]',
      startTime: start_time,
      source: 'walk_in',
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// Status change state-machine action
router.patch(
  '/bookings/:id/status',
  validate({ body: ownerBookingStatusSchema }),
  async (req, res, next) => {
    try {
      const shop = await getRequiredOwnerShop(req.user.id);
      const { status, note } = req.body;

      // Ensure booking belongs to this shop
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('id, shop_id')
        .eq('id', req.params.id)
        .single();

      if (!booking || booking.shop_id !== shop.id) {
        throw new AppError('Booking not found', 404, 'NOT_FOUND');
      }

      const updated = await updateBookingStatus(req.params.id, status, req.user.id, note);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ----------------------------------------------------------------------------
// Customer Directory & Notes
// ----------------------------------------------------------------------------
router.get('/customers', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);

    // Fetch all bookings for this shop to aggregate unique customers
    const { data: bookings = [] } = await supabaseAdmin
      .from('bookings')
      .select('customer_email, customer_name, customer_phone, start_time, status, price_at_booking')
      .eq('shop_id', shop.id);

    // Fetch customer notes
    const { data: notes = [] } = await supabaseAdmin
      .from('customer_notes')
      .select('customer_email, note')
      .eq('shop_id', shop.id);

    const notesMap = new Map(notes.map((n) => [n.customer_email.toLowerCase(), n.note]));

    const customerMap = new Map();

    for (const b of bookings) {
      const email = (b.customer_email || '').toLowerCase().trim();
      if (!email) continue;

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email,
          name: b.customer_name,
          phone: b.customer_phone,
          visitCount: 0,
          totalSpent: 0,
          lastVisit: b.start_time,
          privateNote: notesMap.get(email) || '',
        });
      }

      const record = customerMap.get(email);
      if (['confirmed', 'completed'].includes(b.status)) {
        record.visitCount += 1;
        record.totalSpent += Number(b.price_at_booking || 0);
      }
      if (new Date(b.start_time) > new Date(record.lastVisit)) {
        record.lastVisit = b.start_time;
      }
    }

    const customers = Array.from(customerMap.values()).sort((a, b) => b.visitCount - a.visitCount);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

router.put('/customers/:email/note', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const { note } = req.body;
    const email = req.params.email.toLowerCase().trim();

    const { data, error } = await supabaseAdmin
      .from('customer_notes')
      .upsert(
        {
          shop_id: shop.id,
          customer_email: email,
          note: note || '',
        },
        { onConflict: 'shop_id,customer_email' }
      )
      .select()
      .single();

    if (error) throw new AppError(error.message, 400, 'SAVE_NOTE_FAILED');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// Analytics & AI Insights
// ----------------------------------------------------------------------------
router.get('/analytics', async (req, res, next) => {
  try {
    const shop = await getRequiredOwnerShop(req.user.id);
    const range = req.query.range || '30d';

    const analytics = await getShopAnalytics(shop.id, range);
    const insights = await generateShopkeeperInsights(analytics);

    res.json({
      success: true,
      data: {
        ...analytics,
        aiInsights: insights,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

