export function normalizeTimeoutMs(input: unknown, fallback = 10000): number {
  // Try to coerce common inputs to a number (number, string, bigint)
  let n: number = NaN;

  if (typeof input === 'number') {
    n = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length > 0) n = Number(trimmed);
  } else if (typeof input === 'bigint') {
    n = Number(input);
  }

  // Reject NaN, Infinity, negatives, and zero. Ensure finite.
  if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) {
    return fallback;
  }

  // Return a positive integer timeout (truncate fractional ms)
  return Math.trunc(n);
}

export default normalizeTimeoutMs;
