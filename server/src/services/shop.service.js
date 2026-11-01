import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { generateSlug } from '../utils/slug.js';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

/**
 * List all categories sorted by sort_order
 */
export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
  return data || [];
}

/**
 * Search and filter published shops for discovery
 */
export async function searchShops({
  q = '',
  category = '',
  city = '',
  minRating = 0,
  openNow = false,
  sort = 'rating',
  page = 1,
  limit = 12,
}) {
  let query = supabaseAdmin
    .from('shops')
    .select('*, categories(slug, name, icon)', { count: 'exact' })
    .eq('status', 'published');

  if (category) {
    // If uuid or slug
    if (category.includes('-') && category.length === 36) {
      query = query.eq('category_id', category);
    } else {
      const { data: cat } = await supabaseAdmin.from('categories').select('id').eq('slug', category).single();
      if (cat) query = query.eq('category_id', cat.id);
    }
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (minRating > 0) {
    query = query.gte('rating_avg', minRating);
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`);
  }

  // Sorting
  if (sort === 'rating') {
    query = query.order('rating_avg', { ascending: false }).order('rating_count', { ascending: false });
  } else if (sort === 'name') {
    query = query.order('name', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: shops, count, error } = await query;
  if (error) throw new AppError(error.message, 500, 'SEARCH_FAILED');

  return {
    shops: shops || [],
    pagination: {
      page,
      limit,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get shop detail by ID or Slug with active services and business hours
 */
export async function getShopDetail(shopIdOrSlug) {
  let query = supabaseAdmin
    .from('shops')
    .select('*, categories(slug, name, icon)')
    .eq('status', 'published');

  if (shopIdOrSlug.length === 36 && shopIdOrSlug.includes('-')) {
    query = query.eq('id', shopIdOrSlug);
  } else {
    query = query.eq('slug', shopIdOrSlug);
  }

  const { data: shop, error } = await query.single();
  if (error || !shop) {
    throw new AppError('Shop not found', 404, 'SHOP_NOT_FOUND');
  }

  // Fetch active services, staff, and business hours
  const [{ data: services }, { data: hours }, { data: staff }] = await Promise.all([
    supabaseAdmin.from('services').select('*').eq('shop_id', shop.id).eq('is_active', true).order('price', { ascending: true }),
    supabaseAdmin.from('business_hours').select('*').eq('shop_id', shop.id).order('day_of_week', { ascending: true }).order('open_time', { ascending: true }),
    supabaseAdmin.from('staff_members').select('id, name, is_default, is_active').eq('shop_id', shop.id).eq('is_active', true),
  ]);

  return {
    ...shop,
    services: services || [],
    business_hours: hours || [],
    staff: staff || [],
  };
}

/**
 * Get paginated shop reviews
 */
export async function getShopReviews(shopId, page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabaseAdmin
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new AppError(error.message, 500, 'REVIEWS_FETCH_FAILED');

  return {
    reviews: data || [],
    pagination: {
      page,
      limit,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get shopkeeper's owned shop
 */
export async function getOwnerShop(ownerId) {
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('*, categories(slug, name, icon)')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');
  return data;
}

/**
 * Create a shop for the authenticated shopkeeper
 */
export async function createOwnerShop(ownerId, shopData) {
  // Check if owner already has a shop (1 shop per owner MVP rule)
  const existing = await getOwnerShop(ownerId);
  if (existing) {
    throw new AppError('You already have a shop registered', 400, 'SHOP_ALREADY_EXISTS');
  }

  const slug = generateSlug(shopData.name);

  const { data, error } = await supabaseAdmin
    .from('shops')
    .insert({
      ...shopData,
      owner_id: ownerId,
      slug,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 400, 'CREATE_SHOP_FAILED');
  return data;
}

/**
 * Update shop details
 */
export async function updateOwnerShop(shopId, ownerId, shopData) {
  // Verify ownership
  const { data: shop } = await supabaseAdmin.from('shops').select('id, owner_id').eq('id', shopId).single();
  if (!shop || shop.owner_id !== ownerId) {
    throw new AppError('Shop not found', 404, 'SHOP_NOT_FOUND');
  }

  const { data, error } = await supabaseAdmin
    .from('shops')
    .update({ ...shopData, updated_at: new Date().toISOString() })
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400, 'UPDATE_SHOP_FAILED');
  return data;
}

/**
 * Publish a shop if minimum onboarding criteria are met (has service, has hours)
 */
export async function publishOwnerShop(shopId, ownerId) {
  const { data: shop } = await supabaseAdmin.from('shops').select('*, services(id), business_hours(id)').eq('id', shopId).single();
  if (!shop || shop.owner_id !== ownerId) {
    throw new AppError('Shop not found', 404, 'SHOP_NOT_FOUND');
  }

  const { count: serviceCount } = await supabaseAdmin
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (!serviceCount || serviceCount === 0) {
    throw new AppError('Please add at least one active service before publishing your shop.', 400, 'NO_SERVICES');
  }

  const { count: hoursCount } = await supabaseAdmin
    .from('business_hours')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId);

  if (!hoursCount || hoursCount === 0) {
    throw new AppError('Please configure your weekly working hours before publishing.', 400, 'NO_HOURS');
  }

  const { data, error } = await supabaseAdmin
    .from('shops')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400, 'PUBLISH_FAILED');
  return data;
}

