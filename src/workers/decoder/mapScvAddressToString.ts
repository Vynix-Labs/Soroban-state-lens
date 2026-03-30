/**
 * Maps address-like inputs to safe string representations.
 *
 * Returns a string representation of the address with a predictable fallback
 * for invalid or unrecognized inputs.
 *
 * Behavior:
 * - Plain string: returned as-is
 * - Object with toString(): uses toString() representation
 * - Invalid objects: returns __unsupported_address with fallback marker
 *
 * Deterministic and side-effect free.
 *
 * @param value - Unknown input to convert to address string
 * @returns Safe string representation of the address
 *
 * @example
 * mapScvAddressToString('GDZST3XVCDTUJ76ZAV2HA72KYXM4Y5TCFMMNZTDDXXVYQ4BSVGXL6EH2')
 * // Returns: 'GDZST3XVCDTUJ76ZAV2HA72KYXM4Y5TCFMMNZTDDXXVYQ4BSVGXL6EH2'
 *
 * @example
 * mapScvAddressToString(null)
 * // Returns: '__unsupported_address_null'
 */
export function mapScvAddressToString(value: unknown): string {
  // Handle plain strings
  if (typeof value === 'string') {
    return value
  }

  // Handle null and undefined with explicit fallback
  if (value === null) {
    return '__unsupported_address_null'
  }

  if (value === undefined) {
    return '__unsupported_address_undefined'
  }

  // Handle objects with custom toString method (but exclude arrays and bare plain objects)
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Use toString if it's an own property OR if it's from a built-in class (Date, etc.)
    // but skip the default Object prototype toString
    const hasOwnToString = Object.prototype.hasOwnProperty.call(
      value,
      'toString',
    )
    const isBuiltInClass = ![null, Object.prototype].includes(
      Object.getPrototypeOf(value),
    )

    if (
      (hasOwnToString || isBuiltInClass) &&
      typeof (value as any).toString === 'function'
    ) {
      try {
        const stringResult = (value as any).toString()
        // Ensure toString actually returned a string
        if (typeof stringResult === 'string') {
          return stringResult
        }
      } catch {
        // Fall through to unsupported fallback
      }
    }
  }

  // Fallback for all other cases (numbers, booleans, arrays, plain objects, etc.)
  return '__unsupported_address_invalid'
}
