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

// Ticket 17: Rate Limit Parsing & Behavioral Drift Detection (FR-SIM-06, FR-OBS-06, FR-DET-06, NFR-19)
import type {
  ParsedRetryAfter,
  RateLimitRetryPolicy,
  RateLimitReplayRisk,
  EvidenceStrength
} from '@driftguard/contracts';

/**
 * Parse Retry-After header across supported formats:
 * 1. Integer seconds ('5', '60')
 * 2. HTTP date ('Wed, 21 Oct 2026 07:28:00 GMT')
 * 3. Missing / absent (null, undefined, '')
 * 4. Malformed string ('invalid', negative, non-date string)
 */
export function parseRetryAfter(
  header: string | null | undefined,
  now?: Date
): ParsedRetryAfter {
  if (header === null || header === undefined || header.trim() === '') {
    return {
      seconds: null,
      raw: null,
      format: 'missing'
    };
  }

  const trimmed = header.trim();

  // 1. Integer seconds
  if (/^\d+$/.test(trimmed)) {
    const sec = parseInt(trimmed, 10);
    return {
      seconds: sec >= 0 ? sec : 0,
      raw: trimmed,
      format: 'seconds'
    };
  }

  // 2. HTTP Date
  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    const baseNow = now ?? new Date();
    const diffSec = Math.max(0, Math.round((parsedMs - baseNow.getTime()) / 1000));
    return {
      seconds: diffSec,
      raw: trimmed,
      format: 'http_date'
    };
  }

  // 3. Malformed
  return {
    seconds: null,
    raw: trimmed,
    format: 'malformed'
  };
}

export interface RateLimitObservationInput {
  statusCode: number;
  headers?: Record<string, string | string[] | undefined>;
  endpoint?: string;
  method?: string;
  isIdempotent?: boolean;
}

export interface RateLimitDriftResult {
  hasRateLimitDrift: boolean;
  isOutage: boolean;
  statusCode: number;
  evidenceStrength: EvidenceStrength;
  corroboratedCount: number;
  retryAfter: ParsedRetryAfter;
  replayRisk: RateLimitReplayRisk;
  recommendedPolicy?: RateLimitRetryPolicy;
  description: string;
}

