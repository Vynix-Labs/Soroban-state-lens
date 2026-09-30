import { createJSONStorage } from 'zustand/middleware'
import { parsePersistedNetworkConfig } from '../lib/storage/parsePersistedNetworkConfig'
import { serializePersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'
import { validateNetworkConfigPatch } from './validateNetworkConfigPatch'
import { normalizeNetworkScopeId } from './networkScope'
import {
  BigIntDisplayMode,
  ByteDisplayMode,
  DEFAULT_NETWORKS,
  DEFAULT_PREFERENCES,
  DEFAULT_SNAPSHOT_RETENTION_LIMIT,
} from './types'
import type {
  ContractSnapshot,
  DisplayPreferences,
  LedgerEntry,
  NetworkConfig,
  NetworkScopedContractBuckets,
  WatchlistItem,
} from './types'
import type { PersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'
import type { PersistStorage } from 'zustand/middleware'

/**
 * Storage key for network config persistence
 */
export const NETWORK_CONFIG_STORAGE_KEY = 'ssl.network-config.v1'
export const PERSISTED_STATE_VERSION = 1

/**
 * Storage key for preferences persistence
 */
export const PREFERENCES_STORAGE_KEY = 'ssl.preferences.v1'

/**
 * Default network config used when storage is missing or corrupt
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = DEFAULT_NETWORKS.futurenet

/**
 * Persisted state shape
 */
export interface PersistedState {
  networkConfig: PersistedNetworkConfig
  preferences: DisplayPreferences
  watchlist?: NetworkScopedContractBuckets<Array<WatchlistItem>>
  snapshots?: NetworkScopedContractBuckets<Array<ContractSnapshot>>
}

/**
 * Validates that a value is a valid NetworkConfig object
 */
export function isValidNetworkConfig(value: unknown): value is NetworkConfig {
  const result = validateNetworkConfigPatch(value)

  if (!result.valid || !result.patch) {
    return false
  }

  const { networkId, networkPassphrase, rpcUrl } = result.patch

  return (
    typeof networkId === 'string' &&
    networkId.length > 0 &&
    typeof networkPassphrase === 'string' &&
    networkPassphrase.length > 0 &&
    typeof rpcUrl === 'string' &&
    rpcUrl.length > 0
  )
}

export function isValidByteDisplayMode(
  value: unknown,
): value is ByteDisplayMode {
  return (
    value === ByteDisplayMode.HEX ||
    value === ByteDisplayMode.BASE64 ||
    value === ByteDisplayMode.UTF8
  )
}

export function isValidBigIntDisplayMode(
  value: unknown,
): value is BigIntDisplayMode {
  return (
    value === BigIntDisplayMode.DECIMAL ||
    value === BigIntDisplayMode.HEX ||
    value === BigIntDisplayMode.SCIENTIFIC
  )
}

export function validateDisplayPreferences(value: unknown): DisplayPreferences {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_PREFERENCES
  }

  const candidate = value as Record<string, unknown>

  const byteDisplayMode = isValidByteDisplayMode(candidate.byteDisplayMode)
    ? candidate.byteDisplayMode
    : DEFAULT_PREFERENCES.byteDisplayMode

  const bigIntDisplayMode = isValidBigIntDisplayMode(
    candidate.bigIntDisplayMode,
  )
    ? candidate.bigIntDisplayMode
    : DEFAULT_PREFERENCES.bigIntDisplayMode

  return {
    byteDisplayMode,
    bigIntDisplayMode,
  }
}

function getPersistedStateVersion(persistedState: unknown): number | null {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return null
  }

  const persisted = persistedState as Record<string, unknown>
  const version = persisted.version

  return typeof version === 'number' && Number.isFinite(version)
    ? version
    : null
}
function unwrapPersistedState(
  persistedState: unknown,
): Record<string, unknown> | null {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return null
  }

  const persisted = persistedState as Record<string, unknown>
  const version = getPersistedStateVersion(persistedState)

  if (
    version !== null &&
    version !== 0 &&
    version !== PERSISTED_STATE_VERSION
  ) {
    return null
  }

  if (
    'state' in persisted &&
    typeof persisted.state === 'object' &&
    persisted.state !== null
  ) {
    return persisted.state as Record<string, unknown>
  }

  return persisted
}

