import { supabaseAdmin } from '../lib/supabase.js';
import { subDays, parseISO, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export async function getShopAnalytics(shopId, range = '30d') {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const startDate = subDays(new Date(), days).toISOString();

  // Fetch shop timezone
  const { data: shop } = await supabaseAdmin.from('shops').select('timezone').eq('id', shopId).single();
  const timezone = shop?.timezone || 'Asia/Kolkata';

  // Fetch all bookings within range
  const { data: bookings = [] } = await supabaseAdmin
    .from('bookings')
    .select('id, service_id, status, price_at_booking, start_time, services(name)')
    .eq('shop_id', shopId)
    .gte('start_time', startDate)
    .order('start_time', { ascending: true });

  const totalBookings = bookings.length;
  let estimatedRevenue = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let noShowCount = 0;
  let confirmedCount = 0;

  const hourDistribution = {};
  const serviceDistribution = {};
  const dailySeries = {};

  for (const b of bookings) {
    if (['confirmed', 'completed'].includes(b.status)) {
      estimatedRevenue += Number(b.price_at_booking || 0);
    }
    if (b.status === 'completed') completedCount++;
    if (b.status === 'cancelled') cancelledCount++;
    if (b.status === 'no_show') noShowCount++;
    if (b.status === 'confirmed') confirmedCount++;

    // Peak hours calculation (in shop timezone)
    const localDate = toZonedTime(parseISO(b.start_time), timezone);
    const hour = localDate.getHours();
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;

    // Daily series
    const dayKey = format(localDate, 'yyyy-MM-dd');
    dailySeries[dayKey] = (dailySeries[dayKey] || 0) + 1;

    // Top services
    const sName = b.services?.name || 'General Service';
    serviceDistribution[sName] = (serviceDistribution[sName] || 0) + 1;
  }

  const noShowRate = totalBookings > 0 ? Number(((noShowCount / totalBookings) * 100).toFixed(1)) : 0;

  const topServices = Object.entries(serviceDistribution)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const peakHours = Object.entries(hourDistribution)
    .map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      label: `${parseInt(hour, 10) % 12 || 12}:00 ${parseInt(hour, 10) >= 12 ? 'PM' : 'AM'}`,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    range,
    kpis: {
      totalBookings,
      estimatedRevenue: Math.round(estimatedRevenue),
      completedCount,
      confirmedCount,
      cancelledCount,
      noShowCount,
      noShowRate,
    },
    topServices,
    peakHours,
    dailySeries: Object.entries(dailySeries).map(([date, count]) => ({ date, count })),
  };
}

