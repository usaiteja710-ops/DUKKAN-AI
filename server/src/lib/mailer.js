import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let resendClient = null;
if (env.RESEND_API_KEY && env.RESEND_API_KEY.startsWith('re_')) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

let smtpTransporter = null;
if (env.SMTP_HOST && env.SMTP_USER) {
  smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send booking confirmation email
 * @param {Object} options
 * @param {string} options.to - Customer email
 * @param {string} options.customerName
 * @param {string} options.shopName
 * @param {string} options.shopAddress
 * @param {string} options.shopPhone
 * @param {string} options.serviceName
 * @param {string} options.slotTimeFormatted
 * @param {string} options.duration
 * @param {string|number} options.price
 * @param {string} options.referenceCode
 * @param {number} options.cancellationWindowHours
 */
export async function sendBookingConfirmationEmail(options) {
  const {
    to,
    customerName,
    shopName,
    shopAddress,
    shopPhone,
    serviceName,
    slotTimeFormatted,
    duration,
    price,
    referenceCode,
    cancellationWindowHours = 2,
  } = options;

  const safeCustomerName = escapeHtml(customerName);
  const safeShopName = escapeHtml(shopName);
  const safeShopAddress = escapeHtml(shopAddress);
  const safeShopPhone = escapeHtml(shopPhone);
  const safeServiceName = escapeHtml(serviceName);
  const safeSlotTime = escapeHtml(slotTimeFormatted);
  const safeRef = escapeHtml(referenceCode);

  const subject = `Booking Confirmed: ${safeServiceName} at ${safeShopName} (${safeRef})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Booking is Confirmed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; }
    .header { text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
    .badge { display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; padding: 4px 12px; border-radius: 9999px; font-size: 14px; }
    .ref { font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #0284c7; }
    .details { margin: 24px 0; background: #f8fafc; border-radius: 8px; padding: 16px 20px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-size: 14px; }
    .value { font-weight: 600; font-size: 14px; text-align: right; }
    .policy { font-size: 13px; color: #64748b; background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; }
    .footer a { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Appointment Confirmed</span>
      <h2 style="margin: 12px 0 6px 0; color: #0f172a;">Hello, ${safeCustomerName}!</h2>
      <p style="margin: 0; color: #64748b; font-size: 15px;">Your appointment at <strong>${safeShopName}</strong> has been secured.</p>
      <p style="margin-top: 14px;">Reference Code: <span class="ref">${safeRef}</span></p>
    </div>

    <div class="details">
      <div class="row">
        <span class="label">Service</span>
        <span class="value">${safeServiceName}</span>
      </div>
      <div class="row">
        <span class="label">Date & Time</span>
        <span class="value">${safeSlotTime}</span>
      </div>
      <div class="row">
        <span class="label">Estimated Duration</span>
        <span class="value">${duration} mins</span>
      </div>
      <div class="row">
        <span class="label">Amount Payable at Shop</span>
        <span class="value">₹${price}</span>
      </div>
      <div class="row">
        <span class="label">Shop Location</span>
        <span class="value">${safeShopAddress}</span>
      </div>
      <div class="row">
        <span class="label">Shop Contact</span>
        <span class="value">${safeShopPhone}</span>
      </div>
    </div>

    <div class="policy">
      <strong>Cancellation & Reschedule Policy:</strong> You may reschedule or cancel your appointment free of charge up to <strong>${cancellationWindowHours} hours</strong> before the scheduled start time directly from your BookWise dashboard.
    </div>

    <div class="footer">
      <p>Thank you for choosing BookWise Local.</p>
      <p><a href="http://localhost:5173/profile">Notification Preferences</a> • <a href="http://localhost:5173/privacy">Privacy Policy</a> • <a href="http://localhost:5173/profile#unsubscribe">Unsubscribe from reminders</a></p>
    </div>
  </div>
</body>
</html>
  `;

  // Delivery mechanism
  try {
    if (resendClient) {
      await resendClient.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      logger.info({ to, referenceCode }, 'Sent confirmation email via Resend');
      return true;
    } else if (smtpTransporter) {
      await smtpTransporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      logger.info({ to, referenceCode }, 'Sent confirmation email via SMTP');
      return true;
    } else {
      logger.info({ to, referenceCode, subject }, 'Simulated confirmation email (no SMTP/Resend configured in dev)');
      return true;
    }
  } catch (err) {
    logger.error({ err: err.message, to, referenceCode }, 'Failed to deliver confirmation email');
    return false;
  }
}

