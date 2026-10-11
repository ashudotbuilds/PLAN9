import { createHash } from 'node:crypto';
import { BoundedPaginationStrategy } from '@driftguard/contracts';

export interface PaginationValidatorOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
  endpoint?: string;
  expectedItems?: Array<Record<string, unknown>>;
}

export interface PaginationValidatorResult {
  passed: boolean;
  code: string;
  message: string;
  totalRequests: number;
  itemsRetrieved: Array<Record<string, unknown>>;
  cursorsEncountered: string[];
  terminatedCleanly: boolean;
  loopDetected: boolean;
  duplicatesDetected: string[];
  omissionsDetected: string[];
}

export class PaginationStrategyValidator {
  private fetchFn: typeof fetch;
  private defaultBaseUrl: string;

  constructor(options?: { fetchFn?: typeof fetch; baseUrl?: string }) {
    this.fetchFn = options?.fetchFn || globalThis.fetch;
    this.defaultBaseUrl = options?.baseUrl || 'http://127.0.0.1:4001';
  }

  static computeStrategyHash(strategy: Omit<BoundedPaginationStrategy, 'hash' | 'diff'>): string {
    const payload = {
      id: strategy.id,
      strategyType: strategy.strategyType,
      provider: strategy.provider,
      targetEntity: strategy.targetEntity,
      version: strategy.version,
      cursorParam: strategy.cursorParam,
      cursorPath: strategy.cursorPath,
      itemsPath: strategy.itemsPath,
      uniqueKey: strategy.uniqueKey,
      maxRequests: strategy.maxRequests
    };
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async validateStrategy(
    strategy: BoundedPaginationStrategy,
    options?: PaginationValidatorOptions
  ): Promise<PaginationValidatorResult> {
    const fetchFn = options?.fetchFn || this.fetchFn;
    const baseUrl = options?.baseUrl || this.defaultBaseUrl;
    const endpoint = options?.endpoint || '/inventory/items';
    const expectedItems = options?.expectedItems;

    const maxRequests = strategy.maxRequests || 5;
    const uniqueKey = strategy.uniqueKey || 'sku';
    const cursorParam = strategy.cursorParam || 'cursor';

    // 1. Verify cryptographic hash of the strategy
    const expectedHash = PaginationStrategyValidator.computeStrategyHash(strategy);
    if (strategy.hash !== expectedHash) {
      return {
        passed: false,
        code: 'STRATEGY_HASH_MISMATCH',
        message: `Strategy hash verification failed: computed ${expectedHash} does not match strategy.hash ${strategy.hash}`,
        totalRequests: 0,
        itemsRetrieved: [],
        cursorsEncountered: [],
        terminatedCleanly: false,
        loopDetected: false,
        duplicatesDetected: [],
        omissionsDetected: []
      };
    }

    const seenCursors = new Set<string>();
    const seenKeys = new Set<string>();
    const collectedItems: Array<Record<string, unknown>> = [];
    const cursorsEncountered: string[] = [];
    const duplicatesDetected: string[] = [];

    let currentCursor: string | null = null;
    let requestCount = 0;
    let terminatedCleanly = false;
    let loopDetected = false;

    while (requestCount < maxRequests && !terminatedCleanly) {
      requestCount++;

      let url = `${baseUrl}${endpoint}`;
      if (currentCursor) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${encodeURIComponent(cursorParam)}=${encodeURIComponent(currentCursor)}`;
      }

      let res: Response;
      try {
        res = await fetchFn(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      } catch (err: any) {
        return {
          passed: false,
          code: 'FETCH_FAILED',
          message: `HTTP request ${requestCount} failed: ${err.message}`,
          totalRequests: requestCount,
          itemsRetrieved: collectedItems,
          cursorsEncountered,
          terminatedCleanly: false,
          loopDetected: false,
          duplicatesDetected,
          omissionsDetected: []
        };
      }

      if (!res.ok) {
        return {
          passed: false,
          code: 'PROVIDER_ERROR',
          message: `Provider returned HTTP status ${res.status} on request ${requestCount}`,
          totalRequests: requestCount,
          itemsRetrieved: collectedItems,
          cursorsEncountered,
          terminatedCleanly: false,
          loopDetected: false,
          duplicatesDetected,
          omissionsDetected: []
        };
      }

      const body = (await res.json()) as Record<string, unknown>;

      // Check next cursor & termination first to catch cursor loops immediately
      const nextCursorRaw = body.next_cursor as string | null | undefined;
      const hasMore = body.has_more as boolean | undefined;

      // Check for cursor loops
      if (nextCursorRaw && seenCursors.has(nextCursorRaw)) {
        loopDetected = true;
        cursorsEncountered.push(nextCursorRaw);
        return {
          passed: false,
          code: 'CURSOR_LOOP_DETECTED',
          message: `Repeated cursor '${nextCursorRaw}' detected on request ${requestCount}; aborting traversal`,
          totalRequests: requestCount,
          itemsRetrieved: collectedItems,
          cursorsEncountered,
          terminatedCleanly: false,
          loopDetected: true,
          duplicatesDetected,
          omissionsDetected: []
        };
      }

      // Extract items: default to body.items
      const itemsRaw = (body.items as Array<Record<string, unknown>>) || [];

      // Check each item for duplicates
      for (const item of itemsRaw) {
        const key = String(item[uniqueKey] || item.id || JSON.stringify(item));
        if (seenKeys.has(key)) {
          duplicatesDetected.push(key);
        } else {
          seenKeys.add(key);
          collectedItems.push(item);
        }
      }

      if (duplicatesDetected.length > 0) {
        return {
          passed: false,
          code: 'DUPLICATE_ITEM_DETECTED',
          message: `Duplicate item(s) detected during pagination traversal: ${duplicatesDetected.join(', ')}`,
          totalRequests: requestCount,
          itemsRetrieved: collectedItems,
          cursorsEncountered,
          terminatedCleanly: false,
          loopDetected: false,
          duplicatesDetected,
          omissionsDetected: []
        };
      }

      if (!nextCursorRaw || hasMore === false) {
        terminatedCleanly = true;
        break;
      }

      seenCursors.add(nextCursorRaw);
      cursorsEncountered.push(nextCursorRaw);
      currentCursor = nextCursorRaw;
    }

    if (!terminatedCleanly) {
      return {
        passed: false,
        code: 'REQUEST_LIMIT_EXCEEDED',
        message: `Pagination failed to terminate within maximum allowed requests (${maxRequests})`,
        totalRequests: requestCount,
        itemsRetrieved: collectedItems,
        cursorsEncountered,
        terminatedCleanly: false,
        loopDetected: false,
        duplicatesDetected,
        omissionsDetected: []
      };
    }

    // Check exact item set verification against expected items
    const omissionsDetected: string[] = [];
    if (expectedItems && expectedItems.length > 0) {
      for (const expected of expectedItems) {
        const expectedKey = String(expected[uniqueKey] || expected.id || '');
        if (!seenKeys.has(expectedKey)) {
          omissionsDetected.push(expectedKey);
        }
      }

      if (omissionsDetected.length > 0) {
        return {
          passed: false,
          code: 'ITEM_SET_OMISSION',
          message: `Expected item(s) omitted during pagination traversal: ${omissionsDetected.join(', ')}`,
          totalRequests: requestCount,
          itemsRetrieved: collectedItems,
          cursorsEncountered,
          terminatedCleanly: true,
          loopDetected: false,
          duplicatesDetected,
          omissionsDetected
        };
      }
    }

    return {
      passed: true,
      code: 'VALIDATION_PASSED',
      message: `Bounded pagination strategy validated cleanly: ${collectedItems.length} items retrieved across ${requestCount} requests without loops or duplicates`,
      totalRequests: requestCount,
      itemsRetrieved: collectedItems,
      cursorsEncountered,
      terminatedCleanly: true,
      loopDetected: false,
      duplicatesDetected: [],
      omissionsDetected: []
    };
  }
}
