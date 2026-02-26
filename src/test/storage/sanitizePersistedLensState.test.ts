import { describe, expect, it } from 'vitest';
import { sanitizePersistedLensState } from '../../lib/storage/sanitizePersistedLensState';
import { DEFAULT_NETWORKS } from '../../store/types';

describe('sanitizePersistedLensState', () => {
    const defaultNetworkConfig = DEFAULT_NETWORKS.futurenet;

    it('should return default state for invalid input types', () => {
        const expected = {
            networkConfig: defaultNetworkConfig,
            expandedNodes: [],
        };

        expect(sanitizePersistedLensState(null)).toEqual(expected);
        expect(sanitizePersistedLensState(undefined)).toEqual(expected);
        expect(sanitizePersistedLensState('invalid')).toEqual(expected);
        expect(sanitizePersistedLensState([])).toEqual(expected);
    });

    it('should sanitize valid persisted state', () => {
        const input = {
            networkConfig: {
                networkId: 'testnet',
                networkPassphrase: 'Test SDF Network ; September 2015',
                rpcUrl: 'https://soroban-testnet.stellar.org',
                horizonUrl: 'https://horizon-testnet.stellar.org',
            },
            expandedNodes: ['node1', 'node2'],
        };

        expect(sanitizePersistedLensState(input)).toEqual(input);
    });

    it('should handle partial state and use defaults', () => {
        const input = {
            expandedNodes: ['node1'],
        };

        const result = sanitizePersistedLensState(input);
        expect(result.networkConfig).toEqual(defaultNetworkConfig);
        expect(result.expandedNodes).toEqual(['node1']);
    });

    it('should sanitize invalid networkConfig within state', () => {
        const input = {
            networkConfig: {
                networkId: '', // invalid
                rpcUrl: 123, // invalid
            },
        };

        const result = sanitizePersistedLensState(input);
        expect(result.networkConfig).toEqual(defaultNetworkConfig);
    });

    it('should sanitize invalid expandedNodes', () => {
        const input = {
            expandedNodes: ['node1', '', 123, null],
        };

        const result = sanitizePersistedLensState(input);
        expect(result.expandedNodes).toEqual(['node1']);
    });

    it('should strip unknown top-level fields', () => {
        const input = {
            networkConfig: defaultNetworkConfig,
            expandedNodes: [],
            unknownField: 'value',
            anotherOne: { key: 'val' },
        };

        const result = sanitizePersistedLensState(input);
        expect(result).not.toHaveProperty('unknownField');
        expect(result).not.toHaveProperty('anotherOne');
        expect(result).toEqual({
            networkConfig: defaultNetworkConfig,
            expandedNodes: [],
        });
    });
});
