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
export function deepClone(
  value: unknown,
  seen = new WeakMap<object, unknown>(),
): unknown {
  // Handle primitive types and null
  if (value === null || typeof value !== 'object') {
    return value
  }

  const objectValue = value
  const existingClone = seen.get(objectValue)
  if (existingClone !== undefined) {
    return existingClone
  }

  // Handle DataView separately because its constructor expects an ArrayBuffer.
  if (value instanceof DataView) {
    const cloned = new DataView(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    )
    seen.set(objectValue, cloned)
    return cloned
  }

  // Handle typed arrays (preserve their type)
  if (ArrayBuffer.isView(value)) {
    // Create a new typed array of the same type
    const TypedArrayConstructor = value.constructor as any
    const cloned = new TypedArrayConstructor(value)
    seen.set(objectValue, cloned)
    return cloned
  }

  // Handle regular arrays
  if (Array.isArray(value)) {
    const cloned: Array<unknown> = []
    seen.set(objectValue, cloned)
    for (const item of value) {
      cloned.push(deepClone(item, seen))
    }
    return cloned
  }

  // Handle plain objects
  if (Object.prototype.toString.call(value) === '[object Object]') {
    const cloned: Record<string, unknown> = {}
    seen.set(objectValue, cloned)
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = deepClone((value as Record<string, unknown>)[key], seen)
      }
    }
    return cloned
  }

  // Fallback for other types (functions, symbols, etc.) - return as is
  return value
}
