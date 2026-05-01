import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { getLedgerEntries } from '../lib/network/getLedgerEntries'
import { mapLedgerEntriesToStoreEntries } from '../lib/network/mapLedgerEntriesToStoreEntries'
import { isDecoderWorkerError } from '../types/decoder-worker'
import { createDecoderWorkerSafe } from '../workers/createDecoderWorkerSafe'
import {
  BigIntDisplayMode,
  ByteDisplayMode,
  ConnectionStatus,
  ContractLoadStatus,
  DEFAULT_NETWORKS,
} from './types'
import {
  DEFAULT_NETWORK_CONFIG,
  NETWORK_CONFIG_STORAGE_KEY,
  createSafeStorage,
  mergeNetworkConfig,
  serializeNetworkConfigForStorage,
} from './persistence'
import { createContractSlice } from './contractSlice'
import { createPreferencesSlice } from './preferencesSlice'

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
  WatchlistSlice,
} from './types'

export type { LedgerEntry, LedgerKey } from './types'

// Re-export for backwards compatibility
export { DEFAULT_NETWORKS }

/**
 * Network config slice creator
 */
const createNetworkConfigSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): NetworkConfigSlice => ({
  networkConfig: DEFAULT_NETWORK_CONFIG,
  connectionStatus: ConnectionStatus.IDLE,
  lastCustomUrl: undefined,

  setNetworkConfig: (config: Partial<NetworkConfig>) =>
    set((state) => ({
      networkConfig: { ...state.networkConfig, ...config },
    })),

  resetNetworkConfig: () =>
    set(() => ({
      networkConfig: DEFAULT_NETWORK_CONFIG,
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
})

/**
 * Ledger data slice creator
 */
const createLedgerDataSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): LedgerDataSlice => ({
  ledgerData: {},

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

  setExpanded: (nodeId: string, expanded: boolean) =>
    set((state) => {
      if (expanded) {
        if (state.expandedNodes.includes(nodeId)) {
          return state
        }
        return { expandedNodes: [...state.expandedNodes, nodeId] }
      } else {
        return {
          expandedNodes: state.expandedNodes.filter((id) => id !== nodeId),
        }
      }
    }),

  toggleExpanded: (nodeId: string) =>
    set((state) => {
      if (state.expandedNodes.includes(nodeId)) {
        return {
          expandedNodes: state.expandedNodes.filter((id) => id !== nodeId),
        }
      }
      return { expandedNodes: [...state.expandedNodes, nodeId] }
    }),

  expandAll: (nodeIds: Array<string>) =>
    set((state) => {
      const newExpanded = new Set([...state.expandedNodes, ...nodeIds])
      return { expandedNodes: Array.from(newExpanded) }
    }),

  collapseAll: () =>
    set(() => ({
      expandedNodes: [],
    })),
})

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
    label?: string,
  ) =>
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [contractId]: [
          ...(state.snapshots[contractId] ?? []),
          {
            id: crypto.randomUUID(),
            contractId,
            timestamp: Date.now(),
            ledgerData: { ...entries },
            label,
          },
        ],
      },
    })),

  getSnapshots: (contractId: string) => {
    return get().snapshots[contractId] ?? []
  },

  removeSnapshot: (contractId: string, snapshotId: string) =>
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [contractId]: (state.snapshots[contractId] ?? []).filter(
          (s) => s.id !== snapshotId,
        ),
      },
    })),

  clearSnapshots: (contractId: string) =>
    set((state) => {
      const { [contractId]: _, ...rest } = state.snapshots
      return { snapshots: rest }
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

  return {
    contractLoadStatus: ContractLoadStatus.IDLE,
    contractLoadError: null,

    setContractLoadStatus: (status: ContractLoadStatus) =>
      set(() => ({ contractLoadStatus: status })),

    setContractLoadError: (message: string | null) =>
      set(() => ({ contractLoadError: message })),

    resetContractLoadState: () =>
      set(() => ({
        contractLoadStatus: ContractLoadStatus.IDLE,
        contractLoadError: null,
      })),

    loadContract: async (contractId: string, keys: Array<string>) => {
      requestId += 1
      const currentRequestId = requestId

      if (activeController) {
        activeController.abort()
      }

      activeController = new AbortController()
      const signal = activeController.signal

      set((state) => ({
        activeContractId: contractId,
        contractLoadStatus: ContractLoadStatus.LOADING,
        contractLoadError: null,
        ledgerData:
          state.activeContractId === contractId ? state.ledgerData : {},
      }))

      try {
        const { entries } = await getLedgerEntries({
          rpcUrl: get().networkConfig.rpcUrl,
          keys,
          signal,
        })

        if (currentRequestId !== requestId || signal.aborted) {
          return
        }

        const worker = await createDecoderWorkerSafe()
        const decodedValuesByKey: Record<string, unknown> = {}

        for (const entry of entries) {
          const result = await worker.decodeScVal({ xdr: entry.xdr })
          decodedValuesByKey[entry.key] = isDecoderWorkerError(result)
            ? entry.xdr
            : result
        }

        const mappedEntries = mapLedgerEntriesToStoreEntries({
          contractId,
          entries,
          decodedValuesByKey,
        })

        set(() => ({
          ledgerData: Object.fromEntries(
            mappedEntries.map((entry) => [entry.key, entry]),
          ),
          contractLoadStatus:
            mappedEntries.length === 0
              ? ContractLoadStatus.EMPTY
              : ContractLoadStatus.SUCCESS,
          contractLoadError: null,
        }))
      } catch (error) {
        if (currentRequestId !== requestId || signal.aborted) {
          return
        }

        set(() => ({
          contractLoadStatus: ContractLoadStatus.ERROR,
          contractLoadError:
            error instanceof Error ? error.message : 'Failed to load contract',
        }))
      } finally {
        if (activeController.signal === signal) {
          activeController = null
        }
      }
    },
  }
}

/**
 * Watchlist slice creator
 * Manages pinned keys for quick access across routes
 */
const createWatchlistSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
  get: () => LensStore,
): WatchlistSlice => ({
  watchlist: {},

  addToWatchlist: (contractId: string, keyPath: string) =>
    set((state) => {
      const currentItems = state.watchlist[contractId] ?? []
      
      // Check if item already exists (duplicate protection)
      const isDuplicate = currentItems.some((item) => item.keyPath === keyPath)
      if (isDuplicate) {
        return state
      }

      return {
        watchlist: {
          ...state.watchlist,
          [contractId]: [
            ...currentItems,
            {
              contractId,
              keyPath,
              timestamp: Date.now(),
            },
          ],
        },
      }
    }),

  removeFromWatchlist: (contractId: string, keyPath: string) =>
    set((state) => ({
      watchlist: {
        ...state.watchlist,
        [contractId]: (state.watchlist[contractId] ?? []).filter(
          (item) => item.keyPath !== keyPath,
        ),
      },
    })),

  getWatchlistForContract: (contractId: string) => {
    return get().watchlist[contractId] ?? []
  },

  clearWatchlist: (contractId: string) =>
    set((state) => {
      const { [contractId]: _, ...rest } = state.watchlist
      return { watchlist: rest }
    }),
})

