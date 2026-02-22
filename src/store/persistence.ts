import { createJSONStorage } from 'zustand/middleware'

import { DEFAULT_NETWORKS } from './types'

import type { NetworkConfig } from './types'
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
  networkConfig: NetworkConfig
}

/**
 * Validates that a value is a valid NetworkConfig object
 */
export function isValidNetworkConfig(value: unknown): value is NetworkConfig {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const config = value as Record<string, unknown>

  return (
    typeof config.networkId === 'string' &&
    typeof config.networkPassphrase === 'string' &&
    typeof config.rpcUrl === 'string' &&
    config.networkId.length > 0 &&
    config.networkPassphrase.length > 0 &&
    config.rpcUrl.length > 0
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
  currentState: { networkConfig: NetworkConfig }
): { networkConfig: NetworkConfig } {
  if (
    typeof persistedState === 'object' &&
    persistedState !== null &&
    'networkConfig' in persistedState
  ) {
    const persisted = persistedState as { networkConfig: unknown }

    if (isValidNetworkConfig(persisted.networkConfig)) {
      return { networkConfig: persisted.networkConfig }
    }
  }

  // Return current state (with defaults) if persisted data is invalid
  return currentState
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
