// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { resolveNetworkPreset } from '../../lib/validation/resolveNetworkPreset'
import { DEFAULT_NETWORKS } from '../../store/types'

describe('resolveNetworkPreset', () => {
  it('should return config for "testnet"', () => {
    const result = resolveNetworkPreset('testnet')
    expect(result).toEqual(DEFAULT_NETWORKS.testnet)
  })

  it('should return config for "mainnet"', () => {
    const result = resolveNetworkPreset('mainnet')
    expect(result).toEqual(DEFAULT_NETWORKS.mainnet)
  })

  it('should return config for "futurenet"', () => {
    const result = resolveNetworkPreset('futurenet')
    expect(result).toEqual(DEFAULT_NETWORKS.futurenet)
  })

  it('should handle case-insensitive matching', () => {
    expect(resolveNetworkPreset('TESTNET')).toEqual(DEFAULT_NETWORKS.testnet)
    expect(resolveNetworkPreset('Mainnet')).toEqual(DEFAULT_NETWORKS.mainnet)
    expect(resolveNetworkPreset('FutureNet')).toEqual(
      DEFAULT_NETWORKS.futurenet,
    )
  })

  it('should handle leading and trailing whitespace', () => {
    expect(resolveNetworkPreset('  testnet  ')).toEqual(
      DEFAULT_NETWORKS.testnet,
    )
    expect(resolveNetworkPreset('\tmainnet\n')).toEqual(
      DEFAULT_NETWORKS.mainnet,
    )
  })

  it('should return null for unknown network IDs', () => {
    expect(resolveNetworkPreset('devnet')).toBeNull()
    expect(resolveNetworkPreset('localnet')).toBeNull()
    expect(resolveNetworkPreset('custom')).toBeNull()
  })

  it('should return null for empty strings', () => {
    expect(resolveNetworkPreset('')).toBeNull()
  })

  it('should return null for whitespace-only strings', () => {
    expect(resolveNetworkPreset('   ')).toBeNull()
    expect(resolveNetworkPreset('\t')).toBeNull()
  })

  it('should return null for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(resolveNetworkPreset(null)).toBeNull()
    // @ts-ignore - testing runtime behavior
    expect(resolveNetworkPreset(undefined)).toBeNull()
    // @ts-ignore - testing runtime behavior
    expect(resolveNetworkPreset(123)).toBeNull()
  })

  it('should return a copy, not a reference to the shared config', () => {
    const result = resolveNetworkPreset('testnet')
    expect(result).toEqual(DEFAULT_NETWORKS.testnet)
    expect(result).not.toBe(DEFAULT_NETWORKS.testnet)
  })

  it('should not allow mutation of the original config via the returned copy', () => {
    const result = resolveNetworkPreset('testnet')!
    result.rpcUrl = 'https://mutated.example.com'
    expect(DEFAULT_NETWORKS.testnet.rpcUrl).toBe(
      'https://soroban-testnet.stellar.org',
    )
  })
})
