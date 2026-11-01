import { z } from 'zod';

export const reviewSchema = z.object({
  booking_id: z.string().uuid('Invalid booking_id'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().max(1000, 'Comment cannot exceed 1000 characters').optional().default(''),
}).strict();

