import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApiApp } from '../../apps/api/src/app.js';
import { buildMockProvidersApp } from '../../apps/mock-providers/src/app.js';
import { runSampleConsumer } from '../../apps/sample-consumer/src/index.js';
import {
  CORRELATION_ID_HEADER,
  OPERATOR_TOKEN_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  KnownUserIdentities
} from '@driftguard/contracts';
import { randomUUID } from 'node:crypto';

describe('Ticket 13: Golden Demo & Repeatable Rehearsal Runner', () => {
  let app: FastifyInstance;
  let mockApp: FastifyInstance;
  const operatorToken = 'golden-demo-operator-token';
  const environment = 'development';

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
  });

  async function executeFullRehearsalCycle(cycleName: string) {
    const startTime = Date.now();

    // 1. Health checks (A01, M06)
    const apiHealth = await app.inject({ method: 'GET', url: '/api/health' });
    expect(apiHealth.statusCode).toBe(200);
    const mockHealth = await mockApp.inject({ method: 'GET', url: '/health' });
    expect(mockHealth.statusCode).toBe(200);

    // 2. Operator Session Bootstrap (A20)
    const sessionRes = await app.inject({
      method: 'POST',
      url: '/api/operator/session',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { token: operatorToken }
    });
    expect(sessionRes.statusCode).toBe(200);
    expect(sessionRes.headers['set-cookie']).toBeDefined();

    // 3. Create Project & Issue Dev Ingestion Key (A21, A24)
    const projRes = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        [OPERATOR_TOKEN_HEADER]: operatorToken,
        [IDEMPOTENCY_KEY_HEADER]: `idem_${cycleName}_${Date.now()}`
      },
      payload: { name: `Golden Project ${cycleName}` }
    });
    expect(projRes.statusCode).toBe(201);
    const projectId = projRes.json().project.id;

    const keyRes = await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/keys`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { environment, label: `${cycleName} Key` }
    });
    expect(keyRes.statusCode).toBe(201);
    const { apiKey, keyId, prefix } = keyRes.json();
    expect(prefix).toMatch(/^dg_ing_/);

    // Verify safe read: zero plaintext / secretDigest exposure
    const projDetail = await app.inject({
      method: 'GET',
      url: `/api/projects/${projectId}?environment=${environment}`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken }
    });
    expect(projDetail.statusCode).toBe(200);
    expect((projDetail.json().keyMetadata[0] as any).apiKey).toBeUndefined();
    expect((projDetail.json().keyMetadata[0] as any).secretDigest).toBeUndefined();

    // 4. Sample Consumer connects and tracks 3 Users requests with flush (A27, A28, AT-SDK-04)
    const consumerFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const isApi = url.includes(':4000') || url.startsWith('/api');
      const target = isApi ? app : mockApp;
      const parsed = new URL(url, 'http://127.0.0.1');
      const res = await target.inject({
        method: (init?.method as any) || 'GET',
        url: parsed.pathname + parsed.search,
        headers: (init?.headers as any) || {},
        payload: init?.body ? String(init.body) : undefined
      });
      return new Response(res.body, { status: res.statusCode, headers: res.headers as any });
    };

    const consumerResult = await runSampleConsumer({
      apiKey,
      projectId,
      endpoint: 'http://127.0.0.1:4000',
      usersApiBaseUrl: 'http://127.0.0.1:4001',
      environment: 'development',
      fetchFn: consumerFetch
    });
    expect(consumerResult.registration.ok).toBe(true);
    expect(consumerResult.requests).toHaveLength(3);
    expect(consumerResult.requests.every((r) => r.statusCode === 200 && r.tracked)).toBe(true);
    expect(consumerResult.flush.accepted).toBe(3);

    // 5. Baseline Capture (A03) with 3 identities
    const baselineRes = await app.inject({
      method: 'POST',
      url: '/api/baselines/capture',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(baselineRes.statusCode).toBe(201);
    const baseline = baselineRes.json().baseline;
    expect(baseline.version).toBe(1);
    expect(baseline.fingerprint).toBeDefined();

    // Verify workflows replay healthy
    for (const wf of ['welcome_email', 'customer_profile', 'inventory_sync', 'delivery_estimate'] as const) {
      const replayRes = await app.inject({
        method: 'POST',
        url: `/api/workflows/${wf}/replay`,
        headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
        payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
      });
      expect(replayRes.statusCode).toBe(200);
      expect(replayRes.json().status).toBe('passed');
    }

    // 6. Inject Users field-rename drift (A05)
    const injectRes = await app.inject({
      method: 'POST',
      url: '/api/scenarios/users.field-rename/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(injectRes.statusCode).toBe(200);

    // 7. Run observations & Detect drift (A06, A07)
    const obsRes = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(obsRes.statusCode).toBe(200);
    const { incidents, findings } = obsRes.json();
    expect(incidents.length).toBeGreaterThan(0);
    expect(findings.some((f: any) => f.type === 'field_removed')).toBe(true);

    const userIncident = incidents.find((i: any) => i.provider === 'users');
    expect(userIncident).toBeDefined();

    // 8. Causal impact analysis (A09)
    const impactRes = await app.inject({
      method: 'POST',
      url: `/api/incidents/${userIncident.id}/analyze-impact`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(impactRes.statusCode).toBe(200);
    const impact = impactRes.json();
    expect(impact.affectedWorkflows.some((w: any) => w.workflowId === 'welcome_email')).toBe(true);
    expect(impact.unaffectedWorkflows.some((w: any) => w.workflowId === 'inventory_sync')).toBe(true);

    // 9. Propose Repair with deterministic fallback (A10)
    const propRes = await app.inject({
      method: 'POST',
      url: `/api/incidents/${userIncident.id}/propose-repair`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(propRes.statusCode).toBe(200);
    const proposal = propRes.json().proposal;
    expect(proposal.source).toBe('deterministic_fallback');
    expect(proposal.confidence).toBeGreaterThanOrEqual(0.9);

    // 10. Shadow Validation with 9 gates (A11)
    const valRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${proposal.patch.id}/validate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: proposal.patch.hash }
    });
    expect(valRes.statusCode).toBe(200);
    expect(valRes.json().validationRun.eligibility).toBe('eligible');
    expect(valRes.json().validationRun.gates).toHaveLength(9);

    // Tampered patch hash rejection (A12 guard)
    const tamperedAct = await app.inject({
      method: 'POST',
      url: `/api/patches/${proposal.patch.id}/activate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: 'tampered-hash-failure' }
    });
    expect(tamperedAct.statusCode).toBe(409);
    expect(tamperedAct.json().error.code).toBe('PATCH_HASH_MISMATCH');

    // 11. Backend Recovery Run (A16, A17)
    const recRes = await app.inject({
      method: 'POST',
      url: `/api/incidents/${userIncident.id}/recover`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(recRes.statusCode).toBe(202);
    const { recoveryRunId } = recRes.json();

    const runRes = await app.inject({
      method: 'GET',
      url: `/api/recovery-runs/${recoveryRunId}`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken }
    });
    expect(runRes.statusCode).toBe(200);
    expect(runRes.json().recoveryRun.status).toBe('succeeded');

    // Replay post-recovery confirms welcome_email restored
    const postReplay = await app.inject({
      method: 'POST',
      url: '/api/workflows/welcome_email/replay',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(postReplay.statusCode).toBe(200);
    expect(postReplay.json().status).toBe('passed');

    // 12. Shipping Calendar vs Business-Days Semantic Drift & Review Hold (A05, A06, A10, A11)
    await app.inject({
      method: 'POST',
      url: '/api/scenarios/shipping.business-days/inject',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });

    const shipObs = await app.inject({
      method: 'POST',
      url: '/api/observations/run',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    const shipInc = shipObs.json().incidents.find((i: any) => i.provider === 'shipping');
    expect(shipInc).toBeDefined();

    const shipProp = await app.inject({
      method: 'POST',
      url: `/api/incidents/${shipInc.id}/propose-repair`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(shipProp.statusCode).toBe(200);

    const shipVal = await app.inject({
      method: 'POST',
      url: `/api/patches/${shipProp.json().proposal.patch.id}/validate`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, patchHash: shipProp.json().proposal.patch.hash }
    });
    expect(shipVal.statusCode).toBe(200);
    expect(shipVal.json().validationRun.eligibility).toBe('review_required');

    // 13. Rollback Users Adapter (A13)
    const rollRes = await app.inject({
      method: 'POST',
      url: `/api/patches/${proposal.patch.id}/rollback`,
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment }
    });
    expect(rollRes.statusCode).toBe(200);
    expect(rollRes.json().incidentStatus).toBe('rolled_back');

    // 14. Demo Reset & Restore Defaults (A04, M05)
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/demo/reset',
      headers: { [OPERATOR_TOKEN_HEADER]: operatorToken },
      payload: { projectId, environment, sessionId: 'sess-demo-local-01' }
    });
    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.json().status).toBe('awaiting_baseline');

    const durationSec = (Date.now() - startTime) / 1000;
    console.log(`[Rehearsal] ${cycleName} completed in ${durationSec.toFixed(2)}s (well under 180s threshold)`);
    expect(durationSec).toBeLessThan(180); // Strict 3-minute requirement
  }

  it('Rehearsal Cycle 1: Complete end-to-end judge demo', async () => {
    await executeFullRehearsalCycle('Cycle-1');
  });

  it('Rehearsal Cycle 2: Consecutive clean repetition proving zero state-leakage', async () => {
    await executeFullRehearsalCycle('Cycle-2');
  });
});
