// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { sanitizePersistedNetworkConfig } from '../../lib/storage/sanitizePersistedNetworkConfig'
import { DEFAULT_NETWORKS } from '../../store/types'

const FUTURENET = DEFAULT_NETWORKS.futurenet

describe('sanitizePersistedNetworkConfig', () => {
  it('should return a valid config when all fields are present', () => {
    const input = {
      networkId: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: 'https://horizon-testnet.stellar.org',
    }
    expect(sanitizePersistedNetworkConfig(input)).toEqual(input)
  })

  it('should fallback horizonUrl to futurenet default when not provided', () => {
    const input = {
      networkId: 'custom',
      networkPassphrase: 'Custom Network',
      rpcUrl: 'https://custom.example.com',
    }
    expect(sanitizePersistedNetworkConfig(input)).toEqual({
      ...input,
      horizonUrl: FUTURENET.horizonUrl,
    })
  })

  it('should fallback to futurenet defaults for null input', () => {
    expect(sanitizePersistedNetworkConfig(null)).toEqual(FUTURENET)
  })

  it('should fallback to futurenet defaults for undefined input', () => {
    expect(sanitizePersistedNetworkConfig(undefined)).toEqual(FUTURENET)
  })

  it('should fallback to futurenet defaults for non-object input', () => {
    expect(sanitizePersistedNetworkConfig('string')).toEqual(FUTURENET)
    expect(sanitizePersistedNetworkConfig(123)).toEqual(FUTURENET)
    expect(sanitizePersistedNetworkConfig(true)).toEqual(FUTURENET)
  })

  it('should fallback to futurenet defaults for array input', () => {
    expect(sanitizePersistedNetworkConfig([])).toEqual(FUTURENET)
    expect(sanitizePersistedNetworkConfig([1, 2, 3])).toEqual(FUTURENET)
  })

  it('should fallback to futurenet defaults for empty object', () => {
    expect(sanitizePersistedNetworkConfig({})).toEqual(FUTURENET)
  })

  it('should coerce missing fields to futurenet defaults', () => {
    const input = { networkId: 'mainnet' }
    const result = sanitizePersistedNetworkConfig(input)
    expect(result.networkId).toBe('mainnet')
    expect(result.networkPassphrase).toBe(FUTURENET.networkPassphrase)
    expect(result.rpcUrl).toBe(FUTURENET.rpcUrl)
  })

  it('should coerce non-string fields to futurenet defaults', () => {
    const input = {
      networkId: 42,
      networkPassphrase: null,
      rpcUrl: false,
    }
    expect(sanitizePersistedNetworkConfig(input)).toEqual(FUTURENET)
  })

  it('should coerce empty string fields to futurenet defaults', () => {
    const input = {
      networkId: '',
      networkPassphrase: '  ',
      rpcUrl: '',
    }
    expect(sanitizePersistedNetworkConfig(input)).toEqual(FUTURENET)
  })

  it('should strip unknown keys', () => {
    const input = {
      networkId: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      unknownKey: 'should be stripped',
      anotherExtra: 42,
    }
    const result = sanitizePersistedNetworkConfig(input)
    expect(result).toEqual({
      networkId: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: FUTURENET.horizonUrl,
    })
    expect('unknownKey' in result).toBe(false)
    expect('anotherExtra' in result).toBe(false)
  })

  it('should fallback horizonUrl to futurenet default when invalid', () => {
    const input = {
      networkId: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: 123,
    }
    const result = sanitizePersistedNetworkConfig(input)
    expect(result.horizonUrl).toBe(FUTURENET.horizonUrl)
  })

  it('should not mutate the input object', () => {
    const input = {
      networkId: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: 'https://horizon-testnet.stellar.org',
    }
    const frozen = Object.freeze({ ...input })
    const result = sanitizePersistedNetworkConfig(frozen)
    expect(result).toEqual(input)
    expect(result).not.toBe(frozen)
  })

  it('should not return a reference to the shared fallback config', () => {
    const result = sanitizePersistedNetworkConfig(null)
    expect(result).toEqual(FUTURENET)
    expect(result).not.toBe(FUTURENET)
  })
})
