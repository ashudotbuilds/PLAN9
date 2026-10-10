import { describe, it, expect, beforeEach, vi } from 'vitest';

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

  describe('Ticket 02: A03 Baseline Capture & A15 Workflow Replay', () => {
    const createMockFetch = (overrides: Record<string, any> = {}) => {
      return async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (overrides[urlStr]) {
          return overrides[urlStr];
        }
        if (urlStr.includes('/users/u-123')) {
          return { ok: true, json: async () => ({ id: 'u-123', name: 'Aarav' }) };
        }
        if (urlStr.includes('/users/u-456')) {
          return { ok: true, json: async () => ({ id: 'u-456', name: 'Meera' }) };
        }
        if (urlStr.includes('/users/u-789')) {
          return { ok: true, json: async () => ({ id: 'u-789', name: 'Kabir' }) };
        }
        if (urlStr.includes('/inventory/items')) {
          return {
            ok: true,
            json: async () => ({
              items: [
                { id: 'inv-1', sku: 'WIDGET-A', quantity: 45, in_stock: true },
                { id: 'inv-2', sku: 'GADGET-B', quantity: 20, in_stock: true }
              ],
              total: 2
            })
          };
        }
        if (urlStr.includes('/shipping/estimate')) {
          return {
            ok: true,
            json: async () => ({ estimated_delivery_date: '2026-10-18' })
          };
        }
        return { ok: false, status: 404, message: 'Not found' };
      };
    };

    it('requires operator authentication for capture and replay', async () => {
      const captureRes = await app.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(captureRes.statusCode).toBe(401);

      const replayRes = await app.inject({
        method: 'POST',
        url: '/api/workflows/welcome_email/replay',
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(replayRes.statusCode).toBe(401);
    });

    it('captures baseline across all fixtures with deterministic fingerprint', async () => {
      const mockFetch = createMockFetch();
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.baseline.version).toBe(1);
      expect(body.baseline.fingerprint).toBeDefined();
      expect(body.baseline.fixtures.usersCount).toBe(3);
      expect(body.baseline.fixtures.inventoryItemsCount).toBe(2);
      expect(body.baseline.fixtures.shippingCalculated).toBe(true);

      // Verify traced read edges
      expect(body.readEdges.length).toBeGreaterThanOrEqual(4);
      const emailEdge = body.readEdges.find((e: any) => e.workflowId === 'welcome_email');
      expect(emailEdge).toBeDefined();
      expect(emailEdge.canonicalField).toBe('user.displayName');
      expect(emailEdge.providerField).toBe('name');

      const profileEdge = body.readEdges.find((e: any) => e.workflowId === 'customer_profile' && e.canonicalField === 'user.id');
      expect(profileEdge).toBeDefined();

      // Second equivalent capture produces equivalent fingerprint
      const res2 = await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(res2.statusCode).toBe(201);
      expect(res2.json().baseline.fingerprint).toBe(body.baseline.fingerprint);
    });

    it('enforces shared demo lease lock across competing scopes (409 DEMO_SCOPE_BUSY)', async () => {
      const mockFetch = createMockFetch();
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService });

      // Scope 1 captures
      const res1 = await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_scope_1',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(res1.statusCode).toBe(201);

      // Scope 2 competes
      const res2 = await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_scope_2',
          environment: 'development',
          sessionId: 'sess_2'
        }
      });
      expect(res2.statusCode).toBe(409);
      expect(res2.json().error.code).toBe('DEMO_SCOPE_BUSY');
    });

    it('fails with 502 BASELINE_CAPTURE_FAILED on provider error', async () => {
      const failingFetch = async () => ({ ok: false, status: 500, message: 'Provider offline' });
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const baselineService = new BaselineService({ fetchFn: failingFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(res.statusCode).toBe(502);
      expect(res.json().error.code).toBe('BASELINE_CAPTURE_FAILED');
    });

    it('replays all 4 consumer workflows and validates invariants against baseline', async () => {
      const mockFetch = createMockFetch();
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService });

      // First capture baseline
      await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });

      // 1. Replay welcome_email
      const resEmail = await testApp.inject({
        method: 'POST',
        url: '/api/workflows/welcome_email/replay',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(resEmail.statusCode).toBe(200);
      const emailBody = resEmail.json();
      expect(emailBody.status).toBe('passed');
      expect(emailBody.readFields).toContain('user.displayName');
      expect(emailBody.result.recipientName).toBe('Aarav');

      // 2. Replay customer_profile
      const resProfile = await testApp.inject({
        method: 'POST',
        url: '/api/workflows/customer_profile/replay',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(resProfile.statusCode).toBe(200);
      const profileBody = resProfile.json();
      expect(profileBody.status).toBe('passed');
      expect(profileBody.readFields).toContain('user.id');
      expect(profileBody.readFields).toContain('user.displayName');

      // 3. Replay inventory_sync
      const resInv = await testApp.inject({
        method: 'POST',
        url: '/api/workflows/inventory_sync/replay',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(resInv.statusCode).toBe(200);
      const invBody = resInv.json();
      expect(invBody.status).toBe('passed');
      expect(invBody.readFields).toContain('inventory.items');

      // 4. Replay delivery_estimate
      const resShip = await testApp.inject({
        method: 'POST',
        url: '/api/workflows/delivery_estimate/replay',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(resShip.statusCode).toBe(200);
      const shipBody = resShip.json();
      expect(shipBody.status).toBe('passed');
      expect(shipBody.readFields).toContain('shipping.estimated_delivery_date');
    });

    it('rejects replay for unknown workflow with 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/workflows/unknown_workflow/replay',
        headers: {
          [OPERATOR_TOKEN_HEADER]: testToken
        },
        payload: {
          projectId: 'prj_demo_default',
          environment: 'development',
          sessionId: 'sess_1'
        }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('WORKFLOW_NOT_FOUND');
    });
  });

  describe('Ticket 03: A05 Scenario Injection, A06 Observation & A07/A08 Incident Management', () => {
    it('requires operator authentication for inject, observe, and incident endpoints', async () => {
      const injectRes = await app.inject({
        method: 'POST',
        url: '/api/scenarios/users.field-rename/inject',
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });
      expect(injectRes.statusCode).toBe(401);

      const obsRes = await app.inject({
        method: 'POST',
        url: '/api/observations/run',
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });
      expect(obsRes.statusCode).toBe(401);

      const listRes = await app.inject({
        method: 'GET',
        url: '/api/incidents'
      });
      expect(listRes.statusCode).toBe(401);
    });

    it('injects scenario users.field-rename via mock provider (A05)', async () => {
      const mockFetch = vi.fn(async (url: string | URL | Request) => {
        if (String(url).includes('/scenarios/users.field-rename/inject')) {
          return { ok: true, json: async () => ({ ok: true, activeScenarios: ['users.field-rename'] }) };
        }
        return { ok: false, status: 404 };
      });

      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService();
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/scenarios/users.field-rename/inject',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.scenarioId).toBe('users.field-rename');
      expect(body.activeScenarios).toContain('users.field-rename');
      expect(body.auditEventId).toBeDefined();
    });

    it('observes drift, detects user rename incident, deduplicates and verifies evidence (A06, A07, A08)', async () => {
      let isRenamed = false;
      const mockFetch = vi.fn(async (url: string | URL | Request) => {
        const u = String(url);
        if (u.includes('/users/u-123')) {
          return { ok: true, json: async () => isRenamed ? { id: 'u-123', display_name: 'Aarav' } : { id: 'u-123', name: 'Aarav' } };
        }
        if (u.includes('/users/u-456')) {
          return { ok: true, json: async () => isRenamed ? { id: 'u-456', display_name: 'Meera' } : { id: 'u-456', name: 'Meera' } };
        }
        if (u.includes('/users/u-789')) {
          return { ok: true, json: async () => isRenamed ? { id: 'u-789', display_name: 'Kabir' } : { id: 'u-789', name: 'Kabir' } };
        }
        if (u.includes('/inventory/items')) {
          return { ok: true, json: async () => ({ items: [{ id: '1', sku: 'A', quantity: 10, in_stock: true }], total: 1 }) };
        }
        if (u.includes('/shipping/estimate')) {
          return { ok: true, json: async () => ({ estimated_delivery_date: '2026-10-18' }) };
        }
        if (u.includes('/scenarios/users.field-rename/inject')) {
          isRenamed = true;
          return { ok: true, json: async () => ({ ok: true, activeScenarios: ['users.field-rename'] }) };
        }
        return { ok: false, status: 404 };
      });

      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      // 1. Capture healthy baseline
      await testApp.inject({
        method: 'POST',
        url: '/api/baselines/capture',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });

      // 2. Inject scenario
      await testApp.inject({
        method: 'POST',
        url: '/api/scenarios/users.field-rename/inject',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });

      // 3. Run observations
      const obsRes = await testApp.inject({
        method: 'POST',
        url: '/api/observations/run',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });
      expect(obsRes.statusCode).toBe(200);
      const obsBody = obsRes.json();
      expect(obsBody.findings.length).toBe(2);
      expect(obsBody.findings.some((f: any) => f.type === 'field_removed' && f.fieldName === 'name')).toBe(true);
      expect(obsBody.findings.some((f: any) => f.type === 'field_added' && f.fieldName === 'display_name')).toBe(true);
      expect(obsBody.incident).toBeDefined();
      expect(obsBody.incident.severity).toBe('high');
      expect(obsBody.incident.evidenceStrength).toBe('confirmed');
      expect(obsBody.incident.affectedWorkflows).toContain('welcome_email');
      expect(obsBody.incident.affectedWorkflows).toContain('customer_profile');

      const incidentId = obsBody.incident.id;

      // 4. Repeated observation reuses active incident fingerprint (deduplication)
      const repeatRes = await testApp.inject({
        method: 'POST',
        url: '/api/observations/run',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });
      expect(repeatRes.statusCode).toBe(200);
      const repeatBody = repeatRes.json();
      expect(repeatBody.incidents.length).toBe(1);
      expect(repeatBody.incident.id).toBe(incidentId);

      // 5. List incidents (A07)
      const listRes = await testApp.inject({
        method: 'GET',
        url: '/api/incidents?projectId=prj_demo_default&environment=development',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      expect(listRes.statusCode).toBe(200);
      expect(listRes.json().incidents.length).toBe(1);

      // 6. Get incident detail (A08)
      const detailRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      expect(detailRes.statusCode).toBe(200);
      const detail = detailRes.json().incident;
      expect(detail.id).toBe(incidentId);
      expect(detail.beforeEvidence.users).toBeDefined();
      expect(detail.afterEvidence.users).toBeDefined();
      expect(detail.failedWorkflows.length).toBe(2);
    });
  });
});


