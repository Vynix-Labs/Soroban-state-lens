import { describe, expect, it } from 'vitest'
import { sanitizeNetworkId } from '../../lib/validation/sanitizeNetworkId'

describe('sanitizeNetworkId', () => {
  it('should return normalized known network IDs for valid inputs', () => {
    expect(sanitizeNetworkId('mainnet')).toBe('mainnet')
    expect(sanitizeNetworkId('testnet')).toBe('testnet')
    expect(sanitizeNetworkId('futurenet')).toBe('futurenet')
  })

  it('should be case-insensitive', () => {
    expect(sanitizeNetworkId('MAINNET')).toBe('mainnet')
    expect(sanitizeNetworkId('TestNet')).toBe('testnet')
    expect(sanitizeNetworkId('futureNET')).toBe('futurenet')
  })

  it('should trim whitespace from valid inputs', () => {
    expect(sanitizeNetworkId('  mainnet  ')).toBe('mainnet')
    expect(sanitizeNetworkId(' testnet ')).toBe('testnet')
  })

  it('should return "custom" for unknown network IDs', () => {
    expect(sanitizeNetworkId('unknown')).toBe('custom')
    expect(sanitizeNetworkId('custom-network')).toBe('custom')
  })

  it('should return "custom" for empty or whitespace-only strings', () => {
    expect(sanitizeNetworkId('')).toBe('custom')
    expect(sanitizeNetworkId('   ')).toBe('custom')
  })

  it('should return "custom" for nullish string casts', () => {
    expect(sanitizeNetworkId('null')).toBe('custom')
    expect(sanitizeNetworkId('undefined')).toBe('custom')
  })

  it('should return "custom" for non-string types safely (if cast)', () => {
    // @ts-ignore - testing runtime safety for invalid input types
    expect(sanitizeNetworkId(null)).toBe('custom')
    // @ts-ignore - testing runtime safety for invalid input types
    expect(sanitizeNetworkId(undefined)).toBe('custom')
  })
})
