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

  it('GET /inventory/items supports cursor pagination scenario with clean termination', async () => {
    // 1. Baseline
    const resBaseline = await app.inject({
      method: 'GET',
      url: '/inventory/items'
    });
    expect(resBaseline.statusCode).toBe(200);
    const bodyBase = resBaseline.json();
    expect(bodyBase.page).toBe(1);
    expect(bodyBase.total).toBe(3);
    expect(bodyBase.items.length).toBe(3);

    // 2. Inject scenario
    const resInject = await app.inject({
      method: 'POST',
      url: '/scenarios/inventory.cursor-pagination/inject'
    });
    expect(resInject.statusCode).toBe(200);

    // 3. First page (no cursor)
    const resPage1 = await app.inject({
      method: 'GET',
      url: '/inventory/items'
    });
    expect(resPage1.statusCode).toBe(200);
    const bodyPage1 = resPage1.json();
    expect(bodyPage1.items.length).toBe(2);
    expect(bodyPage1.items[0].sku).toBe('WIDGET-A');
    expect(bodyPage1.items[1].sku).toBe('GADGET-B');
    expect(bodyPage1.next_cursor).toBe('cur_inv_page_2');
    expect(bodyPage1.has_more).toBe(true);
    expect(bodyPage1.page).toBeUndefined();
    expect(bodyPage1.total).toBeUndefined();

    // 4. Second page (using next_cursor)
    const resPage2 = await app.inject({
      method: 'GET',
      url: `/inventory/items?cursor=${bodyPage1.next_cursor}`
    });
    expect(resPage2.statusCode).toBe(200);
    const bodyPage2 = resPage2.json();
    expect(bodyPage2.items.length).toBe(1);
    expect(bodyPage2.items[0].sku).toBe('SENSOR-C');
    expect(bodyPage2.next_cursor).toBeNull();
    expect(bodyPage2.has_more).toBe(false);

    // 5. Exhausted / invalid cursor
    const resExhausted = await app.inject({
      method: 'GET',
      url: '/inventory/items?cursor=cur_exhausted'
    });
    expect(resExhausted.statusCode).toBe(200);
    expect(resExhausted.json().items).toEqual([]);
    expect(resExhausted.json().next_cursor).toBeNull();

    // 6. Reset restores default page-number behavior
    await app.inject({
      method: 'POST',
      url: '/scenarios/reset'
    });
    const resReset = await app.inject({
      method: 'GET',
      url: '/inventory/items'
    });
    expect(resReset.json().page).toBe(1);
    expect(resReset.json().total).toBe(3);
  });
});
