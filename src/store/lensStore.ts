import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import { deepClone } from '../lib/deepClone'
import { getLedgerEntries } from '../lib/network/getLedgerEntries'
import { mapLedgerEntriesToStoreEntries } from '../lib/network/mapLedgerEntriesToStoreEntries'
import { normalizeContractIdInput } from '../lib/validation/normalizeContractIdInput'
import {
  isDecoderWorkerError,
  limitDecoderErrorDetail,
} from '../types/decoder-worker'
import {
  createDecoderWorkerSafe,
  terminateDecoderWorkerSafe,
} from '../workers/createDecoderWorkerSafe'
import { normalizeNetworkScopeId } from './networkScope'
import { createContractSlice } from './contractSlice'
import { createContractSpecSlice } from './contractSpecSlice'
import {
  DEFAULT_NETWORK_CONFIG,
  NETWORK_CONFIG_STORAGE_KEY,
  createSafeStorage,
  mergeNetworkConfig,
  mergePreferences,
  sanitizeNetworkSnapshots,
  serializeNetworkConfigForStorage,
} from './persistence'
import { createPreferencesSlice } from './preferencesSlice'
import {
  ConnectionStatus,
  ContractLoadStatus,
  DEFAULT_NETWORKS,
  DEFAULT_PREFERENCES,
  DEFAULT_SNAPSHOT_RETENTION_LIMIT,
} from './types'

import type * as Comlink from 'comlink'
import type { DecoderWorkerApi } from '../types/decoder-worker'
import type { PersistedState } from './persistence'
import type {
  ContractLoadSlice,
  ExpandedNodesSlice,
  LedgerDataSlice,
  LedgerEntry,
  LedgerKey,
  LensStore,
  NetworkConfig,
  NetworkConfigSlice,
  SnapshotSlice,
  WatchlistItem,
  WatchlistSlice,
} from './types'

export type { LedgerEntry, LedgerKey } from './types'

// Re-export for backwards compatibility
export { DEFAULT_NETWORKS }

function getDecoderFailureReason(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  return 'Decoder worker failed'
}

/**
 * Network config slice creator
 */
const createNetworkConfigSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): NetworkConfigSlice => ({
  networkConfig: DEFAULT_NETWORK_CONFIG,
  connectionStatus: ConnectionStatus.IDLE,
  lastCustomUrl: undefined,
  latestLedgerSequence: null,

  setNetworkConfig: (config: Partial<NetworkConfig>) =>
    set((state) => {
      const networkConfig = { ...state.networkConfig, ...config }
      const changed = Object.keys(config).some(
        (key) =>
          networkConfig[key as keyof NetworkConfig] !==
          state.networkConfig[key as keyof NetworkConfig],
      )

      return {
        networkConfig,
        ...(changed
          ? {
              connectionStatus: ConnectionStatus.IDLE,
              latestLedgerSequence: null,
            }
          : {}),
      }
    }),

  resetNetworkConfig: () =>
    set(() => ({
      networkConfig: DEFAULT_NETWORK_CONFIG,
      connectionStatus: ConnectionStatus.IDLE,
      lastCustomUrl: undefined,
      latestLedgerSequence: null,
    })),

  setConnectionStatus: (status: ConnectionStatus) =>
    set(() => ({
      connectionStatus: status,
    })),

  resetConnectionStatus: () =>
    set(() => ({
      connectionStatus: ConnectionStatus.IDLE,
    })),

  setLastCustomUrl: (url: string) =>
    set(() => ({
      lastCustomUrl: url,
    })),

  setLatestLedgerSequence: (sequence: number | null) =>
    set(() => ({
      latestLedgerSequence: sequence,
    })),
})

/**
 * Ledger data slice creator
 */
const createLedgerDataSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): LedgerDataSlice => ({
  ledgerData: {},
  currentLedgerSequence: 0,

  setCurrentLedgerSequence: (sequence: number) =>
    set(() => ({
      currentLedgerSequence: sequence,
    })),

  upsertLedgerEntry: (entry: LedgerEntry) =>
    set((state) => ({
      ledgerData: {
        ...state.ledgerData,
        [entry.key]: entry,
      },
    })),

  upsertLedgerEntries: (entries: Array<LedgerEntry>) =>
    set((state) => {
      const newData = { ...state.ledgerData }
      for (const entry of entries) {
        newData[entry.key] = entry
      }
      return { ledgerData: newData }
    }),

  removeLedgerEntry: (key: LedgerKey) =>
    set((state) => {
      const newData = { ...state.ledgerData }
      delete newData[key]
      return { ledgerData: newData }
    }),

  clearLedgerData: () =>
    set(() => ({
      ledgerData: {},
    })),

  batchLedgerUpdate: (
    entries: Array<LedgerEntry>,
    removals: Array<LedgerKey>,
  ) =>
    set((state) => {
      const newData = { ...state.ledgerData }
      for (const entry of entries) {
        newData[entry.key] = entry
      }
      for (const key of removals) {
        delete newData[key]
      }
      return { ledgerData: newData }
    }),
})

/**
 * Expanded nodes slice creator
 */
const createExpandedNodesSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): ExpandedNodesSlice => ({
  expandedNodes: [],
  expandedNodesByContract: {},

  setExpanded: (nodeId: string, expanded: boolean) =>
    set((state) => {
      const normalizedNodeId = nodeId.trim()
      if (!normalizedNodeId) {
        return state
      }

      if (expanded) {
        if (state.expandedNodes.includes(normalizedNodeId)) {
          return state
        }
        return { expandedNodes: [...state.expandedNodes, normalizedNodeId] }
      } else {
        return {
          expandedNodes: state.expandedNodes.filter(
            (id) => id !== normalizedNodeId,
          ),
        }
      }
    }),

  toggleExpanded: (nodeId: string) =>
    set((state) => {
      const normalizedNodeId = nodeId.trim()
      if (!normalizedNodeId) {
        return state
      }

      if (state.expandedNodes.includes(normalizedNodeId)) {
        return {
          expandedNodes: state.expandedNodes.filter(
            (id) => id !== normalizedNodeId,
          ),
        }
      }
      return { expandedNodes: [...state.expandedNodes, normalizedNodeId] }
    }),

  expandAll: (nodeIds: Array<string>) =>
    set((state) => {
      const normalizedNodeIds = nodeIds
        .map((nodeId) => nodeId.trim())
        .filter((nodeId) => nodeId.length > 0)

      const newExpanded = new Set([
        ...state.expandedNodes,
        ...normalizedNodeIds,
      ])
      return { expandedNodes: Array.from(newExpanded) }
    }),

  collapseAll: () =>
    set(() => ({
      expandedNodes: [],
    })),

  setExpandedForContract: (contractId, nodeId, expanded) => {
    const normalizedContractId = normalizeContractIdInput(contractId)
    const normalizedNodeId = nodeId.trim()
    if (!normalizedContractId || !normalizedNodeId) return

    set((state) => {
      const current = state.expandedNodesByContract[normalizedContractId] ?? []
      const includesNode = current.includes(normalizedNodeId)
      if (includesNode === expanded) return state
      return {
        expandedNodesByContract: {
          ...state.expandedNodesByContract,
          [normalizedContractId]: expanded
            ? [...current, normalizedNodeId]
            : current.filter((id) => id !== normalizedNodeId),
        },
      }
    })
  },

  toggleExpandedForContract: (contractId, nodeId) => {
    const normalizedContractId = normalizeContractIdInput(contractId)
    const normalizedNodeId = nodeId.trim()
    if (!normalizedContractId || !normalizedNodeId) return

    set((state) => {
      const current = state.expandedNodesByContract[normalizedContractId] ?? []
      return {
        expandedNodesByContract: {
          ...state.expandedNodesByContract,
          [normalizedContractId]: current.includes(normalizedNodeId)
            ? current.filter((id) => id !== normalizedNodeId)
            : [...current, normalizedNodeId],
        },
      }
    })
  },

  expandAllForContract: (contractId, nodeIds) => {
    const normalizedContractId = normalizeContractIdInput(contractId)
    if (!normalizedContractId) return
    const normalizedNodeIds = nodeIds
      .map((nodeId) => nodeId.trim())
      .filter((nodeId) => nodeId.length > 0)

    set((state) => {
      const current = state.expandedNodesByContract[normalizedContractId] ?? []
      const expanded = Array.from(new Set([...current, ...normalizedNodeIds]))
      if (expanded.length === current.length) return state
      return {
        expandedNodesByContract: {
          ...state.expandedNodesByContract,
          [normalizedContractId]: expanded,
        },
      }
    })
  },

  collapseAllForContract: (contractId) => {
    const normalizedContractId = normalizeContractIdInput(contractId)
    if (!normalizedContractId) return
    set((state) => {
      if (!state.expandedNodesByContract[normalizedContractId].length) {
        return state
      }
      const { [normalizedContractId]: _, ...rest } =
        state.expandedNodesByContract
      return { expandedNodesByContract: rest }
    })
  },
})

