import { createJSONStorage } from 'zustand/middleware'
import { parsePersistedNetworkConfig } from '../lib/storage/parsePersistedNetworkConfig'
import { serializePersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'
import { validateNetworkConfigPatch } from './validateNetworkConfigPatch'
import {
  BigIntDisplayMode,
  ByteDisplayMode,
  DEFAULT_NETWORKS,
  DEFAULT_PREFERENCES,
  DisplayPreferences,
  NetworkConfig,
} from './types'
import type { PersistedNetworkConfig } from '../lib/storage/serializePersistedNetworkConfig'
import type { PersistStorage } from 'zustand/middleware'

/**
 * Storage key for network config persistence
 */
export const NETWORK_CONFIG_STORAGE_KEY = 'ssl.network-config.v1'

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

function unwrapPersistedState(persistedState: unknown): Record<string, unknown> | null {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return null
  }

  const persisted = persistedState as Record<string, unknown>

  if ('state' in persisted && typeof persisted.state === 'object' && persisted.state !== null) {
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
 * Hydration merge function that validates persisted data
 * Returns default config if persisted data is invalid
 */
export function mergeNetworkConfig(
  persistedState: unknown,
  currentState: { networkConfig: NetworkConfig },
): { networkConfig: NetworkConfig } {
  const hydratedState = unwrapPersistedState(persistedState)

  if (hydratedState && 'networkConfig' in hydratedState) {
    const parsedNetworkConfig = parsePersistedNetworkConfig(
      hydratedState.networkConfig,
    )

    if (isValidNetworkConfig(parsedNetworkConfig)) {
      return { networkConfig: parsedNetworkConfig }
    }

    console.warn(
      '[LensStore] Persisted network config is invalid, falling back to default',
      hydratedState.networkConfig,
    )
  }

  // Return current state (with defaults) if persisted data is invalid or missing
  return { networkConfig: currentState.networkConfig }
}

export function serializeNetworkConfigForStorage(
  networkConfig: NetworkConfig,
): PersistedNetworkConfig {
  return serializePersistedNetworkConfig(networkConfig)
}

/**
 * Hydration merge function for preferences
 * Validates persisted preferences and falls back to defaults for invalid values
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

    // Log if any values were corrected
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

  // Return current state (with defaults) if persisted data is invalid or missing
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
