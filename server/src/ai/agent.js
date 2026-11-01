import { ai, MODEL, executeGeminiWithRetry } from '../lib/gemini.js';
import { ASSISTANT_CONFIG } from '../config/assistant.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { toolDeclarations, executeTool } from './tools/index.js';
import { markTokenConfirmed, isAffirmativeConfirmation } from './confirmation.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { aiUiResponseSchema } from '../validators/assistant.schema.js';

export async function runAgentLoop({
  sessionId,
  user,
  userMessage,
  contextShopId = null,
  confirmToken = null,
}) {
  // 1. Handle confirmation token if supplied
  if (confirmToken) {
    markTokenConfirmed(confirmToken, user.id);
  } else if (isAffirmativeConfirmation(userMessage)) {
    // If affirmative text, find last confirmation proposal in chat
    const { data: lastToolMsg } = await supabaseAdmin
      .from('chat_messages')
      .select('tool_payload')
      .eq('session_id', sessionId)
      .eq('role', 'tool')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastToolMsg?.tool_payload?.confirmation_token) {
      markTokenConfirmed(lastToolMsg.tool_payload.confirmation_token, user.id);
    }
  }

  // 2. Fetch context shop name if provided
  let contextShopName = 'None (browsing platform)';
  if (contextShopId) {
    const { data: s } = await supabaseAdmin.from('shops').select('name').eq('id', contextShopId).maybeSingle();
    if (s) contextShopName = s.name;
  }

  // 3. Persist user message
  await supabaseAdmin.from('chat_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: userMessage,
  });

  // 4. Fetch recent chat history
  const { data: history = [] } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content, tool_name, tool_payload')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(ASSISTANT_CONFIG.MAX_CHAT_HISTORY);

  // 5. Build dynamic system prompt
  const systemInstruction = buildSystemPrompt({
    nowUtc: new Date().toISOString(),
    userTimezone: 'Asia/Kolkata',
    customerFirstName: user.full_name?.split(' ')[0] || 'there',
    contextShopName,
  });

  // 6. Format contents for Gemini SDK
  const contents = [];

  for (const msg of history) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
    } else if (msg.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: msg.content || '' }] });
    } else if (msg.role === 'tool') {
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: msg.tool_name,
              response: msg.tool_payload || {},
            },
          },
        ],
      });
    }
  }

  // Accumulator for client UI cards built deterministically from server tool outputs
  const uiAccumulator = {};
  let finalReply = '';
  let iterations = 0;

  try {
    while (iterations < ASSISTANT_CONFIG.MAX_TOOL_ITERATIONS) {
      iterations++;

      const response = await executeGeminiWithRetry(() =>
        ai.models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction,
            temperature: ASSISTANT_CONFIG.TEMPERATURE,
            maxOutputTokens: ASSISTANT_CONFIG.MAX_OUTPUT_TOKENS,
            tools: [{ functionDeclarations: toolDeclarations }],
          },
        })
      );

      const candidate = response?.candidates?.[0];
      const modelParts = candidate?.content?.parts || [];

      // Check for function calls
      const functionCalls = modelParts.filter((p) => p.functionCall).map((p) => p.functionCall);

      if (functionCalls.length > 0) {
        // Append model call turn to contents
        contents.push({ role: 'model', parts: modelParts });

        const functionResponseParts = [];

        for (const call of functionCalls) {
          const result = await executeTool(call.name, call.args || {}, {
            user,
            uiAccumulator,
            sessionId,
          });

          // Save to chat_messages
          await supabaseAdmin.from('chat_messages').insert({
            session_id: sessionId,
            role: 'tool',
            tool_name: call.name,
            tool_payload: result,
          });

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: result,
            },
          });
        }

        // Append tool responses turn
        contents.push({ role: 'user', parts: functionResponseParts });
      } else {
        // Text reply received
        finalReply = modelParts.map((p) => p.text || '').join('').trim();
        break;
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Gemini agent loop encountered an error');
    // Graceful fallback if Gemini is offline or fails
    finalReply =
      "I'm currently having trouble processing requests at the moment. You can still explore shops and book directly using the booking form on the shop page!";
  }

  if (!finalReply) {
    finalReply = "I've checked the details for you. How would you like to proceed?";
  }

  // Persist assistant message
  await supabaseAdmin.from('chat_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: finalReply,
  });

  // Dynamic suggested replies based on UI state
  const suggestedReplies = [];
  if (uiAccumulator.confirmation) {
    suggestedReplies.push('Yes, please confirm');
    suggestedReplies.push('Change time slot');
  } else if (uiAccumulator.slots && uiAccumulator.slots.length > 0) {
    suggestedReplies.push(`Book ${uiAccumulator.slots[0].label}`);
    if (uiAccumulator.slots[1]) suggestedReplies.push(`Book ${uiAccumulator.slots[1].label}`);
  } else if (uiAccumulator.shops && uiAccumulator.shops.length > 0) {
    suggestedReplies.push(`View services for ${uiAccumulator.shops[0].name}`);
    suggestedReplies.push('Check available slots tomorrow');
  } else {
    suggestedReplies.push('Find haircut shops near Siripuram');
    suggestedReplies.push('Check dental clinics in Jubilee Hills');
    suggestedReplies.push('View my upcoming bookings');
  }

  return {
    reply: finalReply,
    ui: Object.keys(uiAccumulator).length > 0 ? uiAccumulator : undefined,
    suggested_replies: suggestedReplies.slice(0, 4),
  };
}

