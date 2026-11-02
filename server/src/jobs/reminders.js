import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase.js';
import { sendBookingConfirmationEmail } from '../lib/mailer.js';
import { formatInShopTz } from '../utils/time.js';
import { logger } from '../lib/logger.js';
import { addHours } from 'date-fns';
import { inMemoryBookings } from '../lib/dbStore.js';

export function startReminderJob() {
  // Runs every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly appointment reminder cron job');
    try {
      const now = new Date();
      const windowStart = addHours(now, 23).toISOString();
      const windowEnd = addHours(now, 25).toISOString();

      let upcomingBookings = [];

      try {
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .select('*, shops(name, address_line, city, phone, timezone, cancellation_window_hours), services(name, duration_minutes)')
          .eq('reminder_sent', false)
          .in('status', ['confirmed'])
          .gte('start_time', windowStart)
          .lte('start_time', windowEnd);

        if (!error && Array.isArray(data)) {
          upcomingBookings = data;
        }
      } catch (e) {
        // Fallback to in-memory bookings
      }

      if (upcomingBookings.length === 0) {
        upcomingBookings = (inMemoryBookings || []).filter(
          (b) =>
            !b.reminder_sent &&
            b.status === 'confirmed' &&
            b.start_time >= windowStart &&
            b.start_time <= windowEnd
        );
      }

      for (const booking of upcomingBookings) {
        if (!booking.customer_email || !booking.shops || !booking.services) continue;

        const slotTimeFormatted = formatInShopTz(booking.start_time, booking.shops.timezone);

        await sendBookingConfirmationEmail({
          to: booking.customer_email,
          customerName: booking.customer_name,
          shopName: booking.shops.name,
          shopAddress: `${booking.shops.address_line || ''}, ${booking.shops.city}`,
          shopPhone: booking.shops.phone || '',
          serviceName: booking.services.name,
          slotTimeFormatted,
          duration: booking.services.duration_minutes,
          price: booking.price_at_booking,
          referenceCode: booking.reference_code,
          cancellationWindowHours: booking.shops.cancellation_window_hours,
        });

        booking.reminder_sent = true;
        try {
          await supabaseAdmin
            .from('bookings')
            .update({ reminder_sent: true })
            .eq('id', booking.id);
        } catch (e) {}
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Error during reminder cron job execution');
    }
  });
}
