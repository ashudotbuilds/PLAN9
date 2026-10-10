import { describe, it, expect } from 'vitest';
import {
  ErrorEnvelopeSchema,
  ApiHealthResponseSchema,
  MockHealthResponseSchema,
  UserSchema,
  ChangedUserSchema,
  CanonicalUserSchema,
  InventoryListResponseSchema,
  ShippingEstimateResponseSchema,
  ObservationBatchV1Schema,
  KnownUserIdentities
} from '../src/index.js';

describe('Contracts & DTOs', () => {
  it('validates standard ErrorEnvelope', () => {
    const valid = {
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
        details: { itemId: '123' },
        correlationId: 'corr-xyz'
      }
    };
    expect(ErrorEnvelopeSchema.safeParse(valid).success).toBe(true);
    expect(ErrorEnvelopeSchema.safeParse({ error: { code: 'ERR' } }).success).toBe(false);
  });

  it('validates ApiHealthResponse', () => {
    const valid = {
      status: 'healthy',
      service: 'api',
      timestamp: new Date().toISOString()
    };
    expect(ApiHealthResponseSchema.safeParse(valid).success).toBe(true);
  });

  it('validates MockHealthResponse', () => {
    const valid = {
      status: 'healthy',
      service: 'mock-providers',
      timestamp: new Date().toISOString(),
      providers: {
        users: 'ready',
        inventory: 'ready',
        shipping: 'ready'
      }
    };
    expect(MockHealthResponseSchema.safeParse(valid).success).toBe(true);
  });

  it('validates KnownUserIdentities against UserSchema', () => {
    for (const identity of KnownUserIdentities) {
      expect(UserSchema.safeParse(identity).success).toBe(true);
    }
  });

  it('validates ChangedUserSchema and CanonicalUserSchema', () => {
    expect(ChangedUserSchema.safeParse({ id: 'u-123', display_name: 'Aarav' }).success).toBe(true);
    expect(CanonicalUserSchema.safeParse({ id: 'u-123', displayName: 'Aarav' }).success).toBe(true);
  });

  it('validates InventoryListResponseSchema', () => {
    const sample = {
      items: [{ id: 'item-1', sku: 'SKU-1', quantity: 10, in_stock: true }],
      total: 1,
      page: 1,
      limit: 10
    };
    expect(InventoryListResponseSchema.safeParse(sample).success).toBe(true);
  });

  it('validates ShippingEstimateResponseSchema', () => {
    expect(ShippingEstimateResponseSchema.safeParse({ estimated_delivery_date: '2026-10-12' }).success).toBe(true);
    expect(ShippingEstimateResponseSchema.safeParse({ estimated_delivery_date: 'invalid-date' }).success).toBe(false);
  });

  it('validates ObservationBatchV1Schema', () => {
    const batch = {
      schemaVersion: '1',
      batchId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      projectId: 'prj-123',
      environment: 'development',
      sessionId: 'sess-abc',
      sdkVersion: '1.0.0',
      events: [
        {
          eventId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          dependencyId: 'dep-users',
          method: 'GET',
          routeTemplate: '/users/:id',
          statusCode: 200,
          durationMs: 45,
          observedAt: new Date().toISOString(),
          collectionPolicyVersion: 1
        }
      ]
    };
    expect(ObservationBatchV1Schema.safeParse(batch).success).toBe(true);
  });
});
