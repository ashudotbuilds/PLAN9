import { randomUUID } from 'node:crypto';
import {
  ProjectEnvironment,
  DependencyType,
  ObservationBatchV1,
  CollectionPolicy,
  RegisterDependencyResponseSchema,
  IngestObservationsResponseSchema,
  SdkDiagnosticsResponseSchema
} from '@driftguard/contracts';
import {
  redactValue,
  sanitizeRouteTemplate,
  isApprovedFixtureKey
} from '@driftguard/observer';

export interface DriftGuardConfig {
  apiKey: string;
  projectId: string;
  endpoint?: string;
  environment?: ProjectEnvironment;
  allowInsecureLoopback?: boolean;
  autoBatchFlush?: boolean;
  collection?: {
    responseEvidence?: 'metadata_only' | 'allowlisted_fixture';
    allowedBodyPaths?: string[];
  };
  fetchFn?: typeof fetch;
}

export interface RegisterDependencyInput {
  name: string;
  type: DependencyType;
  baseUrl?: string;
  packageId?: string;
}

export interface RegisterDependencyResult {
  ok: boolean;
  dependencyId?: string;
  sessionId?: string;
  collectionPolicyVersion?: number;
  code?: string;
  message?: string;
}

export interface TrackRequestInput {
  dependencyId: string;
  method: string;
  routeTemplate: string;
  statusCode: number;
  durationMs: number;
  observedAt?: string;
  fixtureKey?: string;
  responseEvidence?: Record<string, unknown>;
}

export interface TrackRequestResult {
  queued: boolean;
  code?: string;
  message?: string;
}

export interface FlushResult {
  accepted: number;
  duplicate: number;
  dropped: number;
  code?: string;
}

export interface SdkDiagnosticsResult {
  acceptedCount: number;
  duplicateCount: number;
  droppedCount: number;
  queuedCount: number;
  activeSessionId?: string;
  lastAcknowledgedIngestAt?: string;
  lastError?: { code: string; message: string };
  sdkVersion: string;
  enabled: boolean;
  serverStatus?: string;
}

export interface ShutdownResult {
  unsentCount: number;
}

const SDK_VERSION = '0.1.0';
const MAX_QUEUE_EVENTS = 100;
const MAX_QUEUE_BYTES = 512 * 1024;
const MAX_BATCH_EVENTS = 20;
const MAX_BATCH_BYTES = 128 * 1024;
const MAX_EVENT_BYTES = 16 * 1024;

interface RegistrationRecord {
  dependencyId: string;
  sessionId: string;
  collectionPolicy: CollectionPolicy;
  collectionPolicyVersion: number;
}

type QueuedEvent = ObservationBatchV1['events'][number] & { _byteLength: number };

export class DriftGuard {
  private config: Required<Pick<DriftGuardConfig, 'apiKey' | 'projectId' | 'endpoint' | 'environment' | 'allowInsecureLoopback' | 'autoBatchFlush'>> & Pick<DriftGuardConfig, 'collection'>;
  private fetchFn: typeof fetch;
  private enabled = true;
  private isShutdown = false;
  private lastError?: { code: string; message: string };

  private registrations = new Map<string, RegistrationRecord>();
  private activeSessionId?: string;
  private collectionPolicyVersion = 1;

  private queue: QueuedEvent[] = [];
  private currentQueueBytes = 0;

  private acceptedCount = 0;
  private duplicateCount = 0;
  private droppedCount = 0;
  private lastAcknowledgedIngestAt?: string;

  private flushTimer?: NodeJS.Timeout;
  private activeFlushPromise: Promise<FlushResult> | null = null;

