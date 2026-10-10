import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import {
  CORRELATION_ID_HEADER,
  OPERATOR_TOKEN_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  OPERATOR_SESSION_COOKIE,
  OperatorSessionRequestSchema,
  CreateProjectRequestSchema,
  ProjectEnvironmentSchema
} from '@driftguard/contracts';
import { randomUUID } from 'node:crypto';
import { OperatorAuthService } from './services/operator-auth-service.js';
import { ProjectService } from './services/project-service.js';

export interface ApiAppOptions {
  operatorToken?: string;
}

export function buildApiApp(options: ApiAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false,
    bodyLimit: 8192 // 8 KiB body limit per PRD
  });

  const authService = new OperatorAuthService(options.operatorToken);
  const projectService = new ProjectService();

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

  // A02: Demo State Projection
  app.get('/api/demo/state', { preHandler: [requireOperatorAuth] }, async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    const query = request.query as { projectId?: string; environment?: string };

    const envParsed = query.environment ? ProjectEnvironmentSchema.safeParse(query.environment) : null;
    const environment = envParsed && envParsed.success ? envParsed.data : 'development';

    const state = projectService.getDemoState(query.projectId, environment);
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

  return app;
}
