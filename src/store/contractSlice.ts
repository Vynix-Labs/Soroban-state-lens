import type { LensStore } from './types'

export type ContractSlice = {
  activeContractId: string | null

  setActiveContractId: (id: string) => void
  clearActiveContractId: () => void
}

export const createContractSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): ContractSlice => ({
  activeContractId: null,

  setActiveContractId: (id:string) =>
    set(() => ({
      activeContractId: id,
    })),

  clearActiveContractId: () =>
    set(() => ({
      activeContractId: null,
    })),
})