import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { profileUpdateSchema } from '../validators/auth.schema.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// Get own profile
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      throw new AppError('Profile not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// Update profile
router.patch('/', requireAuth, validate({ body: profileUpdateSchema }), async (req, res, next) => {
  try {
    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...req.body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400, 'UPDATE_FAILED');
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// User data deletion request (Privacy & GDPR/DPDP Act compliance)
router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete chat sessions
    await supabaseAdmin.from('chat_sessions').delete().eq('user_id', userId);

    // Cancel upcoming bookings
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', cancelled_reason: 'User account data deletion requested' })
      .eq('customer_id', userId)
      .in('status', ['pending', 'confirmed']);

    // Anonymize profile details
    await supabaseAdmin
      .from('profiles')
      .update({
        full_name: 'Anonymized User',
        phone: null,
        avatar_url: null,
        email_notifications: false,
      })
      .eq('id', userId);

    res.json({
      success: true,
      message: 'Your personal data and chat sessions have been safely deleted and anonymized.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;

