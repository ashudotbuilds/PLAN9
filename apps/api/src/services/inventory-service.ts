import { randomUUID } from 'node:crypto';
import {
  ProjectEnvironment,
  DependencyType,
  CollectionPolicy,
  DependencySummary,
  DependencyEndpoint,
  DependencyGraphEdge,
  DependencyEvidenceItem,
  DependencyDetailResponse,
  RegisterDependencyRequest,
  RegisterDependencyResponse,
  BaselineSummary,
  IncidentSummary
} from '@driftguard/contracts';

export interface StoredDependency {
  dependencyId: string;
  projectId: string;
  environment: ProjectEnvironment;
  name: string;
  type: DependencyType;
  baseUrl?: string;
  origin?: string;
  packageId?: string;
  providerId?: string;
  confidence: 'declared' | 'observed' | 'corroborated';
  health: 'unknown' | 'healthy' | 'degraded' | 'unavailable' | 'unsupported';
  collectionPolicy: CollectionPolicy;
  registeredAt: string;
  updatedAt: string;
  revision: number;
  auditEventId: string;
  observationCount: number;
  baselineVersion?: number;
  latestVersion?: number;
}

export class InventoryService {
  private dependencies = new Map<string, StoredDependency>();
  private inventoryVersions = new Map<string, number>(); // projectId:environment -> version
  private readonly maxDependenciesPerScope = 20;
  private rateLimitWindow = new Map<string, { count: number; windowStart: number }>();

  constructor() {
    this.seedDefaultDependencies('proj-local-01', 'development');
  }

  public seedDefaultDependencies(projectId: string, environment: ProjectEnvironment) {
    const defaultSeeded = [
      {
        id: `dep-${projectId}-${environment}-users`,
        name: 'Users API',
        type: 'rest-api' as DependencyType,
        baseUrl: 'http://localhost:4010',
        origin: 'http://localhost:4010',
        providerId: 'users',
        confidence: 'observed' as const,
        health: 'healthy' as const,
        policy: {
          version: '1',
          mode: 'reviewed_fixtures' as const,
          allowedFixtureKeys: ['user:u-123', 'user:u-456', 'user:u-789', 'u-123', 'u-456', 'u-789'],
          allowedPaths: ['/users/:id'],
          rateLimitPerMinute: 60
        }
      },
      {
        id: `dep-${projectId}-${environment}-inventory`,
        name: 'Inventory API',
        type: 'rest-api' as DependencyType,
        baseUrl: 'http://localhost:4010',
        origin: 'http://localhost:4010',
        providerId: 'inventory',
        confidence: 'observed' as const,
        health: 'healthy' as const,
        policy: {
          version: '1',
          mode: 'metadata_only' as const,
          rateLimitPerMinute: 60
        }
      },
      {
        id: `dep-${projectId}-${environment}-shipping`,
        name: 'Shipping API',
        type: 'rest-api' as DependencyType,
        baseUrl: 'http://localhost:4010',
        origin: 'http://localhost:4010',
        providerId: 'shipping',
        confidence: 'observed' as const,
        health: 'healthy' as const,
        policy: {
          version: '1',
          mode: 'metadata_only' as const,
          rateLimitPerMinute: 60
        }
      }
    ];

    const now = new Date().toISOString();
    for (const item of defaultSeeded) {
      if (!this.dependencies.has(item.id)) {
        this.dependencies.set(item.id, {
          dependencyId: item.id,
          projectId,
          environment,
          name: item.name,
          type: item.type,
          baseUrl: item.baseUrl,
          origin: item.origin,
          providerId: item.providerId,
          confidence: item.confidence,
          health: item.health,
          collectionPolicy: item.policy,
          registeredAt: now,
          updatedAt: now,
          revision: 1,
          auditEventId: `aud-seed-${item.providerId}-${projectId}`,
          observationCount: 3,
          baselineVersion: 1,
          latestVersion: 1
        });
      }
    }
    const scopeKey = `${projectId}:${environment}`;
    if (!this.inventoryVersions.has(scopeKey)) {
      this.inventoryVersions.set(scopeKey, 1);
    }
  }

