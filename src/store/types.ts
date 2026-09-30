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
  expired?: boolean
  rawXdr?: string
  decodeErrorReason?: string
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
  latestLedgerSequence: number | null
  setNetworkConfig: (config: Partial<NetworkConfig>) => void
  resetNetworkConfig: () => void
  setConnectionStatus: (status: ConnectionStatus) => void
  resetConnectionStatus: () => void
  setLastCustomUrl: (url: string) => void
  setLatestLedgerSequence: (sequence: number | null) => void
}

// Ledger data slice
export interface LedgerDataSlice {
  ledgerData: LedgerDataMap
  currentLedgerSequence: number
  setCurrentLedgerSequence: (sequence: number) => void
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
  expandedNodesByContract: Record<string, Array<string>>
  setExpanded: (nodeId: string, expanded: boolean) => void
  toggleExpanded: (nodeId: string) => void
  expandAll: (nodeIds: Array<string>) => void
  collapseAll: () => void
  setExpandedForContract: (
    contractId: string,
    nodeId: string,
    expanded: boolean,
  ) => void
  toggleExpandedForContract: (contractId: string, nodeId: string) => void
  expandAllForContract: (contractId: string, nodeIds: Array<string>) => void
  collapseAllForContract: (contractId: string) => void
}

// Contract snapshot record
export interface ContractSnapshot {
  id: string
  contractId: string
  timestamp: number
  ledgerSequence: number
  ledgerData: Record<string, LedgerEntry>
  label?: string
}

export const DEFAULT_SNAPSHOT_RETENTION_LIMIT = 25

// Snapshot slice
export interface SnapshotSlice {
  snapshots: NetworkScopedContractBuckets<Array<ContractSnapshot>>
  addSnapshot: (
    contractId: string,
    entries: Record<string, LedgerEntry>,
    ledgerSequence: number,
    label?: string,
    maxSnapshots?: number,
  ) => void
  getSnapshots: (contractId: string) => Array<ContractSnapshot>
  removeSnapshot: (contractId: string, snapshotId: string) => void
  clearSnapshots: (contractId: string) => void
}

// Contract slice
export interface ContractSlice {
  activeContractId: string | null
  selectedKeyPath: string | null
  setActiveContractId: (id: string) => void
  clearActiveContractId: () => void
  setSelectedKeyPath: (keyPath: string) => void
  clearSelectedKeyPath: () => void
}

export enum ContractLoadStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  EMPTY = 'empty',
  ERROR = 'error',
}

export interface ContractLoadSlice {
  contractLoadStatus: ContractLoadStatus
  contractLoadError: string | null
  contractLoadErrorCode: string | number | null
  contractLoadAttemptCount: number | null
  setContractLoadStatus: (status: ContractLoadStatus) => void
  setContractLoadError: (
    message: string | null,
    code?: string | number | null,
  ) => void
  resetContractLoadState: () => void
  loadContract: (contractId: string, keys: Array<string>) => Promise<void>
  refreshActiveKeys: () => Promise<void>
}

// Watchlist item (pinned key for quick access)
export interface WatchlistItem {
  contractId: string
  keyPath: string
  timestamp: number
}

// Watchlist slice
export interface WatchlistSlice {
  watchlist: NetworkScopedContractBuckets<Array<WatchlistItem>>
  addToWatchlist: (contractId: string, keyPath: string) => boolean
  removeFromWatchlist: (contractId: string, keyPath: string) => void
  getWatchlistForContract: (contractId: string) => Array<WatchlistItem>
  clearWatchlist: (contractId: string) => void
}

export type NetworkScopedContractBuckets<T> = Partial<
  Record<string, Partial<Record<string, T>>>
>

// Contract spec slice – parsed schema data keyed by contract ID
export interface ContractSpecSlice {
  contractSpecs: Record<string, unknown>
  contractSpecErrors: Record<string, string>
  contractSpecMismatches: Record<string, Array<ContractSchemaMismatch>>
  setContractSpec: (contractId: string, spec: unknown) => void
  compareContractSpec: (
    contractId: string,
    expectedFields: Array<ContractSchemaField>,
    actualFields: Array<ContractSchemaField>,
  ) => Array<ContractSchemaMismatch>
  setContractSpecMismatches: (
    contractId: string,
    mismatches: Array<ContractSchemaMismatch>,
  ) => void
  getContractSpec: (contractId: string) => unknown
  setContractSpecError: (contractId: string, error: string) => void
  getContractSpecError: (contractId: string) => string | undefined
  clearContractSpec: (contractId: string) => void
}

/** A storage field and its type in a parsed contract schema. */
export interface ContractSchemaField {
  keyPath: string
  type: string
}

/** Expected and actual types for one mismatching contract storage key. */
export interface ContractSchemaMismatch {
  keyPath: string
  expectedType: string
  actualType: string
}
// Display preferences enums
export enum ByteDisplayMode {
  HEX = 'hex',
  BASE64 = 'base64',
  UTF8 = 'utf8',
}

export enum BigIntDisplayMode {
  DECIMAL = 'decimal',
  HEX = 'hex',
  SCIENTIFIC = 'scientific',
}

// Display preferences
export interface DisplayPreferences {
  byteDisplayMode: ByteDisplayMode
  bigIntDisplayMode: BigIntDisplayMode
}

// Preferences slice
export interface PreferencesSlice {
  preferences: DisplayPreferences
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
    ContractLoadSlice,
    ContractSpecSlice,
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

/**
 * Default display preferences
 */
export const DEFAULT_PREFERENCES: DisplayPreferences = {
  byteDisplayMode: ByteDisplayMode.HEX,
  bigIntDisplayMode: BigIntDisplayMode.DECIMAL,
}
