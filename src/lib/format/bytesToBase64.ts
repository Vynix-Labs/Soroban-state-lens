/**
 * Converts byte arrays to base64 strings.
 * Handles empty and non-empty byte values for Soroban State Lens.
 */

/**
 * Converts a byte array to a base64 string.
 *
 * @param bytes - The byte array to convert. Can be empty or null/undefined.
 * @returns A base64 string representation of the bytes.
 *          Returns an empty string for empty/null/undefined inputs.
 */
export function bytesToBase64(bytes: Uint8Array | null | undefined): string {
  if (!bytes || bytes.length === 0) {
    return ''
  }

  // Use Buffer if available (Node.js/Vitest environment or polyfilled in browser)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  // Fallback to btoa for browser environments without Buffer
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    // @ts-ignore - spread operator works on typed arrays in modern JS
    binary += String.fromCharCode.apply(null, chunk)
  }

  return btoa(binary)
}
