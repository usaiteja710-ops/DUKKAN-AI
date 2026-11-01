import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { assistantLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { assistantMessageSchema } from '../validators/assistant.schema.js';
import { runAgentLoop } from '../ai/agent.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// Create a new chat session
router.post('/sessions', requireAuth, async (req, res, next) => {
  try {
    const { title = 'New Conversation', contextShopId = null } = req.body || {};

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: req.user.id,
        title,
        context_shop_id: contextShopId,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'SESSION_CREATE_FAILED');

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
});

// List user's chat sessions
router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*, shops(name)')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw new AppError(error.message, 500, 'SESSIONS_FETCH_FAILED');

    res.json({
      success: true,
      data: sessions || [],
    });
  } catch (err) {
    next(err);
  }
});

// Get session messages
router.get('/sessions/:id/messages', requireAuth, async (req, res, next) => {
  try {
    // Verify session ownership
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single();

    if (!session || session.user_id !== req.user.id) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw new AppError(error.message, 500, 'MESSAGES_FETCH_FAILED');

    res.json({
      success: true,
      data: messages || [],
    });
  } catch (err) {
    next(err);
  }
});

// Send user message to assistant (Executes Agent Loop)
router.post(
  '/sessions/:id/messages',
  requireAuth,
  assistantLimiter,
  validate({ body: assistantMessageSchema }),
  async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      const { content, contextShopId, confirmToken } = req.body;

      // Verify session ownership
      const { data: session } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, user_id, context_shop_id')
        .eq('id', sessionId)
        .single();

      if (!session || session.user_id !== req.user.id) {
        throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
      }

      // Run AI agent loop
      const result = await runAgentLoop({
        sessionId,
        user: req.user,
        userMessage: content,
        contextShopId: contextShopId || session.context_shop_id,
        confirmToken,
      });

      // Update session timestamp
      await supabaseAdmin
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Delete chat session
router.delete('/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single();

    if (!session || session.user_id !== req.user.id) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    await supabaseAdmin.from('chat_sessions').delete().eq('id', req.params.id);

    res.json({
      success: true,
      data: { message: 'Session deleted successfully' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

