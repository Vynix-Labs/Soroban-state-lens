import { sanitizePersistedNetworkConfig } from './sanitizePersistedNetworkConfig';
import type { NetworkConfig } from '../../store/types';

/**
 * Sanitizes the persisted lens state.
 *
 * @param input - The raw persisted state object (unknown shape).
 * @returns A safe, normalized subset of the lens state.
 */
export function sanitizePersistedLensState(input: unknown): {
    networkConfig: NetworkConfig;
    expandedNodes: Array<string>;
} {
    const defaultNetworkConfig = sanitizePersistedNetworkConfig(undefined);

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return {
            networkConfig: defaultNetworkConfig,
            expandedNodes: [],
        };
    }

    const raw = input as Record<string, unknown>;

    // Sanitize networkConfig
    const networkConfig = sanitizePersistedNetworkConfig(raw.networkConfig);

    // Sanitize expandedNodes
    let expandedNodes: Array<string> = [];
    if (Array.isArray(raw.expandedNodes)) {
        expandedNodes = raw.expandedNodes.filter(
            (nodeId): nodeId is string =>
                typeof nodeId === 'string' && nodeId.trim().length > 0,
        );
    }

    return {
        networkConfig,
        expandedNodes,
    };
}
