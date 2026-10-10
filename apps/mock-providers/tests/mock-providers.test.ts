import { describe, it, expect, beforeEach } from 'vitest';
import { buildMockProvidersApp } from '../src/app.js';
import { CORRELATION_ID_HEADER } from '@driftguard/contracts';

describe('Mock Providers App', () => {
  let app: ReturnType<typeof buildMockProvidersApp>;

  beforeEach(() => {
    app = buildMockProvidersApp();
  });

  it('GET /health returns 200 with all providers ready', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('mock-providers');
    expect(body.providers.users).toBe('ready');
    expect(body.providers.inventory).toBe('ready');
    expect(body.providers.shipping).toBe('ready');
    expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
  });

  it('GET /users/:id returns user for known identity and 404 for unknown', async () => {
    const resAarav = await app.inject({
      method: 'GET',
      url: '/users/u-123'
    });
    expect(resAarav.statusCode).toBe(200);
    expect(resAarav.json()).toEqual({ id: 'u-123', name: 'Aarav' });

    const resUnknown = await app.inject({
      method: 'GET',
      url: '/users/u-999'
    });
    expect(resUnknown.statusCode).toBe(404);
    expect(resUnknown.json().error.code).toBe('USER_NOT_FOUND');
  });

  it('GET /inventory/items returns item list with deterministic defaults', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/inventory/items'
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.total).toBe(body.items.length);
  });

  it('GET /shipping/estimate calculates calendar days by default and business days when scenario injected', async () => {
    // 2026-10-09 is a Friday. Friday + 3 calendar days = Monday 2026-10-12
    const resBaseline = await app.inject({
      method: 'GET',
      url: '/shipping/estimate?ship_date=2026-10-09&delivery_days=3'
    });
    expect(resBaseline.statusCode).toBe(200);
    expect(resBaseline.json()).toEqual({ estimated_delivery_date: '2026-10-12' });

    // Inject scenario
    await app.inject({
      method: 'POST',
      url: '/scenarios/shipping.business-days/inject'
    });

    // Friday + 3 business days = Wednesday 2026-10-14
    const resDrift = await app.inject({
      method: 'GET',
      url: '/shipping/estimate?ship_date=2026-10-09&delivery_days=3'
    });
    expect(resDrift.statusCode).toBe(200);
    expect(resDrift.json()).toEqual({ estimated_delivery_date: '2026-10-14' });
  });

  it('GET /shipping/estimate returns 400 for invalid query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/shipping/estimate?ship_date=invalid&delivery_days=3'
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_QUERY');
  });
});
