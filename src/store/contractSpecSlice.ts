import type { ContractSpecSlice, LensStore } from './types'

export const createContractSpecSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): ContractSpecSlice => ({
  contractSpecs: {},

  setContractSpec: (contractId: string, spec: unknown) =>
    set((state) => ({
      contractSpecs: { ...state.contractSpecs, [contractId]: spec },
    })),

  getContractSpec: (contractId: string) => get().contractSpecs[contractId],

  clearContractSpec: (contractId: string) =>
    set((state) => {
      const { [contractId]: _, ...rest } = state.contractSpecs
      return { contractSpecs: rest }
    }),
})