/**
 * Combined Lens Store with persistence for networkConfig only
 *
 * Centralized state management for Soroban State Lens.
 * Includes slices for:
 * - networkConfig: Current network configuration (PERSISTED)
 * - ledgerData: Cached ledger entries (NOT persisted)
 * - expandedNodes: Tree view expansion state (NOT persisted)
 * - contractLoadStatus: Contract fetch lifecycle (NOT persisted)
 * - watchlist: Pinned keys for quick access (NOT persisted)
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
      ...createContractLoadSlice(set, get),
      ...createPreferencesSlice(set),
    }),
    {
      name: NETWORK_CONFIG_STORAGE_KEY,
      storage: createSafeStorage<PersistedState>(),
      // Persist networkConfig and preferences
      partialize: (state): PersistedState => ({
        networkConfig: serializeNetworkConfigForStorage(state.networkConfig),
        preferences: {
          byteDisplayMode: state.byteDisplayMode,
          bigIntDisplayMode: state.bigIntDisplayMode,
        },
      }),
      // Validate and merge persisted data safely
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...mergeNetworkConfig(persistedState, currentState),
      }),
    },
  ),
)

/**
 * Selector hooks for common use cases
 */
export const useNetworkConfig = () =>
  useLensStore((state) => state.networkConfig)
export const useLedgerData = () => useLensStore((state) => state.ledgerData)
export const useExpandedNodes = () =>
  useLensStore((state) => state.expandedNodes)
export const useActiveContractId = () =>
  useLensStore((state) => state.activeContractId)
export const useContractLoadStatus = () =>
  useLensStore((state) => state.contractLoadStatus)
export const useContractLoadError = () =>
  useLensStore((state) => state.contractLoadError)
export const useSnapshots = (contractId: string) =>
  useLensStore((state) => state.snapshots[contractId] ?? [])
export const useWatchlist = (contractId: string) =>
  useLensStore((state) => state.watchlist[contractId] ?? [])

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
    ledgerData: {},
    expandedNodes: [],
    snapshots: {},
    watchlist: {},
    activeContractId: null,
    contractLoadStatus: ContractLoadStatus.IDLE,
    contractLoadError: null,
    byteDisplayMode: ByteDisplayMode.HEX,
    bigIntDisplayMode: BigIntDisplayMode.RAW,
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
  setContractLoadStatus: (status: ContractLoadStatus) =>
    useLensStore.getState().setContractLoadStatus(status),
  setContractLoadError: (message: string | null) =>
    useLensStore.getState().setContractLoadError(message),
  resetContractLoadState: () => useLensStore.getState().resetContractLoadState(),
  loadContract: (contractId: string, keys: Array<string>) =>
    useLensStore.getState().loadContract(contractId, keys),
}