export { DEFAULT_SNAPSHOT_RETENTION_LIMIT } from './types'

/**
 * Snapshot slice creator
 */
const createSnapshotSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): SnapshotSlice => ({
  snapshots: {},

  addSnapshot: (
    contractId: string,
    entries: Record<string, LedgerEntry>,
    ledgerSequence: number,
    label?: string,
    maxSnapshots: number = DEFAULT_SNAPSHOT_RETENTION_LIMIT,
  ) =>
    set((state) => {
      const normalizedContractId = contractId.trim()
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)

      // Reject empty contract IDs
      if (!normalizedContractId) {
        return state
      }

      // Deep clone entries to ensure immutability
      const clonedEntries: Record<string, LedgerEntry> = {}
      for (const [key, entry] of Object.entries(entries)) {
        clonedEntries[key] = {
          ...entry,
          value: deepClone(entry.value),
        }
      }

      const normalizedLabel =
        typeof label === 'string' ? label.trim() || undefined : label
      const existing = state.snapshots[networkId]?.[normalizedContractId] ?? []
      const timestamp = Date.now()
      const nextSnapshot = {
        id: `${timestamp}-${crypto.randomUUID()}`,
        contractId: normalizedContractId,
        timestamp,
        ledgerSequence,
        ledgerData: clonedEntries,
        label: normalizedLabel,
      }

      const retentionLimit = Math.min(
        maxSnapshots,
        DEFAULT_SNAPSHOT_RETENTION_LIMIT,
      )
      const trimmedSnapshots =
        retentionLimit > 0
          ? [...existing, nextSnapshot].slice(-retentionLimit)
          : []

      return {
        snapshots: {
          ...state.snapshots,
          [networkId]: {
            ...state.snapshots[networkId],
            [normalizedContractId]: trimmedSnapshots,
          },
        },
      }
    }),

  getSnapshots: (contractId: string) => {
    const state = get()
    const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)
    return state.snapshots[networkId]?.[contractId] ?? []
  },

  removeSnapshot: (contractId: string, snapshotId: string) =>
    set((state) => {
      const normalizedContractId = contractId.trim()
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)

      // Reject empty contract IDs
      if (!normalizedContractId) {
        return state
      }

      return {
        snapshots: {
          ...state.snapshots,
          [networkId]: {
            ...state.snapshots[networkId],
            [normalizedContractId]: (
              state.snapshots[networkId]?.[normalizedContractId] ?? []
            ).filter((s) => s.id !== snapshotId),
          },
        },
      }
    }),

  clearSnapshots: (contractId: string) =>
    set((state) => {
      const normalizedContractId = contractId.trim()
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)

      // Reject empty contract IDs
      if (!normalizedContractId) {
        return state
      }

      const currentNetworkSnapshots = state.snapshots[networkId] ?? {}
      const { [normalizedContractId]: _, ...remainingContractSnapshots } =
        currentNetworkSnapshots
      const { [networkId]: __, ...otherNetworkSnapshots } = state.snapshots
      return {
        snapshots:
          Object.keys(remainingContractSnapshots).length > 0
            ? {
                ...otherNetworkSnapshots,
                [networkId]: remainingContractSnapshots,
              }
            : otherNetworkSnapshots,
      }
    }),
})

