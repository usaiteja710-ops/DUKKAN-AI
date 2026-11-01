import { z } from 'zod';
import { isValidPhone, normalizePhone } from '../utils/phone.js';
import { isValidTimezone } from '../utils/time.js';

export const shopCreateSchema = z.object({
  name: z.string().trim().min(2, 'Shop name must be at least 2 chars').max(120),
  category_id: z.string().uuid('Invalid category ID'),
  description: z.string().trim().max(1000).optional().default(''),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, { message: 'Invalid shop phone number' })
    .transform(normalizePhone)
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  address_line: z.string().trim().max(255).optional().default(''),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().max(100).optional().default(''),
  postal_code: z.string().trim().max(20).optional().default(''),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  timezone: z
    .string()
    .refine(isValidTimezone, { message: 'Invalid IANA timezone' })
    .default('Asia/Kolkata'),
  slot_interval_minutes: z.union([
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(30),
    z.literal(60),
  ]).default(30),
  min_notice_hours: z.number().int().min(0).max(72).default(1),
  max_advance_days: z.number().int().min(1).max(365).default(60),
  cancellation_window_hours: z.number().int().min(0).max(168).default(2),
  auto_confirm: z.boolean().default(true),
  cover_image_url: z.string().url().optional().nullable(),
  gallery_urls: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string().trim().max(30)).max(15).default([]),
}).strict();

export const shopUpdateSchema = shopCreateSchema.partial().strict();

const timeStringRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const businessHoursWindowSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  open_time: z.string().regex(timeStringRegex, 'open_time must be HH:MM or HH:MM:SS'),
  close_time: z.string().regex(timeStringRegex, 'close_time must be HH:MM or HH:MM:SS'),
}).refine(data => data.close_time > data.open_time, {
  message: 'close_time must be later than open_time',
  path: ['close_time'],
});

export const replaceBusinessHoursSchema = z.object({
  hours: z.array(businessHoursWindowSchema),
}).refine(data => {
  // Check no overlapping windows on the same day
  const byDay = {};
  for (const window of data.hours) {
    if (!byDay[window.day_of_week]) byDay[window.day_of_week] = [];
    byDay[window.day_of_week].push(window);
  }
  for (const day of Object.keys(byDay)) {
    const windows = byDay[day].sort((a, b) => a.open_time.localeCompare(b.open_time));
    for (let i = 0; i < windows.length - 1; i++) {
      if (windows[i].close_time > windows[i + 1].open_time) {
        return false; // overlap found
      }
    }
  }
  return true;
}, {
  message: 'Business hours contains overlapping time windows on the same day',
  path: ['hours'],
});

export const timeOffSchema = z.object({
  staff_id: z.string().uuid().optional().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  reason: z.string().trim().max(255).optional().default(''),
}).refine(data => new Date(data.ends_at) > new Date(data.starts_at), {
  message: 'ends_at must be after starts_at',
  path: ['ends_at'],
});

export const staffMemberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
}).strict();

