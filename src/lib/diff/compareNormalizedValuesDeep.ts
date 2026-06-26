/**
 * Performs a deep semantic comparison of two normalized values.
 *
 * Comparison rules:
 * - Primitives use strict equality, with NaN treated as equal to NaN.
 * - Arrays are compared element-by-element.
 * - Normalized maps are compared as unordered key/value sets.
 * - Other objects are compared by their own keys recursively.
 */
export function compareNormalizedValuesDeep(
  a: unknown,
  b: unknown,
): boolean {
  if (a === b) {
    return true
  }

  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) {
      return true
    }
  }

  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!compareNormalizedValuesDeep(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) || Array.isArray(b)) {
      return false
    }

    const mapA = isNormalizedMap(a)
    const mapB = isNormalizedMap(b)

    if (mapA || mapB) {
      if (!mapA || !mapB) {
        return false
      }
      return compareNormalizedMapEntries(a.entries, b.entries)
    }

    const keysA = Object.keys(a as Record<string, unknown>)
    const keysB = Object.keys(b as Record<string, unknown>)

    if (keysA.length !== keysB.length) {
      return false
    }

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false
      }
      if (
        !compareNormalizedValuesDeep(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        )
      ) {
        return false
      }
    }

    return true
  }

  return false
}

function isNormalizedMap(value: unknown): value is {
  kind: 'map'
  entries: Array<{ key: unknown; value: unknown }>
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).kind === 'map' &&
    Array.isArray((value as Record<string, unknown>).entries)
  )
}

function compareNormalizedMapEntries(
  entriesA: Array<{ key: unknown; value: unknown }>,
  entriesB: Array<{ key: unknown; value: unknown }>,
): boolean {
  if (entriesA.length !== entriesB.length) {
    return false
  }

  const matched = new Array<boolean>(entriesB.length).fill(false)

  for (const entryA of entriesA) {
    let found = false

    for (let index = 0; index < entriesB.length; index += 1) {
      if (matched[index]) {
        continue
      }

      const entryB = entriesB[index]
      if (
        compareNormalizedValuesDeep(entryA.key, entryB.key) &&
        compareNormalizedValuesDeep(entryA.value, entryB.value)
      ) {
        matched[index] = true
        found = true
        break
      }
    }

    if (!found) {
      return false
    }
  }

  return true
}
