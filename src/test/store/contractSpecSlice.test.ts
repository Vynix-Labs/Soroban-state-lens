import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore } from '../../store/lensStore'
import { contractSpecKey } from '../../store/contractSpecSlice'
import { DEFAULT_NETWORKS } from '../../store/types'

const key = (id: string) => contractSpecKey(getStoreState().networkConfig, id)!

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
    expect(
      getStoreState().contractSpecMismatches[key('CONTRACT_A')],
    ).toHaveLength(1)

    expect(compare('CONTRACT_A', expected, expected)).toEqual([])
    expect(getStoreState().contractSpecMismatches[key('CONTRACT_A')]).toEqual(
      [],
    )
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
    expect(
      getStoreState().contractSpecMismatches[key('CONTRACT_A')],
    ).toBeUndefined()
    expect(
      getStoreState().contractSpecMismatches[key('CONTRACT_B')],
    ).toHaveLength(1)
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

  it('isolates specs and errors for the same contract across networks', () => {
    getStoreState().setNetworkConfig(DEFAULT_NETWORKS.testnet)
    getStoreState().setContractSpec('CONTRACT_A', { name: 'testnet' })
    getStoreState().setContractSpecError('CONTRACT_B', 'testnet error')
    getStoreState().setContractSpecMismatches('CONTRACT_A', [
      { keyPath: 'balance', expectedType: 'i128', actualType: 'symbol' },
    ])
    getStoreState().setNetworkConfig(DEFAULT_NETWORKS.mainnet)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpecError('CONTRACT_B')).toBeUndefined()
    expect(
      getStoreState().contractSpecMismatches[key('CONTRACT_A')],
    ).toBeUndefined()
    getStoreState().setContractSpec('CONTRACT_A', { name: 'mainnet' })
    getStoreState().setNetworkConfig(DEFAULT_NETWORKS.testnet)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual({
      name: 'testnet',
    })
    expect(getStoreState().getContractSpecError('CONTRACT_B')).toBe(
      'testnet error',
    )
    getStoreState().clearContractSpec('CONTRACT_A')
    getStoreState().setNetworkConfig(DEFAULT_NETWORKS.mainnet)
    expect(getStoreState().getContractSpec('CONTRACT_A')).toEqual({
      name: 'mainnet',
    })
  })

  it('does not affect other store state when setting a spec', () => {
    const before = getStoreState()
    const ledgerDataBefore = before.ledgerData

    before.setContractSpec('CONTRACT_A', { spec: true })

    expect(getStoreState().ledgerData).toBe(ledgerDataBefore)
  })
})
