let lastId = 0

/**
 * Returns a deterministic integer request ID.
 *
 * @param seed - Optional seed to generate a repeatable ID.
 * @returns A finite positive integer.
 */
export function toRpcRequestId(seed?: number): number {
  if (seed === undefined) {
    return ++lastId
  }

  // Handle non-finite or NaN seeds
  if (!Number.isFinite(seed) || Number.isNaN(seed)) {
    return 1
  }

  // Clamp invalid values and guarantee finite positive integer
  const absoluteValue = Math.abs(Math.trunc(seed))

  // Guarantee positive (non-zero) integer
  return absoluteValue || 1
}
