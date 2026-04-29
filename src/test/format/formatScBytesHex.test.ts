import { describe, expect, it } from 'vitest'
import { formatScBytesHex } from '../../lib/format/formatScBytesHex'

describe('formatScBytesHex', () => {
  // ✅ Happy paths
  describe('happy path', () => {
    it('converts Uint8Array to lowercase hex with 0x prefix', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5])
      expect(formatScBytesHex(bytes)).toBe('0x0102030405')
    })

    it('converts single byte correctly', () => {
      const bytes = new Uint8Array([255])
      expect(formatScBytesHex(bytes)).toBe('0xff')
    })

    it('converts zero bytes correctly', () => {
      const bytes = new Uint8Array([0, 0, 0, 0])
      expect(formatScBytesHex(bytes)).toBe('0x00000000')
    })

    it('converts mixed byte values', () => {
      const bytes = new Uint8Array([0, 1, 15, 16, 255, 128])
      expect(formatScBytesHex(bytes)).toBe('0x00010f10ff80')
    })

    it('converts longer payload to hex', () => {
      const bytes = new Uint8Array([
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10
      ])
      expect(formatScBytesHex(bytes)).toBe('0x0123456789abcdeffedcba9876543210')
    })

    it('converts number array to hex', () => {
      const bytes = [1, 2, 3, 4, 5]
      expect(formatScBytesHex(bytes)).toBe('0x0102030405')
    })

    it('converts number array with all byte values', () => {
      const bytes = [0, 1, 127, 128, 255]
      expect(formatScBytesHex(bytes)).toBe('0x00017f80ff')
    })

    it('decodes valid base64 string to hex', () => {
      // "AQIDBA==" is base64 for [1, 2, 3, 4]
      expect(formatScBytesHex('AQIDBA==')).toBe('0x01020304')
    })

    it('decodes base64 without padding', () => {
      // "AQID" is base64 for [1, 2, 3]
      expect(formatScBytesHex('AQID')).toBe('0x010203')
    })

    it('handles base64 with all byte values', () => {
      // "AAH/" is base64 for [0, 1, 255]
      expect(formatScBytesHex('AAH/')).toBe('0x0001ff')
    })
  })

  // ❌ Invalid input
  describe('invalid input', () => {
    it('returns "0x" for empty Uint8Array', () => {
      expect(formatScBytesHex(new Uint8Array([]))).toBe('0x')
    })

    it('returns "0x" for empty number array', () => {
      expect(formatScBytesHex([])).toBe('0x')
    })

    it('returns "0x" for empty string', () => {
      expect(formatScBytesHex('')).toBe('0x')
    })

    it('returns "0x" for invalid base64 string', () => {
      expect(formatScBytesHex('not-valid-base64!!!')).toBe('0x')
    })

    it('returns "0x" for invalid characters in base64', () => {
      expect(formatScBytesHex('AQID@@@')).toBe('0x')
    })

    it('returns "0x" for number array with negative value', () => {
      expect(formatScBytesHex([1, -1, 3])).toBe('0x')
    })

    it('returns "0x" for number array with value over 255', () => {
      expect(formatScBytesHex([1, 256, 3])).toBe('0x')
    })

    it('returns "0x" for number array with float', () => {
      expect(formatScBytesHex([1, 2.5, 3])).toBe('0x')
    })

    it('returns "0x" for number array with non-numeric value', () => {
      expect(formatScBytesHex([1, 'invalid', 3] as unknown as number[])).toBe('0x')
    })
  })

  // ⚠️ Edge cases
  describe('edge cases', () => {
    it('handles byte value 0 at start', () => {
      expect(formatScBytesHex([0, 1, 2])).toBe('0x000102')
    })

    it('handles byte value 255 (max valid)', () => {
      expect(formatScBytesHex([254, 255])).toBe('0xfeff')
    })

    it('handles repeated byte values', () => {
      expect(formatScBytesHex([255, 255, 255])).toBe('0xffffff')
    })

    it('handles large byte array', () => {
      const largeArray = new Array(1000).fill(42)
      const result = formatScBytesHex(new Uint8Array(largeArray))
      expect(result.startsWith('0x')).toBe(true)
      expect(result.length).toBe(2 + 1000 * 2) // 0x prefix + 1000 bytes * 2 hex chars
      expect(result).toBe('0x' + '2a'.repeat(1000))
    })

    it('returns lowercase hex (not uppercase)', () => {
      const bytes = new Uint8Array([0xab, 0xcd, 0xef])
      const result = formatScBytesHex(bytes)
      expect(result).toBe('0xabcdef')
      expect(result).not.toBe('0xABCDEF')
    })

    it('pads single digit hex with leading zero', () => {
      const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      const result = formatScBytesHex(bytes)
      expect(result).toBe('0x000102030405060708090a0b0c0d0e0f')
    })

    it('is deterministic (multiple calls same output)', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5])
      const result1 = formatScBytesHex(input)
      const result2 = formatScBytesHex(input)
      expect(result1).toBe(result2)
    })

    it('converts Uint8Array slice correctly', () => {
      const fullArray = new Uint8Array([255, 1, 2, 3, 255])
      const slice = fullArray.slice(1, 4)
      expect(formatScBytesHex(slice)).toBe('0x010203')
    })

    it('handles number array with boundary values', () => {
      expect(formatScBytesHex([0, 1, 254, 255])).toBe('0x0001feff')
    })

    it('returns "0x" when given null as string input but type-unsafe', () => {
      // When type safety is bypassed
      expect(formatScBytesHex(null as unknown as Uint8Array)).toBe('0x')
    })

    it('returns "0x" when given undefined as string input but type-unsafe', () => {
      // When type safety is bypassed
      expect(formatScBytesHex(undefined as unknown as Uint8Array)).toBe('0x')
    })

    it('base64 with special characters in alphabet', () => {
      // "//8=" is base64 for [255, 255]
      expect(formatScBytesHex('//8=')).toBe('0xffff')
    })

    it('base64 with all padding variations', () => {
      // "AA==" is base64 for [0]
      expect(formatScBytesHex('AA==')).toBe('0x00')
      // "AAA=" is base64 for [0, 0]
      expect(formatScBytesHex('AAA=')).toBe('0x0000')
      // "AAAA" is base64 for [0, 0, 0]
      expect(formatScBytesHex('AAAA')).toBe('0x000000')
    })
  })
})
