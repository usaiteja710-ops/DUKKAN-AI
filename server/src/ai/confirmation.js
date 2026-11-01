import crypto from 'crypto';

// Token store: token -> { action, proposal, userId, expiresAt, confirmed }
const tokenStore = new Map();

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate and store a pending confirmation proposal
 * @param {string} action - 'book' | 'reschedule' | 'cancel'
 * @param {Object} proposal
 * @param {string} userId
 * @returns {string} token
 */
export function createConfirmationToken(action, proposal, userId) {
  const token = `cfm_${crypto.randomBytes(16).toString('hex')}`;
  tokenStore.set(token, {
    action,
    proposal,
    userId,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    confirmed: false,
  });

  // Cleanup old tokens
  if (tokenStore.size > 1000) {
    const now = Date.now();
    for (const [k, v] of tokenStore.entries()) {
      if (v.expiresAt < now) tokenStore.delete(k);
    }
  }

  return token;
}

/**
 * Mark token as explicitly approved by user (e.g. from UI "Confirm" button or strict text check)
 */
export function markTokenConfirmed(token, userId) {
  const entry = tokenStore.get(token);
  if (!entry || entry.userId !== userId || entry.expiresAt < Date.now()) {
    return false;
  }
  entry.confirmed = true;
  return true;
}

/**
 * Validate and consume a confirmation token for execution
 * @param {string} token
 * @param {string} userId
 * @param {string} expectedAction
 * @returns {Object|null} proposal
 */
export function consumeConfirmationToken(token, userId, expectedAction) {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (entry.userId !== userId) return null;
  if (entry.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  if (entry.action !== expectedAction) return null;
  if (!entry.confirmed) {
    // If not pre-confirmed via UI button, check affirmative
    return null;
  }

  // Consume token (single use)
  tokenStore.delete(token);
  return entry.proposal;
}

/**
 * Check if a text message is an unambiguous affirmative confirmation
 * @param {string} text
 * @returns {boolean}
 */
export function isAffirmativeConfirmation(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim().replace(/[!.,?]/g, '');
  const positives = [
    'yes',
    'confirm',
    'book it',
    'please book',
    'yes please',
    'yes confirm',
    'go ahead',
    'sure',
    'proceed',
    'okay',
    'ok',
    'yep',
    'yeah',
    'reschedule it',
    'cancel it',
  ];
  return positives.includes(clean);
}