/**
 * Contract-load slice creator
 * Manages load lifecycle and guards against stale in-flight requests.
 */
const createContractLoadSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): ContractLoadSlice => {
  let requestId = 0
  let activeController: AbortController | null = null
  let activeDecodeBatch: Promise<void> | null = null

  const getAttemptCount = (error: unknown): number | null => {
    if (typeof error !== 'object' || error === null || !('attempts' in error)) {
      return null
    }

    const attempts = (error as { attempts?: unknown }).attempts
    return typeof attempts === 'number' &&
      Number.isInteger(attempts) &&
      attempts > 0
      ? attempts
      : null
  }

  return {
    contractLoadStatus: ContractLoadStatus.IDLE,
    contractLoadError: null,
    contractLoadErrorCode: null,
    contractLoadAttemptCount: null,

    setContractLoadStatus: (status: ContractLoadStatus) =>
      set(() => ({ contractLoadStatus: status })),

    setContractLoadError: (message: string | null, code = null) =>
      set(() => ({
        contractLoadError:
          message === null ? null : limitDecoderErrorDetail(message),
        contractLoadErrorCode: message === null ? null : code,
        contractLoadAttemptCount: null,
      })),

    resetContractLoadState: () =>
      set(() => ({
        contractLoadStatus: ContractLoadStatus.IDLE,
        contractLoadError: null,
        contractLoadErrorCode: null,
        contractLoadAttemptCount: null,
      })),

    loadContract: async (contractId: string, keys: Array<string>) => {
      requestId += 1
      const currentRequestId = requestId

      if (activeController) {
        activeController.abort()
      }

      const controller = new AbortController()
      activeController = controller
      const { signal } = controller
      const isRequestStale = () =>
        currentRequestId !== requestId || signal.aborted
      set(() => ({
        activeContractId: contractId,
        contractLoadStatus: ContractLoadStatus.LOADING,
        contractLoadError: null,
        contractLoadErrorCode: null,
        contractLoadAttemptCount: null,
      }))

      try {
        const { entries, latestLedger } = await getLedgerEntries({
          rpcUrl: get().networkConfig.rpcUrl,
          keys,
          signal,
        })

        if (isRequestStale()) {
          return
        }

        while (activeDecodeBatch !== null) {
          await activeDecodeBatch.catch(() => undefined)
          if (isRequestStale()) {
            return
          }
        }

        const decodedValuesByKey: Record<string, unknown> = {}
        const decodeErrorReasonsByKey: Record<string, string> = {}
        let workerUnavailableReason: string | null = null

        const decodeBatch = async () => {
          let activeDecoderWorker: Comlink.Remote<DecoderWorkerApi> | null =
            null
          try {
            for (const entry of entries) {
              if (isRequestStale()) {
                return
              }

              if (
                activeDecoderWorker === null &&
                workerUnavailableReason === null
              ) {
                try {
                  activeDecoderWorker = await createDecoderWorkerSafe()
                } catch (error) {
                  workerUnavailableReason = getDecoderFailureReason(error)
                }
              }

              if (isRequestStale()) {
                return
              }

              if (activeDecoderWorker === null) {
                decodedValuesByKey[entry.key] = {
                  kind: 'raw-xdr',
                  xdr: entry.xdr,
                }
                decodeErrorReasonsByKey[entry.key] =
                  workerUnavailableReason ?? 'Decoder worker failed'
                continue
              }

              try {
                const result = await activeDecoderWorker.decodeScVal({
                  xdr: entry.xdr,
                })
                if (isRequestStale()) {
                  return
                }

                if (isDecoderWorkerError(result)) {
                  decodedValuesByKey[entry.key] = {
                    kind: 'raw-xdr',
                    xdr: entry.xdr,
                  }
                  decodeErrorReasonsByKey[entry.key] =
                    result.message.trim() || 'Decoder worker failed'
                } else {
                  decodedValuesByKey[entry.key] = result
                }
              } catch (error) {
                decodedValuesByKey[entry.key] = {
                  kind: 'raw-xdr',
                  xdr: entry.xdr,
                }
                decodeErrorReasonsByKey[entry.key] =
                  getDecoderFailureReason(error)
                terminateDecoderWorkerSafe(activeDecoderWorker)
                activeDecoderWorker = null
              }
            }
          } finally {
            if (activeDecoderWorker !== null) {
              terminateDecoderWorkerSafe(activeDecoderWorker)
            }
          }
        }

        const currentDecodeBatch = decodeBatch()
        activeDecodeBatch = currentDecodeBatch
        try {
          await currentDecodeBatch
        } finally {
          if (activeDecodeBatch === currentDecodeBatch) {
            activeDecodeBatch = null
          }
        }

        if (isRequestStale()) {
          return
        }

        const mappedEntries = mapLedgerEntriesToStoreEntries({
          contractId,
          entries,
          latestLedger,
          decodedValuesByKey,
          decodeErrorReasonsByKey,
        })

        set((state) => ({
          ledgerData: {
            ...Object.fromEntries(
              Object.entries(state.ledgerData).filter(
                ([, entry]) => entry.contractId !== contractId,
              ),
            ),
            ...Object.fromEntries(
              mappedEntries.map((entry) => [entry.key, entry]),
            ),
          },
          currentLedgerSequence: latestLedger,
          contractLoadStatus:
            mappedEntries.length === 0
              ? ContractLoadStatus.EMPTY
              : ContractLoadStatus.SUCCESS,
          contractLoadError: null,
          contractLoadErrorCode: null,
          contractLoadAttemptCount: null,
        }))
      } catch (error) {
        if (isRequestStale()) {
          return
        }

        set(() => ({
          contractLoadStatus: ContractLoadStatus.ERROR,
          contractLoadError: limitDecoderErrorDetail(
            error instanceof Error ? error.message : 'Failed to load contract',
          ),
          contractLoadErrorCode:
            error instanceof Error &&
            'code' in error &&
            (typeof error.code === 'string' || typeof error.code === 'number')
              ? error.code
              : null,
          contractLoadAttemptCount: getAttemptCount(error),
        }))
      } finally {
        if (activeController === controller) {
          activeController = null
        }
      }
    },

    refreshActiveKeys: async () => {
      const state = get()
      const contractId = state.activeContractId

      if (!contractId) {
        return
      }

      if (activeController !== null) {
        return // Avoid duplicate in-flight work
      }

      // Collect raw RPC keys from the currently cached ledger entries for the active contract
      const rpcKeys = Object.values(state.ledgerData)
        .filter((entry) => entry.contractId === contractId)
        .map((entry) => {
          // Store keys are formatted as contractId::entryType::rpcKey
          const parts = entry.key.split('::')
          return parts[2]
        })
        .filter((key): key is string => Boolean(key))

      if (rpcKeys.length === 0) {
        return
      }

      await state.loadContract(contractId, rpcKeys)
    },
  }
}

