import { Router } from 'express';
import { getCategories, searchShops, getShopDetail, getShopReviews } from '../services/shop.service.js';
import { getShopAvailability } from '../services/availability.service.js';
import { validate } from '../middleware/validate.js';
import { availabilityQuerySchema } from '../validators/booking.schema.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { z } from 'zod';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    },
  });
});

// Categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// Shops search & discovery
const searchShopsQuerySchema = z.object({
  q: z.string().optional().default(''),
  category: z.string().optional().default(''),
  city: z.string().optional().default(''),
  minRating: z.coerce.number().min(0).max(5).optional().default(0),
  openNow: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  sort: z.enum(['rating', 'name', 'newest']).optional().default('rating'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

router.get('/shops', validate({ query: searchShopsQuerySchema }), async (req, res, next) => {
  try {
    const results = await searchShops(req.query);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// Shop detail
router.get('/shops/:shopId', async (req, res, next) => {
  try {
    const shop = await getShopDetail(req.params.shopId);
    res.json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
});

// Active services for a shop
router.get('/shops/:shopId/services', async (req, res, next) => {
  try {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('shop_id', req.params.shopId)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: services || [] });
  } catch (err) {
    next(err);
  }
});

// Shop reviews
router.get('/shops/:shopId/reviews', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const reviews = await getShopReviews(req.params.shopId, page, limit);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

// Compute availability for date
router.get(
  '/shops/:shopId/availability',
  validate({ query: availabilityQuerySchema }),
  async (req, res, next) => {
    try {
      const { serviceId, date, staffId } = req.query;
      const slots = await getShopAvailability(req.params.shopId, serviceId, date, staffId);
      res.json({
        success: true,
        data: {
          date,
          slots,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

