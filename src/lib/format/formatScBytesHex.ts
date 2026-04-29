/**
 * Converts byte-like ScVal values into lowercase 0x-prefixed hex strings.
 * Handles Uint8Array, number arrays, and string (base64) inputs.
 */

/**
 * Converts bytes input into lowercase 0x-prefixed hex string.
 *
 * @param input - Byte-like value: Uint8Array, number array, or base64 string.
 * @returns A lowercase 0x-prefixed hex string, or "0x" on invalid input.
 *
 * Edge cases:
 * - Rejects out-of-range byte values (< 0 or > 255)
 * - Rejects invalid base64/string formats
 * - Returns "0x" as fallback for any invalid input
 */
export function formatScBytesHex(
  input: Uint8Array | number[] | string
): string {
  try {
    let bytes: Uint8Array

    // Handle string input (attempt base64 decode)
    if (typeof input === 'string') {
      if (input.length === 0) {
        return '0x'
      }

      // Try to decode as base64
      try {
        const decoded = atob(input)
        bytes = new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)))
      } catch {
        // Invalid base64
        return '0x'
      }
    }
    // Handle number array
    else if (Array.isArray(input)) {
      // Validate all elements are valid byte values (0-255)
      for (const byte of input) {
        if (
          typeof byte !== 'number' ||
          !Number.isInteger(byte) ||
          byte < 0 ||
          byte > 255
        ) {
          return '0x'
        }
      }
      bytes = new Uint8Array(input)
    }
    // Handle Uint8Array
    else if (input instanceof Uint8Array) {
      bytes = input
    } else {
      // Invalid type
      return '0x'
    }

    // Empty bytes -> "0x"
    if (bytes.length === 0) {
      return '0x'
    }

    // Convert to lowercase hex with 0x prefix
    const hexBytes = Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')

    return `0x${hexBytes}`
  } catch {
    // Fallback for any unexpected errors
    return '0x'
  }
}
