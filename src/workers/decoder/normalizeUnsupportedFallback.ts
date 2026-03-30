import { isUnsupportedFallback } from './isUnsupportedFallback'
import type { UnsupportedFallback } from './normalizeScVal'

/**
 * Returns a normalized UnsupportedFallback from any input.
 *
 * - If `value` is already a valid UnsupportedFallback, its `variant` and
 *   `rawData` are preserved as-is.
 * - Otherwise a deterministic fallback is returned with `variant: 'unknown'`
 *   and `rawData: null`.
 */
export function normalizeUnsupportedFallback(
  value: unknown,
): UnsupportedFallback {
  if (isUnsupportedFallback(value)) {
    return {
      __unsupported: true,
      variant: value.variant,
      rawData: value.rawData,
    }
  }

  return {
    __unsupported: true,
    variant: 'unknown',
    rawData: null,
  }
}
