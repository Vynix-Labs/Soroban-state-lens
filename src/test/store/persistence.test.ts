import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_NETWORK_CONFIG,
  NETWORK_CONFIG_STORAGE_KEY,
  clearPersistedNetworkConfig,
  isValidNetworkConfig,
  mergeNetworkConfig,
  sanitizeNetworkSnapshots,
  sanitizeNetworkWatchlist,
  sanitizeSnapshots,
  sanitizeWatchlist,
  serializeNetworkConfigForStorage,
} from '../../store/persistence'
import {
  DEFAULT_NETWORKS,
  DEFAULT_SNAPSHOT_RETENTION_LIMIT,
} from '../../store/types'
import { useLensStore } from '@/store/lensStore'

// Simple localStorage mock for node environment
const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

const corruptHydrationFixtures: Array<unknown> = [
  '{"networkConfig":',
  [],
  { networkConfig: { kind: 'custom', rpcUrl: 42 } },
  { networkConfig: { kind: 'preset', networkId: 'unknown' }, watchlist: null },
]

// Mock window and localStorage globally for this test
Object.defineProperty(global, 'window', { value: global, writable: true })
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

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

    it('returns persisted preset config when valid', () => {
      const persistedState = {
        networkConfig: {
          kind: 'preset',
          networkId: 'testnet',
        },
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORKS.testnet)
    })

    it('returns persisted custom config when valid', () => {
      const persistedState = {
        networkConfig: {
          kind: 'custom',
          rpcUrl: 'https://rpc.custom.example.com/',
        },
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual({
        networkId: 'custom',
        networkPassphrase: 'Custom Network',
        rpcUrl: 'https://rpc.custom.example.com',
        horizonUrl: DEFAULT_NETWORKS.futurenet.horizonUrl,
      })
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

    it.each(corruptHydrationFixtures)(
      'falls back safely for corrupt hydration fixture %#',
      (persistedState) => {
        expect(() =>
          mergeNetworkConfig(persistedState, currentState),
        ).not.toThrow()
        expect(
          mergeNetworkConfig(persistedState, currentState).networkConfig,
        ).toEqual(DEFAULT_NETWORK_CONFIG)
      },
    )

    it('hydrates a sanitized watchlist alongside a valid networkConfig', () => {
      const watchlist = {
        C1: [
          {
            contractId: 'C1',
            keyPath: 'counter',
            timestamp: 1,
          },
        ],
      }
      const persistedState = {
        networkConfig: {
          kind: 'preset',
          networkId: 'testnet',
        },
        watchlist,
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.networkConfig).toEqual(DEFAULT_NETWORKS.testnet)
      expect(result.watchlist).toEqual({ testnet: watchlist })
    })

    it('drops invalid watchlist entries on hydration without crashing', () => {
      const persistedState = {
        networkConfig: {
          kind: 'preset',
          networkId: 'testnet',
        },
        watchlist: {
          C1: [
            { contractId: 'C1', keyPath: 'ok', timestamp: 1 },
            { contractId: 'C1', keyPath: 'bad' },
            'not-an-item',
            null,
            { contractId: 2, keyPath: 'bad', timestamp: 1 },
          ],
          '': [{ contractId: 'C1', keyPath: 'x', timestamp: 1 }],
          C2: 'not-an-array',
        },
      }
      const result = mergeNetworkConfig(persistedState, currentState)
      expect(result.watchlist).toEqual({
        testnet: {
          C1: [{ contractId: 'C1', keyPath: 'ok', timestamp: 1 }],
        },
      })
    })
  })

  describe('sanitizeWatchlist', () => {
    it('returns an empty record for non-object input', () => {
      expect(sanitizeWatchlist(null)).toEqual({})
      expect(sanitizeWatchlist('x')).toEqual({})
      expect(sanitizeWatchlist(undefined)).toEqual({})
    })

    it('drops contracts with empty keys or non-array items', () => {
      const result = sanitizeWatchlist({
        C1: [{ contractId: 'C1', keyPath: 'k', timestamp: 1 }],
        '': [{ contractId: 'C1', keyPath: 'k', timestamp: 1 }],
        C2: 'nope',
      })
      expect(result).toEqual({
        C1: [{ contractId: 'C1', keyPath: 'k', timestamp: 1 }],
      })
    })

    it('drops individual malformed items and keeps valid ones', () => {
      const result = sanitizeWatchlist({
        C1: [
          { contractId: 'C1', keyPath: 'k', timestamp: 1 },
          { contractId: 'C1', keyPath: 'k', timestamp: NaN },
          { contractId: 'C1' },
          { keyPath: 'k', timestamp: 1 },
          { contractId: 'C1', keyPath: 1, timestamp: 1 },
        ],
      })
      expect(result.C1).toHaveLength(1)
      expect(result.C1[0].keyPath).toBe('k')
    })

    it('sorts hydrated pins newest first with a key-path tie break', () => {
      const result = sanitizeWatchlist({
        C1: [
          { contractId: 'C1', keyPath: '/z', timestamp: 2 },
          { contractId: 'C1', keyPath: '/b', timestamp: 3 },
          { contractId: 'C1', keyPath: '/a', timestamp: 3 },
        ],
      })

      expect(result.C1.map(({ keyPath }) => keyPath)).toEqual([
        '/a',
        '/b',
        '/z',
      ])
    })

    it('drops future-dated items while preserving present and past items', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-27T12:00:00.000Z'))

      try {
        const now = Date.now()

        const result = sanitizeWatchlist({
          C1: [
            {
              contractId: 'C1',
              keyPath: 'present',
              timestamp: now,
            },
            {
              contractId: 'C1',
              keyPath: 'past',
              timestamp: now - 1,
            },
            {
              contractId: 'C1',
              keyPath: 'future',
              timestamp: now + 1,
            },
          ],
        })

        expect(result).toEqual({
          C1: [
            {
              contractId: 'C1',
              keyPath: 'present',
              timestamp: now,
            },
            {
              contractId: 'C1',
              keyPath: 'past',
              timestamp: now - 1,
            },
          ],
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('omits the contract entirely when every item is future-dated', () => {
      const now = Date.now()
      const result = sanitizeWatchlist({
        C1: [{ contractId: 'C1', keyPath: 'a', timestamp: now + 1000 }],
      })
      expect(result).toEqual({})
    })

    it('handles valid, future-dated, and malformed items together', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-27T12:00:00.000Z'))

      try {
        const now = Date.now()

        const result = sanitizeWatchlist({
          C1: [
            { contractId: 'C1', keyPath: 'valid', timestamp: now - 100 },
            { contractId: 'C1', keyPath: 'future', timestamp: now + 100 },
            {
              contractId: 'C1',
              keyPath: 'bad-type',
              timestamp: 'not-a-number',
            },
            null,
          ],
        })

        expect(result).toEqual({
          C1: [
            {
              contractId: 'C1',
              keyPath: 'valid',
              timestamp: now - 100,
            },
          ],
        })
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('sanitizeNetworkWatchlist', () => {
    it('returns an empty record for non-object input', () => {
      expect(sanitizeNetworkWatchlist(null, 'testnet')).toEqual({})
    })

    it('scopes legacy watchlist to the legacy network', () => {
      const result = sanitizeNetworkWatchlist(
        {
          C1: [{ contractId: 'C1', keyPath: 'k', timestamp: 1 }],
        },
        'testnet',
      )
      expect(result).toEqual({
        testnet: {
          C1: [{ contractId: 'C1', keyPath: 'k', timestamp: 1 }],
        },
      })
    })
  })

  describe('sanitizeSnapshots', () => {
    it('returns an empty record for non-object input', () => {
      expect(sanitizeSnapshots(null)).toEqual({})
      expect(sanitizeSnapshots('x')).toEqual({})
    })

    it('retains valid snapshots and drops malformed ones', () => {
      const timestamp = Date.now() - 100
      const result = sanitizeSnapshots({
        C1: [
          {
            id: 'snapshot-valid',
            contractId: 'C1',
            timestamp,
            ledgerSequence: 10,
            ledgerData: {
              key1: {
                key: 'key1',
                contractId: 'C1',
                type: 'ContractData',
                value: { count: 3 },
                lastModifiedLedger: 9,
              },
            },
          },
          {
            id: 'snapshot-malformed',
            contractId: 'C1',
            timestamp,
            ledgerSequence: 10,
            ledgerData: [],
          },
        ],
      })
      expect(result.C1).toHaveLength(1)
      expect(result.C1[0].id).toBe('snapshot-valid')
    })

    it('records a discarded-entry count for rejected records', () => {
      const result = sanitizeSnapshots({
        C1: [
          {
            id: 'partial',
            contractId: 'C1',
            timestamp: Date.now() - 1,
            ledgerSequence: 10,
            ledgerData: {
              good: {
                key: 'good',
                contractId: 'C1',
                type: 'ContractData',
                value: 42,
                lastModifiedLedger: 9,
              },
              bad: { key: 'wrong-key' },
            },
          },
          {
            id: 'empty',
            contractId: 'C1',
            timestamp: Date.now() - 1,
            ledgerSequence: 11,
            ledgerData: {},
          },
        ],
      })

      expect(result.C1[0]).toMatchObject({
        id: 'partial',
        incomplete: true,
        discardedEntryCount: 1,
      })
      expect(Object.keys(result.C1[0].ledgerData)).toEqual(['good'])
      expect(result.C1[1]).not.toHaveProperty('incomplete')
      expect(result.C1[1]).not.toHaveProperty('discardedEntryCount')
    })
  })

  describe('serializeNetworkConfigForStorage', () => {
    it('serializes a preset config', () => {
      const result = serializeNetworkConfigForStorage(DEFAULT_NETWORKS.testnet)
      expect(result).toMatchObject({ kind: 'preset', networkId: 'testnet' })
    })
  })

  describe('store integration', () => {
    it('default retention limit is exposed', () => {
      expect(DEFAULT_SNAPSHOT_RETENTION_LIMIT).toBeGreaterThan(0)
    })

    it('exposes the store for additional assertions', () => {
      expect(useLensStore.getState()).toBeTruthy()
    })
  })
})
