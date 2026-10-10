import { z } from 'zod';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

// Shared Error Envelope
export const ErrorDetailSchema = z.record(z.string(), z.unknown());

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: ErrorDetailSchema.default({}),
    correlationId: z.string()
  })
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// Health Check DTOs
export const ApiHealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  service: z.literal('api'),
  timestamp: z.string().datetime()
});

export type ApiHealthResponse = z.infer<typeof ApiHealthResponseSchema>;

export const MockHealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  service: z.literal('mock-providers'),
  timestamp: z.string().datetime(),
  providers: z.object({
    users: z.enum(['ready', 'degraded', 'offline']),
    inventory: z.enum(['ready', 'degraded', 'offline']),
    shipping: z.enum(['ready', 'degraded', 'offline'])
  })
});

export type MockHealthResponse = z.infer<typeof MockHealthResponseSchema>;

// Mock Provider: Users
export const KnownUserIdentities = [
  { id: 'u-123', name: 'Aarav' },
  { id: 'u-456', name: 'Meera' },
  { id: 'u-789', name: 'Kabir' }
] as const;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string()
});

export type User = z.infer<typeof UserSchema>;

export const ChangedUserSchema = z.object({
  id: z.string(),
  display_name: z.string()
});

export type ChangedUser = z.infer<typeof ChangedUserSchema>;

export const CanonicalUserSchema = z.object({
  id: z.string(),
  displayName: z.string()
});

export type CanonicalUser = z.infer<typeof CanonicalUserSchema>;

// Mock Provider: Inventory
export const InventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  quantity: z.number().int().nonnegative(),
  in_stock: z.boolean()
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const InventoryListResponseSchema = z.object({
  items: z.array(InventoryItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive()
});

export type InventoryListResponse = z.infer<typeof InventoryListResponseSchema>;

// Mock Provider: Shipping
export const ShippingEstimateQuerySchema = z.object({
  ship_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  delivery_days: z.coerce.number().int().positive()
});

export type ShippingEstimateQuery = z.infer<typeof ShippingEstimateQuerySchema>;

export const ShippingEstimateResponseSchema = z.object({
  estimated_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
});

export type ShippingEstimateResponse = z.infer<typeof ShippingEstimateResponseSchema>;

// Lifecycle Enums & Schemas
export const IncidentStatusSchema = z.enum([
  'detected',
  'proposed',
  'validating',
  'validated',
  'active',
  'review_required',
  'rejected',
  'rolled_back',
  'recovered'
]);

export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const RecoveryRunStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed'
]);

export type RecoveryRunStatus = z.infer<typeof RecoveryRunStatusSchema>;

export const RecoveryRunStageSchema = z.enum([
  'impact',
  'proposing',
  'validating',
  'activating',
  'replaying',
  'rolling_back'
]);

export type RecoveryRunStage = z.infer<typeof RecoveryRunStageSchema>;

export const ProjectEnvironmentSchema = z.enum(['development', 'production']);
export type ProjectEnvironment = z.infer<typeof ProjectEnvironmentSchema>;

export const KeyStatusSchema = z.enum(['active', 'revoked']);
export type KeyStatus = z.infer<typeof KeyStatusSchema>;

export const DependencyTypeSchema = z.enum([
  'rest-api',
  'graphql-api',
  'sdk-package',
  'auth-provider',
  'webhook',
  'mcp-server',
  'other'
]);
export type DependencyType = z.infer<typeof DependencyTypeSchema>;

export const DependencyHealthSchema = z.enum(['unknown', 'healthy', 'degraded', 'failing']);
export type DependencyHealth = z.infer<typeof DependencyHealthSchema>;

export const RepairOpSchema = z.enum(['rename', 'coalesce']);
export type RepairOp = z.infer<typeof RepairOpSchema>;

