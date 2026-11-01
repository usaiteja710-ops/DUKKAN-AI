import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { ASSISTANT_CONFIG } from '../config/assistant.js';
import { logger } from './logger.js';

export const MODEL = env.GEMINI_MODEL || ASSISTANT_CONFIG.MODEL;

let clientInstance = null;

try {
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'dummy-gemini-key-for-local-testing') {
    clientInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  } else {
    // Development or test fallback
    clientInstance = new GoogleGenAI({ apiKey: 'dev-key-placeholder' });
  }
} catch (err) {
  logger.warn({ err: err.message }, 'GoogleGenAI client initialized in fallback mode');
}

export const ai = clientInstance;

/**
 * Executes a Gemini request with timeout and exponential backoff retry.
 * @param {Function} apiCallFn - Async function returning response
 * @param {number} [retries=ASSISTANT_CONFIG.EXPONENTIAL_BACKOFF_RETRIES]
 * @returns {Promise<any>}
 */
export async function executeGeminiWithRetry(apiCallFn, retries = ASSISTANT_CONFIG.EXPONENTIAL_BACKOFF_RETRIES) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), ASSISTANT_CONFIG.CALL_TIMEOUT_MS)
      );
      return await Promise.race([apiCallFn(), timeoutPromise]);
    } catch (error) {
      attempt++;
      const isRetryable =
        error.message === 'GEMINI_TIMEOUT' ||
        (error.status && [429, 500, 502, 503, 504].includes(error.status));

      if (attempt > retries || !isRetryable) {
        logger.error({ error: error.message, attempt }, 'Gemini API call failed after retries');
        throw error;
      }

      const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      logger.warn({ attempt, backoffMs }, 'Retrying Gemini API call');
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
}

