import { describe, expect, it } from 'vitest'
import { mapScvMap, mapScvMapEntry } from '../../workers/decoder/mapScvMap'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple normalize function that returns the input as-is for testing */
function identityNormalize(item: unknown): unknown {
  return item
}

/** Normalize function that converts everything to string */
function stringNormalize(item: unknown): unknown {
  return typeof item === 'string' ? item : JSON.stringify(item)
}

/** Normalize function that throws for specific values */
function throwingNormalize(item: unknown): unknown {
  if (item === 'throw') {
    throw new Error('Normalization failed')
  }
  return item
}

// ---------------------------------------------------------------------------
// Tests for mapScvMapEntry
// ---------------------------------------------------------------------------

describe('mapScvMapEntry', () => {
  it('converts valid entry with string key', () => {
    const entry = { key: 'test', val: 42 }
    const result = mapScvMapEntry(entry, identityNormalize)

    expect(result).toEqual(['test', 42])
  })

  it('converts valid entry with number key', () => {
    const entry = { key: 123, val: 'value' }
    const result = mapScvMapEntry(entry, identityNormalize)

    expect(result).toEqual(['123', 'value'])
  })

  it('converts valid entry with boolean key', () => {
    const entry = { key: true, val: false }
    const result = mapScvMapEntry(entry, identityNormalize)

    expect(result).toEqual(['true', false])
  })

  it('converts valid entry with complex object key using JSON.stringify', () => {
    const entry = { key: { nested: 'key' }, val: 'value' }
    const result = mapScvMapEntry(entry, identityNormalize)

    expect(result).toEqual([JSON.stringify({ nested: 'key' }), 'value'])
  })

  it('returns undefined for null entry', () => {
    const result = mapScvMapEntry(null, identityNormalize)
    expect(result).toBeUndefined()
  })

  it('returns undefined for undefined entry', () => {
    const result = mapScvMapEntry(undefined, identityNormalize)
    expect(result).toBeUndefined()
  })

  it('returns undefined for non-object entry', () => {
    const result = mapScvMapEntry('not-an-object', identityNormalize)
    expect(result).toBeUndefined()
  })

  it('returns undefined for entry missing key property', () => {
    const entry = { val: 'value' }
    const result = mapScvMapEntry(entry, identityNormalize)
    expect(result).toBeUndefined()
  })

  it('returns undefined for entry missing val property', () => {
    const entry = { key: 'key' }
    const result = mapScvMapEntry(entry, identityNormalize)
    expect(result).toBeUndefined()
  })

  it('returns undefined when normalize function throws', () => {
    const entry = { key: 'throw', val: 'value' }
    const result = mapScvMapEntry(entry, throwingNormalize)
    expect(result).toBeUndefined()
  })

  it('applies normalize function to both key and value', () => {
    const entry = { key: 'key', val: 'value' }
    const result = mapScvMapEntry(entry, stringNormalize)

    expect(result).toEqual(['key', 'value'])
  })
})

// ---------------------------------------------------------------------------
// Tests for mapScvMap
// ---------------------------------------------------------------------------

describe('mapScvMap', () => {
  it('converts empty array to empty object', () => {
    const result = mapScvMap([], identityNormalize)
    expect(result).toEqual({})
  })

  it('converts single entry to object with one property', () => {
    const entries = [{ key: 'name', val: 'alice' }]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({ name: 'alice' })
  })

  it('converts multiple entries to object with multiple properties', () => {
    const entries = [
      { key: 'name', val: 'alice' },
      { key: 'age', val: 30 },
      { key: 'active', val: true },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      name: 'alice',
      age: 30,
      active: true,
    })
  })

  it('handles numeric keys by converting to strings', () => {
    const entries = [
      { key: 0, val: 'zero' },
      { key: 1, val: 'one' },
      { key: 2, val: 'two' },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      '0': 'zero',
      '1': 'one',
      '2': 'two',
    })
  })

  it('handles boolean keys by converting to strings', () => {
    const entries = [
      { key: true, val: 'yes' },
      { key: false, val: 'no' },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      true: 'yes',
      false: 'no',
    })
  })

  it('handles complex object keys using JSON.stringify', () => {
    const entries = [
      { key: { id: 1 }, val: 'first' },
      { key: { id: 2 }, val: 'second' },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      '{"id":1}': 'first',
      '{"id":2}': 'second',
    })
  })

  it('deterministically overwrites duplicate keys with later entries', () => {
    const entries = [
      { key: 'duplicate', val: 'first' },
      { key: 'unique', val: 'kept' },
      { key: 'duplicate', val: 'second' },
      { key: 'duplicate', val: 'third' },
    ]
    const result = mapScvMap(entries, identityNormalize)

    // Last entry with duplicate key should win
    expect(result).toEqual({
      duplicate: 'third',
      unique: 'kept',
    })
  })

  it('skips invalid entries without throwing', () => {
    const entries: Array<{ key: unknown; val: unknown }> = [
      { key: 'valid', val: 'value' },
      null as any,
      undefined as any,
      'not-an-object' as any,
      { val: 'missing-key' } as any,
      { key: 'missing-val' } as any,
      { key: 'another-valid', val: 'another-value' },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      valid: 'value',
      'another-valid': 'another-value',
    })
  })

  it('skips entries where normalize function throws', () => {
    const entries = [
      { key: 'good', val: 'value' },
      { key: 'throw', val: 'bad' },
      { key: 'also-good', val: 'another-value' },
    ]
    const result = mapScvMap(entries, throwingNormalize)

    expect(result).toEqual({
      good: 'value',
      'also-good': 'another-value',
    })
  })

  it('applies normalize function to all values', () => {
    const entries = [
      { key: 'string', val: 'original' },
      { key: 'number', val: 42 },
      { key: 'boolean', val: true },
    ]
    const result = mapScvMap(entries, stringNormalize)

    expect(result).toEqual({
      string: 'original',
      number: '42',
      boolean: 'true',
    })
  })

  it('preserves insertion order in object property enumeration', () => {
    const entries = [
      { key: 'c', val: 1 },
      { key: 'a', val: 2 },
      { key: 'b', val: 3 },
    ]
    const result = mapScvMap(entries, identityNormalize)

    // Object property order should match insertion order
    const keys = Object.keys(result)
    expect(keys).toEqual(['c', 'a', 'b'])
  })

  it('handles mixed key types in single map', () => {
    const entries = [
      { key: 'string', val: 'string-value' },
      { key: 42, val: 'number-value' },
      { key: true, val: 'boolean-value' },
      { key: { complex: 'key' }, val: 'complex-value' },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      string: 'string-value',
      '42': 'number-value',
      true: 'boolean-value',
      '{"complex":"key"}': 'complex-value',
    })
  })

  it('handles empty values', () => {
    const entries = [
      { key: 'null', val: null },
      { key: 'undefined', val: undefined },
      { key: 'empty-string', val: '' },
      { key: 'zero', val: 0 },
    ]
    const result = mapScvMap(entries, identityNormalize)

    expect(result).toEqual({
      null: null,
      undefined: undefined,
      'empty-string': '',
      zero: 0,
    })
  })

  it('skips entries whose normalized keys cannot be serialized', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    const result = mapScvMap(
      [
        { key: circular, val: 'invalid' },
        { key: 'valid', val: 'kept' },
      ],
      identityNormalize,
    )

    expect(result).toEqual({ valid: 'kept' })
  })
})
