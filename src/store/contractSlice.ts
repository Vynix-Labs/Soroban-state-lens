import {
  DEMO_COUNTER_ENTRY_KEY,
  DEMO_COUNTER_NEXT_VALUE,
  createDemoLedgerEntries,
  readDemoCounterValue,
} from '../lib/demo/demoLedgerEntries'
import { isSampleContractId, withoutDemoRecords } from '../lib/demoContract'
import { ContractLoadStatus } from './types'
import type { LensStore } from './types'

export type ContractSlice = {
  activeContractId: string | null
  selectedKeyPath: string | null

  setActiveContractId: (id: string) => void
  clearActiveContractId: () => void
  setSelectedKeyPath: (keyPath: string) => void
  clearSelectedKeyPath: () => void
  /** Drop cached entries of the sample/demo contract (SSL#733). */
  clearDemoRecords: () => void
  /** Demo-only counter change (SSL-I050). */
  advanceDemoCounter: (contractId: string) => boolean
  /** Seed the local demo fixture for the sample contract (SSL-I050). */
  loadDemoContract: (contractId: string) => void
}

export const createContractSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): ContractSlice => ({
  activeContractId: null,
  selectedKeyPath: null,

  setActiveContractId: (id: string) =>
    set((state) => {
      // Opening a live contract ends demo mode: demo-only records must not
      // leak into live refreshes or network buckets. Unrelated contracts
      // and network state are left untouched.
      if (isSampleContractId(id)) {
        return {
          activeContractId: id,
          ...(id !== state.activeContractId ? { selectedKeyPath: null } : {}),
        }
      }
      const { data, purged } = withoutDemoRecords(state.ledgerData)
      return {
        activeContractId: id,
        ledgerData: purged > 0 ? data : state.ledgerData,
        ...(id !== state.activeContractId ? { selectedKeyPath: null } : {}),
      }
    }),

  clearDemoRecords: () =>
    set((state) => {
      const { data, purged } = withoutDemoRecords(state.ledgerData)
      return purged > 0 ? { ledgerData: data } : {}
    }),

  clearActiveContractId: () =>
    set(() => ({
      activeContractId: null,
      selectedKeyPath: null,
    })),

  setSelectedKeyPath: (keyPath: string) =>
    set(() => ({
      selectedKeyPath: keyPath,
    })),

  clearSelectedKeyPath: () =>
    set(() => ({
      selectedKeyPath: null,
    })),

  loadDemoContract: (contractId: string) => {
    // Demo mode only: live contract ids never receive fixture entries.
    if (!isSampleContractId(contractId)) {
      return
    }

    set((state) => {
      const demoEntries = createDemoLedgerEntries()
      const hasDemoEntries = demoEntries.some((entry) =>
        Object.prototype.hasOwnProperty.call(state.ledgerData, entry.key),
      )

      return {
        activeContractId: contractId,
        selectedKeyPath:
          state.activeContractId === contractId ? state.selectedKeyPath : null,
        ledgerData: hasDemoEntries
          ? state.ledgerData
          : {
              ...state.ledgerData,
              ...Object.fromEntries(
                demoEntries.map((entry) => [entry.key, entry]),
              ),
            },
        contractLoadStatus: ContractLoadStatus.SUCCESS,
        contractLoadError: null,
        contractLoadErrorCode: null,
        contractLoadAttemptCount: null,
      }
    })
  },

  advanceDemoCounter: (contractId: string) => {
    // Demo mode only: live contract ids can never reach the fixture.
    if (!isSampleContractId(contractId)) {
      return false
    }

    let advanced = false
    set((state) => {
      if (!isSampleContractId(state.activeContractId ?? '')) {
        return {}
      }
      if (
        !Object.prototype.hasOwnProperty.call(
          state.ledgerData,
          DEMO_COUNTER_ENTRY_KEY,
        )
      ) {
        return {}
      }

      const currentEntry = state.ledgerData[DEMO_COUNTER_ENTRY_KEY]
      if (readDemoCounterValue(currentEntry) === DEMO_COUNTER_NEXT_VALUE) {
        return {}
      }

      const nextEntry = createDemoLedgerEntries(DEMO_COUNTER_NEXT_VALUE).find(
        (entry) => entry.key === DEMO_COUNTER_ENTRY_KEY,
      )
      if (!nextEntry) {
        return {}
      }

      advanced = true
      // Only the counter entry is replaced; every other contract entry and
      // all network state stay untouched.
      return {
        ledgerData: {
          ...state.ledgerData,
          [DEMO_COUNTER_ENTRY_KEY]: nextEntry,
        },
      }
    })

    return advanced
  },
})
