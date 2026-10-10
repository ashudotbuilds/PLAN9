import { describe, it, expect, beforeEach } from 'vitest';
import { buildApiApp } from '../src/app.js';
import { CORRELATION_ID_HEADER } from '@driftguard/contracts';

describe('Control Plane API', () => {
  let app: ReturnType<typeof buildApiApp>;

  beforeEach(() => {
    app = buildApiApp();
  });

  it('GET /api/health returns 200 with minimal readiness and correlation ID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('api');
    expect(body.timestamp).toBeDefined();
    // Must not leak secret or internal provider state
    expect(body.secrets).toBeUndefined();
    expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
  });

  it('GET non-existent route returns 404 with structured ErrorEnvelope', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/not-a-real-endpoint'
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(body.error.correlationId).toBeDefined();
  });

  it('GET /api/demo/state fails closed before ticket 28 operator onboarding', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/demo/state'
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe('UNAUTHENTICATED_OPERATOR');
  });
});
