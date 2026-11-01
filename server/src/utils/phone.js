/**
 * Normalize Indian or E.164 phone numbers.
 * @param {string} phone
 * @returns {string} E.164 formatted string
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // If 10-digit Indian number, prefix with +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  // If starts with 0 and has 11 digits
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.substring(1)}`;
  }
  // If starts with 91 and has 12 digits
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

export function isValidPhone(phone) {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  // Validates standard E.164 (+ followed by 10 to 15 digits)
  return /^\+[1-9]\d{9,14}$/.test(normalized);
}

