import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore } from '../../store/lensStore'

describe('contractSpecSlice', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with empty contractSpecs', () => {
    expect(getStoreState().contractSpecs).toEqual({})
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

  it('returns undefined for unknown contract ID', () => {
    expect(getStoreState().getContractSpec('UNKNOWN')).toBeUndefined()
  })

  it('clears a single contract spec without affecting others', () => {
    getStoreState().setContractSpec('CONTRACT_A', { name: 'A' })
    getStoreState().setContractSpec('CONTRACT_B', { name: 'B' })

    getStoreState().clearContractSpec('CONTRACT_A')

    expect(getStoreState().getContractSpec('CONTRACT_A')).toBeUndefined()
    expect(getStoreState().getContractSpec('CONTRACT_B')).toEqual({ name: 'B' })
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
})
