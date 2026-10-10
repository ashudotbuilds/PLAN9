import { describe, it, expect } from 'vitest';
import {
  redactValue,
  sanitizeUrl,
  sanitizeRouteTemplate,
  isApprovedFixtureKey,
  APPROVED_FIXTURE_KEYS
} from '../src/index.js';

describe('@driftguard/observer - Sanitization & Redaction Unit Tests', () => {
  it('redacts sensitive keys recursively while preserving non-sensitive data', () => {
    const input = {
      id: 'u-123',
      name: 'Aarav',
      authorization: 'Bearer token-secret',
      password: 'mypassword',
      nested: {
        apiKey: 'key_live_123',
        cookie: 'session=abc',
        safeNumber: 42,
        safeBool: true
      }
    };

    const result = redactValue(input) as any;
    expect(result.id).toBe('u-123');
    expect(result.name).toBe('Aarav');
    expect(result.authorization).toBe('[REDACTED]');
    expect(result.password).toBe('[REDACTED]');
    expect(result.nested.apiKey).toBe('[REDACTED]');
    expect(result.nested.cookie).toBe('[REDACTED]');
    expect(result.nested.safeNumber).toBe(42);
    expect(result.nested.safeBool).toBe(true);
  });

  it('caps string lengths at 1024 bytes and truncates excess', () => {
    const longStr = 'a'.repeat(2000);
    const result = redactValue(longStr) as string;
    expect(result).toHaveLength(1024 + '...[TRUNCATED]'.length);
    expect(result).toContain('...[TRUNCATED]');
  });

  it('caps depth at 8 levels', () => {
    let deepObj: any = { value: 'deep' };
    for (let i = 0; i < 10; i++) {
      deepObj = { next: deepObj };
    }
    const result = redactValue(deepObj) as any;
    expect(JSON.stringify(result)).toContain('[TRUNCATED_DEPTH]');
  });

  it('handles circular references safely without stack overflow', () => {
    const cyclicObj: any = { id: 'cyclic' };
    cyclicObj.self = cyclicObj;

    const result = redactValue(cyclicObj) as any;
    expect(result.id).toBe('cyclic');
    expect(result.self).toBe('[CIRCULAR]');
  });

  it('sanitizes URLs by stripping credentials, query strings, and fragments', () => {
    const dirtyUrl = 'https://admin:secret123@api.example.com/v1/users?token=abc#details';
    const clean = sanitizeUrl(dirtyUrl);
    expect(clean).toBe('https://api.example.com/v1/users');
    expect(clean).not.toContain('secret123');
    expect(clean).not.toContain('token=abc');
    expect(clean).not.toContain('details');
  });

  it('sanitizes route templates by stripping query parameters and capping length', () => {
    const dirtyRoute = '/users/:id?details=true#frag';
    expect(sanitizeRouteTemplate(dirtyRoute)).toBe('/users/:id');

    const longRoute = '/route/' + 'x'.repeat(300);
    expect(sanitizeRouteTemplate(longRoute)).toHaveLength(256);
  });

  it('verifies approved fixture keys for the three golden identities', () => {
    expect(APPROVED_FIXTURE_KEYS).toEqual(['user:u-123', 'user:u-456', 'user:u-789']);
    expect(isApprovedFixtureKey('user:u-123')).toBe(true);
    expect(isApprovedFixtureKey('user:u-456')).toBe(true);
    expect(isApprovedFixtureKey('user:u-789')).toBe(true);
    expect(isApprovedFixtureKey('user:u-999')).toBe(false);
    expect(isApprovedFixtureKey(undefined)).toBe(false);
  });
});
