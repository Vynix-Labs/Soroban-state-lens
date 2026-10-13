import { isSampleContractId, withoutDemoRecords } from '../lib/demoContract'
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
})