/**
 * Watchlist slice creator
 * Manages pinned keys for quick access across routes
 */
const deduplicateWatchlistItems = (
  items: Array<WatchlistItem> | undefined,
): Array<WatchlistItem> => {
  const seen = new Set<string>()
  return [...(items ?? [])]
    .sort(
      (left, right) =>
        right.timestamp - left.timestamp ||
        left.keyPath.localeCompare(right.keyPath),
    )
    .filter((item) => {
      if (typeof item.keyPath !== 'string' || item.keyPath.length === 0) {
        return false
      }
      if (seen.has(item.keyPath)) {
        return false
      }
      seen.add(item.keyPath)
      return true
    })
}

const createWatchlistSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): WatchlistSlice => ({
  watchlist: {},

  addToWatchlist: (contractId: string, keyPath: string) => {
    let added = false
    set((state) => {
      const normalizedContractId = contractId.trim()
      const normalizedKeyPath = keyPath.trim()
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)

      if (!normalizedContractId || !normalizedKeyPath) {
        return state
      }

      const currentItems = deduplicateWatchlistItems(
        state.watchlist[networkId]?.[normalizedContractId],
      )

      // Check if item already exists (duplicate protection)
      const isDuplicate = currentItems.some(
        (item) => item.keyPath === normalizedKeyPath,
      )
      if (isDuplicate) {
        return state
      }

      added = true

      return {
        watchlist: {
          ...state.watchlist,
          [networkId]: {
            ...state.watchlist[networkId],
            [normalizedContractId]: [
              ...currentItems,
              {
                contractId: normalizedContractId,
                keyPath: normalizedKeyPath,
                timestamp: Date.now(),
              },
            ],
          },
        },
      }
    })
    return added
  },

  removeFromWatchlist: (contractId: string, keyPath: string) =>
    set((state) => {
      const normalizedContractId = contractId.trim()
      const normalizedKeyPath = keyPath.trim()
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)
      const remainingItems = deduplicateWatchlistItems(
        (state.watchlist[networkId]?.[normalizedContractId] ?? []).filter(
          (item) => item.keyPath !== normalizedKeyPath,
        ),
      )

      if (remainingItems.length === 0) {
        const currentNetworkWatchlist = state.watchlist[networkId] ?? {}
        const { [normalizedContractId]: _, ...remainingContracts } =
          currentNetworkWatchlist
        const { [networkId]: __, ...otherNetworkWatchlists } = state.watchlist
        return {
          watchlist:
            Object.keys(remainingContracts).length > 0
              ? {
                  ...otherNetworkWatchlists,
                  [networkId]: remainingContracts,
                }
              : otherNetworkWatchlists,
        }
      }

      return {
        watchlist: {
          ...state.watchlist,
          [networkId]: {
            ...state.watchlist[networkId],
            [normalizedContractId]: remainingItems,
          },
        },
      }
    }),

  getWatchlistForContract: (contractId: string) => {
    const state = get()
    const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)
    return deduplicateWatchlistItems(
      state.watchlist[networkId]?.[contractId],
    ).filter((item) => item.contractId === contractId)
  },

  clearWatchlist: (contractId: string) =>
    set((state) => {
      const normalizedContractId = contractId.trim()
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)
      const currentNetworkWatchlist = state.watchlist[networkId] ?? {}
      const { [normalizedContractId]: _, ...remainingContracts } =
        currentNetworkWatchlist
      const { [networkId]: __, ...otherNetworkWatchlists } = state.watchlist
      return {
        watchlist:
          Object.keys(remainingContracts).length > 0
            ? {
                ...otherNetworkWatchlists,
                [networkId]: remainingContracts,
              }
            : otherNetworkWatchlists,
      }
    }),
})

