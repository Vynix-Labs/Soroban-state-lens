import { DEFAULT_NETWORKS } from '../../store/types'
import type { NetworkConfig } from '../../store/types'

/**
 * Resolves a network ID to its preset NetworkConfig.
 *
 * Requirements:
 * - Returns a matching preset from DEFAULT_NETWORKS or null if not found.
 * - Uses sanitized ID matching (trimmed, lowercased).
 * - Returns a deep copy to avoid mutating shared config objects.
 *
 * @param id The network identifier to resolve.
 * @returns A copy of the matching NetworkConfig, or null if no preset matches.
 */
export function resolveNetworkPreset(id: string): NetworkConfig | null {
  if (typeof id !== 'string' || id.trim() === '') {
    return null
  }

  const sanitized = id.trim().toLowerCase()

  if (!(sanitized in DEFAULT_NETWORKS)) {
    return null
  }

  return { ...DEFAULT_NETWORKS[sanitized] }
}
