import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore } from '../../store/lensStore'

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
    const spec = { functions: ['transfer', 'balance'] }
    getStoreState().setContractSpec('CONTRACT_A', spec)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual(spec)
  })

  it('replaces existing spec for the same contract ID', () => {
    getStoreState().setContractSpec('CONTRACT_A', { v: 1 })
    getStoreState().setContractSpec('CONTRACT_A', { v: 2 })
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual({ v: 2 })
  })

  it('stores specs for multiple contract IDs independently', () => {
    getStoreState().setContractSpec('CONTRACT_A', { name: 'A' })
    getStoreState().setContractSpec('CONTRACT_B', { name: 'B' })

    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual({ name: 'A' })
    expect(getStoreState().getContractSpec('CONTRACT_B')).toEqual({ name: 'B' })
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

    getStoreState().setContractSpec('CONTRACT_A', { functions: [] })

    expect(getStoreState().getContractSpecError('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual({
      functions: [],
    })
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
    getStoreState().setContractSpec('CONTRACT_A', { name: 'A' })
    getStoreState().setContractSpec('CONTRACT_B', { name: 'B' })
    getStoreState().setContractSpecMismatches('CONTRACT_A', [
      { keyPath: 'balance', expectedType: 'i128', actualType: 'symbol' },
    ])
    getStoreState().setContractSpecMismatches('CONTRACT_B', [
      { keyPath: 'owner', expectedType: 'address', actualType: 'bytes' },
    ])

    getStoreState().clearContractSpec('CONTRACT_A')

    expect(getStoreState().getContractSpec('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpec('CONTRACT_B')).toEqual({ name: 'B' })
    expect(getStoreState().contractSpecMismatches.CONTRACT_A).toBeUndefined()
    expect(getStoreState().contractSpecMismatches.CONTRACT_B).toHaveLength(1)
  })

  it('normalizes equivalent contract IDs to the same cache entry', () => {
    getStoreState().setContractSpec('  c123   ', { name: 'A' })

    expect(getStoreState().getContractSpec('C123')).toEqual({ name: 'A' })
  })

  it('ignores blank contract IDs when storing specs', () => {
    getStoreState().setContractSpec('   ', { name: 'A' })
    getStoreState().setContractSpec('\n\t', { name: 'B' })

    expect(getStoreState().contractSpecs).toEqual({})
    expect(getStoreState().getContractSpec('   ')).toBeUndefined()
    expect(getStoreState().getContractSpec('\n\t')).toBeUndefined()
  })

  it('does not affect other store state when setting a spec', () => {
    const before = getStoreState()
    const ledgerDataBefore = before.ledgerData

    before.setContractSpec('CONTRACT_A', { spec: true })

    expect(getStoreState().ledgerData).toBe(ledgerDataBefore)
  })

  it('keeps another contract and the network intact when recording a spec error', () => {
    const state = getStoreState()
    const network = state.networkConfig
    const ledgerData = state.ledgerData
    state.setContractSpec('CONTRACT_A', { functions: ['a'] })
    state.setContractSpec('CONTRACT_B', { functions: ['b'] })

    getStoreState().setContractSpecError('CONTRACT_A', 'malformed spec')

    expect(getStoreState().getContractSpec('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpecError('CONTRACT_A')).toBe(
      'malformed spec',
    )
    expect(getStoreState().getContractSpec('CONTRACT_B')).toEqual({
      functions: ['b'],
    })
    expect(getStoreState().networkConfig).toBe(network)
    expect(getStoreState().ledgerData).toBe(ledgerData)
  })
})
