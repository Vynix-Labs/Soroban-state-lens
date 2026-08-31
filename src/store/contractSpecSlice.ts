import { normalizeContractIdInput } from '../lib/validation/normalizeContractIdInput'
import type { ContractSpecSlice, LensStore } from './types'

function normalizeContractSpecKey(contractId: string): string | null {
  const normalized = normalizeContractIdInput(contractId)
  return normalized.length > 0 ? normalized : null
}

export const createContractSpecSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): ContractSpecSlice => ({
  contractSpecs: {},

  setContractSpec: (contractId: string, spec: unknown) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId) {
      return
    }

    set((state) => ({
      contractSpecs: {
        ...state.contractSpecs,
        [normalizedContractId]: spec,
      },
    }))
  },

  getContractSpec: (contractId: string) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId) {
      return undefined
    }

    return get().contractSpecs[normalizedContractId]
  },

  clearContractSpec: (contractId: string) =>
    set((state) => {
      const normalizedContractId = normalizeContractSpecKey(contractId)
      if (!normalizedContractId) {
        return state
      }

      const { [normalizedContractId]: _, ...rest } = state.contractSpecs
      return { contractSpecs: rest }
    }),
})
