import { getContractWasm } from '../lib/network/getContractWasm'
import { parseContractSpec } from '../lib/spec/parseContractSpec'
import { compareContractSchema } from '../lib/spec/compareContractSchema'
import { isContractId } from '../lib/validation/isContractId'
import { normalizeContractIdInput } from '../lib/validation/normalizeContractIdInput'
import { extractContractspecv0 } from '../lib/wasm/wasmExtractor'
import { ContractSpecLoadStatus } from './types'

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
  contractSpecLoadStatuses: {},

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
      contractSpecMismatches: {
        ...state.contractSpecMismatches,
        [normalizedContractId]: [],
      },
      contractSpecErrors: Object.fromEntries(
        Object.entries(state.contractSpecErrors).filter(
          ([key]) => key !== normalizedContractId,
        ),
      ),
      contractSpecLoadStatuses: {
        ...state.contractSpecLoadStatuses,
        [normalizedContractId]: ContractSpecLoadStatus.SUCCESS,
      },
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
      contractSpecLoadStatuses: {
        ...state.contractSpecLoadStatuses,
        [normalizedContractId]: ContractSpecLoadStatus.ERROR,
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
      const { [normalizedContractId]: _status, ...contractSpecLoadStatuses } =
        state.contractSpecLoadStatuses
      return {
        contractSpecs,
        contractSpecErrors,
        contractSpecMismatches,
        contractSpecLoadStatuses,
      }
    }),

  getContractSpecLoadStatus: (contractId: string) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId) return ContractSpecLoadStatus.IDLE
    return (
      get().contractSpecLoadStatuses[normalizedContractId] ??
      ContractSpecLoadStatus.IDLE
    )
  },

  loadContractSpec: async (contractId, options = {}) => {
    const normalizedContractId = normalizeContractSpecKey(contractId)
    if (!normalizedContractId || !isContractId(normalizedContractId)) {
      return { ok: false, reason: 'Invalid contract ID' }
    }

    const updateStatus = (status: ContractSpecLoadStatus) =>
      set((state) => ({
        contractSpecLoadStatuses: {
          ...state.contractSpecLoadStatuses,
          [normalizedContractId]: status,
        },
      }))

    const current = get()
    const alreadyLoaded =
      current.contractSpecs[normalizedContractId] !== undefined ||
      current.contractSpecErrors[normalizedContractId] !== undefined
    if (!options.force && alreadyLoaded) {
      return { ok: true, skipped: true }
    }
    if (
      current.contractSpecLoadStatuses[normalizedContractId] ===
      ContractSpecLoadStatus.LOADING
    ) {
      return {
        ok: false,
        reason: 'Spec load already in progress',
        skipped: true,
      }
    }

    updateStatus(ContractSpecLoadStatus.LOADING)

    try {
      const wasmResult = await getContractWasm({
        rpcUrl: get().networkConfig.rpcUrl,
        contractId: normalizedContractId,
        signal: options.signal,
      })

      if (options.signal?.aborted) {
        updateStatus(ContractSpecLoadStatus.IDLE)
        return { ok: false, reason: 'Spec load aborted', skipped: true }
      }

      if (!wasmResult.success) {
        get().setContractSpecError(normalizedContractId, wasmResult.error)
        return { ok: false, reason: wasmResult.error }
      }

      const extracted = extractContractspecv0(wasmResult.wasm)
      if (!extracted.ok) {
        get().setContractSpecError(normalizedContractId, extracted.reason)
        return { ok: false, reason: extracted.reason }
      }

      const parsed = parseContractSpec(extracted.payload)
      if (!parsed.ok) {
        get().setContractSpecError(normalizedContractId, parsed.reason)
        return { ok: false, reason: parsed.reason }
      }

      get().setContractSpec(normalizedContractId, parsed.spec)
      return { ok: true }
    } catch (error) {
      if (options.signal?.aborted) {
        updateStatus(ContractSpecLoadStatus.IDLE)
        return { ok: false, reason: 'Spec load aborted', skipped: true }
      }

      const reason =
        error instanceof Error ? error.message : 'Failed to load contract spec'
      get().setContractSpecError(normalizedContractId, reason)
      return { ok: false, reason }
    }
  },
})
