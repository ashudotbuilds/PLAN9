import { describe, it, expect, beforeEach } from 'vitest';
import { buildApiApp } from '../src/app.js';
import {
  CORRELATION_ID_HEADER,
  OPERATOR_TOKEN_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  OPERATOR_SESSION_COOKIE
} from '@driftguard/contracts';

describe('Control Plane API - Operator Auth & Projects', () => {
  let app: ReturnType<typeof buildApiApp>;
  const testToken = 'test-operator-token-123';

  beforeEach(() => {
    app = buildApiApp({ operatorToken: testToken });
  });

  it('GET /api/health is public and returns minimal readiness', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('api');
    expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
  });

  describe('A20: POST /api/operator/session', () => {
    it('authenticates with valid token and returns session cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/operator/session',
        headers: {
          origin: 'http://127.0.0.1:3000'
        },
        payload: {
          token: testToken
        }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.expiresAt).toBeDefined();
      expect(body.auditEventId).toBeDefined();

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(String(cookieHeader)).toContain(OPERATOR_SESSION_COOKIE);
      expect(String(cookieHeader)).toContain('HttpOnly');
    });

    it('rejects invalid operator token with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/operator/session',
        headers: {
          origin: 'http://127.0.0.1:3000'
        },
        payload: {
          token: 'wrong-token'
        }
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('INVALID_OPERATOR_TOKEN');
    });

    it('rejects unsafe origin with 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/operator/session',
        headers: {
          origin: 'http://evil-site.com'
        },
        payload: {
          token: testToken
        }
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN_ORIGIN');
    });

    it('permits scripted loopback access with operator header without Origin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/operator/session',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          token: testToken
        }
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().expiresAt).toBeDefined();
    });
  });

  describe('Guarded Operator Endpoints', () => {
    it('denies unauthenticated access to /api/projects with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects'
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('UNAUTHENTICATED_OPERATOR');
    });

    it('allows access using scripted operator header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().projects).toBeDefined();
    });

    it('allows access using operator session cookie', async () => {
      // 1. Login to obtain session cookie
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/operator/session',
        headers: { origin: 'http://127.0.0.1:3000' },
        payload: { token: testToken }
      });
      const cookieHeader = loginRes.headers['set-cookie'];

      // 2. Access /api/projects with cookie
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          cookie: Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader
        }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().projects).toBeDefined();
    });
  });

  describe('A21-A23: Project Management', () => {
    it('POST /api/projects requires Idempotency-Key header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: { name: 'Payments Integration' }
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('MISSING_IDEMPOTENCY_KEY');
    });

    it('creates a project with development and production environments', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken,
          [IDEMPOTENCY_KEY_HEADER]: 'idem-key-1'
        },
        payload: { name: 'Payments Integration' }
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.project.id).toMatch(/^prj_/);
      expect(body.project.name).toBe('Payments Integration');
      expect(body.project.environments).toEqual(['development', 'production']);
      expect(body.auditEventId).toBeDefined();

      // Idempotency: same key & payload returns same response
      const retryRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken,
          [IDEMPOTENCY_KEY_HEADER]: 'idem-key-1'
        },
        payload: { name: 'Payments Integration' }
      });
      expect(retryRes.statusCode).toBe(201);
      expect(retryRes.json().project.id).toBe(body.project.id);

      // Idempotency conflict: same key with different payload returns 409
      const conflictRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken,
          [IDEMPOTENCY_KEY_HEADER]: 'idem-key-1'
        },
        payload: { name: 'Different Name' }
      });
      expect(conflictRes.statusCode).toBe(409);
      expect(conflictRes.json().error.code).toBe('IDEMPOTENCY_CONFLICT');
    });

    it('GET /api/projects/:projectId returns details and 404 for unknown', async () => {
      // 1. Create project
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken,
          [IDEMPOTENCY_KEY_HEADER]: 'idem-key-detail'
        },
        payload: { name: 'Customer Service' }
      });
      const createdId = createRes.json().project.id;

      // 2. Fetch details
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/projects/${createdId}?environment=development`,
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        }
      });
      expect(detailRes.statusCode).toBe(200);
      const detail = detailRes.json();
      expect(detail.project.id).toBe(createdId);
      expect(detail.environmentState.environment).toBe('development');
      expect(detail.environmentState.activeSessionId).toBeDefined();

      // 3. Unknown project
      const notFoundRes = await app.inject({
        method: 'GET',
        url: '/api/projects/prj_non_existent',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        }
      });
      expect(notFoundRes.statusCode).toBe(404);
      expect(notFoundRes.json().error.code).toBe('PROJECT_NOT_FOUND');
    });
  });

  describe('A02 & A14: Demo State and Providers', () => {
    it('GET /api/demo/state returns active demo projection when authenticated', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/demo/state',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.projectId).toBeDefined();
      expect(body.sessionId).toBeDefined();
      expect(body.providers.length).toBe(3);
    });

    it('GET /api/providers returns list of mock dependency providers', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/providers',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.providers.length).toBe(3);
      expect(body.providers[0].name).toBe('Users API');
      expect(body.providers[1].name).toBe('Inventory API');
      expect(body.providers[2].name).toBe('Shipping API');
    });
  });
});
