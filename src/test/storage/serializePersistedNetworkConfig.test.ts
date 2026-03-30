// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { serializePersistedNetworkConfig } from '../../lib/storage/serializePersistedNetworkConfig'
import { DEFAULT_NETWORKS } from '../../store/types'

describe('serializePersistedNetworkConfig', () => {
  it('serializes preset networks by id', () => {
    expect(serializePersistedNetworkConfig(DEFAULT_NETWORKS.testnet)).toEqual({
      kind: 'preset',
      networkId: 'testnet',
    })
  })

  it('serializes matching preset rpc urls as presets even with formatting differences', () => {
    expect(
      serializePersistedNetworkConfig({
        ...DEFAULT_NETWORKS.mainnet,
        rpcUrl: 'https://soroban.stellar.org/',
      }),
    ).toEqual({
      kind: 'preset',
      networkId: 'mainnet',
    })
  })

  it('serializes custom rpc configs with normalized urls', () => {
    expect(
      serializePersistedNetworkConfig({
        networkId: 'custom',
        networkPassphrase: 'Custom Network',
        rpcUrl: ' https://rpc.custom.example.com/path/ ',
      }),
    ).toEqual({
      kind: 'custom',
      rpcUrl: 'https://rpc.custom.example.com/path',
    })
  })

  it('falls back safely when the rpc url cannot be normalized', () => {
    expect(
      serializePersistedNetworkConfig({
        networkId: 'custom',
        networkPassphrase: 'Custom Network',
        rpcUrl: 'not-a-url',
      }),
    ).toEqual({
      kind: 'preset',
      networkId: 'futurenet',
    })
  })
})
