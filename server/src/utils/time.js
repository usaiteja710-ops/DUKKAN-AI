import { format, parseISO, isValid, addMinutes, differenceInMinutes, isBefore, isAfter } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a UTC ISO string or Date into a human-readable string in shop's timezone
 * @param {string | Date} date
 * @param {string} [timeZone='Asia/Kolkata']
 * @param {string} [pattern='PPpp']
 * @returns {string}
 */
export function formatInShopTz(date, timeZone = DEFAULT_TIMEZONE, pattern = 'PPP p') {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    return formatZoned(toZonedTime(d, timeZone), pattern, { timeZone });
  } catch {
    return String(date);
  }
}

/**
 * Format time slot label (e.g. "10:30 AM") in shop's timezone
 * @param {string | Date} date
 * @param {string} [timeZone='Asia/Kolkata']
 * @returns {string}
 */
export function formatSlotTime(date, timeZone = DEFAULT_TIMEZONE) {
  return formatInShopTz(date, timeZone, 'hh:mm a');
}

/**
 * Check if a timezone string is valid IANA timezone
 * @param {string} tz
 * @returns {boolean}
 */
export function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

