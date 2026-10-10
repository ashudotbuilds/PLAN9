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
});
