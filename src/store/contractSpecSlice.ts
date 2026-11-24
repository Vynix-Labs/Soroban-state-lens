import { normalizeContractIdInput } from '../lib/validation/normalizeContractIdInput'
import { compareContractSchema } from '../lib/spec/compareContractSchema'
import type { ContractSpec } from '../types/contract-spec'
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
  contractSpecErrors: {},
  contractSpecMismatches: {},

  setContractSpec: (contractId: string, spec: ContractSpec) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId) {
      return
    }

    set((state) => ({
      contractSpecs: {
        ...state.contractSpecs,
        [normalizedContractId]: spec,
      },
      contractSpecMismatches: {
        ...state.contractSpecMismatches,
        [normalizedContractId]: [],
      },
      contractSpecErrors: Object.fromEntries(
        Object.entries(state.contractSpecErrors).filter(
          ([key]) => key !== normalizedContractId,
        ),
      ),
    }))
  },

  compareContractSpec: (contractId, expectedFields, actualFields) => {
    const mismatches = compareContractSchema(expectedFields, actualFields)
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (normalizedContractId) {
      set((state) => ({
        contractSpecMismatches: {
          ...state.contractSpecMismatches,
          [normalizedContractId]: mismatches,
        },
      }))
    }
    return mismatches
  },

  setContractSpecMismatches: (contractId, mismatches) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId) return

    set((state) => ({
      contractSpecMismatches: {
        ...state.contractSpecMismatches,
        [normalizedContractId]: mismatches,
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

  setContractSpecError: (contractId: string, error: string) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    const normalizedError = error.trim().slice(0, 500)
    if (!normalizedContractId || !normalizedError) return

    set((state) => ({
      contractSpecErrors: {
        ...state.contractSpecErrors,
        [normalizedContractId]: normalizedError,
      },
      contractSpecs: Object.fromEntries(
        Object.entries(state.contractSpecs).filter(
          ([key]) => key !== normalizedContractId,
        ),
      ),
      contractSpecMismatches: {
        ...state.contractSpecMismatches,
        [normalizedContractId]: [],
      },
    }))
  },

  getContractSpecError: (contractId: string) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId) return undefined
    return get().contractSpecErrors[normalizedContractId]
  },

  clearContractSpec: (contractId: string) =>
    set((state) => {
      const normalizedContractId = normalizeContractSpecKey(contractId)
      if (!normalizedContractId) {
        return state
      }

      const { [normalizedContractId]: _spec, ...contractSpecs } =
        state.contractSpecs
      const { [normalizedContractId]: _error, ...contractSpecErrors } =
        state.contractSpecErrors
      const { [normalizedContractId]: _mismatches, ...contractSpecMismatches } =
        state.contractSpecMismatches
      return { contractSpecs, contractSpecErrors, contractSpecMismatches }
    }),
})
