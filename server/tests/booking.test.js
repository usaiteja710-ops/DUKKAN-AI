import { describe, it, expect, vi } from 'vitest';
import { updateBookingStatus, createBooking } from '../src/services/booking.service.js';
import { supabaseAdmin } from '../src/lib/supabase.js';

describe('Booking Service & State Machine', () => {
  it('enforces booking state machine and rejects invalid transitions with 409 INVALID_TRANSITION', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: 'booking-123',
                  status: 'completed',
                  shop_id: 'shop-123',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(
      updateBookingStatus('booking-123', 'pending', 'actor-123')
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'INVALID_TRANSITION',
    });
  });

  it('allows valid transitions: confirmed -> completed', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: { id: 'booking-123', status: 'completed' },
            error: null,
          }),
        }),
      }),
    });

    const mockInsertEvent = vi.fn().mockResolvedValue({});

    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'booking-123', status: 'confirmed' },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      if (table === 'booking_events') {
        return { insert: mockInsertEvent };
      }
      return {};
    });

    const result = await updateBookingStatus('booking-123', 'completed', 'actor-123', 'Customer attended');
    expect(result.status).toBe('completed');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('concurrent booking test: simultaneous requests for the same slot result in exactly one success and one 409 SLOT_TAKEN', async () => {
    let slotClaimed = false;

    // Simulate atomic RPC execution with exclusion constraint
    vi.spyOn(supabaseAdmin, 'rpc').mockImplementation(async (rpcName, params) => {
      if (rpcName === 'create_booking') {
        if (!slotClaimed) {
          slotClaimed = true;
          return {
            data: {
              id: 'booking-winner-uuid',
              reference_code: 'WIN12345',
              shop_id: params.p_shop_id,
              service_id: params.p_service_id,
              start_time: params.p_start,
              status: 'confirmed',
              price_at_booking: 299,
            },
            error: null,
          };
        } else {
          // Exclusion constraint violation
          return {
            data: null,
            error: {
              code: '23P01',
              message: 'exclusion constraint violation "no_overlap_per_staff"',
            },
          };
        }
      }
      return { data: null, error: null };
    });

    const bookingPayload = {
      shopId: '33333333-3333-3333-3333-333333333301',
      serviceId: '44444444-4444-4444-4444-444444444101',
      startTime: '2026-11-05T10:00:00.000Z',
      name: 'Simultaneous Customer',
      phone: '+919876543210',
      email: 'simul@example.com',
    };

    // Fire two simultaneous requests
    const [result1, result2] = await Promise.allSettled([
      createBooking(bookingPayload),
      createBooking(bookingPayload),
    ]);

    // Verify exactly one fulfilled and one rejected with 409 SLOT_TAKEN
    const fulfilled = [result1, result2].filter((r) => r.status === 'fulfilled');
    const rejected = [result1, result2].filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    expect(fulfilled[0].value.reference_code).toBe('WIN12345');
    expect(rejected[0].reason.statusCode).toBe(409);
    expect(rejected[0].reason.code).toBe('SLOT_TAKEN');
  });
});
