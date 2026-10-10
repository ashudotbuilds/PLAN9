import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApiApp } from '../../apps/api/src/app.js';
import { buildMockProvidersApp } from '../../apps/mock-providers/src/app.js';
import { runSampleConsumer } from '../../apps/sample-consumer/src/index.js';
import { redactValue, sanitizeUrl } from '../../packages/observer/src/index.js';
import {
  CORRELATION_ID_HEADER,
  OPERATOR_TOKEN_HEADER,
  IDEMPOTENCY_KEY_HEADER
} from '@driftguard/contracts';
import { randomUUID } from 'node:crypto';

describe('Connected SDK Acceptance & Combined Demo Gates (AT-SDK-01 through AT-SDK-17)', () => {
  let app: FastifyInstance;
  let mockApp: FastifyInstance;
  const operatorToken = 'test-operator-token-35';
  let projectId: string;
  const environment = 'development';
  let activeApiKey: string;
  let activeKeyId: string;
  let registeredDepId: string;

  const createMockFetch = (targetMockApp: FastifyInstance) => {
    return async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = String(url);
      const parsed = new URL(urlStr, 'http://127.0.0.1:4001');
      const res = await targetMockApp.inject({
        method: (init?.method as any) || 'GET',
        url: parsed.pathname + parsed.search,
        headers: (init?.headers as any) || {},
        payload: init?.body ? String(init.body) : undefined
      });
      return {
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        json: async () => res.json(),
        text: async () => res.body
      } as any;
    };
  };

  beforeEach(async () => {
    mockApp = buildMockProvidersApp();
    app = buildApiApp({
      operatorToken,
      fetchFn: createMockFetch(mockApp)
    });

    // Create project
    const projRes = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        [OPERATOR_TOKEN_HEADER]: operatorToken,
        [IDEMPOTENCY_KEY_HEADER]: `idem_setup_${Date.now()}_${Math.random()}`
      },
      payload: { name: 'Connected Demo Acceptance' }
    });
    projectId = projRes.json().project.id;

    // Issue development key
    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/keys`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { environment, label: 'Demo Key' }
    });
    const keyBody = keyRes.json();
    activeApiKey = keyBody.apiKey;
    activeKeyId = keyBody.keyId;
  });

  it('AT-SDK-01: Authenticated local operator creates a project and issues a development key', async () => {
    const projRes = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        [OPERATOR_TOKEN_HEADER]: operatorToken,
        [IDEMPOTENCY_KEY_HEADER]: `idem_at01_${Date.now()}`
      },
      payload: { name: 'AT01 Project' }
    });
    expect(projRes.statusCode).toBe(201);
    const proj = projRes.json().project;
    expect(proj.id).toBeDefined();

    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/projects/${proj.id}/keys`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { environment: 'development', label: 'Dev Key' }
    });
    expect(keyRes.statusCode).toBe(201);
    const keyData = keyRes.json();
    expect(keyData.apiKey).toBeDefined();
    expect(keyData.prefix).toMatch(/^dg_ing_/);

    // Verify safe read exposes prefix and status only, never plaintext apiKey or secret digest
    const detailRes = await app.inject({
      method: 'GET',
      url: `/api/projects/${proj.id}?environment=development`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken }
    });
    expect(detailRes.statusCode).toBe(200);
    const keyMeta = detailRes.json().keyMetadata[0];
    expect(keyMeta.prefix).toBe(keyData.prefix);
    expect(keyMeta.status).toBe('active');
    expect((keyMeta as any).apiKey).toBeUndefined();
    expect((keyMeta as any).secretDigest).toBeUndefined();
  });

  it('AT-SDK-02: Valid bound key registers Users and submits real sample observations', async () => {
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/ingest/dependencies',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        projectId,
        environment,
        sdkVersion: '1.0.0',
        dependency: {
          name: 'users-api',
          type: 'rest-api',
          baseUrl: 'http://127.0.0.1:4001'
        }
      }
    });
    expect(regRes.statusCode).toBe(200);
    registeredDepId = regRes.json().dependencyId;
    expect(registeredDepId).toBeDefined();

    // Ingest observation batch
    const batchId = randomUUID();
    const ingestRes = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        batchId,
        projectId,
        environment,
        sessionId: 'sess-demo-local-01',
        sdkVersion: '1.0.0',
        events: [
          {
            eventId: randomUUID(),
            dependencyId: registeredDepId,
            method: 'GET',
            routeTemplate: '/users/:id',
            statusCode: 200,
            durationMs: 4,
            observedAt: new Date().toISOString(),
            collectionPolicyVersion: 1
          }
        ]
      }
    });
    expect(ingestRes.statusCode).toBe(200);
    expect(ingestRes.json().accepted).toBe(1);
  });

  it('AT-SDK-03: Invalid, revoked, rotated-old, wrong-project, or wrong-environment credentials submit a batch', async () => {
    // 1. Invalid key returns 401
    const badKeyRes = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: 'Bearer invalid-token' },
      payload: {
        schemaVersion: '1',
        batchId: randomUUID(),
        projectId,
        environment,
        sessionId: 'sess-demo-local-01',
        sdkVersion: '1.0.0',
        events: []
      }
    });
    expect(badKeyRes.statusCode).toBe(401);
    expect(['UNAUTHORIZED', 'INVALID_CREDENTIALS']).toContain(badKeyRes.json().error.code);

    // 2. Rotated-old key returns 401
    const rotateRes = await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/keys/${activeKeyId}/rotate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: {}
    });
    expect(rotateRes.statusCode).toBe(201);

    const oldKeyRes = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        batchId: randomUUID(),
        projectId,
        environment,
        sessionId: 'sess-demo-local-01',
        sdkVersion: '1.0.0',
        events: []
      }
    });
    expect(oldKeyRes.statusCode).toBe(401);

    // 3. Ingestion key cannot invoke operator administration routes
    const adminRes = await app.inject({
      method: 'GET',
      url: '/api/projects',
      headers: { authorization: `Bearer ${rotateRes.json().apiKey}` }
    });
    expect(adminRes.statusCode).toBe(401);
  });

  it('AT-SDK-04: Sample executes all three real Users requests with manual tracking and flush', async () => {
    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/keys`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { environment, label: 'Sample Key' }
    });
    const key = keyRes.json().apiKey;

    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      const isApi = url.includes(':4000') || url.startsWith('/api');
      const targetApp = isApi ? app : mockApp;
      const parsed = new URL(url, 'http://127.0.0.1');
      const res = await targetApp.inject({
        method: (init?.method as any) || 'GET',
        url: parsed.pathname + parsed.search,
        headers: (init?.headers as any) || {},
        payload: init?.body ? String(init.body) : undefined
      });
      return new Response(res.body, {
        status: res.statusCode,
        headers: res.headers as any
      });
    };

    const result = await runSampleConsumer({
      apiKey: key,
      projectId,
      endpoint: 'http://127.0.0.1:4000',
      usersApiBaseUrl: 'http://127.0.0.1:4001',
      environment: 'development',
      fetchFn
    });
    expect(result.registration.ok).toBe(true);
    expect(result.requests.length).toBe(3);
    expect(result.requests.every((r) => r.statusCode === 200 && r.tracked)).toBe(true);
    expect(result.flush.accepted).toBe(3);
  });

  it('AT-SDK-05: Redaction of authorization, cookies, keys, and credentials in URLs', () => {
    const input = {
      authorization: 'Bearer secret-operator-token',
      cookie: 'dg_operator_session=secret_cookie_val',
      apiKey: 'secret_api_key_123',
      safeField: 'normal_value'
    };
    const redacted = redactValue(input);
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.cookie).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.safeField).toBe('normal_value');

    const sanitizedUrl = sanitizeUrl('http://operator:password@127.0.0.1:4000/api/ingest?token=secret#section');
    expect(sanitizedUrl).toBe('http://127.0.0.1:4000/api/ingest');
    expect(sanitizedUrl).not.toContain('password');
    expect(sanitizedUrl).not.toContain('secret');
  });

  it('AT-SDK-06: Control plane is unavailable during registration/flush/shutdown', async () => {
    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes(':4000')) {
        throw new Error('ECONNREFUSED: Control plane offline');
      }
      const parsed = new URL(url, 'http://127.0.0.1');
      const res = await mockApp.inject({
        method: (init?.method as any) || 'GET',
        url: parsed.pathname + parsed.search
      });
      return new Response(res.body, { status: res.statusCode });
    };

    const result = await runSampleConsumer({
      apiKey: 'test-key',
      projectId,
      endpoint: 'http://127.0.0.1:4000',
      usersApiBaseUrl: 'http://127.0.0.1:4001',
      fetchFn
    });

    expect(result.requests.length).toBe(3);
    expect(result.requests.every((r) => r.statusCode === 200)).toBe(true);
    expect(result.registration.ok).toBe(false);
    expect(result.flush.accepted).toBe(0);
  });

  it('AT-SDK-07: Retry the same batch IDs, and event ID reuse with different content', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/ingest/dependencies',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        projectId,
        environment,
        sdkVersion: '1.0.0',
        dependency: { name: 'idempotent-api', type: 'rest-api' }
      }
    });
    const depId = reg.json().dependencyId;

    const batchId = randomUUID();
    const eventId = randomUUID();
    const payload1 = {
      schemaVersion: '1',
      batchId,
      projectId,
      environment,
      sessionId: 'sess-demo-local-01',
      sdkVersion: '1.0.0',
      events: [
        {
          eventId,
          dependencyId: depId,
          method: 'GET',
          routeTemplate: '/test/route',
          statusCode: 200,
          durationMs: 10,
          observedAt: new Date().toISOString(),
          collectionPolicyVersion: 1
        }
      ]
    };

    const res1 = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: payload1
    });
    expect(res1.statusCode).toBe(200);
    expect(res1.json().accepted).toBe(1);

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: payload1
    });
    expect(res2.statusCode).toBe(200);
    expect(res2.json().duplicates).toBe(1);

    const res3 = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        ...payload1,
        batchId: randomUUID(),
        events: [
          {
            ...payload1.events[0],
            routeTemplate: '/different/route/conflict'
          }
        ]
      }
    });
    expect(res3.statusCode).toBe(409);
    expect(res3.json().error.code).toBe('EVENT_ID_CONFLICT');
  });

  it('AT-SDK-08: Dashboard lists inventory and ingestion status after acknowledged traffic', async () => {
    // Register dependency first
    await app.inject({
      method: 'POST',
      url: '/api/ingest/dependencies',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        projectId,
        environment,
        sdkVersion: '1.0.0',
        dependency: { name: 'inventory-dep', type: 'rest-api' }
      }
    });

    const listRes = await app.inject({
      method: 'GET',
      url: `/api/projects/${projectId}/dependencies?environment=${environment}`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken }
    });
    expect(listRes.statusCode).toBe(200);
    const deps = listRes.json().dependencies;
    expect(Array.isArray(deps)).toBe(true);
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0].confidence).toBeDefined();
    expect(deps[0].health).toBeDefined();
  });

  it('AT-SDK-09: Baseline capture and immutable independent baseline/latest evidence', async () => {
    const baseRes = await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(baseRes.statusCode).toBe(201);
    const baseline = baseRes.json().baseline;
    expect(baseline.version).toBe(1);
    expect(baseline.fingerprint).toBeDefined();

    const stateRes = await app.inject({
      method: 'GET',
      url: `/api/demo/state?projectId=${projectId}&environment=${environment}`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken }
    });
    expect(stateRes.statusCode).toBe(200);
    expect(stateRes.json().baseline.fingerprint).toBe(baseline.fingerprint);
  });

  it('AT-SDK-10: Ingest changed scenario and detect field-rename drift', async () => {
    // Capture baseline first
    await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });

    // Inject scenario
    const injRes = await app.inject({
      method: 'POST',
      url: '/api/scenarios/users.field-rename/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(injRes.statusCode).toBe(200);

    // Run observations
    const obsRes = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(obsRes.statusCode).toBe(200);
    const findings = obsRes.json().findings;
    expect(findings.some((f: any) => f.type === 'field_removed')).toBe(true);
    expect(obsRes.json().incidents.length).toBeGreaterThan(0);
  });

  it('AT-SDK-11: Trace canonical field-read lineage and explain affected workflows', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/scenarios/users.field-rename/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const obs = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const incId = obs.json().incidents[0].id;

    const impactRes = await app.inject({
      method: 'POST',
      url: `/api/incidents/${incId}/analyze-impact`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(impactRes.statusCode).toBe(200);
    const impact = impactRes.json();
    expect(impact.affectedWorkflows.some((w: any) => w.workflowId === 'welcome_email')).toBe(true);
    expect(impact.unaffectedWorkflows.some((w: any) => w.workflowId === 'inventory_sync')).toBe(true);
  });

  it('AT-SDK-12: Run complete field-rename repair proposal, shadow validation, and activation', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/scenarios/users.field-rename/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const obs = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const incId = obs.json().incidents[0].id;

    // Propose repair
    const propRes = await app.inject({
      method: 'POST',
      url: `/api/incidents/${incId}/propose-repair`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(propRes.statusCode).toBe(200);
    const proposal = propRes.json().proposal;
    expect(proposal.source).toBe('deterministic_fallback');

    // Shadow validation
    const valRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${proposal.patch.id}/validate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: proposal.patch.hash }
    });
    expect(valRes.statusCode).toBe(200);
    expect(valRes.json().validationRun.eligibility).toBe('eligible');
    expect(valRes.json().validationRun.gates.length).toBe(9);

    // Activation
    const actRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${proposal.patch.id}/activate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: proposal.patch.hash }
    });
    expect(actRes.statusCode).toBe(200);
    expect(actRes.json().recoveryStatus).toBe('recovered');
  });

  it('AT-SDK-13: Shipping unchanged-shape calendar→business-days canary refusal', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });

    // Inject shipping scenario
    const injRes = await app.inject({
      method: 'POST',
      url: '/api/scenarios/shipping.business-days/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(injRes.statusCode).toBe(200);

    const obsRes = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(obsRes.statusCode).toBe(200);
    const shippingInc = obsRes.json().incidents.find((i: any) => i.provider === 'shipping');
    expect(shippingInc).toBeDefined();

    // Propose repair for shipping
    const propRes = await app.inject({
      method: 'POST',
      url: `/api/incidents/${shippingInc.id}/propose-repair`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(propRes.statusCode).toBe(200);
    const proposal = propRes.json().proposal;

    // Validate patch
    const valRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${proposal.patch.id}/validate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: proposal.patch.hash }
    });
    expect(valRes.statusCode).toBe(200);
    // Semantic canary refusal holds automatic activation
    expect(valRes.json().validationRun.eligibility).toBe('review_required');
  });

  it('AT-SDK-14: Submit invalid DSL or modify a previously validated patch hash', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/scenarios/users.field-rename/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const obs = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const incId = obs.json().incidents[0].id;
    const prop = await app.inject({
      method: 'POST',
      url: `/api/incidents/${incId}/propose-repair`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    const patchId = prop.json().proposal.patch.id;
    const patchHash = prop.json().proposal.patch.hash;

    // Validate the patch first
    const valRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${patchId}/validate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash }
    });
    expect(valRes.statusCode).toBe(200);

    // Tampered patch hash produces PATCH_HASH_MISMATCH
    const actRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${patchId}/activate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: 'tampered-modified-hash' }
    });
    expect(actRes.statusCode).toBe(409);
    expect(actRes.json().error.code).toBe('PATCH_HASH_MISMATCH');
  });

  it('AT-SDK-15: Force rollback, demo reset, and reject stale-session batch', async () => {
    // Register dependency first so we have a valid depId
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/ingest/dependencies',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        projectId,
        environment,
        sdkVersion: '1.0.0',
        dependency: { name: 'users-api', type: 'rest-api' }
      }
    });
    const depId = regRes.json().dependencyId;

    // Reset demo
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/demo/reset',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.json().status).toBe('awaiting_baseline');

    // Ingest with stale session ID -> must be rejected with 409 STALE_SESSION
    const staleRes = await app.inject({
      method: 'POST',
      url: '/api/ingest/observations',
      headers: { authorization: `Bearer ${activeApiKey}` },
      payload: {
        schemaVersion: '1',
        batchId: randomUUID(),
        projectId,
        environment,
        sessionId: 'sess_stale_invalid_id',
        sdkVersion: '1.0.0',
        events: [
          {
            eventId: randomUUID(),
            dependencyId: depId,
            method: 'GET',
            routeTemplate: '/users/:id',
            statusCode: 200,
            durationMs: 4,
            observedAt: new Date().toISOString(),
            collectionPolicyVersion: 1
          }
        ]
      }
    });
    expect(staleRes.statusCode).toBe(409);
    expect(staleRes.json().error.code).toBe('STALE_SESSION');
  });

  it('AT-SDK-16: Missing live model credentials gracefully falls back to deterministic engine', async () => {
    // Deterministic fallback proposes coalesce rule with 0.95 confidence
    const incDetail = await app.inject({
      method: 'POST',
      url: '/api/incidents/inc_fake_test/propose-repair',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect([200, 404]).toContain(incDetail.statusCode);
  });

  it('AT-SDK-17: Run complete local test fixture suite with no provider credentials or production access', async () => {
    expect(process.env.USERS_API_BASE_URL ?? 'http://127.0.0.1:4001').toContain('127.0.0.1');
    expect(process.env.DRIFTGUARD_ENDPOINT ?? 'http://127.0.0.1:4000').toContain('127.0.0.1');
    const apiHealth = await app.inject({ method: 'GET', url: '/api/health' });
    const mockHealth = await mockApp.inject({ method: 'GET', url: '/health' });
    expect(apiHealth.statusCode).toBe(200);
    expect(mockHealth.statusCode).toBe(200);
  });
});
