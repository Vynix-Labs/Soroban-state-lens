import { readWasmUpload } from '../lib/wasm/readWasmUpload'
import {
  NO_CONTRACT_SPEC_REASON,
  extractContractspecv0,
} from '../lib/wasm/wasmExtractor'
import { loadContractSpec as fetchAndParseContractSpec } from '../lib/spec/loadContractSpec'
import { parseContractSpec } from '../lib/spec/parseContractSpec'
import { compareContractSchema } from '../lib/spec/compareContractSchema'
import { SpecLoadGuard } from '../lib/spec/specLoadGuard'
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

function collectionStructInterpretationKey(
  network: NetworkConfig,
  contractId: string,
  collectionKeyPath: string,
): string | null {
  const specKey = contractSpecKey(network, contractId)
  if (!specKey || !collectionKeyPath.trim()) return null
  return `${specKey}\u0000${collectionKeyPath}`
}

function withoutSpecInterpretations(
  choices: Record<string, string>,
  scope: string,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(choices).filter(
      ([key]) => !key.startsWith(`${scope}\u0000`),
    ),
  )
}

export const createContractSpecSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): ContractSpecSlice => ({
  contractSpecs: {},
  contractSpecErrors: {},
  contractSpecMismatches: {},
  contractSpecLoadStatuses: {},
  collectionStructInterpretations: {},

  setContractSpec: (contractId: string, spec: ContractSpec) => {
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
    if (!normalizedContractId) {
      return
    }

    set((state) => ({
      collectionStructInterpretations: withoutSpecInterpretations(
        state.collectionStructInterpretations,
        normalizedContractId,
      ),
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

  compareContractSpec: (
    contractId,
    expectedFields,
    actualFields,
    scopeKeyPath,
  ) => {
    const mismatches = compareContractSchema(expectedFields, actualFields)
    const normalizedContractId = contractSpecKey(
      get().networkConfig,
      contractId,
    )
    if (normalizedContractId) {
      set((state) => ({
        contractSpecMismatches: {
          ...state.contractSpecMismatches,
          [normalizedContractId]:
            scopeKeyPath === undefined
              ? mismatches
              : [
                  ...(
                    state.contractSpecMismatches[normalizedContractId] ?? []
                  ).filter(
                    (mismatch) =>
                      mismatch.keyPath !== scopeKeyPath &&
                      !mismatch.keyPath.startsWith(`${scopeKeyPath}.`),
                  ),
                  ...mismatches,
                ],
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
      collectionStructInterpretations: withoutSpecInterpretations(
        state.collectionStructInterpretations,
        normalizedContractId,
      ),
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
        [normalizedContractId]:
          normalizedError === NO_CONTRACT_SPEC_REASON
            ? ContractSpecLoadStatus.NO_SPEC
            : ContractSpecLoadStatus.ERROR,
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
      const interpretationPrefix = `${normalizedContractId}\u0000`
      return {
        contractSpecs,
        contractSpecErrors,
        contractSpecMismatches,
        contractSpecLoadStatuses,
        collectionStructInterpretations: Object.fromEntries(
          Object.entries(state.collectionStructInterpretations).filter(
            ([key]) => !key.startsWith(interpretationPrefix),
          ),
        ),
      }
    }),

  getContractSpecLoadStatus: (contractId: string) => {
    const key = contractSpecKey(get().networkConfig, contractId)
    if (!key) return ContractSpecLoadStatus.IDLE
    return get().contractSpecLoadStatuses[key] ?? ContractSpecLoadStatus.IDLE
  },

  clearKeyInterpretation: (specScopeKey, keyPath) =>
    set((state) => {
      const key = `${specScopeKey}\u0000${keyPath}`
      const { [key]: _choice, ...collectionStructInterpretations } =
        state.collectionStructInterpretations
      return {
        collectionStructInterpretations,
        contractSpecMismatches: {
          ...state.contractSpecMismatches,
          [specScopeKey]: (
            state.contractSpecMismatches[specScopeKey] ?? []
          ).filter(
            (mismatch) =>
              mismatch.keyPath !== keyPath &&
              !mismatch.keyPath.startsWith(`${keyPath}.`),
          ),
        },
      }
    }),

  setCollectionStructInterpretation: (
    contractId,
    collectionKeyPath,
    structName,
  ) => {
    const key = collectionStructInterpretationKey(
      get().networkConfig,
      contractId,
      collectionKeyPath,
    )
    if (!key) return
    const normalizedName = structName.trim()
    set((state) => {
      if (!normalizedName) {
        const { [key]: _interpretation, ...collectionStructInterpretations } =
          state.collectionStructInterpretations
        return { collectionStructInterpretations }
      }
      return {
        collectionStructInterpretations: {
          ...state.collectionStructInterpretations,
          [key]: normalizedName,
        },
      }
    })
  },

  getCollectionStructInterpretation: (contractId, collectionKeyPath) => {
    const key = collectionStructInterpretationKey(
      get().networkConfig,
      contractId,
      collectionKeyPath,
    )
    if (!key) return undefined
    return get().collectionStructInterpretations[key]
  },

  loadContractSpecFromUpload: async (contractId, file) => {
    const normalized = normalizeContractIdInput(contractId)
    if (!isContractId(normalized))
      return { ok: false, reason: 'Invalid contract ID' }
    const key = contractSpecKey(get().networkConfig, normalized)!
    const previousStatus =
      get().contractSpecLoadStatuses[key] ?? ContractSpecLoadStatus.IDLE
    if (previousStatus === ContractSpecLoadStatus.LOADING)
      return {
        ok: false,
        skipped: true,
        reason: 'A spec load is already in progress',
      }
    set((state) => ({
      contractSpecLoadStatuses: {
        ...state.contractSpecLoadStatuses,
        [key]: ContractSpecLoadStatus.LOADING,
      },
    }))
    let committed = false
    try {
      const read = await readWasmUpload(file)
      if (contractSpecKey(get().networkConfig, normalized) !== key)
        return {
          ok: false,
          skipped: true,
          reason: 'Spec upload context changed',
        }
      const fail = (reason: string) => {
        get().setContractSpecError(normalized, reason)
        committed = true
        return { ok: false, reason }
      }
      if (!read.ok)
        return fail(
          read.reason === 'TOO_LARGE'
            ? 'Choose a WASM file no larger than 8 MiB.'
            : read.reason === 'INVALID_WASM'
              ? 'Choose a valid WASM version 1 file.'
              : 'The file could not be read. Choose it again.',
        )
      const extracted = extractContractspecv0(read.bytes)
      if (!extracted.ok) return fail(extracted.reason)
      const parsed = parseContractSpec(extracted.payload)
      if (!parsed.ok) return fail(parsed.reason)
      get().setContractSpec(normalized, parsed.spec)
      committed = true
      return { ok: true }
    } finally {
      if (!committed)
        set((state) => ({
          contractSpecLoadStatuses: {
            ...state.contractSpecLoadStatuses,
            [key]: previousStatus,
          },
        }))
    }
  },

  loadContractSpec: async (contractId, options = {}) => {
    const normalizedContractId = normalizeContractIdInput(contractId)
    if (!isContractId(normalizedContractId)) {
      return { ok: false, reason: 'Invalid contract ID' }
    }
    if (options.signal?.aborted) {
      return { ok: false, reason: 'Spec load aborted', skipped: true }
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

    const scope = {
      networkId: network.networkId,
      networkPassphrase: network.networkPassphrase,
      rpcUrl: network.rpcUrl,
      contractId: normalizedContractId,
    }
    const guard = new SpecLoadGuard()
    const attempt = guard.start(scope)
    const cancelAttempt = () => guard.cancel()
    options.signal?.addEventListener('abort', cancelAttempt, { once: true })
    const currentScope = () => {
      const activeNetwork = get().networkConfig
      return {
        networkId: activeNetwork.networkId,
        networkPassphrase: activeNetwork.networkPassphrase,
        rpcUrl: activeNetwork.rpcUrl,
        contractId: normalizedContractId,
      }
    }
    const commitIfCurrent = (commit: () => void) =>
      attempt.commitIfCurrent(currentScope(), commit)
    const abortedResult = () => {
      guard.cancel()
      return { ok: false, reason: 'Spec load aborted', skipped: true }
    }
    let committed = false

    updateStatus(ContractSpecLoadStatus.LOADING)

    try {
      const result = await fetchAndParseContractSpec(
        {
          rpcUrl: network.rpcUrl,
          contractId: normalizedContractId,
          signal: attempt.signal,
        },
        (payload) => {
          const parsed = parseContractSpec(payload)
          return parsed.ok
            ? { ok: true, value: parsed.spec }
            : { ok: false, reason: parsed.reason }
        },
      )

      if (!result.ok) {
        if (
          !commitIfCurrent(() =>
            get().setContractSpecError(normalizedContractId, result.reason),
          )
        ) {
          return abortedResult()
        }
        committed = true
        return { ok: false, reason: result.reason }
      }

      if (
        !commitIfCurrent(() =>
          get().setContractSpec(normalizedContractId, result.spec),
        )
      ) {
        return abortedResult()
      }
      committed = true
      return { ok: true }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Failed to load contract spec'
      if (
        !commitIfCurrent(() =>
          get().setContractSpecError(normalizedContractId, reason),
        )
      ) {
        return abortedResult()
      }
      committed = true
      return { ok: false, reason }
    } finally {
      options.signal?.removeEventListener('abort', cancelAttempt)
      if (!committed) updateStatus(ContractSpecLoadStatus.IDLE)
    }
  },
})
