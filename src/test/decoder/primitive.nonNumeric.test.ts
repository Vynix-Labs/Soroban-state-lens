import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type {
  NormalizedError,
  ScVal,
} from '../../workers/decoder/normalizeScVal'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeScVal(switchType: ScValType, value?: unknown): ScVal {
  return { switch: switchType, value }
}

// ---------------------------------------------------------------------------
// Bool
// ---------------------------------------------------------------------------

describe('normalizeScVal – Bool', () => {
  it('normalizes true to primitive object with boolean value', () => {
    const result: any = normalizeScVal(makeScVal(ScValType.SCV_BOOL, true))
    expect(result.kind).toBe('primitive')
    expect(result.primitive).toBe('bool')
    expect(result.value).toBe(true)
  })

  it('normalizes false to primitive object with boolean value', () => {
    const result: any = normalizeScVal(makeScVal(ScValType.SCV_BOOL, false))
    expect(result.kind).toBe('primitive')
    expect(result.primitive).toBe('bool')
    expect(result.value).toBe(false)
  })

  it('defaults to false when value is not a boolean', () => {
    const invalidCases = [0, 1, 'true', null, undefined, {}, []]

    invalidCases.forEach((badValue) => {
      const result: any = normalizeScVal(makeScVal(ScValType.SCV_BOOL, badValue))
      expect(result.kind).toBe('primitive')
      expect(result.primitive).toBe('bool')
      expect(result.value).toBe(false)
    })
  })

  it('preserves exact fixture output shape for true', () => {
    const r: any = normalizeScVal(makeScVal(ScValType.SCV_BOOL, true))
    expect(r).toStrictEqual({ kind: 'primitive', primitive: 'bool', value: true })
  })

  it('preserves exact fixture output shape for false', () => {
    const r: any = normalizeScVal(makeScVal(ScValType.SCV_BOOL, false))
    expect(r).toStrictEqual({ kind: 'primitive', primitive: 'bool', value: false })
  })
})

// ---------------------------------------------------------------------------
// Void
// ---------------------------------------------------------------------------

describe('normalizeScVal – Void', () => {
  it('normalizes void with no value to null', () => {
    const result: any = normalizeScVal(makeScVal(ScValType.SCV_VOID))
    expect(result.kind).toBe('primitive')
    expect(result.primitive).toBe('void')
    expect(result.value).toBe(null)
  })

  it('normalizes void with undefined value to null', () => {
    const result: any = normalizeScVal(makeScVal(ScValType.SCV_VOID, undefined))
    expect(result.kind).toBe('primitive')
    expect(result.primitive).toBe('void')
    expect(result.value).toBe(null)
  })

  it('normalizes void even when an unexpected payload is present', () => {
    // Void always produces null regardless of any stray payload
    const result: any = normalizeScVal(makeScVal(ScValType.SCV_VOID, 42))
    expect(result.kind).toBe('primitive')
    expect(result.primitive).toBe('void')
    expect(result.value).toBe(null)
  })

  it('preserves exact fixture output shape', () => {
    const r: any = normalizeScVal(makeScVal(ScValType.SCV_VOID))
    expect(r).toStrictEqual({ kind: 'primitive', primitive: 'void', value: null })
  })
})

// ---------------------------------------------------------------------------
// Symbol
// ---------------------------------------------------------------------------