  constructor(config: DriftGuardConfig) {
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
    this.config = {
      apiKey: config.apiKey ?? '',
      projectId: config.projectId ?? '',
      endpoint: config.endpoint ?? 'http://127.0.0.1:4000',
      environment: config.environment ?? 'development',
      allowInsecureLoopback: config.allowInsecureLoopback ?? false,
      autoBatchFlush: config.autoBatchFlush ?? true,
      collection: config.collection
    };

    // Validate config locally without network calls
    if (!this.config.apiKey || typeof this.config.apiKey !== 'string' || this.config.apiKey.trim() === '') {
      this.enabled = false;
      this.lastError = { code: 'INVALID_CONFIG', message: 'apiKey is required and must be a non-empty string.' };
      return;
    }

    if (!this.config.projectId || typeof this.config.projectId !== 'string' || this.config.projectId.trim() === '') {
      this.enabled = false;
      this.lastError = { code: 'INVALID_CONFIG', message: 'projectId is required and must be a non-empty string.' };
      return;
    }

    try {
      const url = new URL(this.config.endpoint);
      if (url.protocol === 'http:') {
        const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
        if (!this.config.allowInsecureLoopback || !isLoopback) {
          this.enabled = false;
          this.lastError = {
            code: 'INSECURE_ENDPOINT',
            message: 'HTTP endpoint is forbidden unless connecting to localhost/loopback with allowInsecureLoopback: true.'
          };
          return;
        }
      } else if (url.protocol !== 'https:') {
        this.enabled = false;
        this.lastError = { code: 'INVALID_ENDPOINT', message: `Unsupported protocol '${url.protocol}'. Expected HTTPS or loopback HTTP.` };
        return;
      }
    } catch (err: any) {
      this.enabled = false;
      this.lastError = { code: 'INVALID_ENDPOINT', message: `Invalid endpoint URL: ${err.message}` };
      return;
    }

    // Auto-flush every 5 seconds (unreferenced timer)
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, 5000);
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  async registerDependency(input: RegisterDependencyInput): Promise<RegisterDependencyResult> {
    if (!this.enabled) {
      return {
        ok: false,
        code: this.lastError?.code || 'SDK_DISABLED',
        message: this.lastError?.message || 'SDK is disabled due to invalid configuration.'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await this.fetchFn(`${this.config.endpoint}/api/ingest/dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          schemaVersion: '1',
          projectId: this.config.projectId,
          environment: this.config.environment,
          sdkVersion: SDK_VERSION,
          dependency: {
            name: input.name,
            type: input.type,
            baseUrl: input.baseUrl,
            packageId: input.packageId
          }
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const code = errorBody?.error?.code || `HTTP_${res.status}`;
        const message = errorBody?.error?.message || `Registration failed with HTTP ${res.status}`;
        this.lastError = { code, message };
        return { ok: false, code, message };
      }

      const rawData = await res.json();
      const parsed = RegisterDependencyResponseSchema.safeParse(rawData);
      if (!parsed.success) {
        this.lastError = { code: 'INVALID_RESPONSE', message: 'Failed to parse registration response.' };
        return { ok: false, code: 'INVALID_RESPONSE', message: 'Failed to parse registration response.' };
      }

      const { dependencyId, sessionId, collectionPolicy } = parsed.data;
      const policyVersionNum = parseInt(collectionPolicy.version, 10) || 1;
      this.activeSessionId = sessionId;
      this.collectionPolicyVersion = policyVersionNum;
      this.registrations.set(dependencyId, {
        dependencyId,
        sessionId,
        collectionPolicy,
        collectionPolicyVersion: policyVersionNum
      });

      return {
        ok: true,
        dependencyId,
        sessionId,
        collectionPolicyVersion: policyVersionNum
      };
    } catch (err: any) {
      const code = err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
      const message = err.message || 'Failed to connect to DriftGuard registration endpoint.';
      this.lastError = { code, message };
      return { ok: false, code, message };
    }
  }

  trackRequest(input: TrackRequestInput): TrackRequestResult {
    if (!this.enabled) {
      return { queued: false, code: 'SDK_DISABLED', message: 'SDK is disabled.' };
    }
    if (this.isShutdown) {
      return { queued: false, code: 'SDK_SHUTDOWN', message: 'SDK has been shut down.' };
    }

    const reg = this.registrations.get(input.dependencyId);
    if (!reg) {
      return {
        queued: false,
        code: 'UNREGISTERED_DEPENDENCY',
        message: `Dependency '${input.dependencyId}' has not been registered with DriftGuard.`
      };
    }

    const validMethods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    const upperMethod = input.method.toUpperCase();
    if (!validMethods.has(upperMethod)) {
      return { queued: false, code: 'INVALID_METHOD', message: `Invalid HTTP method: ${input.method}` };
    }

    const sanitizedRoute = sanitizeRouteTemplate(input.routeTemplate);

    // Effective policy intersection: local opt-in && server reviewed_fixtures && approved fixture key
    let responseEvidence: Record<string, unknown> | undefined = undefined;
    const isLocalOptIn = this.config.collection?.responseEvidence === 'allowlisted_fixture';
    const isServerReviewed = reg.collectionPolicy?.mode === 'reviewed_fixtures';
    const isApprovedFixture = isApprovedFixtureKey(input.fixtureKey, reg.collectionPolicy?.allowedFixtureKeys);

    if (
      isLocalOptIn &&
      isServerReviewed &&
      isApprovedFixture &&
      input.responseEvidence &&
      typeof input.responseEvidence === 'object'
    ) {
      responseEvidence = redactValue(input.responseEvidence) as Record<string, unknown>;
    }

    const eventId = randomUUID();
    const event: QueuedEvent = {
      eventId,
      dependencyId: input.dependencyId,
      method: upperMethod as any,
      routeTemplate: sanitizedRoute,
      statusCode: Math.max(100, Math.min(599, Math.floor(input.statusCode))),
      durationMs: Math.max(0, Math.min(60000, input.durationMs)),
      observedAt: input.observedAt || new Date().toISOString(),
      collectionPolicyVersion: reg.collectionPolicyVersion,
      fixtureKey: input.fixtureKey,
      responseEvidence,
      _byteLength: 0
    };

    const serialized = JSON.stringify(event);
    event._byteLength = Buffer.byteLength(serialized, 'utf8');

    // Individual event limit: 16 KiB
    if (event._byteLength > MAX_EVENT_BYTES) {
      this.droppedCount += 1;
      return { queued: false, code: 'EVENT_TOO_LARGE', message: 'Event exceeds 16 KiB size limit.' };
    }

    // Queue bounds check: 100 events max, 512 KiB max
    if (
      this.queue.length >= MAX_QUEUE_EVENTS ||
      this.currentQueueBytes + event._byteLength > MAX_QUEUE_BYTES
    ) {
      this.droppedCount += 1;
      return { queued: false, code: 'QUEUE_OVERFLOW', message: 'Event dropped due to SDK queue bounds.' };
    }

    this.queue.push(event);
    this.currentQueueBytes += event._byteLength;

    if (this.config.autoBatchFlush && this.queue.length >= MAX_BATCH_EVENTS) {
      void this.flush();
    }

    return { queued: true };
  }

  flush(): Promise<FlushResult> {
    if (this.activeFlushPromise) {
      return this.activeFlushPromise;
    }

    this.activeFlushPromise = this.drainQueue().finally(() => {
      this.activeFlushPromise = null;
    });

    return this.activeFlushPromise;
  }

  private async drainQueue(): Promise<FlushResult> {
    let accepted = 0;
    let duplicate = 0;
    let dropped = 0;
    let finalCode: string | undefined = undefined;

    if (!this.enabled) {
      return { accepted: 0, duplicate: 0, dropped: 0, code: 'SDK_DISABLED' };
    }

    const flushDeadline = Date.now() + 7000;

    while (this.queue.length > 0) {
      if (Date.now() >= flushDeadline) {
        // Capped deadline reached; drop remaining attempted items
        const remainingToDrop = this.queue.splice(0);
        this.currentQueueBytes = 0;
        dropped += remainingToDrop.length;
        this.droppedCount += remainingToDrop.length;
        break;
      }

      // Slice batch items constrained by both <= 20 events AND <= 128 KiB
      const batchItems: QueuedEvent[] = [];
      let batchBytes = 0;
      while (this.queue.length > 0 && batchItems.length < MAX_BATCH_EVENTS) {
        const nextItem = this.queue[0];
        if (batchItems.length > 0 && batchBytes + nextItem._byteLength > MAX_BATCH_BYTES) {
          break;
        }
        batchItems.push(this.queue.shift()!);
        batchBytes += nextItem._byteLength;
      }
      this.currentQueueBytes = Math.max(0, this.currentQueueBytes - batchBytes);

      // Stable batch payload across retries
      const batchPayload: ObservationBatchV1 = {
        schemaVersion: '1',
        batchId: randomUUID(),
        projectId: this.config.projectId,
        environment: this.config.environment,
        sessionId: this.activeSessionId || 'sess_default',
        sdkVersion: SDK_VERSION,
        events: batchItems.map(({ _byteLength, ...e }) => e)
      };

      let attempts = 0;
      let success = false;

      while (attempts <= 2 && !success) {
        if (Date.now() >= flushDeadline) break;
        attempts += 1;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const res = await this.fetchFn(`${this.config.endpoint}/api/ingest/observations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(batchPayload),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          if (res.status === 200) {
            const data = await res.json();
            const parsed = IngestObservationsResponseSchema.safeParse(data);
            if (parsed.success) {
              accepted += parsed.data.accepted;
              duplicate += parsed.data.duplicates;
              this.acceptedCount += parsed.data.accepted;
              this.duplicateCount += parsed.data.duplicates;
              this.lastAcknowledgedIngestAt = new Date().toISOString();
              success = true;
              break;
            }
          }

          if (res.status === 401 || res.status === 403) {
            // Permanent auth failure: disable SDK sending until reconfigured
            this.enabled = false;
            finalCode = 'AUTH_FAILED';
            this.lastError = { code: 'AUTH_FAILED', message: 'Ingestion key revoked or rejected by server.' };
            break;
          }

          if (res.status === 409) {
            const errData = await res.json().catch(() => ({}));
            const code = errData?.error?.code || 'CONFLICT';
            finalCode = code;
            this.lastError = { code, message: errData?.error?.message || 'Ingestion conflict' };
            if (code === 'STALE_SESSION') {
              this.activeSessionId = undefined;
            }
            break;
          }

          // Transient errors (429, 5xx)
          if ((res.status === 429 || res.status >= 500) && attempts <= 2) {
            const retryAfterHeader = res.headers.get('retry-after');
            const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
            const backoffMs = !isNaN(retryAfterSec)
              ? retryAfterSec * 1000
              : attempts === 1 ? 250 : 500;

            if (Date.now() + backoffMs > flushDeadline) {
              finalCode = 'RETRY_AFTER_EXCEEDED';
              break;
            }

            await new Promise(r => setTimeout(r, backoffMs));
            continue;
          }

          // Other 4xx permanent failures
          break;
        } catch {
          if (attempts <= 2 && Date.now() < flushDeadline) {
            await new Promise(r => setTimeout(r, attempts === 1 ? 250 : 500));
            continue;
          }
          break;
        }
      }

      if (!success) {
        dropped += batchItems.length;
        this.droppedCount += batchItems.length;
      }
    }

    return { accepted, duplicate, dropped, code: finalCode };
  }

