import { describe, expect, it } from 'vitest'
import { formatScBytesByPreference } from '../../lib/format/formatScBytesByPreference'
import { ByteDisplayMode } from '../../store/types'

describe('formatScBytesByPreference', () => {
  describe('HEX mode', () => {
    it('returns hex string for Uint8Array', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      expect(formatScBytesByPreference(bytes, ByteDisplayMode.HEX)).toBe('0x0102030405')
    })

    it('returns hex string for number array', () => {
      const bytes = [1, 2, 3, 4, 5]
      expect(formatScBytesByPreference(bytes, ByteDisplayMode.HEX)).toBe('0x0102030405')
    })

    it('returns hex string for base64 string', () => {
      expect(formatScBytesByPreference('AQIDBAU=', ByteDisplayMode.HEX)).toBe('0x0102030405')
    })
  })

  describe('BASE64 mode', () => {
    it('returns base64 string for Uint8Array', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      expect(formatScBytesByPreference(bytes, ByteDisplayMode.BASE64)).toBe('AQIDBAU=')
    })

    it('returns base64 string for number array', () => {
      const bytes = [1, 2, 3, 4, 5]
      expect(formatScBytesByPreference(bytes, ByteDisplayMode.BASE64)).toBe('AQIDBAU=')
    })

    it('returns base64 string for base64 string', () => {
      expect(formatScBytesByPreference('AQIDBAU=', ByteDisplayMode.BASE64)).toBe('AQIDBAU=')
    })
  })

  describe('unknown mode fallback', () => {
    it('falls back to hex for UTF8 mode', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      expect(formatScBytesByPreference(bytes, ByteDisplayMode.UTF8)).toBe('0x0102030405')
    })

    it('falls back to hex for an arbitrary string as mode', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      expect(formatScBytesByPreference(bytes, 'unknown' as ByteDisplayMode)).toBe('0x0102030405')
    })
  })
})
