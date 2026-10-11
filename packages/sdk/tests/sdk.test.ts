import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriftGuard } from '../src/index.js';

describe('@driftguard/sdk - Unit & Contract Tests', () => {
  const validConfig = {
    apiKey: 'dg_key_live_test123',
    projectId: 'proj-local-01',
    endpoint: 'http://127.0.0.1:4000',
    environment: 'development' as const,
    allowInsecureLoopback: true
  };

  it('validates local config and creates enabled SDK instance without network calls', () => {
    const sdk = new DriftGuard(validConfig);
    expect(sdk).toBeDefined();
  });

  it('safely disables SDK on missing apiKey or projectId without throwing into host', async () => {
    const badKeySdk = new DriftGuard({ ...validConfig, apiKey: '' });
    const diagKey = await badKeySdk.diagnostics();
    expect(diagKey.enabled).toBe(false);
    expect(diagKey.lastError?.code).toBe('INVALID_CONFIG');

    const badProjectSdk = new DriftGuard({ ...validConfig, projectId: '   ' });
    const diagProject = await badProjectSdk.diagnostics();
    expect(diagProject.enabled).toBe(false);
    expect(diagProject.lastError?.code).toBe('INVALID_CONFIG');
  });

  it('rejects plain HTTP endpoints unless allowInsecureLoopback is true for loopback', async () => {
    const remoteHttpSdk = new DriftGuard({
      ...validConfig,
      endpoint: 'http://external-api.driftguard.dev',
      allowInsecureLoopback: true
    });
    const diagRemote = await remoteHttpSdk.diagnostics();
    expect(diagRemote.enabled).toBe(false);
    expect(diagRemote.lastError?.code).toBe('INSECURE_ENDPOINT');

    const noFlagLoopback = new DriftGuard({
      ...validConfig,
      allowInsecureLoopback: false
    });
    const diagNoFlag = await noFlagLoopback.diagnostics();
    expect(diagNoFlag.enabled).toBe(false);
    expect(diagNoFlag.lastError?.code).toBe('INSECURE_ENDPOINT');
  });

  it('registers dependency and tracks active session on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        dependencyId: 'dep-users-01',
        sessionId: 'sess-abc-123',
        inventoryVersion: 1,
        collectionPolicy: {
          version: '1',
          mode: 'metadata_only',
          rateLimitPerMinute: 60
        },
        auditEventId: 'aud-reg-01'
      })
    });

    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });
    const regResult = await sdk.registerDependency({
      name: 'users-api',
      type: 'rest-api',
      baseUrl: 'http://127.0.0.1:4001'
    });

    expect(regResult.ok).toBe(true);
    expect(regResult.dependencyId).toBe('dep-users-01');
    expect(regResult.sessionId).toBe('sess-abc-123');

    const diag = await sdk.diagnostics();
    expect(diag.activeSessionId).toBe('sess-abc-123');
    await sdk.shutdown();
  });

  it('handles registration failure safely without throwing', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });

    const res = await sdk.registerDependency({
      name: 'users-api',
      type: 'rest-api'
    });

    expect(res.ok).toBe(false);
    expect(res.code).toBe('NETWORK_ERROR');

    const diag = await sdk.diagnostics();
    expect(diag.lastError?.code).toBe('NETWORK_ERROR');
    await sdk.shutdown();
  });

  it('refuses tracking for unregistered dependency', async () => {
    const sdk = new DriftGuard(validConfig);
    const trackRes = sdk.trackRequest({
      dependencyId: 'unregistered-dep',
      method: 'GET',
      routeTemplate: '/users/:id',
      statusCode: 200,
      durationMs: 45
    });

    expect(trackRes.queued).toBe(false);
    expect(trackRes.code).toBe('UNREGISTERED_DEPENDENCY');
    await sdk.shutdown();
  });

  it('tracks requests with metadata-only by default, stripping response bodies', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          dependencyId: 'dep-users-01',
          sessionId: 'sess-abc-123',
          inventoryVersion: 1,
          collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
          auditEventId: 'aud-reg-01'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          batchId: '123e4567-e89b-12d3-a456-426614174000',
          accepted: 1,
          duplicates: 0,
          findings: [],
          auditEventId: 'aud-ing-01'
        })
      });

    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });
    await sdk.registerDependency({ name: 'users-api', type: 'rest-api' });

    const trackRes = sdk.trackRequest({
      dependencyId: 'dep-users-01',
      method: 'GET',
      routeTemplate: '/users/:id',
      statusCode: 200,
      durationMs: 42,
      responseEvidence: { id: 'u-123', name: 'Aarav', password: 'secret123' }
    });
    expect(trackRes.queued).toBe(true);

    const flushRes = await sdk.flush();
    expect(flushRes.accepted).toBe(1);

    // Verify batch body had no responseEvidence attached (default metadata-only mode)
    const ingestCall = mockFetch.mock.calls[1];
    const payload = JSON.parse(ingestCall[1].body);
    expect(payload.events[0].responseEvidence).toBeUndefined();

    await sdk.shutdown();
  });

  it('locally redacts sensitive fields when allowlisted_fixture collection is enabled', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          dependencyId: 'dep-users-01',
          sessionId: 'sess-abc-123',
          inventoryVersion: 1,
          collectionPolicy: { version: '1', mode: 'reviewed_fixtures', rateLimitPerMinute: 60 },
          auditEventId: 'aud-reg-01'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          batchId: '123e4567-e89b-12d3-a456-426614174000',
          accepted: 1,
          duplicates: 0,
          findings: [],
          auditEventId: 'aud-ing-01'
        })
      });

    const sdk = new DriftGuard({
      ...validConfig,
      collection: { responseEvidence: 'allowlisted_fixture' },
      fetchFn: mockFetch
    });
    await sdk.registerDependency({ name: 'users-api', type: 'rest-api' });

    sdk.trackRequest({
      dependencyId: 'dep-users-01',
      method: 'GET',
      routeTemplate: '/users/:id',
      statusCode: 200,
      durationMs: 38,
      fixtureKey: 'user:u-123',
      responseEvidence: {
        id: 'u-123',
        name: 'Aarav',
        token: 'secret-auth-token',
        password: 'my-password',
        nested: { apiKey: 'key-999', allowedField: 'hello' }
      }
    });

    await sdk.flush();

    const ingestCall = mockFetch.mock.calls[1];
    const payload = JSON.parse(ingestCall[1].body);
    const ev = payload.events[0].responseEvidence;
    expect(ev.name).toBe('Aarav');
    expect(ev.token).toBe('[REDACTED]');
    expect(ev.password).toBe('[REDACTED]');
    expect(ev.nested.apiKey).toBe('[REDACTED]');
    expect(ev.nested.allowedField).toBe('hello');

    await sdk.shutdown();
  });

  it('enforces queue overflow limits by dropping newest events and updating droppedCount', async () => {
    const sdk = new DriftGuard({ ...validConfig, autoBatchFlush: false });
    (sdk as any).registrations.set('dep-01', {
      dependencyId: 'dep-01',
      sessionId: 'sess-01',
      collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
      collectionPolicyVersion: 1
    });

    // Fill queue to 100 events
    for (let i = 0; i < 100; i++) {
      const res = sdk.trackRequest({
        dependencyId: 'dep-01',
        method: 'GET',
        routeTemplate: '/items/:id',
        statusCode: 200,
        durationMs: 10
      });
      expect(res.queued).toBe(true);
    }

    // 101st event should overflow and be dropped
    const overflowRes = sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'GET',
      routeTemplate: '/items/:id',
      statusCode: 200,
      durationMs: 10
    });
    expect(overflowRes.queued).toBe(false);
    expect(overflowRes.code).toBe('QUEUE_OVERFLOW');

    const diag = await sdk.diagnostics();
    expect(diag.droppedCount).toBe(1);
    expect(diag.queuedCount).toBe(100);

    await sdk.shutdown();
  });

  it('shares in-flight promise across concurrent flush callers', async () => {
    let resolveIngest: any;
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolveIngest = () => resolve({
          status: 200,
          json: async () => ({
            batchId: '123e4567-e89b-12d3-a456-426614174000',
            accepted: 1,
            duplicates: 0,
            findings: [],
            auditEventId: 'aud-01'
          })
        });
      });
    });

    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });
    (sdk as any).registrations.set('dep-01', {
      dependencyId: 'dep-01',
      sessionId: 'sess-01',
      collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
      collectionPolicyVersion: 1
    });

    sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'GET',
      routeTemplate: '/test',
      statusCode: 200,
      durationMs: 10
    });

    const flushP1 = sdk.flush();
    const flushP2 = sdk.flush();

    expect(flushP1).toBe(flushP2); // exact same in-flight promise reference

    resolveIngest();
    const [res1, res2] = await Promise.all([flushP1, flushP2]);
    expect(res1.accepted).toBe(1);
    expect(res2.accepted).toBe(1);

    await sdk.shutdown();
  });

  it('disables sending on permanent 401/403 authentication rejection', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 401,
      json: async () => ({ error: { code: 'INVALID_INGESTION_KEY' } })
    });

    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });
    (sdk as any).registrations.set('dep-01', {
      dependencyId: 'dep-01',
      sessionId: 'sess-01',
      collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
      collectionPolicyVersion: 1
    });

    sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'GET',
      routeTemplate: '/test',
      statusCode: 200,
      durationMs: 10
    });

    const flushRes = await sdk.flush();
    expect(flushRes.code).toBe('AUTH_FAILED');

    const diag = await sdk.diagnostics();
    expect(diag.enabled).toBe(false);
    expect(diag.lastError?.code).toBe('AUTH_FAILED');

    // Next trackRequest will be refused
    const nextTrack = sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'GET',
      routeTemplate: '/test',
      statusCode: 200,
      durationMs: 10
    });
    expect(nextTrack.queued).toBe(false);
    expect(nextTrack.code).toBe('SDK_DISABLED');

    await sdk.shutdown();
  });

  it('cleans up resources and refuses tracking after shutdown', async () => {
    const sdk = new DriftGuard(validConfig);
    const shutdownRes = await sdk.shutdown();
    expect(shutdownRes.unsentCount).toBe(0);

    const trackRes = sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'GET',
      routeTemplate: '/test',
      statusCode: 200,
      durationMs: 10
    });
    expect(trackRes.queued).toBe(false);
    expect(trackRes.code).toBe('SDK_SHUTDOWN');
  });

  it('rejects oversized individual events exceeding 16 KiB with EVENT_TOO_LARGE', async () => {
    const sdk = new DriftGuard({ ...validConfig, collection: { responseEvidence: 'allowlisted_fixture' } });
    (sdk as any).registrations.set('dep-01', {
      dependencyId: 'dep-01',
      sessionId: 'sess-01',
      collectionPolicy: { version: '1', mode: 'reviewed_fixtures', rateLimitPerMinute: 60 },
      collectionPolicyVersion: 1
    });

    const hugeBody: Record<string, string> = {};
    for (let i = 0; i < 30; i++) {
      hugeBody[`key_${i}`] = 'x'.repeat(900);
    }

    const res = sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'POST',
      routeTemplate: '/data',
      statusCode: 200,
      durationMs: 20,
      fixtureKey: 'user:u-123',
      responseEvidence: hugeBody
    });

    expect(res.queued).toBe(false);
    expect(res.code).toBe('EVENT_TOO_LARGE');

    const diag = await sdk.diagnostics();
    expect(diag.droppedCount).toBe(1);
    await sdk.shutdown();
  });

  it('omits response evidence when fixtureKey is unapproved or server policy is metadata_only', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        batchId: '123e4567-e89b-12d3-a456-426614174000',
        accepted: 1,
        duplicates: 0,
        findings: [],
        auditEventId: 'aud-01'
      })
    });

    const sdk = new DriftGuard({
      ...validConfig,
      collection: { responseEvidence: 'allowlisted_fixture' },
      fetchFn: mockFetch
    });

    // Registration with server policy mode metadata_only
    (sdk as any).registrations.set('dep-meta-only', {
      dependencyId: 'dep-meta-only',
      sessionId: 'sess-01',
      collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
      collectionPolicyVersion: 1
    });

    sdk.trackRequest({
      dependencyId: 'dep-meta-only',
      method: 'GET',
      routeTemplate: '/items',
      statusCode: 200,
      durationMs: 15,
      fixtureKey: 'user:u-123', // approved key, but server policy is metadata_only
      responseEvidence: { id: 'u-123', name: 'Aarav' }
    });

    await sdk.flush();
    const ingestCall = mockFetch.mock.calls[0];
    const payload = JSON.parse(ingestCall[1].body);
    expect(payload.events[0].responseEvidence).toBeUndefined();

    await sdk.shutdown();
  });

  it('handles 409 STALE_SESSION by invalidating active session and dropping batch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 409,
      json: async () => ({
        error: { code: 'STALE_SESSION', message: 'Current session has been archived or reset.' }
      })
    });

    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });
    (sdk as any).registrations.set('dep-01', {
      dependencyId: 'dep-01',
      sessionId: 'sess-old-01',
      collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
      collectionPolicyVersion: 1
    });
    (sdk as any).activeSessionId = 'sess-old-01';

    sdk.trackRequest({
      dependencyId: 'dep-01',
      method: 'GET',
      routeTemplate: '/test',
      statusCode: 200,
      durationMs: 10
    });

    const flushRes = await sdk.flush();
    expect(flushRes.code).toBe('STALE_SESSION');
    expect(flushRes.dropped).toBe(1);

    const diag = await sdk.diagnostics();
    expect(diag.activeSessionId).toBeUndefined();
    await sdk.shutdown();
  });

  it('resetSession clears registrations, active session, queued events, and allows clean re-registration', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dependencyId: `dep-${callCount}`,
          sessionId: `sess-new-${callCount}`,
          inventoryVersion: callCount,
          collectionPolicy: {
            version: '1',
            mode: 'metadata_only',
            rateLimitPerMinute: 60
          }
        })
      };
    });

    const sdk = new DriftGuard({ ...validConfig, fetchFn: mockFetch });

    // Initial registration
    const reg1 = await sdk.registerDependency({ name: 'users-api', type: 'rest-api' });
    expect(reg1.ok).toBe(true);
    expect(reg1.sessionId).toBe('sess-new-1');

    // Track request
    const track1 = sdk.trackRequest({
      dependencyId: reg1.dependencyId!,
      method: 'GET',
      routeTemplate: '/users/:id',
      statusCode: 200,
      durationMs: 12
    });
    expect(track1.queued).toBe(true);

    const diag1 = await sdk.diagnostics();
    expect(diag1.activeSessionId).toBe('sess-new-1');
    expect(diag1.queuedCount).toBe(1);

    // Call resetSession
    sdk.resetSession();

    const diagReset = await sdk.diagnostics();
    expect(diagReset.activeSessionId).toBeUndefined();
    expect(diagReset.queuedCount).toBe(0);

    // Old dependency is no longer registered; tracking must be rejected
    const trackAfterReset = sdk.trackRequest({
      dependencyId: reg1.dependencyId!,
      method: 'GET',
      routeTemplate: '/users/:id',
      statusCode: 200,
      durationMs: 10
    });
    expect(trackAfterReset.queued).toBe(false);
    expect(trackAfterReset.code).toBe('UNREGISTERED_DEPENDENCY');

    // Re-register dependency after reset
    const reg2 = await sdk.registerDependency({ name: 'users-api', type: 'rest-api' });
    expect(reg2.ok).toBe(true);
    expect(reg2.sessionId).toBe('sess-new-2');

    const diagReReg = await sdk.diagnostics();
    expect(diagReReg.activeSessionId).toBe('sess-new-2');

    // New dependency can now track requests
    const track2 = sdk.trackRequest({
      dependencyId: reg2.dependencyId!,
      method: 'GET',
      routeTemplate: '/users/:id',
      statusCode: 200,
      durationMs: 8
    });
    expect(track2.queued).toBe(true);

    await sdk.shutdown();
  });
});

