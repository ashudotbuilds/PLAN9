import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import {
  CORRELATION_ID_HEADER,
  OPERATOR_TOKEN_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  OPERATOR_SESSION_COOKIE,
  OperatorSessionRequestSchema,
  CreateProjectRequestSchema,
  ProjectEnvironmentSchema,
  ProjectEnvironment,
  CaptureBaselineRequestSchema,
  WorkflowIdSchema,
  ReplayWorkflowRequestSchema,
  InjectScenarioRequestSchema,
  RunObservationsRequestSchema,
  ActivatePatchRequestSchema,
  RollbackPatchRequestSchema,
  CreateIngestionKeyRequestSchema
} from '@driftguard/contracts';
import { randomUUID } from 'node:crypto';
import { OperatorAuthService } from './services/operator-auth-service.js';
import { ProjectService } from './services/project-service.js';
import { BaselineService } from './services/baseline-service.js';
import { IncidentService } from './services/incident-service.js';
import { KeyService } from './services/key-service.js';

export interface ApiAppOptions {
  operatorToken?: string;
  mockProvidersBaseUrl?: string;
  baselineService?: BaselineService;
  incidentService?: IncidentService;
  projectService?: ProjectService;
  keyService?: KeyService;
}

export function buildApiApp(options: ApiAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false,
    bodyLimit: 8192 // 8 KiB body limit per PRD
  });

  const authService = new OperatorAuthService(options.operatorToken);
  const keyService = options.keyService || new KeyService();
  const projectService = options.projectService || new ProjectService(keyService);
  if (!options.projectService) {
    projectService.setKeyService(keyService);
  }
  const baselineService =
    options.baselineService ||
    new BaselineService({ mockProvidersBaseUrl: options.mockProvidersBaseUrl });
  const incidentService =
    options.incidentService ||
    new IncidentService(baselineService, { mockProvidersBaseUrl: options.mockProvidersBaseUrl });



  app.register(fastifyCookie);

  // Attach correlation ID header
  app.addHook('onRequest', async (request, reply) => {
    const correlationId = (request.headers[CORRELATION_ID_HEADER] as string) || `corr_${randomUUID().slice(0, 8)}`;
    reply.header(CORRELATION_ID_HEADER, correlationId);
  });

  // Custom Error Handler returning shared error envelope
  app.setErrorHandler((error, request, reply) => {
    const err = error as { statusCode?: number; code?: string; message?: string };
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || `corr_${randomUUID().slice(0, 8)}`;
    const statusCode = err.statusCode || 500;
    const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

    reply.status(statusCode).send({
      error: {
        code,
        message: err.message || 'Internal server error',
        details: {},
        correlationId
      }
    });
  });

  // Default 404 handler with error envelope
  app.setNotFoundHandler((request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || `corr_${randomUUID().slice(0, 8)}`;
    reply.status(404).send({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route '${request.method} ${request.url}' not found`,
        details: {},
        correlationId
      }
    });
  });

  // Helper auth check middleware
  const requireOperatorAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!authService.isAuthenticated(request)) {
      const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
      reply.status(401).send({
        error: {
          code: 'UNAUTHENTICATED_OPERATOR',
          message: 'Operator session required.',
          details: {},
          correlationId
        }
      });
      return;
    }
  };

  // A01: Minimal public health
  app.get('/api/health', async () => {
    return {
      status: 'healthy',
      service: 'api',
      timestamp: new Date().toISOString()
    };
  });

  // A20: Operator bootstrap session
  app.post('/api/operator/session', async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const origin = request.headers.origin;
    const hasScriptHeader = Boolean(request.headers[OPERATOR_TOKEN_HEADER]);

    // Loopback check
    const clientIp = request.ip || '127.0.0.1';
    if (!authService.isLoopback(clientIp)) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Operator bootstrap requires loopback access.',
          details: {},
          correlationId
        }
      });
    }

    // Origin check: either valid Origin or scripted loopback header
    if (!hasScriptHeader && !authService.validateOrigin(origin)) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Unsafe or unapproved origin.',
          details: {},
          correlationId
        }
      });
    }

    // Rate limit check
    if (!authService.checkRateLimit(clientIp)) {
      return reply.status(429).send({
        error: {
          code: 'OPERATOR_RATE_LIMITED',
          message: 'Too many operator session attempts. Try again later.',
          details: {},
          correlationId
        }
      });
    }

    // Validate body
    const parsed = OperatorSessionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid session request body.',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const { token } = parsed.data;
    if (!authService.verifyToken(token)) {
      return reply.status(401).send({
        error: {
          code: 'INVALID_OPERATOR_TOKEN',
          message: 'Invalid operator credentials.',
          details: {},
          correlationId
        }
      });
    }

    const { session, cookieValue } = authService.createSession();
    const auditEventId = `aud_${randomUUID().slice(0, 8)}`;

    reply.setCookie(OPERATOR_SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/api',
      maxAge: 8 * 60 * 60
    });

    return reply.status(200).send({
      expiresAt: new Date(session.expiresAt).toISOString(),
      auditEventId
    });
  });

  // A21: Create Project
  app.post('/api/projects', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const idempotencyKey = request.headers[IDEMPOTENCY_KEY_HEADER] as string;

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      return reply.status(400).send({
        error: {
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required for project creation.',
          details: {},
          correlationId
        }
      });
    }

    const parsed = CreateProjectRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid project creation payload.',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const result = projectService.createProject(parsed.data.name, idempotencyKey);
    return reply.status(201).send(result);
  });

  // A22: List Projects
  app.get('/api/projects', { preHandler: [requireOperatorAuth] }, async () => {
    return {
      projects: projectService.listProjects()
    };
  });

  // A23: Get Project Detail
  app.get('/api/projects/:projectId', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { projectId } = request.params as { projectId: string };
    const query = request.query as { environment?: string };

    const envParsed = query.environment ? ProjectEnvironmentSchema.safeParse(query.environment) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';

    const project = projectService.getProject(projectId, environment);
    if (!project) {
      return reply.status(404).send({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${projectId}' was not found.`,
          details: { projectId },
          correlationId
        }
      });
    }

    return project;
  });

  // Shared Ingestion Auth Guard (Bound to project & environment; no operator/recovery privileges)
  const requireIngestionAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed Authorization header with Bearer token.',
          details: {},
          correlationId
        }
      });
    }

    const token = authHeader.slice(7).trim();
    const { projectId } = (request.params as { projectId?: string }) || {};
    const query = (request.query as { environment?: string }) || {};
    const body = ((request.body as { environment?: string; projectId?: string }) || {});
    const targetProject = projectId || body.projectId;
    const targetEnv = body.environment || query.environment;

    const verification = keyService.verifyKey(
      token,
      targetProject,
      targetEnv ? (targetEnv as ProjectEnvironment) : undefined
    );

    if (!verification.valid) {
      const statusCode = verification.code === 'SCOPE_FORBIDDEN' ? 403 : 401;
      return reply.status(statusCode).send({
        error: {
          code: verification.code || 'UNAUTHORIZED',
          message: verification.message || 'Ingestion key verification failed.',
          details: {},
          correlationId
        }
      });
    }

    (request as any).ingestionAuth = verification.key;
  };

  // A24: Create Ingestion Key (Cache-Control: no-store, 1-time plaintext)
  app.post('/api/projects/:projectId/keys', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { projectId } = request.params as { projectId: string };

    const project = projectService.getProjectRecord(projectId);
    if (!project) {
      return reply.status(404).send({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${projectId}' was not found.`,
          details: { projectId },
          correlationId
        }
      });
    }

    const parsed = CreateIngestionKeyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid ingestion key creation payload.',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const result = keyService.createKey(projectId, parsed.data.environment, parsed.data.label);
    reply.header('Cache-Control', 'no-store');
    return reply.status(201).send(result);
  });

  // A25: Rotate Ingestion Key (Cache-Control: no-store, 1-time replacement plaintext)
  app.post('/api/projects/:projectId/keys/:keyId/rotate', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { projectId, keyId } = request.params as { projectId: string; keyId: string };

    const project = projectService.getProjectRecord(projectId);
    if (!project) {
      return reply.status(404).send({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${projectId}' was not found.`,
          details: { projectId },
          correlationId
        }
      });
    }

    const result = keyService.rotateKey(projectId, keyId);
    reply.header('Cache-Control', 'no-store');
    return reply.status(201).send(result);
  });

  // A26: Revoke Ingestion Key (Idempotent state action)
  app.post('/api/projects/:projectId/keys/:keyId/revoke', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { projectId, keyId } = request.params as { projectId: string; keyId: string };

    const project = projectService.getProjectRecord(projectId);
    if (!project) {
      return reply.status(404).send({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `Project '${projectId}' was not found.`,
          details: { projectId },
          correlationId
        }
      });
    }

    const result = keyService.revokeKey(projectId, keyId);
    return reply.status(200).send(result);
  });

  // Scope verification diagnostic endpoint using requireIngestionAuth
  app.get('/api/projects/:projectId/keys/verify-scope', { preHandler: [requireIngestionAuth] }, async (request) => {
    return {
      status: 'authenticated',
      ingestionAuth: (request as any).ingestionAuth
    };
  });

  // A02: Demo State Projection
  app.get('/api/demo/state', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const query = request.query as { projectId?: string; environment?: string };

    const envParsed = query.environment ? ProjectEnvironmentSchema.safeParse(query.environment) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';

    const baseline = baselineService.getBaseline(query.projectId || 'prj_demo_default', environment);
    const incidents = incidentService.listIncidents(query.projectId || 'prj_demo_default', environment);
    const activeScenarios = incidentService.getActiveScenarios();

    const state = projectService.getDemoState(
      query.projectId,
      environment,
      baseline?.summary,
      baseline?.readEdges,
      incidents,
      activeScenarios
    );
    if (!state) {
      return reply.status(404).send({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'No active project found for demo state.',
          details: {},
          correlationId
        }
      });
    }

    return state;
  });

  // A14: List Providers
  app.get('/api/providers', { preHandler: [requireOperatorAuth] }, async () => {
    return {
      providers: [
        { id: 'users', name: 'Users API', baseUrl: 'http://127.0.0.1:4001', status: 'ready' },
        { id: 'inventory', name: 'Inventory API', baseUrl: 'http://127.0.0.1:4001', status: 'ready' },
        { id: 'shipping', name: 'Shipping API', baseUrl: 'http://127.0.0.1:4001', status: 'ready' }
      ]
    };
  });

  // A03: Capture Baseline
  app.post('/api/baselines/capture', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const parsed = CaptureBaselineRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid capture baseline payload.',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const { projectId, environment, sessionId } = parsed.data;
    const result = await baselineService.captureBaseline(projectId, environment, sessionId);
    return reply.status(201).send(result);
  });

  // A15: Replay Workflow
  app.post('/api/workflows/:workflowId/replay', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { workflowId } = request.params as { workflowId: string };
    const workflowParsed = WorkflowIdSchema.safeParse(workflowId);
    if (!workflowParsed.success) {
      return reply.status(404).send({
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `Unknown workflow '${workflowId}'.`,
          details: { validWorkflows: WorkflowIdSchema.options },
          correlationId
        }
      });
    }

    const bodyParsed = ReplayWorkflowRequestSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid workflow replay payload.',
          details: bodyParsed.error.format(),
          correlationId
        }
      });
    }

    const { projectId, environment, sessionId, userId } = bodyParsed.data;
    const result = baselineService.replayWorkflow(
      workflowParsed.data,
      projectId,
      environment,
      sessionId,
      userId
    );

    return reply.status(200).send(result);
  });

  // A05: Inject Scenario
  app.post('/api/scenarios/:scenarioId/inject', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { scenarioId } = request.params as { scenarioId: string };
    const parsed = InjectScenarioRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid scenario injection payload.',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const { projectId, environment, sessionId } = parsed.data;
    const result = await incidentService.injectScenario(scenarioId, projectId, environment, sessionId);
    return reply.status(200).send(result);
  });

  // A06: Run Observations & Change Detection
  app.post('/api/observations/run', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const parsed = RunObservationsRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid run observations payload.',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const { projectId, environment, sessionId } = parsed.data;
    const result = await incidentService.runObservations(projectId, environment, sessionId);
    return reply.status(200).send(result);
  });

  // A07: List Incidents
  app.get('/api/incidents', { preHandler: [requireOperatorAuth] }, async (request) => {
    const query = request.query as { projectId?: string; environment?: string };
    const envParsed = query.environment ? ProjectEnvironmentSchema.safeParse(query.environment) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = query.projectId || 'prj_demo_default';

    const incidents = incidentService.listIncidents(projectId, environment);
    return { incidents };
  });

  // A08: Get Incident Detail
  app.get('/api/incidents/:incidentId', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { incidentId } = request.params as { incidentId: string };
    const query = request.query as { projectId?: string; environment?: string };
    const envParsed = query.environment ? ProjectEnvironmentSchema.safeParse(query.environment) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = query.projectId || 'prj_demo_default';

    const incident = incidentService.getIncident(incidentId, projectId, environment);
    if (!incident) {
      return reply.status(404).send({
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: `Incident '${incidentId}' not found in current scope.`,
          details: { incidentId, projectId, environment },
          correlationId
        }
      });
    }

    return { incident };
  });

  // A09: Analyze Incident Impact
  app.post('/api/incidents/:incidentId/analyze-impact', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const { incidentId } = request.params as { incidentId: string };
    const query = request.query as { projectId?: string; environment?: string; sessionId?: string };
    const body = (request.body as { projectId?: string; environment?: string; sessionId?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';
    const sessionId = body.sessionId || query.sessionId;

    const result = incidentService.analyzeImpact(incidentId, projectId, environment, sessionId);
    return reply.status(200).send(result);
  });

  // A10: Propose Repair (Constrained Compatible Adapter)
  app.post('/api/incidents/:incidentId/propose-repair', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const { incidentId } = request.params as { incidentId: string };
    const query = request.query as { projectId?: string; environment?: string; sessionId?: string };
    const body = (request.body as { projectId?: string; environment?: string; sessionId?: string; model?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';
    const sessionId = body.sessionId || query.sessionId;
    const model = body.model || 'deterministic_fallback';

    const result = incidentService.proposeRepair(incidentId, projectId, environment, sessionId, model);
    return reply.status(200).send(result);
  });

  // A11: Validate Candidate Patch in Shadow Mode
  app.post('/api/patches/:patchId/validate', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const { patchId } = request.params as { patchId: string };
    const query = request.query as { projectId?: string; environment?: string; patchHash?: string };
    const body = (request.body as { projectId?: string; environment?: string; patchHash?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';
    const candidatePatchHash = body.patchHash || query.patchHash;

    const result = await incidentService.validatePatch(patchId, projectId, environment, candidatePatchHash);
    return reply.status(200).send(result);
  });

  // A12: Activate Validated Patch
  app.post('/api/patches/:patchId/activate', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const { patchId } = request.params as { patchId: string };
    const query = request.query as { projectId?: string; environment?: string; patchHash?: string };
    const body = (request.body as { projectId?: string; environment?: string; patchHash?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';
    const candidatePatchHash = body.patchHash || query.patchHash;

    const result = await incidentService.activatePatch(patchId, projectId, environment, candidatePatchHash);
    return reply.status(200).send(result);
  });

  // A13: Rollback Active Adapter
  app.post('/api/patches/:patchId/rollback', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const { patchId } = request.params as { patchId: string };
    const query = request.query as { projectId?: string; environment?: string };
    const body = (request.body as { projectId?: string; environment?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';

    const result = await incidentService.rollbackPatch(patchId, projectId, environment);
    return reply.status(200).send(result);
  });

  // A13 Alias: Rollback Adapter by adapterId
  app.post('/api/adapters/:adapterId/rollback', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const { adapterId } = request.params as { adapterId: string };
    const query = request.query as { projectId?: string; environment?: string };
    const body = (request.body as { projectId?: string; environment?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';

    const result = await incidentService.rollbackPatch(adapterId, projectId, environment);
    return reply.status(200).send(result);
  });

  // A16: Run Recovery Workflow (Asynchronous 202)
  app.post('/api/incidents/:incidentId/recover', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { incidentId } = request.params as { incidentId: string };
    const query = request.query as { projectId?: string; environment?: string };
    const body = (request.body as { projectId?: string; environment?: string } | undefined) || {};

    const envCandidate = body.environment || query.environment;
    const envParsed = envCandidate ? ProjectEnvironmentSchema.safeParse(envCandidate) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';
    const projectId = body.projectId || query.projectId || 'prj_demo_default';

    const result = await incidentService.startRecovery(incidentId, projectId, environment);
    // PRD Acceptance Criteria: exactly { recoveryRunId, incidentId }; correlation metadata is a response header
    return reply.status(202).send({
      recoveryRunId: result.recoveryRunId,
      incidentId: result.incidentId
    });
  });

  // A17: Poll Recovery Run Progress
  app.get('/api/recovery-runs/:recoveryRunId', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const { recoveryRunId } = request.params as { recoveryRunId: string };

    const recoveryRun = incidentService.getRecoveryRun(recoveryRunId);
    if (!recoveryRun) {
      return reply.status(404).send({
        error: {
          code: 'RECOVERY_RUN_NOT_FOUND',
          message: `Recovery run '${recoveryRunId}' not found.`,
          details: { recoveryRunId },
          correlationId
        }
      });
    }

    return reply.status(200).send({ recoveryRun });
  });

  return app;
}


