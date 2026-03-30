import { describe, expect, it } from 'vitest'
import { buildNetworkSelectorOptions } from '../../components/global/networkSelectorOptions'
import { DEFAULT_NETWORKS } from '../../store/types'
import type { NetworkConfig } from '../../store/types'

describe('buildNetworkSelectorOptions', () => {
  it('should return sorted options for DEFAULT_NETWORKS', () => {
    const result = buildNetworkSelectorOptions(DEFAULT_NETWORKS)

    expect(result).toEqual([
      { value: 'futurenet', label: 'futurenet' },
      { value: 'mainnet', label: 'mainnet' },
      { value: 'testnet', label: 'testnet' },
    ])
  })

  it('should return empty array for empty object', () => {
    const result = buildNetworkSelectorOptions({})
    expect(result).toEqual([])
  })

  it('should handle networks with missing networkId gracefully', () => {
    const networks: Record<string, NetworkConfig> = {
      valid: {
        networkId: 'valid-network',
        networkPassphrase: 'Test',
        rpcUrl: 'https://test.com',
      },
      invalid: {
        networkId: '',
        networkPassphrase: 'Test',
        rpcUrl: 'https://test.com',
      },
      missingId: {
        networkPassphrase: 'Test',
        rpcUrl: 'https://test.com',
      } as NetworkConfig,
    }

    const result = buildNetworkSelectorOptions(networks)
    expect(result).toEqual([{ value: 'valid-network', label: 'valid-network' }])
  })

  it('should sort options alphabetically by label', () => {
    const networks: Record<string, NetworkConfig> = {
      zeta: {
        networkId: 'zeta',
        networkPassphrase: 'Test',
        rpcUrl: 'https://test.com',
      },
      alpha: {
        networkId: 'alpha',
        networkPassphrase: 'Test',
        rpcUrl: 'https://test.com',
      },
      beta: {
        networkId: 'beta',
        networkPassphrase: 'Test',
        rpcUrl: 'https://test.com',
      },
    }

    const result = buildNetworkSelectorOptions(networks)
    expect(result).toEqual([
      { value: 'alpha', label: 'alpha' },
      { value: 'beta', label: 'beta' },
      { value: 'zeta', label: 'zeta' },
    ])
  })

  it('should handle null/undefined input gracefully', () => {
    const result1 = buildNetworkSelectorOptions(null as any)
    const result2 = buildNetworkSelectorOptions(undefined as any)

    expect(result1).toEqual([])
    expect(result2).toEqual([])
  })
})
