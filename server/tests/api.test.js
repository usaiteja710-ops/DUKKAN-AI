import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAdmin } from '../src/lib/supabase.js';

describe('HTTP API Endpoints & Validation', () => {
  it('GET /api/health returns healthy status code 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /api/categories returns category list', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation((table) => {
      if (table === 'categories') {
        return {
          select: () => ({
            order: async () => ({
              data: [
                { id: '1', slug: 'salon-beauty', name: 'Salon & Beauty' },
                { id: '2', slug: 'barber-shop', name: 'Barber Shop' },
              ],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('POST /api/bookings without auth header returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/bookings with auth but invalid body returns 400 VALIDATION_ERROR with field errors', async () => {
    // Uses development mock token
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer mock-jwt-123-customer')
      .send({
        shop_id: 'not-a-uuid',
        customer_email: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fieldErrors).toHaveProperty('shop_id');
    expect(res.body.error.details.fieldErrors).toHaveProperty('service_id');
    expect(res.body.error.details.fieldErrors).toHaveProperty('customer_email');
  });
});

