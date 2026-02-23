/**
 * Performs shallow comparison of two normalized values.
 *
 * Comparison Rules:
 * - Primitives: compared by strict equality (NaN is treated as equal to NaN).
 * - Arrays: compared by shallow element comparison (identity/value).
 * - Plain objects: compared by top-level keys/values only.
 * - Returns false for nested structural mismatches.
 *
 * @param a First value to compare.
 * @param b Second value to compare.
 * @returns True if values are shallowly equal, false otherwise.
 */
export function compareNormalizedValuesShallow(a: unknown, b: unknown): boolean {
  // Handle NaN (NaN !== NaN in JavaScript, so we use Object.is)
  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true
  }

  // Strict equality for primitives
  if (a === b) {
    return true
  }

  // Handle null/undefined cases
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b
  }

  // Different types are not equal
  if (typeof a !== typeof b) {
    return false
  }

  // Arrays - shallow comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  }

  // Plain objects - shallow comparison
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a as object)
    const keysB = Object.keys(b as object)

    if (keysA.length !== keysB.length) {
      return false
    }

    for (const key of keysA) {
      if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
        return false
      }
    }
    return true
  }

  // All other cases (different non-object types)
  return false
}
