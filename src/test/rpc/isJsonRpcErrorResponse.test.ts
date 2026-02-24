// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isJsonRpcErrorResponse } from '../../lib/rpc/isJsonRpcErrorResponse'

describe('isJsonRpcErrorResponse', () => {
    it('should return true for a valid error response', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: 1,
            error: {
                code: -32600,
                message: 'Invalid Request',
            },
        }
        expect(isJsonRpcErrorResponse(validResponse)).toBe(true)
    })

    it('should return true for error response with string ID', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: 'abc',
            error: {
                code: -32601,
                message: 'Method not found',
            },
        }
        expect(isJsonRpcErrorResponse(validResponse)).toBe(true)
    })

    it('should return true for error response with null ID', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
                code: -32700,
                message: 'Parse error',
            },
        }
        expect(isJsonRpcErrorResponse(validResponse)).toBe(true)
    })

    it('should return true for error response with data field', () => {
        const validResponse = {
            jsonrpc: '2.0',
            id: 1,
            error: {
                code: -32000,
                message: 'Server error',
                data: { details: 'Something went wrong' },
            },
        }
        expect(isJsonRpcErrorResponse(validResponse)).toBe(true)
    })

    it('should return false for success responses (result instead of error)', () => {
        const successResponse = {
            jsonrpc: '2.0',
            id: 1,
            result: 'success',
        }
        expect(isJsonRpcErrorResponse(successResponse)).toBe(false)
    })

    it('should return false if jsonrpc version is incorrect', () => {
        const invalidResponse = {
            jsonrpc: '1.0',
            id: 1,
            error: { code: 1, message: 'error' },
        }
        expect(isJsonRpcErrorResponse(invalidResponse)).toBe(false)
    })

    it('should return false if id is invalid type', () => {
        const invalidResponse = {
            jsonrpc: '2.0',
            id: {},
            error: { code: 1, message: 'error' },
        }
        expect(isJsonRpcErrorResponse(invalidResponse)).toBe(false)
    })

    it('should return false if error object is missing', () => {
        const invalidResponse = {
            jsonrpc: '2.0',
            id: 1,
        }
        expect(isJsonRpcErrorResponse(invalidResponse)).toBe(false)
    })

    it('should return false if error.code is non-numeric', () => {
        const invalidResponse = {
            jsonrpc: '2.0',
            id: 1,
            error: { code: '1', message: 'error' },
        }
        expect(isJsonRpcErrorResponse(invalidResponse)).toBe(false)
    })

    it('should return false if error.message is missing or empty', () => {
        expect(
            isJsonRpcErrorResponse({
                jsonrpc: '2.0',
                id: 1,
                error: { code: 1 },
            }),
        ).toBe(false)
        expect(
            isJsonRpcErrorResponse({
                jsonrpc: '2.0',
                id: 1,
                error: { code: 1, message: '' },
            }),
        ).toBe(false)
        expect(
            isJsonRpcErrorResponse({
                jsonrpc: '2.0',
                id: 1,
                error: { code: 1, message: '  ' },
            }),
        ).toBe(false)
    })

    it('should return false for non-object values', () => {
        expect(isJsonRpcErrorResponse(null)).toBe(false)
        expect(isJsonRpcErrorResponse(undefined)).toBe(false)
        expect(isJsonRpcErrorResponse('string')).toBe(false)
        expect(isJsonRpcErrorResponse(123)).toBe(false)
        expect(isJsonRpcErrorResponse([])).toBe(false)
    })
})
