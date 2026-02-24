import { describe, it, expect } from 'vitest';
import { buildJsonRpcRequest } from '../../lib/rpc/buildJsonRpcRequest';

describe('buildJsonRpcRequest', () => {
    it('should construct a valid JSON-RPC 2.0 request payload (happy path)', () => {
        const method = 'getLatestLedger';
        const params = { foo: 'bar' };
        const id = 123;

        const result = buildJsonRpcRequest(method, params, id);

        expect(result).toEqual({
            jsonrpc: '2.0',
            method: 'getLatestLedger',
            params: { foo: 'bar' },
            id: 123,
        });
    });

    it('should throw an error if the method is an empty string', () => {
        expect(() => buildJsonRpcRequest('', {}, 1)).toThrow('JSON-RPC method name cannot be empty');
    });

    it('should throw an error if the method contains only whitespace', () => {
        expect(() => buildJsonRpcRequest('   ', {}, 1)).toThrow('JSON-RPC method name cannot be empty');
    });

    it('should preserve array params exactly', () => {
        const params = [1, 'two', { three: 3 }];
        const result = buildJsonRpcRequest('someMethod', params, 1);
        expect(result.params).toEqual(params);
        expect(Array.isArray(result.params)).toBe(true);
    });

    it('should preserve object params exactly', () => {
        const params = { key: 'value', nested: { a: 1 } };
        const result = buildJsonRpcRequest('someMethod', params, 1);
        expect(result.params).toEqual(params);
    });

    it('should handle null or undefined params if passed', () => {
        // While unknown, some RPCs might accept null params or zero params
        const resultNull = buildJsonRpcRequest('someMethod', null, 1);
        expect(resultNull.params).toBeNull();

        const resultUndefined = buildJsonRpcRequest('someMethod', undefined, 1);
        expect(resultUndefined.params).toBeUndefined();
    });
});