/**
 * Safe localStorage wrapper that handles errors gracefully
 */
const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') {
        return null
      }
      return localStorage.getItem(name)
    } catch {
      console.warn(`[LensStore] Failed to read from localStorage: ${name}`)
      return null
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      if (typeof window === 'undefined') {
        return
      }
      localStorage.setItem(name, value)
    } catch {
      console.warn(`[LensStore] Failed to write to localStorage: ${name}`)
    }
  },

  removeItem: (name: string): void => {
    try {
      if (typeof window === 'undefined') {
        return
      }
      localStorage.removeItem(name)
    } catch {
      console.warn(`[LensStore] Failed to remove from localStorage: ${name}`)
    }
  },
}

/**
 * Create safe storage for persist middleware
 */
export const createSafeStorage = <T>(): PersistStorage<T> | undefined =>
  createJSONStorage<T>(() => safeLocalStorage)

/**
 * Hydration merge function that validates persisted data.
 */
export function mergeNetworkConfig(
  persistedState: unknown,
  currentState: { networkConfig: NetworkConfig },
): {
  networkConfig: NetworkConfig
  watchlist: NetworkScopedContractBuckets<Array<WatchlistItem>>
  snapshots: NetworkScopedContractBuckets<Array<ContractSnapshot>>
} {
  const hydratedState = unwrapPersistedState(persistedState)
  let networkConfig = currentState.networkConfig

  if (hydratedState && 'networkConfig' in hydratedState) {
    const parsedNetworkConfig = parsePersistedNetworkConfig(
      hydratedState.networkConfig,
    )

    if (isValidNetworkConfig(parsedNetworkConfig)) {
      networkConfig = parsedNetworkConfig
    } else {
      console.warn(
        '[LensStore] Persisted network config is invalid, falling back to default',
        hydratedState.networkConfig,
      )
    }
  }

  return {
    networkConfig,
    watchlist: sanitizeNetworkWatchlist(
      hydratedState &&
        typeof hydratedState === 'object' &&
        'watchlist' in hydratedState
        ? hydratedState.watchlist
        : undefined,
      networkConfig.networkId,
    ),
    snapshots: sanitizeNetworkSnapshots(
      hydratedState &&
        typeof hydratedState === 'object' &&
        'snapshots' in hydratedState
        ? hydratedState.snapshots
        : undefined,
      networkConfig.networkId,
    ),
  }
}