/**
 * Combined Lens Store with persistence for networkConfig, preferences, watchlist, and snapshots
 *
 * Centralized state management for Soroban State Lens.
 * Includes slices for:
 * - networkConfig: Current network configuration (PERSISTED)
 * - preferences: Display preferences (PERSISTED)
 * - ledgerData: Cached ledger entries (NOT persisted)
 * - expandedNodes: Tree view expansion state (NOT persisted)
 * - contractLoadStatus: Contract fetch lifecycle (NOT persisted)
 * - watchlist: Pinned keys for quick access (PERSISTED)
 * - snapshots: Bounded contract history (PERSISTED)
 */
export const useLensStore = create<LensStore>()(
  persist<LensStore, [], [], PersistedState>(
    (set, get) => ({
      ...createNetworkConfigSlice(set),
      ...createLedgerDataSlice(set),
      ...createExpandedNodesSlice(set),
      ...createSnapshotSlice(set, get),
      ...createWatchlistSlice(set, get),
      ...createContractSlice(set),
      ...createContractSpecSlice(set, get),
      ...createContractLoadSlice(set, get),
      ...createPreferencesSlice(set),
    }),
    {
      name: NETWORK_CONFIG_STORAGE_KEY,
      storage: createSafeStorage<PersistedState>(),
      version: 1,
      migrate: (persistedState, version) => {
        if (
          typeof persistedState !== 'object' ||
          persistedState === null ||
          version === 0 ||
          version === 1
        ) {
          return persistedState as PersistedState
        }

        return {
          networkConfig: serializeNetworkConfigForStorage(
            DEFAULT_NETWORK_CONFIG,
          ),
          preferences: DEFAULT_PREFERENCES,
          watchlist: {},
          snapshots: {},
        }
      },
      // Persist networkConfig, preferences, watchlist, and bounded snapshots
      partialize: (state): PersistedState => ({
        networkConfig: serializeNetworkConfigForStorage(state.networkConfig),
        preferences: state.preferences,
        watchlist: state.watchlist,
        snapshots: sanitizeNetworkSnapshots(
          state.snapshots,
          state.networkConfig.networkId,
        ),
      }),
      // Validate and merge persisted data safely
      merge: (persistedState, currentState) => {
        const mergedNetwork = mergeNetworkConfig(persistedState, currentState)
        const mergedPreferences = mergePreferences(persistedState, currentState)
        return {
          ...currentState,
          ...mergedNetwork,
          ...mergedPreferences,
        }
      },
    },
  ),
)

