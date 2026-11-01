import { z } from 'zod';
import { isValidPhone, normalizePhone } from '../utils/phone.js';

export const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, { message: 'Invalid phone number format' })
    .transform(normalizePhone)
    .optional()
    .or(z.literal('')),
  role: z.enum(['customer', 'shopkeeper']).default('customer'),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, { message: 'Invalid phone number' })
    .transform(normalizePhone)
    .optional(),
  avatar_url: z.string().url().optional().nullable(),
  email_notifications: z.boolean().optional(),
}).strict();

