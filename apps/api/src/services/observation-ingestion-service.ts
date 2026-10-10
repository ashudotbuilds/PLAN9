import { createHash, randomUUID } from 'node:crypto';
import {
  ObservationBatchV1,
  ProjectEnvironment,
  IngestObservationsResponse,
  IngestObservationsFinding,
  SdkDiagnosticsResponse
} from '@driftguard/contracts';
import { InventoryService } from './inventory-service.js';
import { IncidentService } from './incident-service.js';

export class ObservationIngestionService {
  private inventoryService: InventoryService;
  private incidentService?: IncidentService;

  // Dedup stores:
  // batchId -> { digest: string; response: IngestObservationsResponse }
  private seenBatches = new Map<string, { digest: string; response: IngestObservationsResponse }>();
  // eventKey (scope:sessionId:eventId) -> digest: string
  private seenEvents = new Map<string, string>();

  // Diagnostic counters and timestamps per scope (projectId:environment)
  private diagnosticsStats = new Map<
    string,
    {
      acceptedCount: number;
      rejectionCount: number;
      lastIngestAt?: string;
    }
  >();

  // Retention tracking per session (projectId:environment:sessionId -> count)
  private sessionObservationCounts = new Map<string, number>();

  // Rate limiter (projectId:environment -> { count: number; windowStart: number })
  private rateLimitWindow = new Map<string, { count: number; windowStart: number }>();

  constructor(inventoryService: InventoryService, incidentService?: IncidentService) {
    this.inventoryService = inventoryService;
    this.incidentService = incidentService;
  }

  private checkRateLimit(projectId: string, environment: string): void {
    const key = `${projectId}:${environment}`;
    const now = Date.now();
    const entry = this.rateLimitWindow.get(key) || { count: 0, windowStart: now };

    if (now - entry.windowStart > 60000) {
      entry.count = 1;
      entry.windowStart = now;
      this.rateLimitWindow.set(key, entry);
      return;
    }

    entry.count += 1;
    this.rateLimitWindow.set(key, entry);

    if (entry.count > 60) {
      const error: any = new Error('Rate limit of 60 ingestion requests per minute exceeded.');
      error.statusCode = 429;
      error.code = 'RATE_LIMIT_EXCEEDED';
      throw error;
    }
  }

  private getStats(scopeKey: string) {
    let stats = this.diagnosticsStats.get(scopeKey);
    if (!stats) {
      stats = { acceptedCount: 0, rejectionCount: 0 };
      this.diagnosticsStats.set(scopeKey, stats);
    }
    return stats;
  }

