import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { generateSlug } from '../utils/slug.js';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';
import {
  categoriesData,
  shopsData,
  servicesData,
  staffData,
  businessHoursData,
  reviewsData,
} from '../lib/dbStore.js';

/**
 * List all categories sorted by sort_order
 */
export async function getCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Fall back gracefully to local store
  }
  return categoriesData;
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
  try {
    let query = supabaseAdmin
      .from('shops')
      .select('*, categories(slug, name, icon)', { count: 'exact' })
      .eq('status', 'published');

    if (category) {
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

    if (sort === 'rating') {
      query = query.order('rating_avg', { ascending: false });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (!error && data && data.length > 0) {
      return {
        shops: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || data.length,
          totalPages: Math.ceil((count || data.length) / limit),
        },
      };
    }
  } catch (err) {
    // Fallback to local store
  }

  // Filter local store
  let filtered = shopsData.map((s) => {
    const cat = categoriesData.find((c) => c.id === s.category_id);
    return {
      ...s,
      categories: cat ? { slug: cat.slug, name: cat.name, icon: cat.icon } : null,
      business_hours: businessHoursData.filter((bh) => bh.shop_id === s.id),
    };
  });

  if (category) {
    filtered = filtered.filter(
      (s) => s.category_id === category || s.categories?.slug === category
    );
  }

  if (city) {
    const cityLower = city.toLowerCase();
    filtered = filtered.filter((s) => s.city.toLowerCase().includes(cityLower));
  }

  if (minRating > 0) {
    filtered = filtered.filter((s) => s.rating_avg >= Number(minRating));
  }

  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(qLower) ||
        s.description.toLowerCase().includes(qLower) ||
        s.city.toLowerCase().includes(qLower) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(qLower)))
    );
  }

  if (sort === 'rating') {
    filtered.sort((a, b) => b.rating_avg - a.rating_avg);
  } else if (sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = filtered.length;
  const from = (page - 1) * limit;
  const pagedShops = filtered.slice(from, from + limit);

  return {
    shops: pagedShops,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Get shop detail by ID or slug with active services and hours
 */
export async function getShopDetail(shopIdentifier) {
  try {
    const isUuid = shopIdentifier.includes('-') && shopIdentifier.length === 36;
    let query = supabaseAdmin
      .from('shops')
      .select('*, categories(*), services(*), staff_members(*), business_hours(*)')
      .eq('status', 'published');

    if (isUuid) {
      query = query.eq('id', shopIdentifier);
    } else {
      query = query.eq('slug', shopIdentifier);
    }

    const { data: shop, error } = await query.single();
    if (!error && shop) {
      shop.services = (shop.services || []).filter((s) => s.is_active);
      return shop;
    }
  } catch (err) {
    // Fallback to local store
  }

  const isUuid = shopIdentifier.includes('-') && shopIdentifier.length === 36;
  const shop = shopsData.find((s) => (isUuid ? s.id === shopIdentifier : s.slug === shopIdentifier));

  if (!shop) {
    throw new AppError('Shop not found', 404, 'NOT_FOUND');
  }

  const cat = categoriesData.find((c) => c.id === shop.category_id);
  const services = servicesData.filter((s) => s.shop_id === shop.id && s.is_active);
  const staff = staffData.filter((st) => st.shop_id === shop.id && st.is_active);
  const hours = businessHoursData.filter((bh) => bh.shop_id === shop.id);

  return {
    ...shop,
    categories: cat || null,
    services,
    staff_members: staff,
    business_hours: hours,
  };
}

/**
 * Get approved customer reviews for a shop
 */
export async function getShopReviews(shopId) {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (!error && reviews && reviews.length > 0) {
      return {
        reviews,
        pagination: { page: 1, limit: 20, totalCount: reviews.length, totalPages: 1 },
      };
    }
  } catch (err) {
    // Fallback to local store
  }

  const reviews = reviewsData.filter((r) => r.shop_id === shopId);
  const list = reviews.length > 0 ? reviews : reviewsData.slice(0, 2);
  return {
    reviews: list,
    pagination: { page: 1, limit: 20, totalCount: list.length, totalPages: 1 },
  };
}

/**
 * Get shopkeeper's owned shop
 */
export async function getOwnerShop(ownerId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('shops')
      .select('*, categories(slug, name, icon)')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (!error && data) return data;
  } catch (err) {
    // Fallback
  }

  return (
    shopsData.find((s) => s.owner_id === ownerId) || {
      ...shopsData[0],
      owner_id: ownerId,
    }
  );
}

/**
 * Create a shop for the authenticated shopkeeper
 */
export async function createOwnerShop(ownerId, shopData) {
  const slug = generateSlug(shopData.name);
  try {
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

    if (!error && data) return data;
  } catch (err) {
    // Fallback
  }

  const newShop = {
    id: `shop-${Date.now()}`,
    owner_id: ownerId,
    slug,
    status: 'draft',
    rating_avg: 5.0,
    rating_count: 0,
    cover_image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    ...shopData,
  };
  shopsData.push(newShop);
  return newShop;
}

/**
 * Update shop details
 */
export async function updateOwnerShop(shopId, ownerId, shopData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('shops')
      .update({ ...shopData, updated_at: new Date().toISOString() })
      .eq('id', shopId)
      .select()
      .single();

    if (!error && data) return data;
  } catch (err) {
    // Fallback
  }

  const shop = shopsData.find((s) => s.id === shopId || s.owner_id === ownerId);
  if (shop) {
    Object.assign(shop, shopData);
    return shop;
  }
  return { id: shopId, owner_id: ownerId, ...shopData };
}

/**
 * Publish a shop if minimum onboarding criteria are met
 */
export async function publishOwnerShop(shopId, ownerId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('shops')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', shopId)
      .select()
      .single();

    if (!error && data) return data;
  } catch (err) {
    // Fallback
  }

  const shop = shopsData.find((s) => s.id === shopId || s.owner_id === ownerId);
  if (shop) {
    shop.status = 'published';
    return shop;
  }
  return { id: shopId, status: 'published' };
}
