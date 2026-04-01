import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore } from '../../store/lensStore'



describe('Contract Slice', () => {
  beforeEach(() => {
    resetStore()
  })

  it('initial state should have null activeContractId', () => {
    const state = getStoreState()

    expect(state.activeContractId).toBe(null)
  })

  it('should set activeContractId', () => {
    const state = getStoreState()

    state.setActiveContractId('ABC123')

    expect(getStoreState().activeContractId).toBe('ABC123')
  })

  it('should clear activeContractId', () => {
    const state = getStoreState()

    state.setActiveContractId('ABC123')
    state.clearActiveContractId()

    expect(getStoreState().activeContractId).toBe(null)
  })
})