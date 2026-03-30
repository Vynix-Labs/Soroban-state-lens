import { DEFAULT_NETWORKS } from '../../store/types'
import { normalizeRpcUrl } from '../validation/normalizeRpcUrl'

import type { NetworkConfig } from '../../store/types'

export type PersistedNetworkConfig =
  | {
      kind: 'preset'
      networkId: 'futurenet' | 'testnet' | 'mainnet'
    }
  | {
      kind: 'custom'
      rpcUrl: string
    }

const PRESET_NETWORK_IDS = new Set(['futurenet', 'testnet', 'mainnet'])

export function serializePersistedNetworkConfig(
  config: NetworkConfig,
): PersistedNetworkConfig {
  const networkId = config.networkId.trim()

  if (PRESET_NETWORK_IDS.has(networkId)) {
    const preset = DEFAULT_NETWORKS[networkId]
    const currentRpcUrl = normalizeRpcUrl(config.rpcUrl)
    const presetRpcUrl = normalizeRpcUrl(preset.rpcUrl)

    if (currentRpcUrl === '' || currentRpcUrl === presetRpcUrl) {
      return {
        kind: 'preset',
        networkId: networkId as 'futurenet' | 'testnet' | 'mainnet',
      }
    }
  }

  const rpcUrl = normalizeRpcUrl(config.rpcUrl)
  if (rpcUrl !== '') {
    return {
      kind: 'custom',
      rpcUrl,
    }
  }

  return {
    kind: 'preset',
    networkId: 'futurenet',
  }
}
