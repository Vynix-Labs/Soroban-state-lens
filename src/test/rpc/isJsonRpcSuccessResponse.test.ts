// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isJsonRpcSuccessResponse } from '../../lib/rpc/isJsonRpcSuccessResponse'

describe('isJsonRpcSuccessResponse', () => {
    it('should return true for a valid success response', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: 1,
            result: 'success',
        }
        expect(isJsonRpcSuccessResponse(validResponse)).toBe(true)
    })

    it('should return true for success response with string ID', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: 'abc',
            result: { data: [1, 2, 3] },
        }
        expect(isJsonRpcSuccessResponse(validResponse)).toBe(true)
    })

    it('should return true for success response with null ID', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: null,
            result: 42,
        }
        expect(isJsonRpcSuccessResponse(validResponse)).toBe(true)
    })

    it('should return false for error responses (error instead of result)', () => {
        const errorResponse = {
            jsonrpc: '2.0',
            id: 1,
            error: {
                code: -32600,
                message: 'Invalid Request',
            },
        }
        expect(isJsonRpcSuccessResponse(errorResponse)).toBe(false)
    })

    it('should return false if both result and error are present', () => {
        const mixedResponse = {
            jsonrpc: '2.0',
            id: 1,
            result: 'success',
            error: {
                code: -32000,
                message: 'Mixed response',
            },
        }
        expect(isJsonRpcSuccessResponse(mixedResponse)).toBe(false)
    })

    it('should return false if jsonrpc version is incorrect', () => {
        const invalidResponse = {
            jsonrpc: '1.0',
            id: 1,
            result: 'success',
        }
        expect(isJsonRpcSuccessResponse(invalidResponse)).toBe(false)
    })

    it('should return false if id is invalid type', () => {
        const invalidResponse = {
            jsonrpc: '2.0',
            id: {},
            result: 'success',
        }
        expect(isJsonRpcSuccessResponse(invalidResponse)).toBe(false)
    })

    it('should return false if result field is missing', () => {
        const invalidResponse = {
            jsonrpc: '2.0',
            id: 1,
        }
        expect(isJsonRpcSuccessResponse(invalidResponse)).toBe(false)
    })

    it('should return false for non-object values', () => {
        expect(isJsonRpcSuccessResponse(null)).toBe(false)
        expect(isJsonRpcSuccessResponse(undefined)).toBe(false)
        expect(isJsonRpcSuccessResponse('string')).toBe(false)
        expect(isJsonRpcSuccessResponse(123)).toBe(false)
        expect(isJsonRpcSuccessResponse([])).toBe(false)
    })
})
