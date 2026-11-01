import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { assistantLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { assistantMessageSchema } from '../validators/assistant.schema.js';
import { runAgentLoop } from '../ai/agent.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';
import { inMemoryChatSessions, inMemoryChatMessages } from '../lib/dbStore.js';

const router = Router();

// Create a new chat session
router.post('/sessions', requireAuth, async (req, res, next) => {
  try {
    const { title = 'New Conversation', contextShopId = null } = req.body || {};

    try {
      const { data: session, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          user_id: req.user.id,
          title,
          context_shop_id: contextShopId,
        })
        .select()
        .single();

      if (!error && session) {
        return res.status(201).json({ success: true, data: session });
      }
    } catch (e) {
      // In-memory fallback
    }

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sessionObj = {
      id: sessionId,
      user_id: req.user.id,
      title,
      context_shop_id: contextShopId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryChatSessions.set(sessionId, sessionObj);
    inMemoryChatMessages.set(sessionId, []);

    res.status(201).json({
      success: true,
      data: sessionObj,
    });
  } catch (err) {
    next(err);
  }
});

// List user's chat sessions
router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    try {
      const { data: sessions, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('*, shops(name)')
        .eq('user_id', req.user.id)
        .order('updated_at', { ascending: false });

      if (!error && sessions) {
        return res.json({ success: true, data: sessions });
      }
    } catch (e) {
      // In-memory fallback
    }

    const userSessions = Array.from(inMemoryChatSessions.values())
      .filter((s) => s.user_id === req.user.id)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({
      success: true,
      data: userSessions,
    });
  } catch (err) {
    next(err);
  }
});

// Get session messages
router.get('/sessions/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const sessionId = req.params.id;

    try {
      const { data: session } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .single();

      if (session && session.user_id === req.user.id) {
        const { data: messages } = await supabaseAdmin
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (messages) {
          return res.json({ success: true, data: messages });
        }
      }
    } catch (e) {
      // In-memory fallback
    }

    const memSession = inMemoryChatSessions.get(sessionId);
    if (!memSession || memSession.user_id !== req.user.id) {
      // Create session on the fly if needed
      inMemoryChatSessions.set(sessionId, {
        id: sessionId,
        user_id: req.user.id,
        title: 'Quick Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      inMemoryChatMessages.set(sessionId, []);
    }

    const messages = inMemoryChatMessages.get(sessionId) || [];
    res.json({
      success: true,
      data: messages,
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

      // Verify or initialize session
      let session = inMemoryChatSessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          user_id: req.user.id,
          title: 'Quick Chat',
          context_shop_id: contextShopId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        inMemoryChatSessions.set(sessionId, session);
        inMemoryChatMessages.set(sessionId, []);
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
      session.updated_at = new Date().toISOString();
      inMemoryChatSessions.set(sessionId, session);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
