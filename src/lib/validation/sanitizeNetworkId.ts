import { DEFAULT_NETWORKS } from '../../store/types'

export type NetworkId = 'futurenet' | 'testnet' | 'mainnet' | 'custom'

/**
 * Sanitizes and normalizes network identifiers.
 *
 * @param input - The network ID input to sanitize.
 * @returns A normalized network ID: 'futurenet', 'testnet', 'mainnet', or 'custom'.
 */
export function sanitizeNetworkId(input: string): NetworkId {
    if (!input || typeof input !== 'string' || input.trim() === '') {
        return 'custom'
    }

    const normalized = input.toLowerCase().trim()
    const knownNetworks = Object.keys(DEFAULT_NETWORKS)

    if (knownNetworks.includes(normalized)) {
        return normalized as 'futurenet' | 'testnet' | 'mainnet'
    }

    // Handle explicit nullish casts if passed as strings (e.g. from external JSON)
    if (normalized === 'null' || normalized === 'undefined') {
        return 'custom'
    }

    return 'custom'
}
