import { z } from 'zod';

export const assistantMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
  contextShopId: z.string().uuid().optional().nullable(),
  confirmToken: z.string().trim().optional(),
}).strict();

// AI tool argument schemas
export const searchShopsToolSchema = z.object({
  query: z.string().trim().optional(),
  category_slug: z.string().trim().optional(),
  city: z.string().trim().optional(),
  max_price: z.number().optional(),
  min_rating: z.number().optional(),
});

export const getShopInfoToolSchema = z.object({
  shop_id: z.string().uuid(),
});

export const checkAvailabilityToolSchema = z.object({
  shop_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_window: z.enum(['any', 'morning', 'afternoon', 'evening']).optional().default('any'),
});

export const prepareBookingToolSchema = z.object({
  shop_id: z.string().uuid(),
  service_id: z.string().uuid(),
  start_time: z.string().datetime(),
  notes: z.string().trim().max(500).optional(),
});

export const createBookingToolSchema = z.object({
  confirmation_token: z.string().min(10),
});

export const listMyBookingsToolSchema = z.object({
  when: z.enum(['upcoming', 'past', 'all']).optional().default('upcoming'),
});

export const prepareRescheduleToolSchema = z.object({
  booking_id: z.string().uuid(),
  new_start_time: z.string().datetime(),
});

export const rescheduleBookingToolSchema = z.object({
  confirmation_token: z.string().min(10),
});

export const prepareCancelToolSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const cancelBookingToolSchema = z.object({
  confirmation_token: z.string().min(10),
});

// Structured UI Response Schema
export const aiUiResponseSchema = z.object({
  reply: z.string(),
  ui: z.object({
    shops: z.array(z.object({
      shop_id: z.string(),
      name: z.string(),
      category: z.string().optional(),
      rating: z.number().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
    })).optional(),
    slots: z.array(z.object({
      start_time: z.string(),
      label: z.string(),
    })).optional(),
    confirmation: z.object({
      token: z.string(),
      action: z.enum(['book', 'reschedule', 'cancel']),
      shop_name: z.string().optional(),
      service_name: z.string().optional(),
      when_label: z.string().optional(),
      price: z.number().optional(),
      booking_id: z.string().optional(),
    }).optional(),
    booking: z.object({
      reference_code: z.string(),
      status: z.string(),
      shop_name: z.string().optional(),
      service_name: z.string().optional(),
      when_label: z.string().optional(),
    }).optional(),
  }).optional(),
  suggested_replies: z.array(z.string()).max(4).optional(),
});

// Shopkeeper AI Insights Schema
export const aiInsightsSchema = z.object({
  insights: z.array(z.object({
    title: z.string(),
    detail: z.string(),
    action: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })).min(1).max(5),
});

