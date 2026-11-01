import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  logger.error(
    {
      err: {
        message: err.message,
        code: err.code,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      path: req.path,
      method: req.method,
    },
    'Request error caught in central errorHandler'
  );

  // PostgreSQL exclusion violation (double booking)
  if (err.code === '23P01' || err.message?.includes('SLOT_TAKEN') || err.message?.includes('no_overlap_per_staff')) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'SLOT_TAKEN',
        message: 'This time slot is no longer available. Please select another slot.',
      },
    });
  }

  // PostgreSQL custom exceptions from RPC
  if (err.code === 'P0001' || err.message?.includes('P0001')) {
    if (err.message?.includes('SLOT_TAKEN')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_TAKEN',
          message: 'The requested time slot has just been reserved. Please pick another slot.',
        },
      });
    }
    if (err.message?.includes('SLOT_BLOCKED')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_BLOCKED',
          message: 'This slot falls within a scheduled break, holiday, or blocked time.',
        },
      });
    }
    if (err.message?.includes('TOO_SOON')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_SOON',
          message: 'Booking does not satisfy the minimum advance notice required by this shop.',
        },
      });
    }
    if (err.message?.includes('TOO_FAR')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_FAR',
          message: 'Booking date exceeds the maximum advance booking window for this shop.',
        },
      });
    }
    if (err.message?.includes('INSIDE_CANCELLATION_WINDOW')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSIDE_CANCELLATION_WINDOW',
          message: 'Appointments cannot be changed or cancelled inside the shop cancellation window.',
        },
      });
    }
  }

  // Known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Fallback for unhandled internal errors
  const isDev = env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred. Please try again.',
      ...(isDev && { stack: err.stack }),
    },
  });
}