export function detectRateLimitDrift(
  observations: RateLimitObservationInput[],
  options: {
    provider?: string;
    endpoint?: string;
    now?: Date;
    maxRetries?: number;
    maxDurationSeconds?: number;
  } = {}
): RateLimitDriftResult {
  const provider = options.provider ?? 'users';
  const endpoint = options.endpoint ?? '/users/:id';
  const maxRetries = Math.min(3, Math.max(1, options.maxRetries ?? 3));
  const maxDurationSeconds = Math.min(60, Math.max(1, options.maxDurationSeconds ?? 60));

  const count429 = observations.filter(o => o.statusCode === 429).length;
  const count5xx = observations.filter(o => o.statusCode >= 500 && o.statusCode <= 599).length;

  if (count429 === 0) {
    const isOutage = count5xx > 0;
    return {
      hasRateLimitDrift: false,
      isOutage,
      statusCode: observations[0]?.statusCode ?? 200,
      evidenceStrength: 'limited',
      corroboratedCount: 0,
      retryAfter: { seconds: null, raw: null, format: 'missing' },
      replayRisk: 'safe_idempotent',
      description: isOutage
        ? 'Provider unavailable or internal server error (5xx). Outage classified separately from rate-limiting drift.'
        : 'No rate limit drift detected.'
    };
  }

  // Find the primary 429 observation to inspect headers
  const primary429 = observations.find(o => o.statusCode === 429)!;
  const rawRetryAfterHeader = primary429.headers?.['retry-after'] ?? primary429.headers?.['Retry-After'];
  const headerStr = Array.isArray(rawRetryAfterHeader) ? rawRetryAfterHeader[0] : rawRetryAfterHeader;
  const parsedRetryAfter = parseRetryAfter(headerStr, options.now);

  // Evidence maturity: 1 observation is limited/suspected; 3+ is confirmed
  const evidenceStrength: EvidenceStrength = count429 >= 3 ? 'confirmed' : 'limited';

  // Determine idempotency and side-effect risk
  const method = (primary429.method ?? 'GET').toUpperCase();
  const isExplicitIdempotent = primary429.isIdempotent;
  const isReadOnlyGet = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const isPaymentOrSideEffect = /payment|order|charge|checkout|transfer/i.test(endpoint);

  const isSafeToRetry = (isReadOnlyGet || isExplicitIdempotent === true) && !isPaymentOrSideEffect;
  const replayRisk: RateLimitReplayRisk = isSafeToRetry ? 'safe_idempotent' : 'non_idempotent_refusal';

  // Bounded retry schedule calculation
  const baseDelayMs = parsedRetryAfter.seconds !== null && parsedRetryAfter.seconds > 0
    ? parsedRetryAfter.seconds * 1000
    : 1000;

  const backoffScheduleMs: number[] = [];
  for (let i = 1; i <= maxRetries; i++) {
    const delay = Math.min(baseDelayMs * i, maxDurationSeconds * 1000);
    backoffScheduleMs.push(delay);
  }

  let explanation = '';
  let status: 'proposed' | 'review_required' | 'rejected' | 'bounded_retry_approved' = 'proposed';

  if (!isSafeToRetry) {
    status = 'review_required';
    explanation = `Refusing automated retry: operation ${method} ${endpoint} is non-idempotent or carries side-effect risk (e.g. payment/mutation). Operator review required to prevent duplicate execution.`;
  } else {
    status = 'bounded_retry_approved';
    if (parsedRetryAfter.format === 'seconds') {
      explanation = `Bounded retry policy: parsed Retry-After of ${parsedRetryAfter.seconds}s. Safe read-only GET query will retry up to ${maxRetries} times within ${maxDurationSeconds}s maximum duration.`;
    } else if (parsedRetryAfter.format === 'http_date') {
      explanation = `Bounded retry policy: parsed HTTP-Date Retry-After (${parsedRetryAfter.raw}) yielding ${parsedRetryAfter.seconds}s delta. Safe read-only GET query will retry up to ${maxRetries} times within ${maxDurationSeconds}s.`;
    } else if (parsedRetryAfter.format === 'missing') {
      explanation = `Bounded retry policy: Retry-After header absent. Applying default exponential backoff schedule [${backoffScheduleMs.join(', ')}]ms up to ${maxRetries} retries within ${maxDurationSeconds}s.`;
    } else {
      explanation = `Bounded retry policy: Retry-After header '${parsedRetryAfter.raw}' is malformed. Safely falling back to bounded backoff schedule [${backoffScheduleMs.join(', ')}]ms up to ${maxRetries} retries within ${maxDurationSeconds}s.`;
    }
  }

  const exhaustionExplanation = `When retry attempts exceed ${maxRetries} or cumulative elapsed time reaches ${maxDurationSeconds}s, retry_exhausted is signaled and the workflow fails closed without unbounded background loops.`;

  const recommendedPolicy: RateLimitRetryPolicy = {
    id: `rl-policy-${Date.now()}`,
    provider,
    endpoint,
    maxRetries,
    maxDurationSeconds,
    backoffScheduleMs,
    retryAfter: parsedRetryAfter,
    idempotentOnly: true,
    replayRisk,
    status,
    explanation,
    exhaustionExplanation
  };

  const description = `Rate limit behavioral drift detected: provider returned HTTP 429 Too Many Requests (${count429} observation(s) recorded, evidence: ${evidenceStrength}). ${explanation}`;

  return {
    hasRateLimitDrift: true,
    isOutage: false,
    statusCode: 429,
    evidenceStrength,
    corroboratedCount: count429,
    retryAfter: parsedRetryAfter,
    replayRisk,
    recommendedPolicy,
    description
  };
}

