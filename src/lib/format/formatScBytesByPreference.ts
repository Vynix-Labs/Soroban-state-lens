import { ByteDisplayMode } from '../../store/types'
import { bytesToBase64 } from './bytesToBase64'
import { formatScBytesHex } from './formatScBytesHex'

/**
 * Formats a byte array according to the given display preference.
 *
 * @param input - Byte-like value: Uint8Array, number array, or string.
 * @param preference - The preferred display mode (hex, base64, etc).
 * @returns The formatted string. Falls back to hex for unknown modes.
 */
export function formatScBytesByPreference(
  input: Uint8Array | Array<number> | string,
  preference: ByteDisplayMode
): string {
  if (preference === ByteDisplayMode.BASE64) {
    let bytes: Uint8Array | undefined

    if (typeof input === 'string') {
      if (input.length === 0) {
        return bytesToBase64(new Uint8Array())
      }
      try {
        const decoded = atob(input)
        bytes = new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)))
      } catch {
        return formatScBytesHex(input)
      }
    } else if (Array.isArray(input)) {
      for (const byte of input) {
        if (
          typeof byte !== 'number' ||
          !Number.isInteger(byte) ||
          byte < 0 ||
          byte > 255
        ) {
          return formatScBytesHex(input)
        }
      }
      bytes = new Uint8Array(input)
    } else if (input instanceof Uint8Array) {
      bytes = input
    } else {
      return formatScBytesHex(input)
    }

    return bytesToBase64(bytes)
  }

  return formatScBytesHex(input)
}
