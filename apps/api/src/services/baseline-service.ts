import { createHash, randomUUID } from 'node:crypto';
import {
  BaselineSummary,
  CaptureBaselineResponse,
  DependencyEdge,
  ProjectEnvironment,
  ReplayWorkflowResponse,
  WorkflowId,
  CanonicalUser
} from '@driftguard/contracts';

export interface DemoLease {
  projectId: string;
  environment: ProjectEnvironment;
  sessionId: string;
  acquiredAt: string;
}

export interface BaselineRecord {
  summary: BaselineSummary;
  rawEvidence: {
    users: Record<string, unknown>[];
    inventory: Record<string, unknown>;
    shipping: Record<string, unknown>;
  };
  normalizedEvidence: Record<string, unknown>;
  canonicalEntities: {
    users: CanonicalUser[];
    inventory: Record<string, unknown>;
    shipping: Record<string, unknown>;
  };
  workflowResults: Record<string, unknown>;
  readEdges: DependencyEdge[];
  observationsCount: number;
  evidenceBytes: number;
}

export interface BaselineServiceOptions {
  mockProvidersBaseUrl?: string;
  fetchFn?: typeof fetch;
}

export class BaselineService {
  private currentLease: DemoLease | null = null;
  private baselines = new Map<string, BaselineRecord>(); // keyed by `${projectId}:${environment}`
  private sessionStats = new Map<string, { observations: number; bytes: number }>();
  private readonly maxObservations = 1000;
  private readonly maxEvidenceBytes = 10 * 1024 * 1024; // 10 MiB
  private mockProvidersBaseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: BaselineServiceOptions = {}) {
    this.mockProvidersBaseUrl = options.mockProvidersBaseUrl || process.env.MOCK_PROVIDERS_URL || 'http://127.0.0.1:4001';
    this.fetchFn = options.fetchFn || fetch;
  }

  getLease(): DemoLease | null {
    return this.currentLease;
  }

  acquireLease(projectId: string, environment: ProjectEnvironment, sessionId: string): void {
    if (this.currentLease) {
      if (
        this.currentLease.projectId !== projectId ||
        this.currentLease.environment !== environment
      ) {
        const err = new Error(`Demo environment is currently locked by project '${this.currentLease.projectId}' (${this.currentLease.environment})`);
        (err as any).statusCode = 409;
        (err as any).code = 'DEMO_SCOPE_BUSY';
        (err as any).details = { activeLease: this.currentLease };
        throw err;
      }
    }

    this.currentLease = {
      projectId,
      environment,
      sessionId,
      acquiredAt: new Date().toISOString()
    };
  }

  releaseLease(projectId: string, environment: ProjectEnvironment): void {
    if (
      this.currentLease &&
      this.currentLease.projectId === projectId &&
      this.currentLease.environment === environment
    ) {
      this.currentLease = null;
    }
  }

  traceReads<T extends object>(target: T, onRead: (prop: string) => void, prefix = ''): T {
    return new Proxy(target, {
      get(t, prop, receiver) {
        if (typeof prop === 'string') {
          const fullPath = prefix ? `${prefix}.${prop}` : prop;
          onRead(fullPath);
          const val = Reflect.get(t, prop, receiver);
          if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            return new BaselineService().traceReads(val, onRead, fullPath);
          }
          return val;
        }
        return Reflect.get(t, prop, receiver);
      }
    });
  }

  async captureBaseline(
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string
  ): Promise<CaptureBaselineResponse> {
    // 1. Check retention limit
    const sessionKey = `${projectId}:${sessionId}`;
    const stats = this.sessionStats.get(sessionKey) || { observations: 0, bytes: 0 };
    if (stats.observations >= this.maxObservations || stats.bytes >= this.maxEvidenceBytes) {
      const err = new Error('Session retention limit reached (max 1000 observations or 10 MiB)');
      (err as any).statusCode = 429;
      (err as any).code = 'RETENTION_LIMIT';
      (err as any).details = { observations: stats.observations, bytes: stats.bytes };
      throw err;
    }

    // 2. Acquire lease
    this.acquireLease(projectId, environment, sessionId);

    // 3. Fetch fixtures over HTTP from mock providers
    const userIds = ['u-123', 'u-456', 'u-789'];
    let rawUsers: any[] = [];
    let rawInventory: any;
    let rawShipping: any;

    try {
      const userPromises = userIds.map(async (id) => {
        const res = await this.fetchFn(`${this.mockProvidersBaseUrl}/users/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching user ${id}`);
        return res.json();
      });

      const invPromise = (async () => {
        const res = await this.fetchFn(`${this.mockProvidersBaseUrl}/inventory/items`);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching inventory`);
        return res.json();
      })();

      const shipPromise = (async () => {
        const res = await this.fetchFn(`${this.mockProvidersBaseUrl}/shipping/estimate?ship_date=2026-10-09&delivery_days=3`);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching shipping`);
        return res.json();
      })();

      const [users, inventory, shipping] = await Promise.all([
        Promise.all(userPromises),
        invPromise,
        shipPromise
      ]);

      rawUsers = users;
      rawInventory = inventory;
      rawShipping = shipping;
    } catch (err: any) {
      const captureErr = new Error(`Failed to capture baseline from mock providers: ${err.message}`);
      (captureErr as any).statusCode = 502;
      (captureErr as any).code = 'BASELINE_CAPTURE_FAILED';
      (captureErr as any).details = { originalError: err.message };
      throw captureErr;
    }

    // 4. Baseline Adapter: map provider shapes to canonical representations
    // User: maps 'name' -> 'displayName'
    const canonicalUsers: CanonicalUser[] = rawUsers.map((u) => {
      if (typeof u.name !== 'string' || !u.id) {
        const err = new Error(`Invalid raw user object missing expected name/id: ${JSON.stringify(u)}`);
        (err as any).statusCode = 502;
        (err as any).code = 'BASELINE_CAPTURE_FAILED';
        throw err;
      }
      return {
        id: u.id,
        displayName: u.name
      };
    });

    const canonicalInventory = {
      items: rawInventory.items || [],
      total: rawInventory.total ?? (rawInventory.items?.length || 0)
    };

    const canonicalShipping = {
      estimated_delivery_date: rawShipping.estimated_delivery_date
    };

    // 5. Traced Workflows & Dependency Edge Extraction
    const readEdges: DependencyEdge[] = [];
    const workflowResults: Record<string, unknown> = {};

    // Workflow A: welcome_email
    {
      const reads = new Set<string>();
      const tracedUser = this.traceReads(canonicalUsers[0], (prop) => reads.add(prop));
      const result = {
        type: 'send_email',
        recipientName: tracedUser.displayName,
        template: 'welcome',
        status: 'simulated_intent'
      };
      workflowResults.welcome_email = result;
      for (const field of reads) {
        readEdges.push({
          workflowId: 'welcome_email',
          canonicalField: `user.${field}`,
          providerField: field === 'displayName' ? 'name' : undefined,
          invariant: 'nonempty_recipient_matches_baseline'
        });
      }
    }

    // Workflow B: customer_profile
    {
      const reads = new Set<string>();
      const tracedUser = this.traceReads(canonicalUsers[0], (prop) => reads.add(prop));
      const result = {
        id: tracedUser.id,
        displayName: tracedUser.displayName
      };
      workflowResults.customer_profile = result;
      for (const field of reads) {
        readEdges.push({
          workflowId: 'customer_profile',
          canonicalField: `user.${field}`,
          providerField: field === 'displayName' ? 'name' : field === 'id' ? 'id' : undefined,
          invariant: 'deep_equal_to_baseline'
        });
      }
    }

    // Workflow C: inventory_sync
    {
      const reads = new Set<string>();
      const tracedInv = this.traceReads(canonicalInventory, (prop) => reads.add(prop));
      const result = {
        syncedItemCount: tracedInv.items.length,
        totalAvailableQuantity: tracedInv.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0)
      };
      workflowResults.inventory_sync = result;
      for (const field of reads) {
        readEdges.push({
          workflowId: 'inventory_sync',
          canonicalField: `inventory.${field}`,
          invariant: 'deep_equal_to_baseline'
        });
      }
    }

    // Workflow D: delivery_estimate
    {
      const reads = new Set<string>();
      const tracedShip = this.traceReads(canonicalShipping, (prop) => reads.add(prop));
      const result = {
        estimatedDeliveryDate: tracedShip.estimated_delivery_date
      };
      workflowResults.delivery_estimate = result;
      for (const field of reads) {
        readEdges.push({
          workflowId: 'delivery_estimate',
          canonicalField: `shipping.${field}`,
          invariant: 'deep_equal_to_baseline'
        });
      }
    }

    // 6. Normalization and Deterministic Fingerprint
    // Normalization redacts/omits volatile headers/timestamps and normalizes structure
    const normalizedEvidence = {
      users: canonicalUsers.map((u) => ({ id: u.id, displayName: u.displayName })).sort((a, b) => a.id.localeCompare(b.id)),
      inventory: {
        total: canonicalInventory.total,
        items: (canonicalInventory.items as any[]).map((i) => ({ id: i.id, sku: i.sku, in_stock: i.in_stock, quantity: i.quantity }))
      },
      shipping: {
        estimated_delivery_date: canonicalShipping.estimated_delivery_date
      }
    };

    const fingerprint = createHash('sha256')
      .update(JSON.stringify(normalizedEvidence))
      .digest('hex');

    const now = new Date().toISOString();
    const baselineId = `base_${randomUUID().slice(0, 8)}`;
    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    const baselineSummary: BaselineSummary = {
      id: baselineId,
      projectId,
      environment,
      sessionId,
      version: 1,
      fingerprint,
      capturedAt: now,
      status: 'captured',
      fixtures: {
        usersCount: canonicalUsers.length,
        inventoryItemsCount: canonicalInventory.items.length,
        shippingCalculated: Boolean(canonicalShipping.estimated_delivery_date)
      }
    };

    // Calculate payload size
    const rawSize = Buffer.byteLength(JSON.stringify({ rawUsers, rawInventory, rawShipping }));
    stats.observations += 5; // 3 users + 1 inventory + 1 shipping
    stats.bytes += rawSize;
    this.sessionStats.set(sessionKey, stats);

    const record: BaselineRecord = {
      summary: baselineSummary,
      rawEvidence: {
        users: rawUsers,
        inventory: rawInventory,
        shipping: rawShipping
      },
      normalizedEvidence,
      canonicalEntities: {
        users: canonicalUsers,
        inventory: canonicalInventory,
        shipping: canonicalShipping
      },
      workflowResults,
      readEdges,
      observationsCount: stats.observations,
      evidenceBytes: stats.bytes
    };

    const scopeKey = `${projectId}:${environment}`;
    this.baselines.set(scopeKey, record);

    return {
      baseline: baselineSummary,
      readEdges,
      auditEventId
    };
  }

  getBaseline(projectId: string, environment: ProjectEnvironment): BaselineRecord | null {
    const scopeKey = `${projectId}:${environment}`;
    return this.baselines.get(scopeKey) || null;
  }

  replayWorkflow(
    workflowId: WorkflowId,
    projectId: string,
    environment: ProjectEnvironment,
    sessionId: string,
    userId?: string
  ): ReplayWorkflowResponse {
    const scopeKey = `${projectId}:${environment}`;
    const baseline = this.baselines.get(scopeKey);
    if (!baseline) {
      const err = new Error('No baseline captured for this project and environment. Capture a baseline first.');
      (err as any).statusCode = 409;
      (err as any).code = 'BASELINE_REQUIRED';
      throw err;
    }

    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;
    const readFields: string[] = [];

    switch (workflowId) {
      case 'welcome_email': {
        const user = (userId ? baseline.canonicalEntities.users.find((u) => u.id === userId) : baseline.canonicalEntities.users[0]) || baseline.canonicalEntities.users[0];
        const tracedUser = this.traceReads(user, (prop) => readFields.push(`user.${prop}`));
        const result = {
          type: 'send_email',
          recipientName: tracedUser.displayName,
          template: 'welcome',
          status: 'simulated_intent'
        };
        const baselineResult = baseline.workflowResults.welcome_email as any;
        const passed = Boolean(result.recipientName && result.recipientName === baselineResult?.recipientName);
        return {
          workflowId,
          status: passed ? 'passed' : 'failed',
          result,
          invariantResult: {
            passed,
            details: passed ? 'recipientName non-empty and equals baseline' : 'recipientName invariant failed'
          },
          readFields: Array.from(new Set(readFields)),
          auditEventId
        };
      }

      case 'customer_profile': {
        const user = (userId ? baseline.canonicalEntities.users.find((u) => u.id === userId) : baseline.canonicalEntities.users[0]) || baseline.canonicalEntities.users[0];
        const tracedUser = this.traceReads(user, (prop) => readFields.push(`user.${prop}`));
        const result = {
          id: tracedUser.id,
          displayName: tracedUser.displayName
        };
        const baselineResult = baseline.workflowResults.customer_profile as any;
        const passed = Boolean(result.id === baselineResult?.id && result.displayName === baselineResult?.displayName);
        return {
          workflowId,
          status: passed ? 'passed' : 'failed',
          result,
          invariantResult: {
            passed,
            details: passed ? 'Profile matches baseline id and displayName' : 'Profile invariant failed'
          },
          readFields: Array.from(new Set(readFields)),
          auditEventId
        };
      }

      case 'inventory_sync': {
        const inv = baseline.canonicalEntities.inventory as any;
        const tracedInv = this.traceReads(inv, (prop) => readFields.push(`inventory.${prop}`));
        const result = {
          syncedItemCount: tracedInv.items.length,
          totalAvailableQuantity: tracedInv.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0)
        };
        const baselineResult = baseline.workflowResults.inventory_sync as any;
        const passed = Boolean(result.syncedItemCount === baselineResult?.syncedItemCount && result.totalAvailableQuantity === baselineResult?.totalAvailableQuantity);
        return {
          workflowId,
          status: passed ? 'passed' : 'failed',
          result,
          invariantResult: {
            passed,
            details: passed ? 'Inventory sync counts match baseline' : 'Inventory sync invariant failed'
          },
          readFields: Array.from(new Set(readFields)),
          auditEventId
        };
      }

      case 'delivery_estimate': {
        const ship = baseline.canonicalEntities.shipping as any;
        const tracedShip = this.traceReads(ship, (prop) => readFields.push(`shipping.${prop}`));
        const result = {
          estimatedDeliveryDate: tracedShip.estimated_delivery_date
        };
        const baselineResult = baseline.workflowResults.delivery_estimate as any;
        const passed = Boolean(result.estimatedDeliveryDate === baselineResult?.estimatedDeliveryDate);
        return {
          workflowId,
          status: passed ? 'passed' : 'failed',
          result,
          invariantResult: {
            passed,
            details: passed ? 'Delivery date matches baseline' : 'Delivery date invariant failed'
          },
          readFields: Array.from(new Set(readFields)),
          auditEventId
        };
      }

      default: {
        const err = new Error(`Unknown workflow ID '${workflowId}'`);
        (err as any).statusCode = 404;
        (err as any).code = 'WORKFLOW_NOT_FOUND';
        throw err;
      }
    }
  }
}
