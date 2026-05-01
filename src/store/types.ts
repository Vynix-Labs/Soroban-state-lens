/**
 * Store type definitions for Soroban State Lens
 */

// Network configuration status
export enum ConnectionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Display preferences
export enum ByteDisplayMode {
  HEX = 'hex',
  BASE64 = 'base64',
}

export enum BigIntDisplayMode {
  RAW = 'raw',
  FORMATTED = 'formatted',
}

// Network configuration
export interface NetworkConfig {
  networkId: string
  networkPassphrase: string
  rpcUrl: string
  horizonUrl?: string
}

// Ledger entry key (unique identifier)
export type LedgerKey = string

// Ledger entry data
export interface LedgerEntry {
  key: LedgerKey
  contractId: string
  type: 'ContractData' | 'ContractCode' | 'Account' | 'Trustline' | 'Other'
  durability?: 'Persistent' | 'Temporary' | 'Instance'
  value: unknown
  lastModifiedLedger: number
  expirationLedger?: number
  rawXdr?: string
}

// Map of ledger entries by key
export type LedgerDataMap = Record<LedgerKey, LedgerEntry>

// Set of expanded node IDs in the tree view
export type ExpandedNodes = Set<string>

// Network config slice
export interface NetworkConfigSlice {
  networkConfig: NetworkConfig
  connectionStatus: ConnectionStatus
  lastCustomUrl?: string
  setNetworkConfig: (config: Partial<NetworkConfig>) => void
  resetNetworkConfig: () => void
  setConnectionStatus: (status: ConnectionStatus) => void
  resetConnectionStatus: () => void
  setLastCustomUrl: (url: string) => void
}

// Ledger data slice
export interface LedgerDataSlice {
  ledgerData: LedgerDataMap
  upsertLedgerEntry: (entry: LedgerEntry) => void
  upsertLedgerEntries: (entries: Array<LedgerEntry>) => void
  removeLedgerEntry: (key: LedgerKey) => void
  clearLedgerData: () => void
  batchLedgerUpdate: (
    upserts: Array<LedgerEntry>,
    removals: Array<LedgerKey>,
  ) => void
}

// Expanded nodes slice
export interface ExpandedNodesSlice {
  expandedNodes: Array<string>
  setExpanded: (nodeId: string, expanded: boolean) => void
  toggleExpanded: (nodeId: string) => void
  expandAll: (nodeIds: Array<string>) => void
  collapseAll: () => void
}

// Contract snapshot record
export interface ContractSnapshot {
  id: string
  contractId: string
  timestamp: number
  ledgerData: Record<string, LedgerEntry>
  label?: string
}

// Snapshot slice
export interface SnapshotSlice {
  snapshots: Record<string, Array<ContractSnapshot>>
  addSnapshot: (
    contractId: string,
    entries: Record<string, LedgerEntry>,
    label?: string,
  ) => void
  getSnapshots: (contractId: string) => Array<ContractSnapshot>
  removeSnapshot: (contractId: string, snapshotId: string) => void
  clearSnapshots: (contractId: string) => void
}

// Contract slice
export interface ContractSlice {
  activeContractId: string | null
  setActiveContractId: (id: string) => void
  clearActiveContractId: () => void
}

// Watchlist item (pinned key for quick access)
export interface WatchlistItem {
  contractId: string
  keyPath: string
  timestamp: number
}

// Watchlist slice
export interface WatchlistSlice {
  watchlist: Record<string, Array<WatchlistItem>>
  addToWatchlist: (contractId: string, keyPath: string) => void
  removeFromWatchlist: (contractId: string, keyPath: string) => void
  getWatchlistForContract: (contractId: string) => Array<WatchlistItem>
  clearWatchlist: (contractId: string) => void
}

// Preferences slice
export interface PreferencesSlice {
  byteDisplayMode: ByteDisplayMode
  bigIntDisplayMode: BigIntDisplayMode
  setByteDisplayMode: (mode: ByteDisplayMode) => void
  setBigIntDisplayMode: (mode: BigIntDisplayMode) => void
  resetPreferences: () => void
}

// Combined store type
export interface LensStore
  extends
    NetworkConfigSlice,
    LedgerDataSlice,
    ExpandedNodesSlice,
    SnapshotSlice,
    ContractSlice,
    PreferencesSlice,
    WatchlistSlice {}

// Default network configurations
export const DEFAULT_NETWORKS: Record<string, NetworkConfig> = {
  futurenet: {
    networkId: 'futurenet',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
  },
  testnet: {
    networkId: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
  mainnet: {
    networkId: 'mainnet',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    rpcUrl: 'https://soroban.stellar.org',
    horizonUrl: 'https://horizon.stellar.org',
  },
}
