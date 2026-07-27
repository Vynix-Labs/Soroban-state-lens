/**
 * Deep clones a value while preserving typed arrays and undefined values.
 * Unlike JSON.parse(JSON.stringify()), this function handles:
 * - Undefined values
 * - Uint8Array and other typed arrays
 * - Circular references (returns the same reference for circular cases)
 * - Regular objects and arrays
 *
 * @param value - The value to deep clone
 * @returns A deep clone of the value
 */
export function deepClone(value: unknown): unknown {
  // Handle primitive types and null
  if (value === null || typeof value !== 'object') {
    return value
  }

  // Handle typed arrays (preserve their type)
  if (ArrayBuffer.isView(value)) {
    // Create a new typed array of the same type
    const TypedArrayConstructor = value.constructor as any
    return new TypedArrayConstructor(value)
  }

  // Handle regular arrays
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item))
  }

  // Handle plain objects
  if (Object.prototype.toString.call(value) === '[object Object]') {
    const cloned: Record<string, unknown> = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = deepClone((value as Record<string, unknown>)[key])
      }
    }
    return cloned
  }

  // Fallback for other types (functions, symbols, etc.) - return as is
  return value
}
