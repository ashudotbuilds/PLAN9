const SENSITIVE_KEY_REGEX = /(?:authorization|token|secret|password|apikey|cookie)/i;

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
