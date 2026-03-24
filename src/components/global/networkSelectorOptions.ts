import type { NetworkConfig } from '../../store/types'

export interface NetworkSelectorOption {
  value: string
  label: string
}

export function buildNetworkSelectorOptions(
  networks: Record<string, NetworkConfig> | null | undefined,
): Array<NetworkSelectorOption> {
  if (!networks) {
    return []
  }

  const entries = Object.entries(networks)

  if (entries.length === 0) {
    return []
  }

  return entries
    .filter(([, config]) => config.networkId)
    .map(([, config]) => ({
      value: config.networkId,
      label: config.networkId,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
