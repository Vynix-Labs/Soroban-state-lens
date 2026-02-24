import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_NETWORK_CONFIG,
  NETWORK_CONFIG_STORAGE_KEY,
  clearPersistedNetworkConfig,
  isValidNetworkConfig,
  mergeNetworkConfig,
} from '../../store/persistence'
import { DEFAULT_NETWORKS } from '../../store/types'

describe('persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearPersistedNetworkConfig()
    vi.clearAllMocks()
  })

  describe('NETWORK_CONFIG_STORAGE_KEY', () => {
    it('has correct storage key format', () => {
      expect(NETWORK_CONFIG_STORAGE_KEY).toBe('ssl.network-config.v1')
    })
  })

  describe('DEFAULT_NETWORK_CONFIG', () => {
    it('defaults to futurenet', () => {
      expect(DEFAULT_NETWORK_CONFIG).toEqual(DEFAULT_NETWORKS.futurenet)
    })

    it('has valid network config structure', () => {
      expect(isValidNetworkConfig(DEFAULT_NETWORK_CONFIG)).toBe(true)
    })
  })

  describe('isValidNetworkConfig', () => {
    it('returns true for valid network config', () => {
      const validConfig = {
        networkId: 'testnet',
        networkPassphrase: 'Test Network',
        rpcUrl: 'https://rpc.test.com',
      }
      expect(isValidNetworkConfig(validConfig)).toBe(true)
    })

    it('returns true for config with optional horizonUrl', () => {
      const validConfig = {
        networkId: 'mainnet',
        networkPassphrase: 'Public Network',
        rpcUrl: 'https://rpc.main.com',
        horizonUrl: 'https://horizon.main.com',
      }
      expect(isValidNetworkConfig(validConfig)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isValidNetworkConfig(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidNetworkConfig(undefined)).toBe(false)
    })

    it('returns false for non-object', () => {
      expect(isValidNetworkConfig('string')).toBe(false)
      expect(isValidNetworkConfig(123)).toBe(false)
      expect(isValidNetworkConfig(true)).toBe(false)
    })

    it('returns false when networkId is missing', () => {
      const config = {
        networkPassphrase: 'Test Network',
        rpcUrl: 'https://rpc.test.com',
      }
      expect(isValidNetworkConfig(config)).toBe(false)
    })

    it('returns false when networkPassphrase is missing', () => {
      const config = {
        networkId: 'testnet',
        rpcUrl: 'https://rpc.test.com',
      }
      expect(isValidNetworkConfig(config)).toBe(false)
    })

    it('returns false when rpcUrl is missing', () => {
      const config = {
        networkId: 'testnet',
        networkPassphrase: 'Test Network',
      }
      expect(isValidNetworkConfig(config)).toBe(false)
    })

    it('returns false when networkId is empty string', () => {
      const config = {
        networkId: '',
        networkPassphrase: 'Test Network',
        rpcUrl: 'https://rpc.test.com',
      }
      expect(isValidNetworkConfig(config)).toBe(false)
    })

    it('returns false when values are wrong type', () => {
      const config = {
        networkId: 123,
        networkPassphrase: 'Test Network',
        rpcUrl: 'https://rpc.test.com',
      }
      expect(isValidNetworkConfig(config)).toBe(false)
    })
  })

  describe('mergeNetworkConfig', () => {
    const currentState = { networkConfig: DEFAULT_NETWORK_CONFIG }

    it('returns persisted config when valid', () => {
      const persistedState = {
        networkConfig: DEFAULT_NETWORKS.testnet,
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORKS.testnet)
    })

    it('returns current state when persisted state is null', () => {
      const result = mergeNetworkConfig(null, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORK_CONFIG)
    })

    it('returns current state when persisted state is undefined', () => {
      const result = mergeNetworkConfig(undefined, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORK_CONFIG)
    })

    it('returns current state when persisted networkConfig is invalid', () => {
      const persistedState = {
        networkConfig: { invalid: 'data' },
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORK_CONFIG)
    })

    it('returns current state when persisted state has no networkConfig', () => {
      const persistedState = {
        someOtherData: 'value',
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORK_CONFIG)
    })

    it('returns current state when persisted state is corrupt JSON', () => {
      const persistedState = 'not an object'
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORK_CONFIG)
    })
  })

  describe('clearPersistedNetworkConfig', () => {
    it('removes the storage key', () => {
      // Set a value first
      localStorage.setItem(
        NETWORK_CONFIG_STORAGE_KEY,
        JSON.stringify({ test: true }),
      )
      expect(localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)).not.toBeNull()

      // Clear it
      clearPersistedNetworkConfig()
      expect(localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)).toBeNull()
    })

    it('does not throw when key does not exist', () => {
      expect(() => clearPersistedNetworkConfig()).not.toThrow()
    })
  })
})