export function sanitizeNetworkWatchlist(
  value: unknown,
  legacyNetworkId: string,
): NetworkScopedContractBuckets<Array<WatchlistItem>> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  const source = value as Record<string, unknown>
  const legacyWatchlist = sanitizeWatchlist(value)
  if (Object.keys(legacyWatchlist).length > 0) {
    return { [normalizeNetworkScopeId(legacyNetworkId)]: legacyWatchlist }
  }

  const networkScoped: Record<string, Record<string, Array<WatchlistItem>>> = {}
  for (const [networkId, contracts] of Object.entries(source)) {
    if (typeof contracts !== 'object' || contracts === null) continue
    const validContracts = sanitizeWatchlist(contracts)
    if (Object.keys(validContracts).length > 0) {
      networkScoped[normalizeNetworkScopeId(networkId)] = validContracts
    }
  }
  return networkScoped
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeSnapshotLedgerData(
  value: unknown,
  contractId: string,
): Record<string, LedgerEntry> {
  if (!isRecord(value)) return {}

  const entries: Record<string, LedgerEntry> = {}
  for (const [key, item] of Object.entries(value)) {
    if (!isRecord(item)) continue

    const validType =
      item.type === 'ContractData' ||
      item.type === 'ContractCode' ||
      item.type === 'Account' ||
      item.type === 'Trustline' ||
      item.type === 'Other'
    const validDurability =
      !('durability' in item) ||
      item.durability === 'Persistent' ||
      item.durability === 'Temporary' ||
      item.durability === 'Instance'

    if (
      item.key !== key ||
      item.contractId !== contractId ||
      !validType ||
      !('value' in item) ||
      !isJsonSerializableValue(item.value) ||
      typeof item.lastModifiedLedger !== 'number' ||
      !Number.isSafeInteger(item.lastModifiedLedger) ||
      item.lastModifiedLedger < 0 ||
      !validDurability ||
      ('expirationLedger' in item &&
        (typeof item.expirationLedger !== 'number' ||
          !Number.isSafeInteger(item.expirationLedger) ||
          item.expirationLedger < 0)) ||
      ('rawXdr' in item && typeof item.rawXdr !== 'string') ||
      ('decodeErrorReason' in item &&
        typeof item.decodeErrorReason !== 'string')
    ) {
      continue
    }

    entries[key] = {
      key,
      contractId,
      type: item.type as LedgerEntry['type'],
      value: item.value,
      lastModifiedLedger: item.lastModifiedLedger,
      ...(item.durability === undefined
        ? {}
        : { durability: item.durability as LedgerEntry['durability'] }),
      ...(item.expirationLedger === undefined
        ? {}
        : { expirationLedger: item.expirationLedger as number }),
      ...(typeof item.rawXdr === 'string' ? { rawXdr: item.rawXdr } : {}),
      ...(typeof item.decodeErrorReason === 'string'
        ? { decodeErrorReason: item.decodeErrorReason.slice(0, 500) }
        : {}),
    }
  }
  return entries
}

function isJsonSerializableValue(
  value: unknown,
  ancestors = new WeakSet<object>(),
): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object') return false
  if (ancestors.has(value)) return false

  const prototype = Object.getPrototypeOf(value)
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  )
    return false

  ancestors.add(value)
  const values = Array.isArray(value) ? value : Object.values(value)
  const valid = values.every((item) => isJsonSerializableValue(item, ancestors))
  ancestors.delete(value)
  return valid
}

export function sanitizeSnapshots(
  value: unknown,
): Record<string, Array<ContractSnapshot>> {
  if (!isRecord(value)) return {}

  const hydrationTime = Date.now()
  const snapshots: Record<string, Array<ContractSnapshot>> = {}
  for (const [contractId, items] of Object.entries(value)) {
    if (!contractId || !Array.isArray(items)) continue

    const validSnapshots: Array<ContractSnapshot> = []
    for (const item of items) {
      if (!isRecord(item)) continue
      if (
        typeof item.id !== 'string' ||
        item.id.trim().length === 0 ||
        item.contractId !== contractId ||
        typeof item.timestamp !== 'number' ||
        !Number.isFinite(item.timestamp) ||
        item.timestamp < 0 ||
        item.timestamp > hydrationTime ||
        typeof item.ledgerSequence !== 'number' ||
        !Number.isSafeInteger(item.ledgerSequence) ||
        item.ledgerSequence < 0 ||
        !isRecord(item.ledgerData)
      ) {
        continue
      }

      const label = typeof item.label === 'string' ? item.label : undefined
      validSnapshots.push({
        id: item.id,
        contractId,
        timestamp: item.timestamp,
        ledgerSequence: item.ledgerSequence,
        ledgerData: sanitizeSnapshotLedgerData(item.ledgerData, contractId),
        ...(label === undefined ? {} : { label }),
      })
    }

    const retained = validSnapshots.slice(-DEFAULT_SNAPSHOT_RETENTION_LIMIT)
    if (retained.length > 0) snapshots[contractId] = retained
  }
  return snapshots
}

