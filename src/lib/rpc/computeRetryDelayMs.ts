/**
 * Computes exponential backoff delay for RPC retry logic using min(baseMs * 2^attempt, maxMs)
 *
 * Retry option normalization rules:
 * - `baseMs` and `maxMc` are clamped to non-negative finite values.
 *   Non-finite values (NaN, Infinity) fall back to their default (250 and 5000 respectively).
 *   Negative values are clamped to 0.
 * - `maxAttempts` (see `normalizeMaxAttempts`) is normalized to an integer of at least 1.
 */
export function computeRetryDelayMs(
  attempt: number,
  baseMs = 250,
  maxMs = 5000,
): number {
  const safeAttempt = Math.max(0, Number(attempt) || 0);
  const safeBaseMs = normalizeDelay(baseMs, 250);
  const safeMaxMs = normalizeDelay(maxMs, 5000);
  const delay = safeBaseMs * Math.pow(2, safeAttempt);

  if (!Number.isFinite(delay) || delay > safeMaxMs) {
    return Math.floor(safeMaxMs);
  }

  return Math.floor(delay);
}

/**
 * Normalizes a delay value to a non-negative finite number.
 * Falls back to `defaultValue` for non-finite values, and clamps negative values to 0.
 */
function normalizeDelay(value: number, defaultValue: number): number {
  if (!Number.isFinite(value)) {
    return defaultValue;
  }
  return Math.max(0, value);
}

/**
 * Normalizes the maximum attempt count so that at least the initial attempt is always allowed.
 * Non-finite values and values less than 1 are normalized to 1.
 */
export function normalizeMaxAttempts(maxAttempts: number): number {
  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    return 1;
  }
  return Math.floor(maxAttempts);
}
