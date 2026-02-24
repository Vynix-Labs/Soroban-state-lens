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
export const selectLedgerEntriesByContract =
  (contractId: string) => (state: LensStore) =>
    Object.values(state.ledgerData).filter((e) => e.contractId === contractId)
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

// Action selectors (for grabbing actions without re-rendering on state changes)
export const selectSetNetworkConfig = (state: LensStore) =>
  state.setNetworkConfig
export const selectResetNetworkConfig = (state: LensStore) =>
  state.resetNetworkConfig
export const selectToggleExpanded = (state: LensStore) => state.toggleExpanded
export const selectSetExpanded = (state: LensStore) => state.setExpanded
export const selectExpandAll = (state: LensStore) => state.expandAll
export const selectCollapseAll = (state: LensStore) => state.collapseAll
