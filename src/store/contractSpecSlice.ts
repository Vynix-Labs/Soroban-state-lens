import { loadContractSpec as fetchAndParseContractSpec } from '../lib/spec/loadContractSpec'
import { parseContractSpec } from '../lib/spec/parseContractSpec'
import { compareContractSchema } from '../lib/spec/compareContractSchema'
import { isContractId } from '../lib/validation/isContractId'
import { normalizeContractIdInput } from '../lib/validation/normalizeContractIdInput'
import { ContractSpecLoadStatus } from './types'

import type { ContractSpec } from '../types/contract-spec'
import type { ContractSpecSlice, LensStore, NetworkConfig } from './types'

export function contractSpecKey(
  network: NetworkConfig,
  contractId: string,
): string | null {
  const normalized = normalizeContractIdInput(contractId)
  return normalized.length > 0
    ? JSON.stringify([
        network.networkId.trim().toLowerCase(),
        network.networkPassphrase.trim(),
        network.rpcUrl.trim(),
        normalized,
      ])
    : null
}

export const createContractSpecSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): ContractSpecSlice => ({
  contractSpecs: {},
  contractSpecErrors: {},
  contractSpecMismatches: {},
  contractSpecLoadStatuses: {},

  setContractSpec: (contractId: string, spec: ContractSpec) => {
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
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
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
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
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
    if (!normalizedContractId) return

    set((state) => ({
      contractSpecMismatches: {
        ...state.contractSpecMismatches,
        [normalizedContractId]: mismatches,
      },
    }))
  },

  getContractSpec: (contractId: string) => {
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
    if (!normalizedContractId) {
      return undefined
    }

    return get().contractSpecs[normalizedContractId]
  },

  setContractSpecError: (contractId: string, error: string) => {
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
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
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
    if (!normalizedContractId) return undefined
    return get().contractSpecErrors[normalizedContractId]
  },

  clearContractSpec: (contractId: string) =>
    set((state) => {
      const normalizedContractId = contractSpecKey(
        state.networkConfig,
        contractId,
      )
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
    const key = contractSpecKey(get().networkConfig, contractId)
    if (!key) return ContractSpecLoadStatus.IDLE
    return get().contractSpecLoadStatuses[key] ?? ContractSpecLoadStatus.IDLE
  },

  loadContractSpec: async (contractId, options = {}) => {
    const normalizedContractId = normalizeContractIdInput(contractId)
    if (!isContractId(normalizedContractId)) {
      return { ok: false, reason: 'Invalid contract ID' }
    }
    const network = get().networkConfig
    const key = contractSpecKey(network, normalizedContractId)
    if (!key) return { ok: false, reason: 'Invalid contract ID' }

    const updateStatus = (status: ContractSpecLoadStatus) =>
      set((state) => ({
        contractSpecLoadStatuses: {
          ...state.contractSpecLoadStatuses,
          [key]: status,
        },
      }))
    const isCurrentScope = () =>
      !options.signal?.aborted &&
      contractSpecKey(get().networkConfig, normalizedContractId) === key

    const current = get()
    const alreadyLoaded =
      Object.prototype.hasOwnProperty.call(current.contractSpecs, key) ||
      Object.prototype.hasOwnProperty.call(current.contractSpecErrors, key)
    if (!options.force && alreadyLoaded) {
      return { ok: true, skipped: true }
    }
    if (
      current.contractSpecLoadStatuses[key] === ContractSpecLoadStatus.LOADING
    ) {
      return {
        ok: false,
        reason: 'Spec load already in progress',
        skipped: true,
      }
    }

    updateStatus(ContractSpecLoadStatus.LOADING)

    try {
      const result = await fetchAndParseContractSpec(
        {
          rpcUrl: network.rpcUrl,
          contractId: normalizedContractId,
          signal: options.signal,
        },
        (payload) => {
          const parsed = parseContractSpec(payload)
          return parsed.ok
            ? { ok: true, value: parsed.spec }
            : { ok: false, reason: parsed.reason }
        },
      )

      if (!isCurrentScope()) {
        updateStatus(ContractSpecLoadStatus.IDLE)
        return { ok: false, reason: 'Spec load aborted', skipped: true }
      }

      if (!result.ok) {
        get().setContractSpecError(normalizedContractId, result.reason)
        return { ok: false, reason: result.reason }
      }

      get().setContractSpec(normalizedContractId, result.spec)
      return { ok: true }
    } catch (error) {
      if (!isCurrentScope()) {
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
