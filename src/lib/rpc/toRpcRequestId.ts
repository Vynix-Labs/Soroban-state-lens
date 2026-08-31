let lastId = 0

/**
 * Returns a deterministic integer request ID.
 *
 * @param seed - Optional seed to generate a repeatable ID.
 * @returns A finite positive integer.
 */
export function toRpcRequestId(seed?: number): number {
  if (seed === undefined) {
    if (lastId >= Number.MAX_SAFE_INTEGER) {
      lastId = 0
      return 1
    }

    lastId += 1
    return lastId
  }

  // Handle non-finite or NaN seeds
  if (!Number.isFinite(seed) || Number.isNaN(seed)) {
    return 1
  }

  // Clamp invalid values and guarantee finite positive integer
  const absoluteValue = Math.abs(Math.trunc(seed))
  const safeValue = Math.min(absoluteValue, Number.MAX_SAFE_INTEGER)

  // Guarantee positive (non-zero) integer
  return safeValue || 1
}
