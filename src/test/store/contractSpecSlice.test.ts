import { xdr } from '@stellar/stellar-sdk'
import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore } from '../../store/lensStore'
import type { ContractSpec } from '../../types/contract-spec'

function makeSpec(name: string): ContractSpec {
  const wire = new xdr.ScSpecFunctionV0({
    doc: '',
    name,
    inputs: [],
    outputs: [],
  })
  return {
    entries: [{ kind: 'function', name, inputs: [], outputs: [], wire }],
  }
}

describe('contractSpecSlice', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with empty contractSpecs', () => {
    expect(getStoreState().contractSpecs).toEqual({})
    expect(getStoreState().contractSpecErrors).toEqual({})
    expect(getStoreState().contractSpecMismatches).toEqual({})
  })

  it('stores spec data for a contract ID', () => {
    const spec = makeSpec('transfer')
    getStoreState().setContractSpec('CONTRACT_A', spec)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual(spec)
  })

  it('replaces existing spec for the same contract ID', () => {
    const first = makeSpec('first')
    const second = makeSpec('second')
    getStoreState().setContractSpec('CONTRACT_A', first)
    getStoreState().setContractSpec('CONTRACT_A', second)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual(second)
  })

  it('stores specs for multiple contract IDs independently', () => {
    const specA = makeSpec('A')
    const specB = makeSpec('B')
    getStoreState().setContractSpec('CONTRACT_A', specA)
    getStoreState().setContractSpec('CONTRACT_B', specB)

    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual(specA)
    expect(getStoreState().getContractSpec('CONTRACT_B')).toEqual(specB)
  })

  it('stores schema comparison details and clears them for matching fields', () => {
    const compare = getStoreState().compareContractSpec
    const expected = [{ keyPath: 'balance', type: 'i128' }]

    expect(
      compare('CONTRACT_A', expected, [{ keyPath: 'balance', type: 'symbol' }]),
    ).toEqual([
      { keyPath: 'balance', expectedType: 'i128', actualType: 'symbol' },
    ])
    expect(getStoreState().contractSpecMismatches.CONTRACT_A).toHaveLength(1)

    expect(compare('CONTRACT_A', expected, expected)).toEqual([])
    expect(getStoreState().contractSpecMismatches.CONTRACT_A).toEqual([])
  })

  it('returns undefined for unknown contract ID', () => {
    expect(getStoreState().getContractSpec('UNKNOWN')).toBeUndefined()
  })

  it.each([
    ['missing metadata', 'contractspecv0 section not found in module'],
    ['malformed metadata', 'Failed to decode custom section name'],
  ])('stores a safe %s error for the contract', (_label, message) => {
    getStoreState().setContractSpecError('  contract_a ', ` ${message} `)

    expect(getStoreState().getContractSpecError('CONTRACT_A')).toBe(message)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toBeUndefined()
  })

  it('bounds error text and clears it when a spec loads successfully', () => {
    getStoreState().setContractSpecError('CONTRACT_A', 'x'.repeat(700))
    expect(getStoreState().getContractSpecError('CONTRACT_A')).toHaveLength(500)

    const spec = makeSpec('empty')
    getStoreState().setContractSpec('CONTRACT_A', spec)

    expect(getStoreState().getContractSpecError('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual(spec)
  })

  it('clears spec data and errors for only the selected contract', () => {
    getStoreState().setContractSpecError('CONTRACT_A', 'missing metadata')
    getStoreState().setContractSpecError('CONTRACT_B', 'malformed metadata')

    getStoreState().clearContractSpec('CONTRACT_A')

    expect(getStoreState().getContractSpecError('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpecError('CONTRACT_B')).toBe(
      'malformed metadata',
    )
  })

  it('clears a single contract spec without affecting others', () => {
    const specA = makeSpec('A')
    const specB = makeSpec('B')
    getStoreState().setContractSpec('CONTRACT_A', specA)
    getStoreState().setContractSpec('CONTRACT_B', specB)
    getStoreState().setContractSpecMismatches('CONTRACT_A', [
      { keyPath: 'balance', expectedType: 'i128', actualType: 'symbol' },
    ])
    getStoreState().setContractSpecMismatches('CONTRACT_B', [
      { keyPath: 'owner', expectedType: 'address', actualType: 'bytes' },
    ])

    getStoreState().clearContractSpec('CONTRACT_A')

    expect(getStoreState().getContractSpec('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpec('CONTRACT_B')).toEqual(specB)
    expect(getStoreState().contractSpecMismatches.CONTRACT_A).toBeUndefined()
    expect(getStoreState().contractSpecMismatches.CONTRACT_B).toHaveLength(1)
  })

  it('normalizes equivalent contract IDs to the same cache entry', () => {
    const spec = makeSpec('A')
    getStoreState().setContractSpec('  c123   ', spec)

    expect(getStoreState().getContractSpec('C123')).toEqual(spec)
  })

  it('ignores blank contract IDs when storing specs', () => {
    getStoreState().setContractSpec('   ', makeSpec('A'))
    getStoreState().setContractSpec('\n\t', makeSpec('B'))

    expect(getStoreState().contractSpecs).toEqual({})
    expect(getStoreState().getContractSpec('   ')).toBeUndefined()
    expect(getStoreState().getContractSpec('\n\t')).toBeUndefined()
  })

  it('does not affect other store state when setting a spec', () => {
    const before = getStoreState()
    const ledgerDataBefore = before.ledgerData

    before.setContractSpec('CONTRACT_A', makeSpec('preserve-state'))

    expect(getStoreState().ledgerData).toBe(ledgerDataBefore)
  })
})
