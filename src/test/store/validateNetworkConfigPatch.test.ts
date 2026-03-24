import { describe, expect, it } from 'vitest'
import { validateNetworkConfigPatch } from '../../store/validateNetworkConfigPatch'

describe('validateNetworkConfigPatch', () => {
  it('should validate a valid full config patch', () => {
    const input = {
      networkId: 'testnet',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      horizonUrl: 'https://horizon-testnet.stellar.org',
    }
    const result = validateNetworkConfigPatch(input)
    expect(result.valid).toBe(true)
    expect(result.patch).toEqual(input)
    expect(result.errors).toBeUndefined()
  })

  it('should validate a valid partial config patch', () => {
    const input = {
      networkId: 'mainnet',
    }
    const result = validateNetworkConfigPatch(input)
    expect(result.valid).toBe(true)
    expect(result.patch).toEqual(input)
    expect(result.errors).toBeUndefined()
  })

  it('should reject unknown keys', () => {
    const input = {
      networkId: 'testnet',
      unknownKey: 'some value',
    }
    const result = validateNetworkConfigPatch(input)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Unknown key: unknownKey')
  })

  it('should reject invalid types', () => {
    const input = {
      networkId: 123, // Should be string
      rpcUrl: true, // Should be string
    }
    const result = validateNetworkConfigPatch(input)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid type for networkId: expected string, got number')
    expect(result.errors).toContain('Invalid type for rpcUrl: expected string, got boolean')
  })

  it('should reject non-object inputs', () => {
    expect(validateNetworkConfigPatch(null).valid).toBe(false)
    expect(validateNetworkConfigPatch(undefined).valid).toBe(false)
    expect(validateNetworkConfigPatch('string').valid).toBe(false)
    expect(validateNetworkConfigPatch(123).valid).toBe(false)
    expect(validateNetworkConfigPatch([]).valid).toBe(false)
  })

  it('should return multiple errors if applicable', () => {
    const input = {
      networkId: 123,
      extra: 'extra',
    }
    const result = validateNetworkConfigPatch(input)
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.errors).toContain('Unknown key: extra')
    expect(result.errors).toContain('Invalid type for networkId: expected string, got number')
  })
})
