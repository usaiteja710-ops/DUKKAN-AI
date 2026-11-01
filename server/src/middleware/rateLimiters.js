import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Global API rate limiter
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 mins
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many login/signup attempts, please try again in 15 minutes.',
    },
  },
});

// Stricter limiter for booking creation
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    error: {
      code: 'BOOKING_RATE_LIMIT',
      message: 'Too many booking attempts. Please wait a bit before booking again.',
    },
  },
});

// Rate limiter for AI Assistant interactions
export const assistantLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: env.ASSISTANT_RATE_LIMIT_MAX, // 20 messages
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    error: {
      code: 'ASSISTANT_RATE_LIMIT',
      message: 'Assistant message rate limit reached. Please wait a few minutes or use direct booking.',
    },
  },
});

