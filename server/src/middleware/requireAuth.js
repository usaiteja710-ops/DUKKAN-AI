import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    // Check for test mock token in development/test
    if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-jwt-')) {
      const parts = token.split('-');
      // format: mock-jwt-{userId}-{role}
      const userId = parts[2] || '22222222-2222-2222-2222-222222222202';
      const role = parts[3] || 'customer';
      req.user = {
        id: userId,
        email: `${role}@dukkan.ai`,
        role,
        full_name: role === 'shopkeeper' ? 'Rajesh Sharma' : 'Priya Rao',
      };
      req.token = token;
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session has expired or is invalid. Please log in again.',
        },
      });
    }

    // Fetch user profile to get authoritative role
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email, phone')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      // Fallback to metadata if profile record not found yet
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      };
    } else {
      req.user = profile;
    }

    req.token = token;
    next();
  } catch (err) {
    logger.error({ err: err.message }, 'Authentication verification failed');
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Failed to authenticate user',
      },
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      req.user = null;
      return next();
    }

    if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-jwt-')) {
      const parts = token.split('-');
      const userId = parts[2] || '22222222-2222-2222-2222-222222222202';
      const role = parts[3] || 'customer';
      req.user = {
        id: userId,
        email: `${role}@dukkan.ai`,
        role,
        full_name: role === 'shopkeeper' ? 'Rajesh Sharma' : 'Priya Rao',
      };
      req.token = token;
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email, phone')
      .eq('id', user.id)
      .single();

    if (!profile) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      };
    } else {
      req.user = profile;
    }

    req.token = token;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}
