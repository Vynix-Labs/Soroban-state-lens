import { beforeEach, describe, expect, it } from 'vitest'
import { clearActiveContractContext } from '@/routes/contracts/$contractId'
import { getStoreState, resetStore } from '@/store/lensStore'

const VALID_CONTRACT_ID =
  'CC42QZWUV2R7PUN2SZZW3Y3A43UUB5L2U3B4K3O5EUT7Y4I2O2W34EWM'

describe('contract layout cleanup (#292)', () => {
  beforeEach(() => {
    resetStore()
  })

  it('clears the active contract ID when leaving contract routes', () => {
    getStoreState().setActiveContractId(VALID_CONTRACT_ID)
    expect(getStoreState().activeContractId).toBe(VALID_CONTRACT_ID)

    clearActiveContractContext()

    expect(getStoreState().activeContractId).toBe(null)
  })

  it('clears the selected key path when leaving contract routes', () => {
    getStoreState().setSelectedKeyPath('entry[0].value')
    expect(getStoreState().selectedKeyPath).toBe('entry[0].value')

    clearActiveContractContext()

    expect(getStoreState().selectedKeyPath).toBe(null)
  })

  it('clears both active contract ID and selected key path together', () => {
    getStoreState().setActiveContractId(VALID_CONTRACT_ID)
    getStoreState().setSelectedKeyPath('entry[0].value')

    clearActiveContractContext()

    expect(getStoreState().activeContractId).toBe(null)
    expect(getStoreState().selectedKeyPath).toBe(null)
  })

  it('is a no-op when context is already empty', () => {
    clearActiveContractContext()

    expect(getStoreState().activeContractId).toBe(null)
    expect(getStoreState().selectedKeyPath).toBe(null)
  })

  it('leaves ledger data untouched (out of scope)', () => {
    getStoreState().setActiveContractId(VALID_CONTRACT_ID)
    const ledgerBefore = getStoreState().ledgerData

    clearActiveContractContext()

    expect(getStoreState().ledgerData).toBe(ledgerBefore)
  })
})