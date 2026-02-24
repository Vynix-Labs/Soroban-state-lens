import { DEFAULT_NETWORKS } from '../../store/types'
import type { NetworkConfig } from '../../store/types'

const FALLBACK: NetworkConfig = DEFAULT_NETWORKS.futurenet

/**
 * Sanitizes an unknown persisted value into a safe NetworkConfig.
 *
 * Requirements:
 * - Returns a NetworkConfig with all required fields populated.
 * - Falls back to DEFAULT_NETWORKS.futurenet values for missing or invalid fields.
 * - Strips unknown keys not part of NetworkConfig.
 * - Coerces non-string or empty fields to the futurenet defaults.
 * - Never mutates the input or shared config objects.
 *
 * @param input The raw persisted value (unknown shape).
 * @returns A sanitized NetworkConfig with guaranteed valid fields.
 */
export function sanitizePersistedNetworkConfig(
  input: unknown,
): NetworkConfig {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ...FALLBACK }
  }

  const raw = input as Record<string, unknown>

  const networkId = isNonEmptyString(raw.networkId)
    ? raw.networkId
    : FALLBACK.networkId

  const networkPassphrase = isNonEmptyString(raw.networkPassphrase)
    ? raw.networkPassphrase
    : FALLBACK.networkPassphrase

  const rpcUrl = isNonEmptyString(raw.rpcUrl)
    ? raw.rpcUrl
    : FALLBACK.rpcUrl

  return {
    networkId,
    networkPassphrase,
    rpcUrl,
    horizonUrl: isNonEmptyString(raw.horizonUrl)
      ? raw.horizonUrl
      : FALLBACK.horizonUrl,
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
