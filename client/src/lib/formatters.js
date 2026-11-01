import { format, parseISO, isValid } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Format currency in Indian Rupees (INR)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a UTC ISO string into localized shop date
 * @param {string|Date} date
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @param {string} [pattern='EEE, dd MMM yyyy']
 * @returns {string}
 */
export function formatLocalDate(date, timeZone = DEFAULT_TIMEZONE, pattern = 'EEE, dd MMM yyyy') {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    return formatZoned(toZonedTime(d, timeZone), pattern, { timeZone });
  } catch {
    return String(date);
  }
}

/**
 * Format time (e.g. "10:30 AM") in shop's timezone
 * @param {string|Date} date
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @returns {string}
 */
export function formatLocalTime(date, timeZone = DEFAULT_TIMEZONE) {
  return formatLocalDate(date, timeZone, 'hh:mm a');
}

/**
 * Format full date and time
 */
export function formatLocalDateTime(date, timeZone = DEFAULT_TIMEZONE) {
  return formatLocalDate(date, timeZone, 'dd MMM yyyy, hh:mm a');
}

