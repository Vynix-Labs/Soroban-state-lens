import { createJSONStorage } from 'zustand/middleware'
import { parsePersistedNetworkConfig } from '../lib/storage/parsePersistedNetworkConfig'
import { serializePersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'

import { DEFAULT_NETWORKS } from './types'
import { validateNetworkConfigPatch } from './validateNetworkConfigPatch'

import type { NetworkConfig } from './types'
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
): { networkConfig: NetworkConfig } {
  if (
    typeof persistedState === 'object' &&
    persistedState !== null &&
    'networkConfig' in persistedState
  ) {
    const persisted = persistedState as { networkConfig: unknown }
    const parsedNetworkConfig = parsePersistedNetworkConfig(
      persisted.networkConfig,
    )

    if (isValidNetworkConfig(parsedNetworkConfig)) {
      return { networkConfig: parsedNetworkConfig }
    }

    console.warn(
      '[LensStore] Persisted network config is invalid, falling back to default',
      persisted.networkConfig,
    )
  }

  // Return current state (with defaults) if persisted data is invalid or missing
  return currentState
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
