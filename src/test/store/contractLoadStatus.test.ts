import { beforeEach, describe, expect, it } from 'vitest'
import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'
import { ContractLoadStatus } from '../../store/types'

describe('contractLoadStatus', () => {
  beforeEach(() => {
    resetStore()
  })

  it('initializes with idle status and null error', () => {
    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.IDLE)
    expect(state.contractLoadError).toBeNull()
  })

  it('setContractLoadStatus updates status explicitly', () => {
    const { setContractLoadStatus } = useLensStore.getState()

    setContractLoadStatus(ContractLoadStatus.LOADING)
    expect(getStoreState().contractLoadStatus).toBe(ContractLoadStatus.LOADING)

    setContractLoadStatus(ContractLoadStatus.SUCCESS)
    expect(getStoreState().contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)

    setContractLoadStatus(ContractLoadStatus.EMPTY)
    expect(getStoreState().contractLoadStatus).toBe(ContractLoadStatus.EMPTY)

    setContractLoadStatus(ContractLoadStatus.ERROR)
    expect(getStoreState().contractLoadStatus).toBe(ContractLoadStatus.ERROR)
  })

  it('setContractLoadError and resetContractLoadState behave correctly', () => {
    const { setContractLoadStatus, setContractLoadError, resetContractLoadState } =
      useLensStore.getState()

    setContractLoadStatus(ContractLoadStatus.ERROR)
    setContractLoadError('boom')

    expect(getStoreState().contractLoadStatus).toBe(ContractLoadStatus.ERROR)
    expect(getStoreState().contractLoadError).toBe('boom')

    resetContractLoadState()

    expect(getStoreState().contractLoadStatus).toBe(ContractLoadStatus.IDLE)
    expect(getStoreState().contractLoadError).toBeNull()
  })

  it('status transitions do not mutate activeContractId or ledgerData', () => {
    const {
      setActiveContractId,
      upsertLedgerEntry,
      setContractLoadStatus,
      setContractLoadError,
    } = useLensStore.getState()

    setActiveContractId('CABC')
    upsertLedgerEntry({
      key: 'CABC:Other:key-1',
      contractId: 'CABC',
      type: 'Other',
      value: 'xdr',
      lastModifiedLedger: 1,
    })

    const activeBefore = getStoreState().activeContractId
    const dataBefore = getStoreState().ledgerData

    setContractLoadStatus(ContractLoadStatus.LOADING)
    setContractLoadError(null)
    setContractLoadStatus(ContractLoadStatus.SUCCESS)

    expect(getStoreState().activeContractId).toBe(activeBefore)
    expect(getStoreState().ledgerData).toEqual(dataBefore)
  })
})
