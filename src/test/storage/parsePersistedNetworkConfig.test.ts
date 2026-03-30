// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parsePersistedNetworkConfig } from '../../lib/storage/parsePersistedNetworkConfig'
import { DEFAULT_NETWORKS } from '../../store/types'

describe('parsePersistedNetworkConfig', () => {
  it('parses persisted preset values', () => {
    expect(
      parsePersistedNetworkConfig({
        kind: 'preset',
        networkId: 'testnet',
      }),
    ).toEqual(DEFAULT_NETWORKS.testnet)
  })

  it('parses persisted custom rpc values', () => {
    expect(
      parsePersistedNetworkConfig({
        kind: 'custom',
        rpcUrl: 'https://rpc.custom.example.com/',
      }),
    ).toEqual({
      networkId: 'custom',
      networkPassphrase: 'Custom Network',
      rpcUrl: 'https://rpc.custom.example.com',
      horizonUrl: DEFAULT_NETWORKS.futurenet.horizonUrl,
    })
  })

  it('supports the legacy persisted network config shape', () => {
    expect(
      parsePersistedNetworkConfig({
        networkId: 'mainnet',
        networkPassphrase: 'ignored',
        rpcUrl: 'https://ignored.example.com',
      }),
    ).toEqual(DEFAULT_NETWORKS.mainnet)
  })

  it('falls back safely on malformed payloads', () => {
    expect(parsePersistedNetworkConfig(null)).toEqual(
      DEFAULT_NETWORKS.futurenet,
    )
    expect(parsePersistedNetworkConfig('invalid')).toEqual(
      DEFAULT_NETWORKS.futurenet,
    )
    expect(
      parsePersistedNetworkConfig({
        kind: 'custom',
        rpcUrl: 'not-a-url',
      }),
    ).toEqual(DEFAULT_NETWORKS.futurenet)
  })
})
