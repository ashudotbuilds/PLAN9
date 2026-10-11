import Fastify, { FastifyInstance } from 'fastify';
import {
  CORRELATION_ID_HEADER,
  KnownUserIdentities,
  ShippingEstimateQuerySchema
} from '@driftguard/contracts';
import { randomUUID } from 'node:crypto';

export interface MockProvidersOptions {
  activeScenarios?: Set<string>;
}

export function buildMockProvidersApp(options: MockProvidersOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false
  });

  const activeScenarios = options.activeScenarios ?? new Set<string>();

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

  // M06: Health check
  app.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'mock-providers',
      timestamp: new Date().toISOString(),
      providers: {
        users: 'ready',
        inventory: 'ready',
        shipping: 'ready'
      }
    };
  });

  // M01: Users API
  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = KnownUserIdentities.find((u) => u.id === id);

    if (!user) {
      const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
      return reply.status(404).send({
        error: {
          code: 'USER_NOT_FOUND',
          message: `User '${id}' not found`,
          details: { id },
          correlationId
        }
      });
    }

    if (activeScenarios.has('users.field-rename')) {
      return {
        id: user.id,
        display_name: user.name
      };
    }

    return {
      id: user.id,
      name: user.name
    };
  });

  // M02: Inventory API
  const mockInventory = [
    { id: 'inv-101', sku: 'WIDGET-A', quantity: 45, in_stock: true },
    { id: 'inv-102', sku: 'GADGET-B', quantity: 0, in_stock: false },
    { id: 'inv-103', sku: 'SENSOR-C', quantity: 120, in_stock: true }
  ];

  app.get('/inventory/items', async (request) => {
    if (activeScenarios.has('inventory.cursor-pagination')) {
      const query = (request.query as any) || {};
      const cursor = query.cursor;

      if (!cursor) {
        // First page: return first 2 items with next_cursor
        return {
          items: mockInventory.slice(0, 2),
          next_cursor: 'cur_inv_page_2',
          has_more: true
        };
      } else if (cursor === 'cur_inv_page_2') {
        // Second page: return remaining 1 item with null next_cursor
        return {
          items: mockInventory.slice(2),
          next_cursor: null,
          has_more: false
        };
      } else {
        // Exhausted / unknown cursor
        return {
          items: [],
          next_cursor: null,
          has_more: false
        };
      }
    }

    return {
      items: mockInventory,
      total: mockInventory.length,
      page: 1,
      limit: 10
    };
  });

  // M03: Shipping API
  app.get('/shipping/estimate', async (request, reply) => {
    const parsed = ShippingEstimateQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      const correlationId = (reply.getHeader(CORRELATION_ID_HEADER) as string) || 'corr_unknown';
      return reply.status(400).send({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid shipping estimate query parameters',
          details: parsed.error.format(),
          correlationId
        }
      });
    }

    const { ship_date, delivery_days } = parsed.data;
    const baseDate = new Date(ship_date);

    if (activeScenarios.has('shipping.business-days')) {
      // Skip weekends (Saturday=6, Sunday=0)
      let addedDays = 0;
      const curr = new Date(baseDate);
      while (addedDays < delivery_days) {
        curr.setUTCDate(curr.getUTCDate() + 1);
        const day = curr.getUTCDay();
        if (day !== 0 && day !== 6) {
          addedDays++;
        }
      }
      const yyyy = curr.getUTCFullYear();
      const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(curr.getUTCDate()).padStart(2, '0');
      return { estimated_delivery_date: `${yyyy}-${mm}-${dd}` };
    }

    // Default baseline: calendar days
    const curr = new Date(baseDate);
    curr.setUTCDate(curr.getUTCDate() + delivery_days);
    const yyyy = curr.getUTCFullYear();
    const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(curr.getUTCDate()).padStart(2, '0');
    return { estimated_delivery_date: `${yyyy}-${mm}-${dd}` };
  });

  // Scenario management for demo control
  app.post('/scenarios/:scenarioId/inject', async (request) => {
    const { scenarioId } = request.params as { scenarioId: string };
    activeScenarios.add(scenarioId);
    return { ok: true, activeScenarios: Array.from(activeScenarios) };
  });

  app.post('/scenarios/reset', async () => {
    activeScenarios.clear();
    return { ok: true, activeScenarios: [] };
  });

  // M05: Reset simulator scenarios to defaults
  app.post('/__control/reset', async () => {
    activeScenarios.clear();
    return { ok: true, activeScenarios: [] };
  });

  return app;
}
