import { describe, it, expect } from 'vitest';
import { computeAvailableSlots } from '../src/services/availability.service.js';

describe('Availability Engine (Pure Unit Tests)', () => {
  const shop = {
    timezone: 'Asia/Kolkata',
    slot_interval_minutes: 30,
    min_notice_hours: 1,
    max_advance_days: 30,
  };

  const service = {
    duration_minutes: 30,
    buffer_minutes: 0,
    price: 300,
  };

  const staff = [
    { id: 'staff-1', name: 'Master Barber', is_default: true, is_active: true },
  ];

  // Monday = day_of_week 1 (2026-11-02 is Monday)
  const businessHours = [
    { day_of_week: 1, open_time: '10:00:00', close_time: '13:00:00' }, // Morning
    { day_of_week: 1, open_time: '14:00:00', close_time: '18:00:00' }, // Afternoon (13:00-14:00 lunch break)
  ];

  it('generates correct candidate slots honoring business hours and lunch breaks', () => {
    // Current time is set to 2026-11-01 (day before), so notice window does not eliminate morning slots
    const currentDateTime = new Date('2026-11-01T12:00:00Z');
    const targetDate = '2026-11-02'; // Monday

    const slots = computeAvailableSlots({
      shop,
      service,
      staffMembers: staff,
      businessHours,
      timeOffList: [],
      existingBookings: [],
      targetDate,
      currentDateTime,
    });

    // Morning window: 10:00 to 13:00 with 30 min duration -> 10:00, 10:30, 11:00, 11:30, 12:00, 12:30 (6 slots)
    // Afternoon window: 14:00 to 18:00 with 30 min duration -> 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30 (8 slots)
    // Total = 14 slots. Crucially, NO slot starts at 13:00 or 13:30 (lunch break).
    expect(slots.length).toBe(14);

    const labels = slots.map((s) => s.label);
    expect(labels).toContain('10:00 AM');
    expect(labels).toContain('12:30 PM');
    expect(labels).not.toContain('01:00 PM');
    expect(labels).not.toContain('01:30 PM');
    expect(labels).toContain('02:00 PM');
    expect(labels).toContain('05:30 PM');
  });

  it('excludes slots overlapping with an existing booking', () => {
    const currentDateTime = new Date('2026-11-01T12:00:00Z');
    const targetDate = '2026-11-02';

    // Book 10:30 to 11:00 AM IST (in UTC: 10:30 AM IST = 05:00 UTC)
    const existingBookings = [
      {
        staff_id: 'staff-1',
        start_time: '2026-11-02T05:00:00.000Z', // 10:30 AM IST
        occupied_until: '2026-11-02T05:30:00.000Z', // 11:00 AM IST
        status: 'confirmed',
      },
    ];

    const slots = computeAvailableSlots({
      shop,
      service,
      staffMembers: staff,
      businessHours,
      timeOffList: [],
      existingBookings,
      targetDate,
      currentDateTime,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).toContain('10:00 AM');
    expect(labels).not.toContain('10:30 AM'); // Taken
    expect(labels).toContain('11:00 AM');
  });

  it('respects service buffer times to prevent back-to-back overlap', () => {
    const currentDateTime = new Date('2026-11-01T12:00:00Z');
    const targetDate = '2026-11-02';

    // Service has 45 min duration + 15 min buffer (takes 60 min total)
    const longService = {
      duration_minutes: 45,
      buffer_minutes: 15,
      price: 500,
    };

    // A booking exists at 11:00 to 11:30 AM IST (05:30 to 06:00 UTC)
    const existingBookings = [
      {
        staff_id: 'staff-1',
        start_time: '2026-11-02T05:30:00.000Z',
        occupied_until: '2026-11-02T06:00:00.000Z',
        status: 'confirmed',
      },
    ];

    const slots = computeAvailableSlots({
      shop,
      service: longService,
      staffMembers: staff,
      businessHours,
      timeOffList: [],
      existingBookings,
      targetDate,
      currentDateTime,
    });

    const labels = slots.map((s) => s.label);
    // 10:30 AM with 45m duration + 15m buffer would run until 11:30 AM, colliding with 11:00 booking
    expect(labels).not.toContain('10:30 AM');
  });

  it('enforces minimum notice window (cannot book slots starting too soon)', () => {
    // Current time is Monday 10:15 AM IST (04:45 UTC)
    const currentDateTime = new Date('2026-11-02T04:45:00.000Z');
    const targetDate = '2026-11-02';

    // Min notice is 2 hours, so no slots before 12:15 PM IST
    const noticeShop = {
      ...shop,
      min_notice_hours: 2,
    };

    const slots = computeAvailableSlots({
      shop: noticeShop,
      service,
      staffMembers: staff,
      businessHours,
      timeOffList: [],
      existingBookings: [],
      targetDate,
      currentDateTime,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).not.toContain('10:00 AM');
    expect(labels).not.toContain('11:00 AM');
    expect(labels).not.toContain('12:00 PM');
    expect(labels).toContain('12:30 PM');
  });

  it('blocks slots covered by shop-wide or staff time off', () => {
    const currentDateTime = new Date('2026-11-01T12:00:00Z');
    const targetDate = '2026-11-02';

    // Time off from 14:00 to 16:00 IST (08:30 to 10:30 UTC)
    const timeOffList = [
      {
        staff_id: null, // shop-wide holiday/block
        starts_at: '2026-11-02T08:30:00.000Z',
        ends_at: '2026-11-02T10:30:00.000Z',
      },
    ];

    const slots = computeAvailableSlots({
      shop,
      service,
      staffMembers: staff,
      businessHours,
      timeOffList,
      existingBookings: [],
      targetDate,
      currentDateTime,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).not.toContain('02:00 PM');
    expect(labels).not.toContain('02:30 PM');
    expect(labels).not.toContain('03:30 PM');
    expect(labels).toContain('04:00 PM');
  });
});

