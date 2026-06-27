import { createJSONStorage } from 'zustand/middleware'
import { parsePersistedNetworkConfig } from '../lib/storage/parsePersistedNetworkConfig'
import { serializePersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'

import { DEFAULT_NETWORKS } from './types'
import { validateNetworkConfigPatch } from './validateNetworkConfigPatch'

import type { NetworkConfig, WatchlistItem } from './types'
import type { PersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'
import type { PersistStorage } from 'zustand/middleware'

/**
 * Storage key for network config persistence
 */
export const NETWORK_CONFIG_STORAGE_KEY = 'ssl.network-config.v1'

/**
 * Default network config used when storage is missing or corrupt
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = DEFAULT_NETWORKS.futurenet

/**
 * Persisted state shape (only networkConfig)
 */
export interface PersistedState {
  networkConfig: PersistedNetworkConfig
  preferences?: {
    byteDisplayMode: string
    bigIntDisplayMode: string
  }
  watchlist?: Record<string, Array<WatchlistItem>>
}

/**
 * Validates that a value is a valid NetworkConfig object
 */
export function isValidNetworkConfig(value: unknown): value is NetworkConfig {
  const result = validateNetworkConfigPatch(value)

  if (!result.valid || !result.patch) {
    return false
  }

  // Ensure all required fields are present and non-empty
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
 * Hydration merge function that validates persisted data
 * Returns default config if persisted data is invalid
 */
export function mergeNetworkConfig(
  persistedState: unknown,
  currentState: { networkConfig: NetworkConfig },
): any {
  let watchlist: Record<string, Array<WatchlistItem>> = {}

  if (
    typeof persistedState === 'object' &&
    persistedState !== null &&
    'watchlist' in persistedState
  ) {
    const persisted = persistedState as { watchlist?: unknown }
    watchlist = sanitizeWatchlist(persisted.watchlist)
  }

  if (
    typeof persistedState === 'object' &&
    persistedState !== null &&
    'networkConfig' in persistedState
  ) {
    const persisted = persistedState as {
      networkConfig: unknown
      preferences?: {
        byteDisplayMode: string
        bigIntDisplayMode: string
      }
    }
    const parsedNetworkConfig = parsePersistedNetworkConfig(
      persisted.networkConfig,
    )

    if (isValidNetworkConfig(parsedNetworkConfig)) {
      return {
        networkConfig: parsedNetworkConfig,
        ...(persisted.preferences
          ? {
              byteDisplayMode: (persisted.preferences as any).byteDisplayMode,
              bigIntDisplayMode: (persisted.preferences as any)
                .bigIntDisplayMode,
            }
          : {}),
        watchlist,
      }
    }

    console.warn(
      '[LensStore] Persisted network config is invalid, falling back to default',
      persisted.networkConfig,
    )
  }

  // Return current state (with defaults) if persisted data is invalid or missing
  return { ...currentState, watchlist }
}

/**
 * Sanitizes a persisted watchlist into the known shape, dropping any entry
 * that does not match the {@link WatchlistItem} contract. Guards against
 * corrupted localStorage payloads crashing the store on hydration.
 */
export function sanitizeWatchlist(
  value: unknown,
): Record<string, Array<WatchlistItem>> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

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
      if (
        typeof item === 'object' &&
        item !== null &&
        'contractId' in item &&
        'keyPath' in item &&
        'timestamp' in item &&
        typeof (item as Record<string, unknown>).contractId === 'string' &&
        typeof (item as Record<string, unknown>).keyPath === 'string' &&
        typeof (item as Record<string, unknown>).timestamp === 'number' &&
        Number.isFinite((item as Record<string, unknown>).timestamp as number)
      ) {
        validItems.push(item as unknown as WatchlistItem)
      }
    }

    if (validItems.length > 0) {
      sanitized[contractId] = validItems
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
