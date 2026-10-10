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
  )
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