export function sanitizeNetworkSnapshots(
  value: unknown,
  legacyNetworkId: string,
): NetworkScopedContractBuckets<Array<ContractSnapshot>> {
  if (!isRecord(value)) return {}

  const legacySnapshots = sanitizeSnapshots(value)
  if (Object.keys(legacySnapshots).length > 0) {
    return { [normalizeNetworkScopeId(legacyNetworkId)]: legacySnapshots }
  }

  const networkScoped: Record<string, Record<string, Array<ContractSnapshot>>> =
    {}
  for (const [networkId, snapshots] of Object.entries(value)) {
    if (!isRecord(snapshots)) continue
    const validSnapshots = sanitizeSnapshots(snapshots)
    if (Object.keys(validSnapshots).length > 0) {
      networkScoped[normalizeNetworkScopeId(networkId)] = validSnapshots
    }
  }
  return networkScoped
}

/**
 * Sanitizes a persisted watchlist into the known shape, dropping any entry
 * that does not match the WatchlistItem contract.
 */
export function sanitizeWatchlist(
  value: unknown,
): Record<string, Array<WatchlistItem>> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  const hydrationTime = Date.now()
  const source = value as Record<string, unknown>
  const sanitized: Record<string, Array<WatchlistItem>> = {}

  for (const [contractId, items] of Object.entries(source)) {
    if (typeof contractId !== 'string' || contractId.length === 0) {
      continue
    }

    if (!Array.isArray(items)) {
      continue
    }

    const validItems: Array<WatchlistItem> = []

    for (const item of items) {
      if (typeof item !== 'object' || item === null) {
        continue
      }

      const candidate = item as Record<string, unknown>

      if (
        typeof candidate.contractId === 'string' &&
        typeof candidate.keyPath === 'string' &&
        typeof candidate.timestamp === 'number' &&
        Number.isFinite(candidate.timestamp) &&
        candidate.timestamp <= hydrationTime &&
        candidate.contractId === contractId
      ) {
        validItems.push(item as unknown as WatchlistItem)
      }
    }

    if (validItems.length > 0) {
      sanitized[contractId] = validItems.sort(
        (left, right) =>
          right.timestamp - left.timestamp ||
          left.keyPath.localeCompare(right.keyPath),
      )
    }
  }

  return sanitized
}

export function serializeNetworkConfigForStorage(
  networkConfig: NetworkConfig,
): PersistedNetworkConfig {
  return serializePersistedNetworkConfig(networkConfig)
}

/**
 * Hydration merge function for preferences.
 */
export function mergePreferences(
  persistedState: unknown,
  currentState: { preferences: DisplayPreferences },
): { preferences: DisplayPreferences } {
  const hydratedState = unwrapPersistedState(persistedState)

  if (hydratedState && 'preferences' in hydratedState) {
    const validatedPreferences = validateDisplayPreferences(
      hydratedState.preferences,
    )

    if (
      hydratedState.preferences !== null &&
      typeof hydratedState.preferences === 'object'
    ) {
      const original = hydratedState.preferences as Record<string, unknown>
      if (
        !isValidByteDisplayMode(original.byteDisplayMode) ||
        !isValidBigIntDisplayMode(original.bigIntDisplayMode)
      ) {
        console.warn(
          '[LensStore] Persisted preferences contain invalid values, applying defaults',
          hydratedState.preferences,
        )
      }
    }

    return { preferences: validatedPreferences }
  }

  return { preferences: currentState.preferences }
}

/**
 * Clear persisted preferences (for testing)
 */
export function clearPersistedPreferences(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREFERENCES_STORAGE_KEY)
    }
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Clear persisted network config (for testing)
 */
export function clearPersistedNetworkConfig(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(NETWORK_CONFIG_STORAGE_KEY)
    }
  } catch {
    // Ignore errors during cleanup
  }
}
