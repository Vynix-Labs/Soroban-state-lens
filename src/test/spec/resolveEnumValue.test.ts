import { describe, expect, it } from 'vitest'

import {
  buildEnumLookup,
  resolveEnumValue,
} from '../../lib/spec/resolveEnumValue'

import type { SpecEnumEntry } from '../../lib/spec/resolveEnumValue'

describe('buildEnumLookup', () => {
  it('builds a lookup map from enum entries', () => {
    const entries: Array<SpecEnumEntry> = [
      {
        name: 'Status',
        cases: [
          { name: 'Active', value: 0 },
          { name: 'Inactive', value: 1 },
        ],
      },
    ]

    const lookup = buildEnumLookup(entries)

    expect(lookup).toEqual({
      Status: { 0: 'Active', 1: 'Inactive' },
    })
  })

  it('handles multiple enum types', () => {
    const entries: Array<SpecEnumEntry> = [
      {
        name: 'Color',
        cases: [
          { name: 'Red', value: 0 },
          { name: 'Green', value: 1 },
          { name: 'Blue', value: 2 },
        ],
      },
      {
        name: 'Size',
        cases: [
          { name: 'Small', value: 0 },
          { name: 'Large', value: 1 },
        ],
      },
    ]

    const lookup = buildEnumLookup(entries)

    expect(lookup).toEqual({
      Color: { 0: 'Red', 1: 'Green', 2: 'Blue' },
      Size: { 0: 'Small', 1: 'Large' },
    })
  })

  it('returns an empty object for empty entries', () => {
    const lookup = buildEnumLookup([])
    expect(lookup).toEqual({})
  })

  it('handles entries with no cases', () => {
    const entries: Array<SpecEnumEntry> = [
      {
        name: 'Empty',
        cases: [],
      },
    ]

    const lookup = buildEnumLookup(entries)
    expect(lookup).toEqual({ Empty: {} })
  })
})

describe('resolveEnumValue', () => {
  const lookup = buildEnumLookup([
    {
      name: 'Status',
      cases: [
        { name: 'Active', value: 0 },
        { name: 'Inactive', value: 1 },
      ],
    },
    {
      name: 'Color',
      cases: [
        { name: 'Red', value: 0 },
        { name: 'Green', value: 1 },
        { name: 'Blue', value: 2 },
      ],
    },
  ])

  it('resolves a known enum value to its label', () => {
    const result = resolveEnumValue(lookup, 0)
    expect(result).toEqual({ typeName: 'Status', label: 'Active' })
  })

  it('returns the first matching enum type when multiple enums share a value', () => {
    const result = resolveEnumValue(lookup, 1)
    expect(result).toEqual({ typeName: 'Status', label: 'Inactive' })
  })

  it('returns undefined for unknown value', () => {
    expect(resolveEnumValue(lookup, 99)).toBeUndefined()
  })

  it('returns undefined for empty lookup', () => {
    expect(resolveEnumValue({}, 0)).toBeUndefined()
  })

  it('returns undefined for negative number', () => {
    expect(resolveEnumValue(lookup, -1)).toBeUndefined()
  })
})
