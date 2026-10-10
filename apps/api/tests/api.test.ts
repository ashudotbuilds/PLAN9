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

      // 7. Analyze impact (A09 - Ticket 04)
      const impactRes = await testApp.inject({
        method: 'POST',
        url: `/api/incidents/${incidentId}/analyze-impact`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });
      expect(impactRes.statusCode).toBe(200);
      const impact = impactRes.json();
      expect(impact.status).toBe('completed');
      expect(impact.incidentId).toBe(incidentId);

      // Verify affected workflows
      const affectedIds = impact.affectedWorkflows.map((w: any) => w.workflowId);
      expect(affectedIds).toContain('welcome_email');
      expect(affectedIds).toContain('customer_profile');
      expect(affectedIds).not.toContain('inventory_sync');
      expect(affectedIds).not.toContain('delivery_estimate');

      const welcomeImpact = impact.affectedWorkflows.find((w: any) => w.workflowId === 'welcome_email');
      expect(welcomeImpact.status).toBe('affected');
      expect(welcomeImpact.canonicalField).toBe('displayName');
      expect(welcomeImpact.providerField).toBe('name');
      expect(welcomeImpact.invariant).toBe('nonempty_recipient_matches_baseline');
      expect(welcomeImpact.provenance).toBe('runtime_read');

      // Verify unaffected workflows
      const unaffectedIds = impact.unaffectedWorkflows.map((w: any) => w.workflowId);
      expect(unaffectedIds).toContain('inventory_sync');
      expect(unaffectedIds).toContain('delivery_estimate');
      const invImpact = impact.unaffectedWorkflows.find((w: any) => w.workflowId === 'inventory_sync');
      expect(invImpact.status).toBe('unaffected');
      expect(invImpact.provenance).toBe('runtime_read');

      // Verify trace paths
      expect(impact.tracePaths.length).toBe(2);
      expect(impact.tracePaths[0].provider).toBe('users');
      expect(impact.tracePaths[0].endpoint).toBe('/api/v1/users');
      expect(impact.tracePaths[0].declaredClient).toBe('users-client-sdk');
      expect(impact.tracePaths[0].canonicalAdapter).toBe('CanonicalUserAdapter');

      // 8. Re-fetch incident detail (A08) verifies impact analysis is retained
      const detailWithImpactRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      expect(detailWithImpactRes.statusCode).toBe(200);
      expect(detailWithImpactRes.json().incident.impactAnalysis).toBeDefined();
      expect(detailWithImpactRes.json().incident.impactAnalysis.affectedWorkflows.length).toBe(2);
    });

    it('returns 404 INCIDENT_NOT_FOUND when analyzing non-existent incident', async () => {
      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/incidents/inc_nonexistent/analyze-impact',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('INCIDENT_NOT_FOUND');
    });

    it('returns insufficient_evidence and unknown workflows when baseline lineage is missing', async () => {
      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });

      // Inject scenario and observe without baseline should fail observations or if baseline not captured
      // Manually add incident to test isolated lineage-missing impact analysis
      (incidentService as any).incidents.set('inc_test', {
        id: 'inc_test',
        projectId: 'prj_demo_default',
        environment: 'development',
        sessionId: 'sess_1',
        provider: 'users',
        endpoint: '/api/v1/users',
        fingerprint: 'fp_test',
        status: 'open',
        severity: 'high',
        summary: 'Drift test',
        detectedAt: new Date().toISOString(),
        evidenceStrength: 'confirmed',
        affectedWorkflows: ['welcome_email'],
        findings: [],
        beforeEvidence: {},
        afterEvidence: {},
        failedWorkflows: [],
        auditEventId: 'aud_1'
      });

      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/incidents/inc_test/analyze-impact',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_1' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('insufficient_evidence');
      expect(body.affectedWorkflows.length).toBe(0);
      expect(body.unknownWorkflows.length).toBe(4);
      expect(body.unknownWorkflows.every((w: any) => w.status === 'unknown')).toBe(true);
    });
  });

  describe('A10 & A08: Constrained Compatible Adapter Proposal', () => {
    it('proposes constrained compatible adapter with deterministic fallback and preserves id', async () => {
      let isRenamed = false;
      const mockFetch = vi.fn(async (url: any) => {
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
      const { IncidentService, AdapterRuntime } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      // Setup baseline & incident
      await baselineService.captureBaseline('prj_demo_default', 'development', 'sess_test');
      await testApp.inject({
        method: 'POST',
        url: '/api/scenarios/users.field-rename/inject',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken, [IDEMPOTENCY_KEY_HEADER]: 'idem-inj-prop' },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_test' }
      });

      const obsRes = await testApp.inject({
        method: 'POST',
        url: '/api/observations/run',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken, [IDEMPOTENCY_KEY_HEADER]: 'idem-obs-prop' },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_test' }
      });
      const incidentId = obsRes.json().incident.id;

      // Propose repair via A10
      const propRes = await testApp.inject({
        method: 'POST',
        url: `/api/incidents/${incidentId}/propose-repair`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(propRes.statusCode).toBe(200);
      const { proposal, auditEventId } = propRes.json();
      expect(proposal.id).toMatch(/^prop_/);
      expect(proposal.incidentId).toBe(incidentId);
      expect(proposal.patch.provider).toBe('users');
      expect(proposal.source).toBe('deterministic_fallback');
      expect(proposal.confidence).toBe(0.95);
      expect(proposal.uncertainties).toEqual([]);
      expect(proposal.evidenceRefs).toContain(incidentId);
      expect(proposal.requiredChecks.length).toBeGreaterThan(0);

      // Verify patch rules
      const patch = proposal.patch;
      expect(patch.rules.length).toBe(1);
      const rule = patch.rules[0];
      expect(rule.op).toBe('coalesce');
      expect(rule.sources).toEqual(['display_name', 'name']);
      expect(rule.targetField).toBe('displayName');
      expect(patch.preservedFields).toContain('id');
      expect(patch.diff).toContain('+displayName: raw.display_name ?? raw.name');

      // Test AdapterRuntime.apply directly
      const oldRec = { id: 'usr_1', name: 'Alice Old' };
      const newRec = { id: 'usr_2', display_name: 'Bob New' };
      const bothRec = { id: 'usr_3', display_name: 'Charlie Priority', name: 'Charlie Deprecated' };
      const emptyRec = { id: 'usr_4' };

      expect(AdapterRuntime.apply(oldRec, patch)).toEqual({ id: 'usr_1', displayName: 'Alice Old' });
      expect(AdapterRuntime.apply(newRec, patch)).toEqual({ id: 'usr_2', displayName: 'Bob New' });
      expect(AdapterRuntime.apply(bothRec, patch)).toEqual({ id: 'usr_3', displayName: 'Charlie Priority' });
      expect(AdapterRuntime.apply(emptyRec, patch)).toEqual({ id: 'usr_4', displayName: undefined });

      // Verify incident detail (A08) now includes the proposal
      const detailRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      expect(detailRes.statusCode).toBe(200);
      const detail = detailRes.json();
      expect(detail.incident.proposals).toBeDefined();
      expect(detail.incident.proposals.length).toBe(1);
      expect(detail.incident.proposals[0].id).toBe(proposal.id);
    });

    it('returns 404 INCIDENT_NOT_FOUND when proposing repair for unknown incident', async () => {
      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/incidents/inc_unknown/propose-repair',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('INCIDENT_NOT_FOUND');
    });

    it('returns 422 REPAIR_SYNTHESIS_FAILED when incident has insufficient evidence', async () => {
      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });

      (incidentService as any).incidents.set('inc_weak', {
        id: 'inc_weak',
        projectId: 'prj_demo_default',
        environment: 'development',
        sessionId: 'sess_weak',
        provider: 'inventory',
        endpoint: '/api/v1/items',
        fingerprint: 'fp_weak',
        status: 'open',
        severity: 'low',
        summary: 'Unknown drift',
        detectedAt: new Date().toISOString(),
        evidenceStrength: 'tentative',
        affectedWorkflows: [],
        findings: [],
        beforeEvidence: {},
        afterEvidence: {},
        failedWorkflows: [],
        auditEventId: 'aud_weak'
      });

      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/incidents/inc_weak/propose-repair',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe('UNSUPPORTED_DRIFT');
    });
  });

  describe('A11 & A08: Shadow Validation & Automatic Eligibility', () => {
    it('validates candidate patch in shadow isolation and passes all 9 FR-REP-07 gates', async () => {
      let isRenamed = false;
      const mockFetch = vi.fn(async (url: any) => {
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

      // Setup baseline, inject scenario, run observation, propose repair
      await baselineService.captureBaseline('prj_demo_default', 'development', 'sess_val');
      await testApp.inject({
        method: 'POST',
        url: '/api/scenarios/users.field-rename/inject',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken, [IDEMPOTENCY_KEY_HEADER]: 'idem-inj-val' },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_val' }
      });
      const obsRes = await testApp.inject({
        method: 'POST',
        url: '/api/observations/run',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken, [IDEMPOTENCY_KEY_HEADER]: 'idem-obs-val' },
        payload: { projectId: 'prj_demo_default', environment: 'development', sessionId: 'sess_val' }
      });
      const incidentId = obsRes.json().incident.id;

      const propRes = await testApp.inject({
        method: 'POST',
        url: `/api/incidents/${incidentId}/propose-repair`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      const proposal = propRes.json().proposal;
      const patchId = proposal.patch.id;
      const patchHash = proposal.patch.hash;

      // Validate candidate patch via A11
      const valRes = await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/validate`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', patchHash }
      });

      expect(valRes.statusCode).toBe(200);
      const { validationRun, auditEventId } = valRes.json();
      expect(validationRun.id).toMatch(/^val_/);
      expect(validationRun.patchId).toBe(patchId);
      expect(validationRun.patchHash).toBe(patchHash);
      expect(validationRun.incidentId).toBe(incidentId);
      expect(validationRun.status).toBe('passed');
      expect(validationRun.eligibility).toBe('eligible');

      // Verify all 9 gates
      expect(validationRun.gates.length).toBe(9);
      for (const gate of validationRun.gates) {
        expect(gate.status).toBe('passed');
      }
      const gateIds = validationRun.gates.map((g: any) => g.gateId);
      expect(gateIds).toContain('read_only_endpoint');
      expect(gateIds).toContain('structural_drift_only');
      expect(gateIds).toContain('allowed_operations_only');
      expect(gateIds).toContain('value_equivalence_identities');
      expect(gateIds).toContain('no_proposal_uncertainty');
      expect(gateIds).toContain('replay_safe_workflows');
      expect(gateIds).toContain('canonical_schema_and_invariants');
      expect(gateIds).toContain('patch_hash_match');
      expect(gateIds).toContain('no_unrelated_regression');

      // Verify workflow outcomes and side effect stubbing (FR-VAL-07)
      expect(validationRun.workflowOutcomes.length).toBe(4);
      const welcomeOutcome = validationRun.workflowOutcomes.find((w: any) => w.workflowId === 'welcome_email');
      expect(welcomeOutcome.status).toBe('passed');
      expect(welcomeOutcome.sideEffectStubbed).toBe(true);

      const profileOutcome = validationRun.workflowOutcomes.find((w: any) => w.workflowId === 'customer_profile');
      expect(profileOutcome.status).toBe('passed');

      const invOutcome = validationRun.workflowOutcomes.find((w: any) => w.workflowId === 'inventory_sync');
      expect(invOutcome.status).toBe('unchanged');

      // Verify incident detail (A08) retains validation run
      const detailRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      expect(detailRes.statusCode).toBe(200);
      const detail = detailRes.json();
      expect(detail.incident.validationRuns).toBeDefined();
      expect(detail.incident.validationRuns.length).toBe(1);
      expect(detail.incident.validationRuns[0].id).toBe(validationRun.id);
    });

    it('rejects candidate patch when candidate patch hash does not match (FR-VAL-05)', async () => {
      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });

      // Seed proposal
      const fakePatch = {
        id: 'patch_tamper_test',
        hash: 'original_hash_123',
        provider: 'users',
        targetEntity: 'CanonicalUser',
        version: 2,
        rules: [{ op: 'coalesce' as const, sources: ['display_name', 'name'], targetField: 'displayName' }],
        preservedFields: ['id'],
        diff: 'fake diff'
      };
      (incidentService as any).incidents.set('inc_val_test', {
        id: 'inc_val_test',
        projectId: 'prj_demo_default',
        environment: 'development',
        sessionId: 'sess_1',
        provider: 'users',
        endpoint: '/api/v1/users',
        fingerprint: 'fp_val',
        status: 'open',
        severity: 'high',
        summary: 'Drift test',
        detectedAt: new Date().toISOString(),
        evidenceStrength: 'confirmed',
        affectedWorkflows: ['welcome_email'],
        findings: [{ id: 'f1', type: 'field_removed', provider: 'users', endpoint: '/users', fieldName: 'name', path: '$.name', evidenceStrength: 'confirmed', description: 'removed' }],
        beforeEvidence: {},
        afterEvidence: {},
        failedWorkflows: [],
        proposals: [{
          id: 'prop_tamper',
          incidentId: 'inc_val_test',
          source: 'deterministic_fallback',
          recommendation: 'recommended',
          confidence: 0.95,
          patch: fakePatch,
          evidenceRefs: ['inc_val_test'],
          uncertainties: [],
          requiredChecks: ['test'],
          createdAt: new Date().toISOString(),
          auditEventId: 'aud_prop'
        }],
        auditEventId: 'aud_1'
      });

      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/patches/patch_tamper_test/validate',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', patchHash: 'tampered_candidate_hash' }
      });

      expect(res.statusCode).toBe(200);
      const { validationRun } = res.json();
      expect(validationRun.status).toBe('failed');
      expect(validationRun.eligibility).toBe('rejected');
      const hashGate = validationRun.gates.find((g: any) => g.gateId === 'patch_hash_match');
      expect(hashGate.status).toBe('failed');
    });

    it('returns 404 PATCH_NOT_FOUND when validating non-existent patch', async () => {
      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/patches/patch_nonexistent/validate',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('PATCH_NOT_FOUND');
    });
  });

  describe('Ticket 07: A12 Patch Activation, Post-Activation Replay & A13 Safe Rollback', () => {
    async function setupValidatedPatchApp() {
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');

      let isRenamed = false;
      const mockFetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes('/scenarios/users.field-rename/inject')) {
          isRenamed = true;
          return { ok: true, json: async () => ({ ok: true, activeScenarios: ['users.field-rename'] }) };
        }
        if (urlStr.includes('/users/')) {
          const id = urlStr.split('/users/')[1]?.split('?')[0] || 'u-123';
          const nameMap: Record<string, string> = { 'u-123': 'Aarav', 'u-456': 'Meera', 'u-789': 'Kabir' };
          const name = nameMap[id] || 'Aarav';
          return {
            ok: true,
            json: async () => (isRenamed ? { id, display_name: name } : { id, name })
          };
        }
        if (urlStr.includes('/inventory/items')) {
          return { ok: true, json: async () => ({ items: [{ sku: 'WIDGET-A', quantity: 15 }] }) };
        }
        if (urlStr.includes('/shipping/estimate')) {
          return { ok: true, json: async () => ({ estimated_delivery_date: '2026-10-18' }) };
        }
        return { ok: true, json: async () => ({}) };
      });

      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      await baselineService.captureBaseline('prj_demo_default', 'development', 'sess_1');

      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      await incidentService.injectScenario('users.field-rename', 'prj_demo_default', 'development', 'sess_1');
      const obsRes = await incidentService.runObservations('prj_demo_default', 'development', 'sess_1');
      const incidentId = obsRes.incident!.id;

      const propRes = incidentService.proposeRepair(incidentId, 'prj_demo_default', 'development', 'sess_1');
      const patchId = propRes.proposal.patch.id;
      const patchHash = propRes.proposal.patch.hash;

      // Validate the patch
      const valRes = await incidentService.validatePatch(patchId, 'prj_demo_default', 'development', patchHash);

      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });
      return { testApp, incidentId, patchId, patchHash, incidentService, baselineService };
    }

    it('requires operator authentication for activation and rollback', async () => {
      const resAct = await app.inject({
        method: 'POST',
        url: '/api/patches/patch_1/activate',
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(resAct.statusCode).toBe(401);

      const resRoll = await app.inject({
        method: 'POST',
        url: '/api/patches/patch_1/rollback',
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(resRoll.statusCode).toBe(401);
    });

    it('activates validated patch, executes post-activation replay, and transitions incident to recovered (A12)', async () => {
      const { testApp, patchId, patchHash, incidentId } = await setupValidatedPatchApp();

      const res = await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/activate`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', patchHash }
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.activeAdapter).toBeDefined();
      expect(data.activeAdapter.version).toBe(2);
      expect(data.activeAdapter.parentVersion).toBe(1);
      expect(data.activeAdapter.status).toBe('active');
      expect(data.activeAdapter.patchId).toBe(patchId);
      expect(data.recoveryStatus).toBe('recovered');
      expect(data.incidentStatus).toBe('recovered');
      expect(data.postActivationReplay.status).toBe('passed');
      expect(data.postActivationReplay.replays).toHaveLength(2);

      // Verify incident detail now reflects recovery and active adapter
      const incRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      const incDetail = incRes.json().incident;
      expect(incDetail.status).toBe('recovered');
      expect(incDetail.recoveryStatus).toBe('recovered');
      expect(incDetail.activeAdapter.version).toBe(2);
    });

    it('rejects activation if patch has not been validated with 409 PATCH_NOT_VALIDATED', async () => {
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');
      let isRenamed = false;
      const mockFetch = vi.fn(async (url: string | URL | Request) => {
        const u = String(url);
        if (u.includes('/scenarios/users.field-rename/inject')) {
          isRenamed = true;
          return { ok: true, json: async () => ({ ok: true, activeScenarios: ['users.field-rename'] }) };
        }
        if (u.includes('/users/')) {
          const id = u.split('/users/')[1]?.split('?')[0] || 'u-123';
          const nameMap: Record<string, string> = { 'u-123': 'Aarav', 'u-456': 'Meera', 'u-789': 'Kabir' };
          const name = nameMap[id] || 'Aarav';
          return { ok: true, json: async () => (isRenamed ? { id, display_name: name } : { id, name }) };
        }
        if (u.includes('/inventory/items')) {
          return { ok: true, json: async () => ({ items: [{ sku: 'WIDGET-A', quantity: 15 }] }) };
        }
        if (u.includes('/shipping/estimate')) {
          return { ok: true, json: async () => ({ estimated_delivery_date: '2026-10-18' }) };
        }
        return { ok: true, json: async () => ({}) };
      });
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      await baselineService.captureBaseline('prj_demo_default', 'development', 'sess_1');
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      await incidentService.injectScenario('users.field-rename', 'prj_demo_default', 'development', 'sess_1');
      const obsRes = await incidentService.runObservations('prj_demo_default', 'development', 'sess_1');
      const propRes = incidentService.proposeRepair(obsRes.incident!.id, 'prj_demo_default', 'development', 'sess_1');
      const patchId = propRes.proposal.patch.id;

      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      const res = await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/activate`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('PATCH_NOT_VALIDATED');
    });

    it('rejects activation if patch hash does not match candidate hash with 409 PATCH_HASH_MISMATCH', async () => {
      const { testApp, patchId } = await setupValidatedPatchApp();

      const res = await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/activate`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', patchHash: 'corrupted_or_different_hash' }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('PATCH_HASH_MISMATCH');
    });

    it('returns 404 PATCH_NOT_FOUND when activating non-existent patch', async () => {
      const { testApp } = await setupValidatedPatchApp();

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/patches/patch_nonexistent/activate',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('PATCH_NOT_FOUND');
    });

    it('rolls back active adapter to parent v1 and updates incident status (A13)', async () => {
      const { testApp, patchId, patchHash, incidentId } = await setupValidatedPatchApp();

      // First activate
      await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/activate`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', patchHash }
      });

      // Rollback via /api/patches/:patchId/rollback
      const rollRes = await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/rollback`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(rollRes.statusCode).toBe(200);
      const rollData = rollRes.json();
      expect(rollData.restoredAdapter.version).toBe(1);
      expect(rollData.incidentStatus).toBe('rolled_back');

      // Check incident reflects rolled_back
      const incRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      const incDetail = incRes.json().incident;
      expect(incDetail.status).toBe('rolled_back');
      expect(incDetail.recoveryStatus).toBe('rolled_back');
      expect(incDetail.activeAdapter.version).toBe(1);
    });

    it('supports A13 alias /api/adapters/:adapterId/rollback', async () => {
      const { testApp, patchId, patchHash } = await setupValidatedPatchApp();

      await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/activate`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development', patchHash }
      });

      const rollRes = await testApp.inject({
        method: 'POST',
        url: '/api/adapters/adp_v2/rollback',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(rollRes.statusCode).toBe(200);
      expect(rollRes.json().restoredAdapter.version).toBe(1);
    });

    it('rejects rollback if no parent adapter exists with 409 NO_ROLLBACK_PARENT', async () => {
      const { testApp, patchId } = await setupValidatedPatchApp();

      // Try rollback without prior activation (no active adapter with parentVersion)
      const rollRes = await testApp.inject({
        method: 'POST',
        url: `/api/patches/${patchId}/rollback`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(rollRes.statusCode).toBe(409);
      expect(rollRes.json().error.code).toBe('NO_ROLLBACK_PARENT');
    });
  });

  describe('Ticket 08: A16 Backend Recovery Workflow & A17 Status Polling', () => {
    async function setupIncidentApp() {
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');

      let isRenamed = false;
      const mockFetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes('/scenarios/users.field-rename/inject')) {
          isRenamed = true;
          return { ok: true, json: async () => ({ ok: true, activeScenarios: ['users.field-rename'] }) };
        }
        if (urlStr.includes('/users/')) {
          const id = urlStr.split('/users/')[1]?.split('?')[0] || 'u-123';
          const nameMap: Record<string, string> = { 'u-123': 'Aarav', 'u-456': 'Meera', 'u-789': 'Kabir' };
          const name = nameMap[id] || 'Aarav';
          return {
            ok: true,
            json: async () => (isRenamed ? { id, display_name: name } : { id, name })
          };
        }
        if (urlStr.includes('/inventory/items')) {
          return { ok: true, json: async () => ({ items: [{ sku: 'WIDGET-A', quantity: 15 }] }) };
        }
        if (urlStr.includes('/shipping/estimate')) {
          return { ok: true, json: async () => ({ estimated_delivery_date: '2026-10-18' }) };
        }
        return { ok: true, json: async () => ({}) };
      });

      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      await baselineService.captureBaseline('prj_demo_default', 'development', 'sess_1');

      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      await incidentService.injectScenario('users.field-rename', 'prj_demo_default', 'development', 'sess_1');
      const obsRes = await incidentService.runObservations('prj_demo_default', 'development', 'sess_1');
      const incidentId = obsRes.incident!.id;

      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });
      return { testApp, incidentId, baselineService, incidentService };
    }

    it('requires operator authentication for A16 recover and A17 poll', async () => {
      const recRes = await app.inject({
        method: 'POST',
        url: '/api/incidents/inc_1/recover',
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });
      expect(recRes.statusCode).toBe(401);

      const pollRes = await app.inject({
        method: 'GET',
        url: '/api/recovery-runs/rec_1'
      });
      expect(pollRes.statusCode).toBe(401);
    });

    it('starts recovery with 202 returning exactly recoveryRunId and incidentId, and completes successfully (A16, A17)', async () => {
      const { testApp, incidentId } = await setupIncidentApp();

      const startRes = await testApp.inject({
        method: 'POST',
        url: `/api/incidents/${incidentId}/recover`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(startRes.statusCode).toBe(202);
      const startBody = startRes.json();
      expect(Object.keys(startBody).sort()).toEqual(['incidentId', 'recoveryRunId']);
      expect(startBody.incidentId).toBe(incidentId);
      expect(startBody.recoveryRunId).toMatch(/^rec_/);

      const recoveryRunId = startBody.recoveryRunId;

      // Poll until completed
      let pollRes;
      let run;
      for (let i = 0; i < 20; i++) {
        pollRes = await testApp.inject({
          method: 'GET',
          url: `/api/recovery-runs/${recoveryRunId}`,
          headers: { [OPERATOR_TOKEN_HEADER]: testToken }
        });
        expect(pollRes.statusCode).toBe(200);
        run = pollRes.json().recoveryRun;
        if (run.status === 'succeeded' || run.status === 'failed') break;
        await new Promise((r) => setTimeout(r, 50));
      }

      expect(run.status).toBe('succeeded');
      expect(run.stage).toBe('completed');
      expect(run.incidentId).toBe(incidentId);
      expect(run.completedAt).toBeDefined();

      // Verify stage history contains expected sequence
      const stages = run.stageHistory.map((s: any) => s.stage);
      expect(stages).toContain('queued');
      expect(stages).toContain('impact');
      expect(stages).toContain('proposing');
      expect(stages).toContain('validating');
      expect(stages).toContain('activating');
      expect(stages).toContain('replaying');

      // Verify artifacts populated
      expect(run.artifacts.patchId).toBeDefined();
      expect(run.artifacts.patchHash).toBeDefined();
      expect(run.artifacts.validationRunId).toBeDefined();
      expect(run.artifacts.activeAdapterId).toBeDefined();

      // Verify incident is recovered
      const incRes = await testApp.inject({
        method: 'GET',
        url: `/api/incidents/${incidentId}?projectId=prj_demo_default&environment=development`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });
      const incident = incRes.json().incident;
      expect(incident.status).toBe('recovered');
      expect(incident.recoveryStatus).toBe('recovered');
    });

    it('rejects concurrent recovery on the same incident with 409 RECOVERY_ALREADY_RUNNING', async () => {
      const { testApp, incidentId, incidentService } = await setupIncidentApp();

      // Inject an active recovery run directly into incidentService to simulate in-flight run
      const conflictRes = await testApp.inject({
        method: 'POST',
        url: `/api/incidents/${incidentId}/recover`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(conflictRes.statusCode).toBe(202);
      const activeRunId = conflictRes.json().recoveryRunId;

      // Second immediate call on same incident while running or queued
      // Set the first run status explicitly to running to test concurrent guard
      const run = incidentService.getRecoveryRun(activeRunId);
      if (run) {
        run.status = 'running';
      }

      const secondRes = await testApp.inject({
        method: 'POST',
        url: `/api/incidents/${incidentId}/recover`,
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(secondRes.statusCode).toBe(409);
      expect(secondRes.json().error.code).toBe('RECOVERY_ALREADY_RUNNING');
    });

    it('rejects recovery on non-existent incident with 404 INCIDENT_NOT_FOUND', async () => {
      const { testApp } = await setupIncidentApp();

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/incidents/inc_nonexistent/recover',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('INCIDENT_NOT_FOUND');
    });

    it('returns 404 RECOVERY_RUN_NOT_FOUND when polling unknown run', async () => {
      const { testApp } = await setupIncidentApp();

      const res = await testApp.inject({
        method: 'GET',
        url: '/api/recovery-runs/rec_unknown',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken }
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('RECOVERY_RUN_NOT_FOUND');
    });

    it('rejects recovery when no baseline captured with 409 BASELINE_REQUIRED', async () => {
      const { BaselineService } = await import('../src/services/baseline-service.js');
      const { IncidentService } = await import('../src/services/incident-service.js');

      const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
      const baselineService = new BaselineService({ fetchFn: mockFetch as any });
      const incidentService = new IncidentService(baselineService, { fetchFn: mockFetch as any });
      const testApp = buildApiApp({ operatorToken: testToken, baselineService, incidentService });

      // Add dummy incident without capturing baseline
      (incidentService as any).incidents.set('inc_no_base', {
        id: 'inc_no_base',
        projectId: 'prj_demo_default',
        environment: 'development',
        sessionId: 'sess_1',
        provider: 'users',
        endpoint: '/users/:id',
        fingerprint: 'fp',
        status: 'detected',
        severity: 'high',
        summary: 'summary',
        detectedAt: new Date().toISOString(),
        evidenceStrength: 'confirmed',
        affectedWorkflows: ['welcome_email'],
        findings: [],
        beforeEvidence: {},
        afterEvidence: {},
        failedWorkflows: [],
        auditEventId: 'aud_1'
      });

      const res = await testApp.inject({
        method: 'POST',
        url: '/api/incidents/inc_no_base/recover',
        headers: { [OPERATOR_TOKEN_HEADER]: testToken },
        payload: { projectId: 'prj_demo_default', environment: 'development' }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('BASELINE_REQUIRED');
    });
  });
});