  async diagnostics(options?: { fetchRemote?: boolean }): Promise<SdkDiagnosticsResult> {
    let serverStatus: string | undefined = undefined;

    if (options?.fetchRemote && this.enabled) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await this.fetchFn(
          `${this.config.endpoint}/api/sdk/diagnostics?projectId=${encodeURIComponent(this.config.projectId)}&environment=${encodeURIComponent(this.config.environment)}`,
          {
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`
            },
            signal: controller.signal
          }
        ).finally(() => clearTimeout(timeoutId));

        if (res.ok) {
          const data = await res.json();
          const parsed = SdkDiagnosticsResponseSchema.safeParse(data);
          if (parsed.success) {
            serverStatus = parsed.data.status;
          }
        }
      } catch {
        // Fall back to local diagnostics safely
      }
    }

    return {
      acceptedCount: this.acceptedCount,
      duplicateCount: this.duplicateCount,
      droppedCount: this.droppedCount,
      queuedCount: this.queue.length,
      activeSessionId: this.activeSessionId,
      lastAcknowledgedIngestAt: this.lastAcknowledgedIngestAt,
      lastError: this.lastError,
      sdkVersion: SDK_VERSION,
      enabled: this.enabled,
      serverStatus
    };
  }

  async shutdown(): Promise<ShutdownResult> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    this.isShutdown = true;

    // Bounded final drain with up to 8s deadline
    await Promise.race([
      this.flush(),
      new Promise(r => setTimeout(r, 8000))
    ]).catch(() => {});

    return {
      unsentCount: this.queue.length
    };
  }
}
