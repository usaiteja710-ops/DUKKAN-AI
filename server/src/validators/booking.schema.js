import { z } from 'zod';
import { isValidPhone, normalizePhone } from '../utils/phone.js';

export const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid('Invalid serviceId'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, 'Invalid calendar date'),
  staffId: z.string().uuid('Invalid staff ID').optional().nullable().or(z.literal('')),
});

export const createBookingSchema = z.object({
  shop_id: z.string().uuid('Invalid shop ID'),
  service_id: z.string().uuid('Invalid service ID'),
  staff_id: z.string().uuid('Invalid staff ID').optional().nullable().or(z.literal('')),
  start_time: z
    .string()
    .datetime({ message: 'start_time must be a valid ISO 8601 UTC string' })
    .refine((val) => new Date(val) > new Date(), {
      message: 'start_time must be in the future',
    }),
  customer_name: z.string().trim().min(2, 'Name must be at least 2 chars').max(80),
  customer_phone: z
    .string()
    .trim()
    .refine(isValidPhone, { message: 'Invalid phone number format' })
    .transform(normalizePhone),
  customer_email: z.string().trim().email('Invalid email address'),
  notes: z.string().trim().max(500).optional().default(''),
}).strict();

export const rescheduleSchema = z.object({
  newStartTime: z
    .string()
    .datetime({ message: 'newStartTime must be a valid ISO 8601 UTC string' })
    .refine((val) => new Date(val) > new Date(), {
      message: 'newStartTime must be in the future',
    }),
}).strict();

export const cancelSchema = z.object({
  reason: z.string().trim().max(500).optional().default('Cancelled by customer'),
}).strict();

export const ownerBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']),
  note: z.string().trim().max(500).optional().default(''),
}).strict();

export const walkInBookingSchema = z.object({
  service_id: z.string().min(1, 'service_id is required'),
  staff_id: z.string().optional().nullable().or(z.literal('')),
  start_time: z
    .string()
    .datetime({ message: 'start_time must be a valid ISO 8601 UTC string' }),
  customer_name: z.string().trim().min(2).max(80),
  customer_phone: z
    .string()
    .trim()
    .refine(isValidPhone, { message: 'Invalid phone number format' })
    .transform(normalizePhone)
    .optional()
    .or(z.literal('')),
  customer_email: z.string().trim().email().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().default('Walk-in customer'),
}).strict();