/**
 * Selector hooks for common use cases
 */
const EMPTY_ARRAY: Array<never> = []

export const useNetworkConfig = () =>
  useLensStore((state) => state.networkConfig)
export const useLatestLedgerSequence = () =>
  useLensStore((state) => state.latestLedgerSequence)
export const useLedgerData = () => useLensStore((state) => state.ledgerData)
export const useExpandedNodes = () =>
  useLensStore((state) => state.expandedNodes)
export const useActiveContractId = () =>
  useLensStore((state) => state.activeContractId)
export const useSelectedKeyPath = () =>
  useLensStore((state) => state.selectedKeyPath)
export const useContractLoadStatus = () =>
  useLensStore((state) => state.contractLoadStatus)
export const useContractLoadError = () =>
  useLensStore((state) => state.contractLoadError)
export const useSnapshots = (contractId: string) =>
  useLensStore((state) => {
    const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)
    return state.snapshots[networkId]?.[contractId] ?? EMPTY_ARRAY
  })
export const useWatchlist = (contractId: string) => {
  return useLensStore(
    useShallow((state) => {
      const networkId = normalizeNetworkScopeId(state.networkConfig.networkId)
      return deduplicateWatchlistItems(
        state.watchlist[networkId]?.[contractId],
      ).filter((item) => item.contractId === contractId)
    }),
  )
}

/**
 * Get store state outside of React components (for testing)
 */
export const getStoreState = () => useLensStore.getState()

/**
 * Reset store to initial state (for testing)
 */
export const resetStore = () => {
  useLensStore.setState({
    networkConfig: DEFAULT_NETWORK_CONFIG,
    connectionStatus: ConnectionStatus.IDLE,
    lastCustomUrl: undefined,
    latestLedgerSequence: null,
    ledgerData: {},
    expandedNodes: [],
    expandedNodesByContract: {},
    snapshots: {},
    watchlist: {},
    contractSpecs: {},
    contractSpecErrors: {},
    contractSpecMismatches: {},
    activeContractId: null,
    selectedKeyPath: null,
    contractLoadStatus: ContractLoadStatus.IDLE,
    contractLoadError: null,
    contractLoadErrorCode: null,
    contractLoadAttemptCount: null,
    preferences: DEFAULT_PREFERENCES,
  })
}

