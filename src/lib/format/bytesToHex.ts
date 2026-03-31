/**
 * Converts byte arrays to stable hexadecimal strings.
 * Handles empty and non-empty byte values for Soroban State Lens.
 */

/**
 * Converts a byte array to a hexadecimal string.
 * 
 * @param bytes - The byte array to convert. Can be empty or null/undefined.
 * @returns A deterministic hex string representation of the bytes.
 *          Returns "0x" for empty/null/undefined inputs.
 */
export function bytesToHex(bytes: Uint8Array | null | undefined): string {
  if (!bytes || bytes.length === 0) {
    return '0x'
  }

  // Convert each byte to a 2-digit hex string and join them
  const hexBytes = Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `0x${hexBytes}`
}

/**
 * Type guard to check if a value is a Uint8Array.
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}
