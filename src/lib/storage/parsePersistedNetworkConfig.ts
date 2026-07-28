import { DEFAULT_NETWORKS } from '../../store/types'
import { normalizeRpcUrl } from '../validation/normalizeRpcUrl'

import type { NetworkConfig } from '../../store/types'
import type { PersistedNetworkConfig } from './serializePersistedNetworkConfig'

const FALLBACK = DEFAULT_NETWORKS.futurenet

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePreset(networkId: unknown): NetworkConfig | null {
  if (
    networkId === 'futurenet' ||
    networkId === 'testnet' ||
    networkId === 'mainnet'
  ) {
    return { ...DEFAULT_NETWORKS[networkId] }
  }

  return null
}

function parseCustom(
  rpcUrl: unknown,
  networkPassphrase?: unknown,
): NetworkConfig | null {
  if (typeof rpcUrl !== 'string') {
    return null
  }

  const normalizedRpcUrl = normalizeRpcUrl(rpcUrl)
  if (normalizedRpcUrl === '') {
    return null
  }

  const passphrase =
    typeof networkPassphrase === 'string' && networkPassphrase.trim().length > 0
      ? networkPassphrase.trim()
      : 'Custom Network'

  return {
    networkId: 'custom',
    networkPassphrase: passphrase,
    rpcUrl: normalizedRpcUrl,
    horizonUrl: FALLBACK.horizonUrl,
  }
}

function parseLegacyNetworkConfig(
  input: Record<string, unknown>,
): NetworkConfig | null {
  const preset = parsePreset(input.networkId)
  if (preset !== null) {
    return preset
  }

  return parseCustom(input.rpcUrl, input.networkPassphrase)
}

export function parsePersistedNetworkConfig(input: unknown): NetworkConfig {
  if (!isObjectRecord(input)) {
    return { ...FALLBACK }
  }

  const persisted = input as PersistedNetworkConfig | Record<string, unknown>

  if (persisted.kind === 'preset') {
    return parsePreset(persisted.networkId) ?? { ...FALLBACK }
  }

  if (persisted.kind === 'custom') {
    return (
      parseCustom(persisted.rpcUrl, persisted.networkPassphrase) ?? {
        ...FALLBACK,
      }
    )
  }

  return parseLegacyNetworkConfig(input) ?? { ...FALLBACK }
}
