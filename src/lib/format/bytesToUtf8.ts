/**
 * Attempts to decode a byte array as a UTF-8 string.
 * Handles empty and non-empty byte values for Soroban State Lens.
 */

/**
 * Decodes a byte array to a UTF-8 string.
 *
 * @param bytes - The byte array to decode. Can be empty or null/undefined.
 * @returns The decoded string if the bytes are valid UTF-8.
 *          Returns null for null/undefined/empty inputs or if the bytes
 *          contain invalid UTF-8 sequences.
 */
export function bytesToUtf8(bytes: Uint8Array | null | undefined): string | null {
  if (!bytes || bytes.length === 0) {
    return null
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    return decoder.decode(bytes)
  } catch {
    return null
  }
}