// SDK Telemetry Observation Batch V1
export const ObservationBatchV1Schema = z.object({
  schemaVersion: z.literal('1'),
  batchId: z.string().uuid(),
  projectId: z.string().min(1),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string().min(1),
  sdkVersion: z.string().min(1),
  events: z.array(
    z.object({
      eventId: z.string().uuid(),
      dependencyId: z.string().min(1),
      method: z.enum(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
      routeTemplate: z.string().max(256),
      statusCode: z.number().int().min(100).max(599),
      durationMs: z.number().nonnegative().max(60000),
      observedAt: z.string().datetime(),
      collectionPolicyVersion: z.number().int().nonnegative(),
      fixtureKey: z.string().optional(),
      responseEvidence: z.record(z.string(), z.unknown()).optional(),
      schemaFingerprint: z.string().optional()
    })
  ).max(20)
});

export type ObservationBatchV1 = z.infer<typeof ObservationBatchV1Schema>;

// Operator & Project Headers & Cookies
export const OPERATOR_TOKEN_HEADER = 'x-driftguard-operator-token';
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const OPERATOR_SESSION_COOKIE = 'dg_operator_session';

// A20: Operator session
export const OperatorSessionRequestSchema = z.object({
  token: z.string().min(1).max(1024)
});
export type OperatorSessionRequest = z.infer<typeof OperatorSessionRequestSchema>;

export const OperatorSessionResponseSchema = z.object({
  expiresAt: z.string().datetime(),
  auditEventId: z.string()
});
export type OperatorSessionResponse = z.infer<typeof OperatorSessionResponseSchema>;

// A21: Projects
export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(80)
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const ProjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  environments: z.array(ProjectEnvironmentSchema)
});
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

export const CreateProjectResponseSchema = z.object({
  project: ProjectSummarySchema,
  auditEventId: z.string()
});
export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;

// A22: List Projects
export const ListProjectsResponseSchema = z.object({
  projects: z.array(ProjectSummarySchema)
});
export type ListProjectsResponse = z.infer<typeof ListProjectsResponseSchema>;

// A23: Project Detail
export const ProjectDetailResponseSchema = z.object({
  project: ProjectSummarySchema,
  environmentState: z.object({
    environment: ProjectEnvironmentSchema,
    activeSessionId: z.string(),
    lastIngestAt: z.string().nullable()
  }),
  keyMetadata: z.array(z.unknown()),
  collectionPolicy: z.record(z.string(), z.unknown())
});
export type ProjectDetailResponse = z.infer<typeof ProjectDetailResponseSchema>;

// Ticket 02: Baseline & Workflow Lineage Schemas (A03, A15)
export const WorkflowIdSchema = z.enum([
  'welcome_email',
  'customer_profile',
  'inventory_sync',
  'delivery_estimate'
]);
export type WorkflowId = z.infer<typeof WorkflowIdSchema>;

export const DependencyEdgeSchema = z.object({
  workflowId: WorkflowIdSchema,
  canonicalField: z.string(),
  providerField: z.string().optional(),
  invariant: z.string()
});
export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

export const BaselineSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string(),
  version: z.number().int().positive(),
  fingerprint: z.string(),
  capturedAt: z.string().datetime(),
  status: z.literal('captured'),
  fixtures: z.object({
    usersCount: z.number().int(),
    inventoryItemsCount: z.number().int(),
    shippingCalculated: z.boolean()
  })
});
export type BaselineSummary = z.infer<typeof BaselineSummarySchema>;

export const FindingTypeSchema = z.enum([
  'field_removed',
  'field_added',
  'field_type_changed',
  'semantic_behavior_drift'
]);
export type FindingType = z.infer<typeof FindingTypeSchema>;

export const EvidenceStrengthSchema = z.enum(['limited', 'moderate', 'strong', 'confirmed']);
export type EvidenceStrength = z.infer<typeof EvidenceStrengthSchema>;

export const IncidentSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string(),
  provider: z.string(),
  endpoint: z.string(),
  fingerprint: z.string(),
  status: IncidentStatusSchema,
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  summary: z.string(),
  detectedAt: z.string().datetime(),
  evidenceStrength: EvidenceStrengthSchema,
  affectedWorkflows: z.array(WorkflowIdSchema)
});
export type IncidentSummary = z.infer<typeof IncidentSummarySchema>;

// A02: Demo State
export const DemoStateResponseSchema = z.object({
  projectId: z.string(),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string(),
  status: z.string(),
  providers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.string()
    })
  ),
  baseline: BaselineSummarySchema.optional(),
  readEdges: z.array(DependencyEdgeSchema).optional(),
  incidents: z.array(IncidentSummarySchema).optional(),
  activeScenarios: z.array(z.string()).optional()
});
export type DemoStateResponse = z.infer<typeof DemoStateResponseSchema>;