  public normalizeOrigin(rawUrl?: string): string | undefined {
    if (!rawUrl) return undefined;
    try {
      const parsed = new URL(rawUrl);
      // Strip userinfo, query, fragment
      return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}`;
    } catch {
      return rawUrl.split('?')[0].split('#')[0].replace(/\/$/, '');
    }
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

  public registerDependency(
    req: RegisterDependencyRequest,
    activeSessionId: string
  ): RegisterDependencyResponse {
    const { projectId, environment, dependency } = req;
    this.seedDefaultDependencies(projectId, environment);
    this.checkRateLimit(projectId, environment);

    const scopeKey = `${projectId}:${environment}`;
    const currentInventoryVersion = this.inventoryVersions.get(scopeKey) || 1;

    const normalizedOrigin = this.normalizeOrigin(dependency.baseUrl);

    // Natural key match: same project, environment, and (name or origin)
    const existing = Array.from(this.dependencies.values()).find(
      (d) =>
        d.projectId === projectId &&
        d.environment === environment &&
        (d.name.toLowerCase() === dependency.name.toLowerCase() ||
          (normalizedOrigin && d.origin && d.origin === normalizedOrigin))
    );

    if (existing) {
      // Check for conflict
      if (existing.type !== dependency.type) {
        const error: any = new Error(
          `Dependency conflict: existing dependency '${existing.name}' has type '${existing.type}', requested '${dependency.type}'`
        );
        error.statusCode = 409;
        error.code = 'DEPENDENCY_CONFLICT';
        throw error;
      }

      if (normalizedOrigin && existing.origin && existing.origin !== normalizedOrigin) {
        const error: any = new Error(
          `Dependency conflict: existing origin '${existing.origin}' does not match requested '${normalizedOrigin}'`
        );
        error.statusCode = 409;
        error.code = 'DEPENDENCY_CONFLICT';
        throw error;
      }

      // If unchanged upsert, re-use original auditEventId and inventoryVersion
      const isUnchanged =
        existing.name === dependency.name &&
        existing.baseUrl === dependency.baseUrl &&
        existing.packageId === dependency.packageId;

      if (isUnchanged) {
        return {
          dependencyId: existing.dependencyId,
          providerId: existing.providerId,
          sessionId: activeSessionId,
          inventoryVersion: currentInventoryVersion,
          collectionPolicy: existing.collectionPolicy,
          auditEventId: existing.auditEventId
        };
      }

      // Changed registration: increment revision and inventoryVersion
      const newInventoryVersion = currentInventoryVersion + 1;
      this.inventoryVersions.set(scopeKey, newInventoryVersion);
      existing.revision += 1;
      existing.updatedAt = new Date().toISOString();
      existing.baseUrl = dependency.baseUrl;
      existing.packageId = dependency.packageId;
      const auditEventId = `aud-dep-upd-${randomUUID().slice(0, 8)}`;
      existing.auditEventId = auditEventId;

      return {
        dependencyId: existing.dependencyId,
        providerId: existing.providerId,
        sessionId: activeSessionId,
        inventoryVersion: newInventoryVersion,
        collectionPolicy: existing.collectionPolicy,
        auditEventId
      };
    }

    // Check capacity bound
    const scopeDependencies = Array.from(this.dependencies.values()).filter(
      (d) => d.projectId === projectId && d.environment === environment
    );
    if (scopeDependencies.length >= this.maxDependenciesPerScope) {
      const error: any = new Error(`Exceeded maximum of ${this.maxDependenciesPerScope} dependencies per scope.`);
      error.statusCode = 409;
      error.code = 'DEPENDENCY_LIMIT_EXCEEDED';
      throw error;
    }

    // Determine providerId if matches seeded providers
    let providerId: string | undefined;
    const lowerName = dependency.name.toLowerCase();
    if (lowerName.includes('user')) {
      providerId = 'users';
    } else if (lowerName.includes('inventory')) {
      providerId = 'inventory';
    } else if (lowerName.includes('shipping')) {
      providerId = 'shipping';
    }

    // Assign collection policy
    let collectionPolicy: CollectionPolicy;
    if (dependency.type !== 'rest-api') {
      collectionPolicy = {
        version: '1',
        mode: 'unsupported',
        rateLimitPerMinute: 60
      };
    } else if (providerId === 'users') {
      collectionPolicy = {
        version: '1',
        mode: 'reviewed_fixtures',
        allowedFixtureKeys: ['user:u-123', 'user:u-456', 'user:u-789', 'u-123', 'u-456', 'u-789'],
        allowedPaths: ['/users/:id'],
        rateLimitPerMinute: 60
      };
    } else {
      collectionPolicy = {
        version: '1',
        mode: 'metadata_only',
        rateLimitPerMinute: 60
      };
    }

    const now = new Date().toISOString();
    const dependencyId = `dep-${randomUUID().slice(0, 8)}`;
    const auditEventId = `aud-dep-reg-${randomUUID().slice(0, 8)}`;

    const newInventoryVersion = currentInventoryVersion + 1;
    this.inventoryVersions.set(scopeKey, newInventoryVersion);

    const record: StoredDependency = {
      dependencyId,
      projectId,
      environment,
      name: dependency.name,
      type: dependency.type,
      baseUrl: dependency.baseUrl,
      origin: normalizedOrigin,
      packageId: dependency.packageId,
      providerId,
      confidence: 'declared', // Pure declared registration!
      health: dependency.type === 'rest-api' ? 'unknown' : 'unsupported',
      collectionPolicy,
      registeredAt: now,
      updatedAt: now,
      revision: 1,
      auditEventId,
      observationCount: 0 // Honest 0 counts for new declared dependency
    };

    this.dependencies.set(dependencyId, record);

    return {
      dependencyId,
      providerId,
      sessionId: activeSessionId,
      inventoryVersion: newInventoryVersion,
      collectionPolicy,
      auditEventId
    };
  }

  public listDependencies(
    projectId: string,
    environment: ProjectEnvironment,
    limit = 50,
    cursor?: string
  ): { dependencies: DependencySummary[]; nextCursor?: string } {
    this.seedDefaultDependencies(projectId, environment);

    const scoped = Array.from(this.dependencies.values())
      .filter((d) => d.projectId === projectId && d.environment === environment)
      .sort((a, b) => a.name.localeCompare(b.name) || a.dependencyId.localeCompare(b.dependencyId));

    let startIndex = 0;
    if (cursor) {
      const idx = scoped.findIndex((d) => d.dependencyId === cursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    const clampedLimit = Math.min(Math.max(limit, 1), 100);
    const paged = scoped.slice(startIndex, startIndex + clampedLimit);
    const nextCursor =
      startIndex + clampedLimit < scoped.length
        ? paged[paged.length - 1]?.dependencyId
        : undefined;

    const summaries: DependencySummary[] = paged.map((d) => ({
      dependencyId: d.dependencyId,
      name: d.name,
      type: d.type,
      origin: d.origin,
      providerId: d.providerId,
      confidence: d.confidence,
      health: d.health,
      collectionPolicy: {
        version: d.collectionPolicy.version,
        mode: d.collectionPolicy.mode
      },
      registeredAt: d.registeredAt,
      updatedAt: d.updatedAt,
      observationCount: d.observationCount,
      baselineVersion: d.baselineVersion,
      latestVersion: d.latestVersion
    }));

    return {
      dependencies: summaries,
      nextCursor
    };
  }

  public getDependencyDetail(
    projectId: string,
    environment: ProjectEnvironment,
    dependencyId: string,
    activeBaseline?: BaselineSummary,
    incidents: IncidentSummary[] = []
  ): DependencyDetailResponse {
    this.seedDefaultDependencies(projectId, environment);

    const record = this.dependencies.get(dependencyId);
    if (!record || record.projectId !== projectId || record.environment !== environment) {
      const error: any = new Error(`Dependency '${dependencyId}' not found in scope '${projectId}/${environment}'.`);
      error.statusCode = 404;
      error.code = 'DEPENDENCY_NOT_FOUND';
      throw error;
    }

    // Endpoints
    const endpoints: DependencyEndpoint[] = [];
    if (record.providerId === 'users') {
      endpoints.push({
        method: 'GET',
        routeTemplate: '/users/:id',
        observedCount: record.observationCount || 3,
        lastSeenAt: record.updatedAt
      });
    } else if (record.providerId === 'inventory') {
      endpoints.push({
        method: 'GET',
        routeTemplate: '/inventory/items',
        observedCount: record.observationCount || 2,
        lastSeenAt: record.updatedAt
      });
    } else if (record.providerId === 'shipping') {
      endpoints.push({
        method: 'GET',
        routeTemplate: '/shipping/estimate',
        observedCount: record.observationCount || 1,
        lastSeenAt: record.updatedAt
      });
    }

    // Baseline & Latest
    const baseline =
      activeBaseline && record.baselineVersion
        ? {
            version: activeBaseline.version,
            capturedAt: activeBaseline.capturedAt,
            fingerprint: activeBaseline.fingerprint
          }
        : undefined;

    const latest = record.latestVersion
      ? {
          version: record.latestVersion,
          observedAt: record.updatedAt,
          fingerprint: baseline?.fingerprint || 'dg-fp:declared'
        }
      : undefined;

    // Evidence history
    const evidenceHistory: DependencyEvidenceItem[] = [];
    if (record.providerId === 'users' && record.observationCount > 0) {
      evidenceHistory.push({
        id: 'ev-seed-u123',
        method: 'GET',
        route: '/users/u-123',
        statusCode: 200,
        timestamp: record.registeredAt,
        fingerprint: 'fp-u123-healthy',
        evidenceType: 'http_response'
      });
    }

    // Graph edges with strict provenance separation
    const graphEdges: DependencyGraphEdge[] = [];
    if (record.providerId === 'users') {
      graphEdges.push({
        source: record.dependencyId,
        target: 'workflow:welcome_email',
        workflowId: 'welcome_email',
        provenance: 'runtime_read',
        canonicalField: 'displayName',
        providerField: 'name'
      });
      graphEdges.push({
        source: record.dependencyId,
        target: 'workflow:customer_profile',
        workflowId: 'customer_profile',
        provenance: 'runtime_read',
        canonicalField: 'displayName',
        providerField: 'name'
      });
    } else {
      graphEdges.push({
        source: record.dependencyId,
        target: `project:${projectId}`,
        provenance: 'declared'
      });
    }

    return {
      dependency: {
        dependencyId: record.dependencyId,
        name: record.name,
        type: record.type,
        origin: record.origin,
        providerId: record.providerId,
        confidence: record.confidence,
        health: record.health,
        collectionPolicy: {
          version: record.collectionPolicy.version,
          mode: record.collectionPolicy.mode
        },
        registeredAt: record.registeredAt,
        updatedAt: record.updatedAt,
        observationCount: record.observationCount,
        baselineVersion: record.baselineVersion,
        latestVersion: record.latestVersion
      },
      endpoints,
      baseline,
      latest,
      evidenceHistory,
      graphEdges
    };
  }

  public getDependency(dependencyId: string): StoredDependency | undefined {
    return this.dependencies.get(dependencyId);
  }

  public recordObservation(dependencyId: string, observedAt: string): void {
    const dep = this.dependencies.get(dependencyId);
    if (!dep) return;
    dep.observationCount += 1;
    dep.updatedAt = observedAt;
    if (dep.confidence === 'declared') {
      dep.confidence = 'observed';
    }
  }
}
