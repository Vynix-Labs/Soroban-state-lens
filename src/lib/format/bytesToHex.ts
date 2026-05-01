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
 * Decodes bytes as UTF-8 when the sequence is valid.
 * Returns an empty string for empty input and null for invalid or unreadable UTF-8.
 */
export function bytesToUtf8Preview(
  bytes: Uint8Array | null | undefined,
): string | null {
  if (!bytes || bytes.length === 0) {
    return ''
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return isReadableUtf8Preview(text) ? text : null
  } catch {
    return null
  }
}

function isReadableUtf8Preview(text: string): boolean {
  for (const character of text) {
    const codePoint = character.codePointAt(0)
    if (codePoint === undefined) {
      return false
    }

    if (codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d) {
      continue
    }

    if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f)) {
      return false
    }
  }

  return true
}

/**
 * Type guard to check if a value is a Uint8Array.
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}
