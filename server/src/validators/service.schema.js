import { z } from 'zod';

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2, 'Service name must be at least 2 characters').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  duration_minutes: z.number().int().min(5, 'Minimum duration is 5 minutes').max(480, 'Maximum duration is 480 minutes'),
  buffer_minutes: z.number().int().min(0, 'Buffer cannot be negative').max(60, 'Maximum buffer is 60 minutes').default(0),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().default('INR'),
  is_active: z.boolean().default(true),
}).strict();

export const serviceUpdateSchema = serviceCreateSchema.partial().strict();

