/**
 * Computes exponential backoff delay for RPC retry logic using min(baseMs * 2^attempt, maxMs)
 */
export function computeRetryDelayMs(
  attempt: number,
  baseMs = 250,
  maxMs = 5000,
): number {
  const safeAttempt = Math.max(0, Number(attempt) || 0)
  const delay = baseMs * Math.pow(2, safeAttempt)

  if (!Number.isFinite(delay) || delay > maxMs) {
    return Math.floor(maxMs)
  }

  return Math.floor(delay)
}
