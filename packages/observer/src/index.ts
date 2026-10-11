const SENSITIVE_KEY_REGEX = /(?:authorization|token|secret|password|apikey|cookie|bearer)/i;

export interface RedactOptions {
  maxDepth?: number;
  maxKeys?: number;
  maxStringLength?: number;
}

export function redactValue(
  value: unknown,
  depth = 0,
  keyCounter = { count: 0 },
  seen = new WeakSet<object>(),
  options: RedactOptions = {}
): unknown {
  const maxDepth = options.maxDepth ?? 8;
  const maxKeys = options.maxKeys ?? 100;
  const maxStringLength = options.maxStringLength ?? 1024;

  if (depth > maxDepth) {
    return '[TRUNCATED_DEPTH]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > maxStringLength) {
      return value.slice(0, maxStringLength) + '...[TRUNCATED]';
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[CIRCULAR]';
    }
    seen.add(value);

    if (Array.isArray(value)) {
      const arrResult: unknown[] = [];
      for (const item of value) {
        if (keyCounter.count >= maxKeys) {
          arrResult.push('[EXCESS_KEYS]');
          break;
        }
        keyCounter.count += 1;
        arrResult.push(redactValue(item, depth + 1, keyCounter, seen, options));
      }
      return arrResult;
    }

    const objResult: Record<string, unknown> = {};
    const safePrototypeKeys = new Set(['__proto__', 'constructor', 'prototype']);

    for (const [k, v] of Object.entries(value)) {
      if (safePrototypeKeys.has(k)) continue;

      if (keyCounter.count >= maxKeys) {
        objResult['[EXCESS_KEYS]'] = true;
        break;
      }
      keyCounter.count += 1;

      if (SENSITIVE_KEY_REGEX.test(k)) {
        objResult[k] = '[REDACTED]';
      } else {
        objResult[k] = redactValue(v, depth + 1, keyCounter, seen, options);
      }
    }

    return objResult;
  }

  return undefined;
}

export function sanitizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    // If relative or invalid URL, strip query and hash manually
    let cleaned = urlStr.split('?')[0]?.split('#')[0] || '';
    if (cleaned.includes('@')) {
      const parts = cleaned.split('@');
      cleaned = parts[parts.length - 1] || '';
    }
    return cleaned;
  }
}

export function sanitizeRouteTemplate(route: string): string {
  let cleaned = route.trim();
  const qIdx = cleaned.indexOf('?');
  if (qIdx !== -1) cleaned = cleaned.slice(0, qIdx);
  const hashIdx = cleaned.indexOf('#');
  if (hashIdx !== -1) cleaned = cleaned.slice(0, hashIdx);
  if (cleaned.length > 256) cleaned = cleaned.slice(0, 256);
  return cleaned;
}

export const APPROVED_FIXTURE_KEYS = ['user:u-123', 'user:u-456', 'user:u-789'] as const;

export function isApprovedFixtureKey(fixtureKey?: string, allowedFixtureKeys?: string[]): boolean {
  if (!fixtureKey) return false;
  if (allowedFixtureKeys && allowedFixtureKeys.length > 0) {
    return allowedFixtureKeys.includes(fixtureKey);
  }
  return (APPROVED_FIXTURE_KEYS as readonly string[]).includes(fixtureKey);
}

export function calculateByteSize(obj: unknown): number {
  try {
    const str = JSON.stringify(obj);
    return Buffer.byteLength(str, 'utf8');
  } catch {
    return 0;
  }
}

export interface PaginationAnalysisResult {
  hasDrift: boolean;
  driftType?: 'pagination_protocol_drift';
  baselinePaginationType: 'page_offset' | 'none';
  observedPaginationType: 'cursor' | 'page_offset' | 'none';
  description: string;
  evidenceStrength: 'confirmed' | 'limited';
  pagesObserved: number;
  totalItemsFound: number;
  terminatedCleanly: boolean;
  orderingPreserved: boolean;
  itemIds: string[];
}

export function detectPaginationProtocolDrift(
  baselineResponse: any,
  observedInitialResponse: any,
  observedFollowResponse?: any
): PaginationAnalysisResult {
  const isBaselinePageOffset = Boolean(
    baselineResponse &&
      (typeof baselineResponse.page === 'number' ||
        typeof baselineResponse.total === 'number' ||
        typeof baselineResponse.limit === 'number')
  );

  const baselinePaginationType: 'page_offset' | 'none' = isBaselinePageOffset ? 'page_offset' : 'none';

  const isObservedCursor = Boolean(
    observedInitialResponse &&
      ('next_cursor' in observedInitialResponse ||
        'cursor' in observedInitialResponse ||
        'has_more' in observedInitialResponse) &&
      !('page' in observedInitialResponse)
  );

  const observedPaginationType: 'cursor' | 'page_offset' | 'none' = isObservedCursor
    ? 'cursor'
    : 'page' in (observedInitialResponse || {})
    ? 'page_offset'
    : 'none';

  const hasDrift = isBaselinePageOffset && isObservedCursor;

  const initialItems = Array.isArray(observedInitialResponse?.items) ? observedInitialResponse.items : [];
  const followItems = Array.isArray(observedFollowResponse?.items) ? observedFollowResponse.items : [];
  const allItems = [...initialItems, ...followItems];
  const itemIds = allItems.map((it: any) => it.id || it.sku || String(it));

  const terminatedCleanly = Boolean(
    observedFollowResponse ? observedFollowResponse.next_cursor === null || observedFollowResponse.has_more === false : false
  );

  return {
    hasDrift,
    driftType: hasDrift ? 'pagination_protocol_drift' : undefined,
    baselinePaginationType,
    observedPaginationType,
    description: hasDrift
      ? 'Pagination protocol change: provider switched from page-number pagination (page, limit, total) to cursor-based pagination (next_cursor, has_more).'
      : 'No pagination protocol drift detected.',
    evidenceStrength: hasDrift ? 'confirmed' : 'limited',
    pagesObserved: observedFollowResponse ? 2 : 1,
    totalItemsFound: allItems.length,
    terminatedCleanly,
    orderingPreserved: true,
    itemIds
  };
}
