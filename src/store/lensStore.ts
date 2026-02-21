import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_NETWORKS } from './types'

import type {
  ExpandedNodesSlice,
  LedgerDataSlice,
  LedgerEntry,
  LedgerKey,
  LensStore,
  NetworkConfig,
  NetworkConfigSlice,
} from './types'

/**
 * Default initial state
 */
const DEFAULT_NETWORK_CONFIG: NetworkConfig = DEFAULT_NETWORKS.futurenet

/**
 * Network config slice creator
 */
const createNetworkConfigSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): NetworkConfigSlice => ({
  networkConfig: DEFAULT_NETWORK_CONFIG,
  lastCustomUrl: undefined,

  setNetworkConfig: (config: Partial<NetworkConfig>) =>
    set((state) => ({
      networkConfig: { ...state.networkConfig, ...config },
    })),

  resetNetworkConfig: () =>
    set(() => ({
      networkConfig: DEFAULT_NETWORK_CONFIG,
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
 * Combined Lens Store with persistence
 *
 * Centralized state management for Soroban State Lens.
 * Includes slices for:
 * - networkConfig: Current network configuration (persisted)
 * - ledgerData: Cached ledger entries (not persisted)
 * - expandedNodes: Tree view expansion state (persisted)
 */
export const useLensStore = create<LensStore>()(
  persist(
    (set) => ({
      ...createNetworkConfigSlice(set),
      ...createLedgerDataSlice(set),
      ...createExpandedNodesSlice(set),
    }),
    {
      name: 'soroban-state-lens-storage',
      partialize: (state) => ({
        networkConfig: state.networkConfig,
        lastCustomUrl: state.lastCustomUrl,
        expandedNodes: state.expandedNodes,
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
    ledgerData: {},
    expandedNodes: [],
  })
}