  private hash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private redactEvidence(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data || typeof data !== 'object') return data;
    const sensitiveKeys = new Set([
      'authorization',
      'token',
      'secret',
      'password',
      'apikey',
      'api_key',
      'bearer',
      'access_token'
    ]);

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.redactEvidence(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  public async ingestObservations(
    batch: ObservationBatchV1,
    activeSessionId: string
  ): Promise<IngestObservationsResponse> {
    const scopeKey = `${batch.projectId}:${batch.environment}`;
    const stats = this.getStats(scopeKey);

    try {
      // 1. Session check: Reject stale or mismatched sessions
      if (batch.sessionId !== activeSessionId) {
        const error: any = new Error(
          `Stale or invalid session: provided '${batch.sessionId}', active is '${activeSessionId}'.`
        );
        error.statusCode = 409;
        error.code = 'STALE_SESSION';
        throw error;
      }

      // 2. Rate limit check
      this.checkRateLimit(batch.projectId, batch.environment);

      // 3. Batch Dedup & Idempotency
      const batchDigest = this.hash(JSON.stringify(batch));
      const existingBatch = this.seenBatches.get(batch.batchId);
      if (existingBatch) {
        if (existingBatch.digest === batchDigest) {
          // Exact retry: return original acknowledgment without incrementing counters, audit, or incidents
          return {
            ...existingBatch.response,
            accepted: 0,
            duplicates: batch.events.length
          };
        } else {
          // Conflicting batch payload with same batchId
          const error: any = new Error(
            `Batch ID '${batch.batchId}' already exists with conflicting content.`
          );
          error.statusCode = 409;
          error.code = 'BATCH_ID_CONFLICT';
          throw error;
        }
      }

      // 4. Timestamp validity check for all events: max 5m future, max 24h past
      const now = Date.now();
      for (const ev of batch.events) {
        const ts = Date.parse(ev.observedAt);
        if (isNaN(ts) || ts > now + 5 * 60 * 1000 || now - ts > 24 * 3600 * 1000) {
          const error: any = new Error(
            `Event timestamp '${ev.observedAt}' outside policy window (must be within past 24h and at most 5m in future).`
          );
          error.statusCode = 400;
          error.code = 'INVALID_EVENT_TIMESTAMP';
          throw error;
        }
      }

      // 5. Dependency existence check for all events
      this.inventoryService.seedDefaultDependencies(batch.projectId, batch.environment);
      for (const ev of batch.events) {
        const dep = this.inventoryService.getDependency(ev.dependencyId);
        if (!dep || dep.projectId !== batch.projectId || dep.environment !== batch.environment) {
          const error: any = new Error(
            `Dependency '${ev.dependencyId}' not found in scope '${batch.projectId}/${batch.environment}'.`
          );
          error.statusCode = 404;
          error.code = 'DEPENDENCY_NOT_FOUND';
          throw error;
        }
      }

      // 6. Retention check: max 1,000 observations per session
      const sessionKey = `${batch.projectId}:${batch.environment}:${batch.sessionId}`;
      const currentSessionCount = this.sessionObservationCounts.get(sessionKey) || 0;
      if (currentSessionCount + batch.events.length > 1000) {
        const error: any = new Error(
          `Retention limit of 1,000 observations per session exceeded (current: ${currentSessionCount}).`
        );
        error.statusCode = 429;
        error.code = 'RETENTION_LIMIT';
        throw error;
      }

      // 7. Event-level Dedup & Conflict pre-validation
      const pendingEvents: {
        event: (typeof batch.events)[number];
        isDuplicate: boolean;
        eventKey: string;
        eventDigest: string;
      }[] = [];

      for (const ev of batch.events) {
        const eventKey = `${batch.projectId}:${batch.environment}:${batch.sessionId}:${ev.eventId}`;
        const eventDigest = this.hash(JSON.stringify(ev));
        const existingEventDigest = this.seenEvents.get(eventKey);

        if (existingEventDigest) {
          if (existingEventDigest === eventDigest) {
            pendingEvents.push({ event: ev, isDuplicate: true, eventKey, eventDigest });
          } else {
            const error: any = new Error(
              `Event ID '${ev.eventId}' already exists with conflicting content.`
            );
            error.statusCode = 409;
            error.code = 'EVENT_ID_CONFLICT';
            throw error;
          }
        } else {
          pendingEvents.push({ event: ev, isDuplicate: false, eventKey, eventDigest });
        }
      }

      // 8. Atomic processing: Commit observations and evaluate findings
      let accepted = 0;
      let duplicates = 0;
      const findings: IngestObservationsFinding[] = [];

      for (const item of pendingEvents) {
        if (item.isDuplicate) {
          duplicates += 1;
          continue;
        }

        accepted += 1;
        this.seenEvents.set(item.eventKey, item.eventDigest);

        const dep = this.inventoryService.getDependency(item.event.dependencyId)!;
        this.inventoryService.recordObservation(dep.dependencyId, item.event.observedAt);

        // Sanitize / Redact evidence
        const sanitizedEvidence = this.redactEvidence(item.event.responseEvidence);

        // Evaluate collection policy and detection semantics
        const policy = dep.collectionPolicy;
        if (policy.mode === 'reviewed_fixtures') {
          // Check for reviewed Users fixture and user rename drift
          if (sanitizedEvidence && dep.providerId === 'users') {
            if ('display_name' in sanitizedEvidence && !('name' in sanitizedEvidence)) {
              const findingId = `find_${randomUUID().slice(0, 8)}`;
              findings.push({
                id: findingId,
                evidenceStatus: 'confirmed'
              });
            }
          }
        } else if (policy.mode === 'metadata_only') {
          // Metadata-only events cannot claim field semantics!
          // No field findings generated
        } else if (policy.mode === 'unsupported') {
          // Non-REST unsupported policy
          const findingId = `find_${randomUUID().slice(0, 8)}`;
          findings.push({
            id: findingId,
            evidenceStatus: 'unsupported'
          });
        }
      }

      // Update session observation retention count
      this.sessionObservationCounts.set(sessionKey, currentSessionCount + accepted);

      // Update diagnostic statistics
      stats.acceptedCount += accepted;
      stats.lastIngestAt = new Date().toISOString();

      const auditEventId = `aud_ingest_${randomUUID().slice(0, 8)}`;
      const response: IngestObservationsResponse = {
        batchId: batch.batchId,
        accepted,
        duplicates,
        findings,
        auditEventId
      };

      // Persist batch result for exact idempotency replay
      this.seenBatches.set(batch.batchId, { digest: batchDigest, response });

      return response;
    } catch (err: any) {
      stats.rejectionCount += 1;
      throw err;
    }
  }

  public getDiagnostics(
    projectId: string,
    environment: ProjectEnvironment,
    activeSessionId: string
  ): SdkDiagnosticsResponse {
    const scopeKey = `${projectId}:${environment}`;
    const stats = this.getStats(scopeKey);

    let status: 'awaiting_observations' | 'receiving' | 'stale';
    if (!stats.lastIngestAt || stats.acceptedCount === 0) {
      status = 'awaiting_observations';
    } else {
      const diffMs = Date.now() - Date.parse(stats.lastIngestAt);
      if (diffMs > 60000) {
        status = 'stale';
      } else {
        status = 'receiving';
      }
    }

    return {
      projectId,
      environment,
      sessionId: activeSessionId,
      lastIngestAt: stats.lastIngestAt,
      acceptedCount: stats.acceptedCount,
      rejectionCount: stats.rejectionCount,
      status
    };
  }
}
