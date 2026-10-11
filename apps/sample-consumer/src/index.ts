import { DriftGuard } from '@driftguard/sdk';

export interface SampleConsumerOptions {
  apiKey?: string;
  projectId?: string;
  endpoint?: string;
  environment?: 'development' | 'production';
  usersApiBaseUrl?: string;
  allowInsecureLoopback?: boolean;
  enableReviewedFixtures?: boolean;
  fetchFn?: typeof fetch;
  demonstrateReset?: boolean;
}

export interface SampleRequestResult {
  userId: string;
  statusCode: number;
  durationMs: number;
  data?: unknown;
  tracked: boolean;
}

export interface SampleConsumerResult {
  registration: { ok: boolean; dependencyId?: string; sessionId?: string; code?: string };
  requests: SampleRequestResult[];
  flush: { accepted: number; duplicate: number; dropped: number; code?: string };
  diagnostics: { acceptedCount: number; duplicateCount: number; droppedCount: number; activeSessionId?: string };
  resetReRegistration?: {
    resetSucceeded: boolean;
    unregisteredTrackBlocked: boolean;
    reRegistration: { ok: boolean; dependencyId?: string; sessionId?: string; code?: string };
  };
}

export async function runSampleConsumer(options: SampleConsumerOptions = {}): Promise<SampleConsumerResult> {
  const apiKey = options.apiKey ?? process.env.DRIFTGUARD_API_KEY ?? 'dg_key_dev_default';
  const projectId = options.projectId ?? process.env.DRIFTGUARD_PROJECT_ID ?? 'proj-local-01';
  const endpoint = options.endpoint ?? process.env.DRIFTGUARD_ENDPOINT ?? 'http://127.0.0.1:4000';
  const environment = options.environment ?? (process.env.DRIFTGUARD_ENVIRONMENT as any) ?? 'development';
  const usersApiBaseUrl = options.usersApiBaseUrl ?? process.env.USERS_API_BASE_URL ?? 'http://127.0.0.1:4001';
  const allowInsecureLoopback = options.allowInsecureLoopback ?? true;
  const enableReviewedFixtures = options.enableReviewedFixtures ?? false;
  const fetchFn = options.fetchFn ?? globalThis.fetch;

  console.log(`[sample-consumer] Initializing DriftGuard SDK for project: ${projectId} (${environment})`);

  // 1. Initialize DriftGuard SDK
  const driftguard = new DriftGuard({
    apiKey,
    projectId,
    endpoint,
    environment,
    allowInsecureLoopback,
    collection: enableReviewedFixtures
      ? {
          responseEvidence: 'allowlisted_fixture',
          allowedBodyPaths: ['$.id', '$.name', '$.display_name']
        }
      : undefined,
    fetchFn
  });

  // 2. Explicitly register Users dependency
  console.log(`[sample-consumer] Registering dependency 'users-api' at ${usersApiBaseUrl}...`);
  const registration = await driftguard.registerDependency({
    name: 'users-api',
    type: 'rest-api',
    baseUrl: usersApiBaseUrl
  });

  if (!registration.ok) {
    console.warn(`[sample-consumer] Warning: Dependency registration returned not ok: ${registration.code}. Proceeding with host requests.`);
  } else {
    console.log(`[sample-consumer] Registered dependency successfully: id=${registration.dependencyId}, session=${registration.sessionId}`);
  }

  // 3. Make real HTTP requests to Users provider across the three fixture identities
  const userIds = ['u-123', 'u-456', 'u-789'];
  const requestResults: SampleRequestResult[] = [];

  for (const id of userIds) {
    const url = `${usersApiBaseUrl}/users/${id}`;
    const startTime = Date.now();
    let statusCode = 0;
    let responseData: any = undefined;

    try {
      const res = await fetchFn(url);
      statusCode = res.status;
      responseData = await res.json().catch(() => undefined);
    } catch (err: any) {
      console.warn(`[sample-consumer] Request to ${url} failed: ${err.message}`);
      statusCode = 503;
    }

    const durationMs = Math.max(1, Date.now() - startTime);

    // Track request manually after actual provider request
    let tracked = false;
    if (registration.ok && registration.dependencyId) {
      const trackRes = driftguard.trackRequest({
        dependencyId: registration.dependencyId,
        method: 'GET',
        routeTemplate: '/users/:id',
        statusCode,
        durationMs,
        observedAt: new Date().toISOString(),
        fixtureKey: `user:${id}`,
        responseEvidence: responseData && typeof responseData === 'object' ? responseData : undefined
      });
      tracked = trackRes.queued;
    }

    requestResults.push({
      userId: id,
      statusCode,
      durationMs,
      data: responseData,
      tracked
    });

    console.log(`[sample-consumer] Request GET /users/${id} -> ${statusCode} (${durationMs}ms, tracked=${tracked})`);
  }

  // 4. Flush telemetry to DriftGuard
  console.log('[sample-consumer] Flushing telemetry to DriftGuard...');
  const flushResult = await driftguard.flush();
  console.log(`[sample-consumer] Flush result: accepted=${flushResult.accepted}, duplicates=${flushResult.duplicate}, dropped=${flushResult.dropped}`);

  // 5. Gather diagnostics and shutdown cleanly
  const diag = await driftguard.diagnostics();
  await driftguard.shutdown();

  console.log('[sample-consumer] Shutdown complete.');

  return {
    registration,
    requests: requestResults,
    flush: flushResult,
    diagnostics: {
      acceptedCount: diag.acceptedCount,
      duplicateCount: diag.duplicateCount,
      droppedCount: diag.droppedCount,
      activeSessionId: diag.activeSessionId
    }
  };
}

// Direct CLI entrypoint
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  runSampleConsumer()
    .then((res) => {
      console.log('Sample run finished:', JSON.stringify(res, null, 2));
    })
    .catch((err) => {
      console.error('Fatal sample error:', err);
      process.exit(1);
    });
}
