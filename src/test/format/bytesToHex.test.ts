import { describe, expect, test } from 'vitest'
import { bytesToHex, isUint8Array } from '../../lib/format/bytesToHex'

describe('bytesToHex', () => {
  test('should return "0x" for null input', () => {
    expect(bytesToHex(null)).toBe('0x')
  })

  test('should return "0x" for undefined input', () => {
    expect(bytesToHex(undefined)).toBe('0x')
  })

  test('should return "0x" for empty byte array', () => {
    const emptyBytes = new Uint8Array([])
    expect(bytesToHex(emptyBytes)).toBe('0x')
  })

  test('should convert single byte to hex', () => {
    const singleByte = new Uint8Array([255])
    expect(bytesToHex(singleByte)).toBe('0xff')
  })

  test('should convert short byte array to hex', () => {
    const shortBytes = new Uint8Array([1, 2, 3, 4, 5])
    expect(bytesToHex(shortBytes)).toBe('0x0102030405')
  })

  test('should convert longer payload to hex', () => {
    const longerBytes = new Uint8Array([
      0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
      0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
      0x00, 0xff, 0x80, 0x7f, 0x11, 0x22, 0x33, 0x44,
      0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc
    ])
    expect(bytesToHex(longerBytes)).toBe(
      '0x0123456789abcdeffedcba987654321000ff807f112233445566778899aabbcc'
    )
  })

  test('should handle zero bytes correctly', () => {
    const zeroBytes = new Uint8Array([0, 0, 0, 0])
    expect(bytesToHex(zeroBytes)).toBe('0x00000000')
  })

  test('should handle mixed values', () => {
    const mixedBytes = new Uint8Array([0, 1, 15, 16, 255, 128])
    expect(bytesToHex(mixedBytes)).toBe('0x00010f10ff80')
  })
})

describe('isUint8Array', () => {
  test('should return true for Uint8Array', () => {
    const bytes = new Uint8Array([1, 2, 3])
    expect(isUint8Array(bytes)).toBe(true)
  })

  test('should return false for regular arrays', () => {
    const array = [1, 2, 3]
    expect(isUint8Array(array)).toBe(false)
  })

  test('should return false for strings', () => {
    expect(isUint8Array('hello')).toBe(false)
  })

  test('should return false for null', () => {
    expect(isUint8Array(null)).toBe(false)
  })

  test('should return false for undefined', () => {
    expect(isUint8Array(undefined)).toBe(false)
  })

  test('should return false for objects', () => {
    expect(isUint8Array({})).toBe(false)
  })
})
