import type { UnsupportedFallback } from './normalizeScVal'

/**
 * Runtime type guard for UnsupportedFallback objects.
 *
 * Narrows `value` to `UnsupportedFallback` only when it is a non-null object
 * with `__unsupported === true` and `variant` as a non-empty string.
 * Partial objects or wrong field types are rejected.
 */
export function isUnsupportedFallback(
  value: unknown,
): value is UnsupportedFallback {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    candidate.__unsupported === true && typeof candidate.variant === 'string'
  )
}