describe('normalizeScVal – Symbol', () => {
  const symbolFixtures = [
    { value: 'transfer', expected: 'transfer' },
    { value: 'mint', expected: 'mint' },
    { value: 'burn', expected: 'burn' },
    { value: '', expected: '' },
    { value: 'SNAKE_CASE_SYMBOL', expected: 'SNAKE_CASE_SYMBOL' },
    { value: 'symbol-with-dashes', expected: 'symbol-with-dashes' },
  ]

  symbolFixtures.forEach(({ value, expected }) => {
    it(`normalizes symbol "${value}" to string "${expected}"`, () => {
      const result: any = normalizeScVal(makeScVal(ScValType.SCV_SYMBOL, value))
      expect(result.kind).toBe('primitive')
      expect(result.primitive).toBe('symbol')
      expect(result.value).toBe(expected)
      expect(typeof result.value).toBe('string')
    })
  })

  it('defaults to empty string when value is not a string', () => {
    const invalidCases = [42, true, null, undefined, [], {}]

    invalidCases.forEach((badValue) => {
      const result: any = normalizeScVal(makeScVal(ScValType.SCV_SYMBOL, badValue))
      expect(result.kind).toBe('primitive')
      expect(result.primitive).toBe('symbol')
      expect(result.value).toBe('')
    })
  })

  it('preserves exact fixture output shape', () => {
    const r: any = normalizeScVal(makeScVal(ScValType.SCV_SYMBOL, 'transfer'))
    expect(r).toStrictEqual({ kind: 'primitive', primitive: 'symbol', value: 'transfer' })
  })
})

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('normalizeScVal – Error', () => {
  describe('well-formed error value', () => {
    const errorFixtures: Array<{
      type: string
      code: number
    }> = [
      { type: 'contract', code: 1 },
      { type: 'wasm_vm', code: 0 },
      { type: 'context', code: 3 },
      { type: 'storage', code: 2 },
      { type: 'object', code: 5 },
      { type: 'crypto', code: 6 },
      { type: 'events', code: 7 },
      { type: 'budget', code: 8 },
      { type: 'value', code: 9 },
      { type: 'auth', code: 4 },
    ]

    errorFixtures.forEach(({ type, code }) => {
      it(`normalizes error type="${type}" code=${code} to NormalizedError`, () => {
        const scVal = makeScVal(ScValType.SCV_ERROR, { type, code })
        const result = normalizeScVal(scVal) as NormalizedError

        expect(result.__error).toBe(true)
        expect(result.type).toBe(type)
        expect(result.code).toBe(code)
      })
    })

    it('preserves exact fixture output shape for contract error', () => {
      const scVal = makeScVal(ScValType.SCV_ERROR, { type: 'contract', code: 1 })
      expect(normalizeScVal(scVal)).toStrictEqual({
        __error: true,
        type: 'contract',
        code: 1,
      })
    })

    it('coerces numeric code to number', () => {
      const scVal = makeScVal(ScValType.SCV_ERROR, { type: 'value', code: '7' })
      const result = normalizeScVal(scVal) as NormalizedError

      expect(result.__error).toBe(true)
      expect(typeof result.code).toBe('number')
      expect(result.code).toBe(7)
    })

    it('coerces non-string type to string', () => {
      const scVal = makeScVal(ScValType.SCV_ERROR, { type: 99, code: 0 })
      const result = normalizeScVal(scVal) as NormalizedError

      expect(result.__error).toBe(true)
      expect(typeof result.type).toBe('string')
      expect(result.type).toBe('99')
    })
  })

  describe('malformed / missing error value', () => {
    const malformedCases = [
      { label: 'undefined value', value: undefined },
      { label: 'null value', value: null },
      { label: 'string value', value: 'oops' },
      { label: 'number value', value: 42 },
      { label: 'missing code field', value: { type: 'contract' } },
      { label: 'missing type field', value: { code: 1 } },
      { label: 'empty object', value: {} },
    ]

    malformedCases.forEach(({ label, value }) => {
      it(`returns safe default NormalizedError for ${label}`, () => {
        const scVal = makeScVal(ScValType.SCV_ERROR, value)
        const result = normalizeScVal(scVal) as NormalizedError

        expect(result.__error).toBe(true)
        expect(result.type).toBe('unknown')
        expect(result.code).toBe(0)
      })
    })

    it('default fallback is JSON-serializable', () => {
      const scVal = makeScVal(ScValType.SCV_ERROR)
      const result = normalizeScVal(scVal)

      // Must not throw
      const serialized = JSON.stringify(result)
      expect(typeof serialized).toBe('string')
      expect(JSON.parse(serialized)).toEqual({ __error: true, type: 'unknown', code: 0 })
    })
  })

  describe('error does not crash for any input', () => {
    it('returns a NormalizedError even for deeply unexpected values', () => {
      const edgeCases = [
        { type: null, code: null },
        { type: undefined, code: undefined },
        { type: [], code: {} },
      ]

      edgeCases.forEach((value) => {
        const scVal = makeScVal(ScValType.SCV_ERROR, value)
        const result = normalizeScVal(scVal) as NormalizedError

        // Should always have the discriminant
        expect(result.__error).toBe(true)
        expect(typeof result.type).toBe('string')
        expect(typeof result.code).toBe('number')
      })
    })
  })
})