// A14: Providers
export const ProviderSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  status: z.string()
});
export type ProviderSummary = z.infer<typeof ProviderSummarySchema>;

export const ListProvidersResponseSchema = z.object({
  providers: z.array(ProviderSummarySchema)
});
export type ListProvidersResponse = z.infer<typeof ListProvidersResponseSchema>;

// A03: Baseline Capture
export const CaptureBaselineRequestSchema = z.object({
  projectId: z.string().min(1),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string().min(1)
});
export type CaptureBaselineRequest = z.infer<typeof CaptureBaselineRequestSchema>;

export const CaptureBaselineResponseSchema = z.object({
  baseline: BaselineSummarySchema,
  readEdges: z.array(DependencyEdgeSchema),
  auditEventId: z.string()
});
export type CaptureBaselineResponse = z.infer<typeof CaptureBaselineResponseSchema>;


// A15: Workflow Replay
export const ReplayWorkflowRequestSchema = z.object({
  projectId: z.string().min(1),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string().min(1),
  userId: z.string().optional()
});
export type ReplayWorkflowRequest = z.infer<typeof ReplayWorkflowRequestSchema>;

export const ReplayWorkflowResponseSchema = z.object({
  workflowId: WorkflowIdSchema,
  status: z.enum(['passed', 'failed']),
  result: z.unknown(),
  invariantResult: z.object({
    passed: z.boolean(),
    details: z.string()
  }),
  readFields: z.array(z.string()),
  auditEventId: z.string()
});
export type ReplayWorkflowResponse = z.infer<typeof ReplayWorkflowResponseSchema>;

// Ticket 03: Scenario Injection, Findings, Observations & Incidents (A05, A06, A07, A08)
export const InjectScenarioRequestSchema = z.object({
  projectId: z.string().min(1),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string().min(1)
});
export type InjectScenarioRequest = z.infer<typeof InjectScenarioRequestSchema>;

export const InjectScenarioResponseSchema = z.object({
  scenarioId: z.string(),
  activeScenarios: z.array(z.string()),
  auditEventId: z.string()
});
export type InjectScenarioResponse = z.infer<typeof InjectScenarioResponseSchema>;

export const FindingSchema = z.object({
  id: z.string(),
  type: FindingTypeSchema,
  provider: z.string(),
  endpoint: z.string(),
  fieldName: z.string(),
  path: z.string(),
  evidenceStrength: EvidenceStrengthSchema,
  beforeValue: z.unknown().optional(),
  afterValue: z.unknown().optional(),
  description: z.string()
});
export type Finding = z.infer<typeof FindingSchema>;

export const ListIncidentsResponseSchema = z.object({
  incidents: z.array(IncidentSummarySchema)
});
export type ListIncidentsResponse = z.infer<typeof ListIncidentsResponseSchema>;

export const IncidentDetailSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string(),
  provider: z.string(),
  endpoint: z.string(),
  fingerprint: z.string(),
  status: IncidentStatusSchema,
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  summary: z.string(),
  detectedAt: z.string().datetime(),
  evidenceStrength: EvidenceStrengthSchema,
  affectedWorkflows: z.array(WorkflowIdSchema),
  findings: z.array(FindingSchema),
  beforeEvidence: z.record(z.string(), z.unknown()),
  afterEvidence: z.record(z.string(), z.unknown()),
  failedWorkflows: z.array(
    z.object({
      workflowId: WorkflowIdSchema,
      reason: z.string()
    })
  ),
  auditEventId: z.string()
});
export type IncidentDetail = z.infer<typeof IncidentDetailSchema>;

export const IncidentDetailResponseSchema = z.object({
  incident: IncidentDetailSchema
});
export type IncidentDetailResponse = z.infer<typeof IncidentDetailResponseSchema>;

export const RunObservationsRequestSchema = z.object({
  projectId: z.string().min(1),
  environment: ProjectEnvironmentSchema,
  sessionId: z.string().min(1)
});
export type RunObservationsRequest = z.infer<typeof RunObservationsRequestSchema>;

export const RunObservationsResponseSchema = z.object({
  observationIds: z.array(z.string()),
  findings: z.array(FindingSchema),
  incident: IncidentSummarySchema.nullable(),
  incidents: z.array(IncidentSummarySchema),
  auditEventId: z.string()
});
export type RunObservationsResponse = z.infer<typeof RunObservationsResponseSchema>;


