import type { LensStore } from './types'

// Network selectors
export const selectNetworkConfig = (state: LensStore) => state.networkConfig
export const selectNetworkId = (state: LensStore) =>
  state.networkConfig.networkId
export const selectRpcUrl = (state: LensStore) => state.networkConfig.rpcUrl
export const selectHorizonUrl = (state: LensStore) =>
  state.networkConfig.horizonUrl

// Ledger data selectors
export const selectLedgerData = (state: LensStore) => state.ledgerData
export const selectLedgerEntry = (key: string) => (state: LensStore) =>
  state.ledgerData[key] as LensStore['ledgerData'][string] | undefined

// Memoize filtered ledger entries per contractId by ledgerData reference.
// Cache has a bounded size to prevent unbounded memory growth across sessions.
const _ledgerEntriesByContractCache: Map<
  string,
  { ledgerDataRef: LensStore['ledgerData'] | null; result: Array<LensStore['ledgerData'][string]> }
> = new Map()

const MAX_LEDGER_ENTRIES_CACHE_SIZE = 50

/**
 * Evicts the oldest entry from the cache when max size is exceeded.
 * Uses Map iteration order (FIFO) to identify the oldest entry.
 */
function evictOldestCacheEntry(): void {
  if (_ledgerEntriesByContractCache.size > MAX_LEDGER_ENTRIES_CACHE_SIZE) {
    const oldestKey = _ledgerEntriesByContractCache.keys().next().value
    if (oldestKey !== undefined) {
      _ledgerEntriesByContractCache.delete(oldestKey)
    }
  }
}

/**
 * Clears stale cache entries when ledgerData changes.
 * Entries are considered stale when the cached ledgerDataRef no longer matches the current ledgerData.
 */
function clearStaleCacheEntries(currentLedgerData: LensStore['ledgerData']): void {
  const staleKeys: Array<string> = []
  for (const [key, cached] of _ledgerEntriesByContractCache.entries()) {
    if (cached.ledgerDataRef !== currentLedgerData) {
      staleKeys.push(key)
    }
  }
  for (const key of staleKeys) {
    _ledgerEntriesByContractCache.delete(key)
  }
}

export const selectLedgerEntriesByContract = (contractId: string) => (
  state: LensStore,
) => {
  const ledgerData = state.ledgerData
  const cached = _ledgerEntriesByContractCache.get(contractId)

  // Clear stale entries before checking cache
  clearStaleCacheEntries(ledgerData)

  if (cached && cached.ledgerDataRef === ledgerData) {
    return cached.result
  }

  const result = Object.values(ledgerData).filter(
    (e) => e.contractId === contractId,
  )

  _ledgerEntriesByContractCache.set(contractId, {
    ledgerDataRef: ledgerData,
    result,
  })

  // Evict oldest entry if cache exceeds max size
  evictOldestCacheEntry()

  return result
}
export const selectWatchlistForContract =
  (contractId: string) => (state: LensStore) =>
    state.watchlist[contractId] ?? []
export const selectSnapshotsForContract =
  (contractId: string) => (state: LensStore) =>
    state.snapshots[contractId] ?? []
export const selectLedgerEntryCount = (state: LensStore) =>
  Object.keys(state.ledgerData).length
export const selectHasLedgerData = (state: LensStore) =>
  Object.keys(state.ledgerData).length > 0

// Expanded nodes selectors
export const selectExpandedNodes = (state: LensStore) => state.expandedNodes
export const selectIsExpanded = (nodeId: string) => (state: LensStore) =>
  state.expandedNodes.includes(nodeId)
export const selectExpandedCount = (state: LensStore) =>
  state.expandedNodes.length
export const selectSelectedKeyPath = (state: LensStore) => state.selectedKeyPath

// Action selectors (for grabbing actions without re-rendering on state changes)
export const selectSetNetworkConfig = (state: LensStore) =>
  state.setNetworkConfig
export const selectResetNetworkConfig = (state: LensStore) =>
  state.resetNetworkConfig
export const selectToggleExpanded = (state: LensStore) => state.toggleExpanded
export const selectSetExpanded = (state: LensStore) => state.setExpanded
export const selectExpandAll = (state: LensStore) => state.expandAll
export const selectCollapseAll = (state: LensStore) => state.collapseAll
export const selectSetSelectedKeyPath = (state: LensStore) =>
  state.setSelectedKeyPath
export const selectClearSelectedKeyPath = (state: LensStore) =>
  state.clearSelectedKeyPath
