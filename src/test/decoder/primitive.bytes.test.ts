import { describe, expect, test } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { ScVal } from '../../workers/decoder/normalizeScVal'

describe('ScVal Bytes Normalization', () => {
  test('should normalize empty bytes', () => {
    const scVal: ScVal = {
      switch: ScValType.SCV_BYTES,
      value: new Uint8Array([]),
    }
    const result = normalizeScVal(scVal)

    expect(result).toEqual({
      kind: 'primitive',
      primitive: 'bytes',
      value: '0x',
    })
  })

  test('should normalize short bytes', () => {
    const scVal: ScVal = {
      switch: ScValType.SCV_BYTES,
      value: new Uint8Array([1, 2, 3, 4, 5]),
    }
    const result = normalizeScVal(scVal)

    expect(result).toEqual({
      kind: 'primitive',
      primitive: 'bytes',
      value: '0x0102030405',
    })
  })

  test('should normalize longer payload', () => {
    const longerBytes = new Uint8Array([
      0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0xfe, 0xdc, 0xba, 0x98,
      0x76, 0x54, 0x32, 0x10,
    ])
    const scVal: ScVal = {
      switch: ScValType.SCV_BYTES,
      value: longerBytes,
    }
    const result = normalizeScVal(scVal)

    expect(result).toEqual({
      kind: 'primitive',
      primitive: 'bytes',
      value: '0x0123456789abcdeffedcba9876543210',
    })
  })

  test('should handle bytes with zero values', () => {
    const scVal: ScVal = {
      switch: ScValType.SCV_BYTES,
      value: new Uint8Array([0, 0, 255, 128]),
    }
    const result = normalizeScVal(scVal)

    expect(result).toEqual({
      kind: 'primitive',
      primitive: 'bytes',
      value: '0x0000ff80',
    })
  })

  test('should handle malformed byte values gracefully', () => {
    // Create a malformed ScVal where value is not a Uint8Array
    const malformedScVal: ScVal = {
      switch: ScValType.SCV_BYTES,
      value: 'not-a-byte-array' as any,
    }

    const result = normalizeScVal(malformedScVal)

    expect(result).toEqual({
      kind: 'primitive',
      primitive: 'bytes',
      value: '0x',
    })
  })
})
