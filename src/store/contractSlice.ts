import type { LensStore } from './types'

export type ContractSlice = {
  activeContractId: string | null
  selectedKeyPath: string | null

  setActiveContractId: (id: string) => void
  clearActiveContractId: () => void
  setSelectedKeyPath: (keyPath: string) => void
  clearSelectedKeyPath: () => void
}

export const createContractSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): ContractSlice => ({
  activeContractId: null,
  selectedKeyPath: null,

  setActiveContractId: (id: string) =>
    set((state) => ({
      activeContractId: id,
      ...(id !== state.activeContractId ? { selectedKeyPath: null } : {}),
    })),

  clearActiveContractId: () =>
    set(() => ({
      activeContractId: null,
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