/**
 * Standalone action helpers — callable outside React components
 */
export const lensActions = {
  setNetworkConfig: (config: Partial<NetworkConfig>) =>
    useLensStore.getState().setNetworkConfig(config),
  resetNetworkConfig: () => useLensStore.getState().resetNetworkConfig(),
  setConnectionStatus: (status: ConnectionStatus) =>
    useLensStore.getState().setConnectionStatus(status),
  resetConnectionStatus: () => useLensStore.getState().resetConnectionStatus(),
  toggleExpanded: (nodeId: string) =>
    useLensStore.getState().toggleExpanded(nodeId),
  expandAll: (nodeIds: Array<string>) =>
    useLensStore.getState().expandAll(nodeIds),
  collapseAll: () => useLensStore.getState().collapseAll(),
  batchLedgerUpdate: (
    upserts: Array<LedgerEntry>,
    removals: Array<LedgerKey>,
  ) => useLensStore.getState().batchLedgerUpdate(upserts, removals),
  addToWatchlist: (contractId: string, keyPath: string) =>
    useLensStore.getState().addToWatchlist(contractId, keyPath),
  removeFromWatchlist: (contractId: string, keyPath: string) =>
    useLensStore.getState().removeFromWatchlist(contractId, keyPath),
  getWatchlistForContract: (contractId: string) =>
    useLensStore.getState().getWatchlistForContract(contractId),
  clearWatchlist: (contractId: string) =>
    useLensStore.getState().clearWatchlist(contractId),
  setActiveContractId: (contractId: string) =>
    useLensStore.getState().setActiveContractId(contractId),
  clearActiveContractId: () => useLensStore.getState().clearActiveContractId(),
  setSelectedKeyPath: (keyPath: string) =>
    useLensStore.getState().setSelectedKeyPath(keyPath),
  clearSelectedKeyPath: () => useLensStore.getState().clearSelectedKeyPath(),
  setContractLoadStatus: (status: ContractLoadStatus) =>
    useLensStore.getState().setContractLoadStatus(status),
  setContractLoadError: (
    message: string | null,
    code?: string | number | null,
  ) => useLensStore.getState().setContractLoadError(message, code),
  resetContractLoadState: () =>
    useLensStore.getState().resetContractLoadState(),
  loadContract: (contractId: string, keys: Array<string>) =>
    useLensStore.getState().loadContract(contractId, keys),
  refreshActiveKeys: () => useLensStore.getState().refreshActiveKeys(),
  addSnapshot: (
    contractId: string,
    entries: Record<string, LedgerEntry>,
    ledgerSequence: number,
    label?: string,
    maxSnapshots?: number,
  ) =>
    useLensStore
      .getState()
      .addSnapshot(contractId, entries, ledgerSequence, label, maxSnapshots),
  getSnapshots: (contractId: string) =>
    useLensStore.getState().getSnapshots(contractId),
  removeSnapshot: (contractId: string, snapshotId: string) =>
    useLensStore.getState().removeSnapshot(contractId, snapshotId),
  clearSnapshots: (contractId: string) =>
    useLensStore.getState().clearSnapshots(contractId),
  /**
   * Capture current contract state as a timestamped snapshot.
   * Clones the active contract's ledger data into an immutable snapshot record.
   */
  captureSnapshot: (label?: string) => {
    const state = useLensStore.getState()
    if (!state.activeContractId) {
      console.warn('No active contract to capture snapshot for')
      return
    }
    state.addSnapshot(
      state.activeContractId,
      state.ledgerData,
      state.currentLedgerSequence,
      label,
    )
  },
}
