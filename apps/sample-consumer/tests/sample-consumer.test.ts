import { describe, it, expect, vi } from 'vitest';
import { runSampleConsumer } from '../src/index.js';

describe('Sample Consumer Integration & Failure Isolation', () => {
  it('executes all three Users requests, registers dependency, and flushes telemetry successfully', async () => {
    const mockUsersData: Record<string, { id: string; name: string }> = {
      'u-123': { id: 'u-123', name: 'Aarav' },
      'u-456': { id: 'u-456', name: 'Beatriz' },
      'u-789': { id: 'u-789', name: 'Charlie' }
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      // 1. DriftGuard registration
      if (url.includes('/api/dependencies/register') || url.includes('/api/ingest/dependencies')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            dependencyId: 'dep-users-01',
            sessionId: 'sess-test-01',
            inventoryVersion: 1,
            collectionPolicy: { version: '1', mode: 'metadata_only', rateLimitPerMinute: 60 },
            auditEventId: 'aud-reg-01'
          })
        };
      }

      // 2. DriftGuard observation ingestion
      if (url.includes('/api/ingest/observations')) {
        const body = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            batchId: body.batchId,
            accepted: body.events.length,
            duplicates: 0,
            findings: [],
            auditEventId: 'aud-ing-01'
          })
        };
      }

      // 3. Mock Users provider endpoints
      const userMatch = url.match(/\/users\/(u-\d+)/);
      if (userMatch) {
        const uid = userMatch[1];
        return {
          ok: true,
          status: 200,
          json: async () => mockUsersData[uid]
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      };
    });

    const result = await runSampleConsumer({
      apiKey: 'dg_key_live_mock',
      projectId: 'proj-local-01',
      endpoint: 'http://127.0.0.1:4000',
      usersApiBaseUrl: 'http://127.0.0.1:4001',
      fetchFn: mockFetch
    });

    expect(result.registration.ok).toBe(true);
    expect(result.registration.dependencyId).toBe('dep-users-01');
    expect(result.requests).toHaveLength(3);
    expect(result.requests.every(r => r.statusCode === 200 && r.tracked)).toBe(true);
    expect(result.flush.accepted).toBe(3);
    expect(result.diagnostics.acceptedCount).toBe(3);
    expect(result.diagnostics.droppedCount).toBe(0);
  });

  it('preserves host request success when DriftGuard is completely unavailable', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      // DriftGuard endpoints fail with network error
      if (url.includes(':4000')) {
        throw new Error('Connection refused to DriftGuard');
      }

      // Upstream Users provider continues to work
      const userMatch = url.match(/\/users\/(u-\d+)/);
      if (userMatch) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: userMatch[1], name: 'User' })
        };
      }

      return { ok: false, status: 500 };
    });

    const result = await runSampleConsumer({
      apiKey: 'dg_key_live_mock',
      projectId: 'proj-local-01',
      endpoint: 'http://127.0.0.1:4000',
      usersApiBaseUrl: 'http://127.0.0.1:4001',
      fetchFn: mockFetch
    });

    // Registration fails safely
    expect(result.registration.ok).toBe(false);

    // Host application requests STILL succeed completely
    expect(result.requests).toHaveLength(3);
    expect(result.requests.every(r => r.statusCode === 200)).toBe(true);

    // Flush gracefully drops/reports failure without throwing
    expect(result.flush.accepted).toBe(0);
  });
});
