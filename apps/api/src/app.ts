import Fastify, { FastifyInstance } from 'fastify';
import { CORRELATION_ID_HEADER } from '@driftguard/contracts';
import { randomUUID } from 'node:crypto';

export interface ApiAppOptions {
  operatorToken?: string;
}

export function buildApiApp(options: ApiAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false
  });

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

  // A01: Minimal public health
  app.get('/api/health', async () => {
    return {
      status: 'healthy',
      service: 'api',
      timestamp: new Date().toISOString()
    };
  });

  // A02: Fail closed / unavailable before ticket 28 operator onboarding
  app.get('/api/demo/state', async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    return reply.status(401).send({
      error: {
        code: 'UNAUTHENTICATED_OPERATOR',
        message: 'Operator session required. Demo state is unavailable before onboarding.',
        details: { ticket: '28-local-project-onboarding' },
        correlationId
      }
    });
  });

  // A14: Provider listing fails closed before ticket 28
  app.get('/api/providers', async (request, reply) => {
    const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
    return reply.status(401).send({
      error: {
        code: 'UNAUTHENTICATED_OPERATOR',
        message: 'Operator session required.',
        details: { ticket: '28-local-project-onboarding' },
        correlationId
      }
    });
  });

  return app;
}
