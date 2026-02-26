import { describe, expect, it } from 'vitest'
import { shouldRetryRpcError } from '../../lib/rpc/shouldRetryRpcError'

describe('shouldRetryRpcError', () => {
    describe('HTTP status codes', () => {
        it('should return true for 429 (Too Many Requests)', () => {
            expect(shouldRetryRpcError({ status: 429 })).toBe(true)
        })

        it('should return true for 5xx (Server Errors)', () => {
            expect(shouldRetryRpcError({ status: 500 })).toBe(true)
            expect(shouldRetryRpcError({ status: 503 })).toBe(true)
            expect(shouldRetryRpcError({ status: 504 })).toBe(true)
        })

        it('should return false for fatal 4xx (Client Errors)', () => {
            expect(shouldRetryRpcError({ status: 400 })).toBe(false)
            expect(shouldRetryRpcError({ status: 401 })).toBe(false)
            expect(shouldRetryRpcError({ status: 403 })).toBe(false)
            expect(shouldRetryRpcError({ status: 404 })).toBe(false)
        })

        it('should return false for unknown status codes (2xx, 3xx)', () => {
            expect(shouldRetryRpcError({ status: 200 })).toBe(false)
            expect(shouldRetryRpcError({ status: 302 })).toBe(false)
        })
    })

    describe('Error codes', () => {
        it('should return true for TIMEOUT code', () => {
            expect(shouldRetryRpcError({ code: 'TIMEOUT' })).toBe(true)
        })

        it('should return true for NETWORK_ERROR code', () => {
            expect(shouldRetryRpcError({ code: 'NETWORK_ERROR' })).toBe(true)
        })

        it('should return true for retryable JSON-RPC error codes', () => {
            expect(shouldRetryRpcError({ code: -32603 })).toBe(true)
            expect(shouldRetryRpcError({ code: -32000 })).toBe(true)
            expect(shouldRetryRpcError({ code: -32099 })).toBe(true)
            expect(shouldRetryRpcError({ code: '-32603' })).toBe(true)
        })

        it('should return false for non-retryable JSON-RPC error codes', () => {
            expect(shouldRetryRpcError({ code: -32600 })).toBe(false)
            expect(shouldRetryRpcError({ code: -32700 })).toBe(false)
        })

        it('should return false for unknown string codes', () => {
            expect(shouldRetryRpcError({ code: 'UNKNOWN_ERROR' })).toBe(false)
            expect(shouldRetryRpcError({ code: 'FATAL_ERROR' })).toBe(false)
        })
    })

    describe('Edge cases and invalid input', () => {
        it('should return false when both status and code are missing', () => {
            expect(shouldRetryRpcError({})).toBe(false)
        })

        it('should handle missing fields safely and return false', () => {
            expect(shouldRetryRpcError({ status: undefined })).toBe(false)
            expect(shouldRetryRpcError({ code: undefined })).toBe(false)
        })

        it('should return false for malformed status/code inputs', () => {
            expect(shouldRetryRpcError({ status: NaN })).toBe(false)
            expect(shouldRetryRpcError({ code: null as any })).toBe(false)
        })

        it('should prioritize retryable status over fatal code (if any)', () => {
            // Technically status is checked first in current implementation
            expect(shouldRetryRpcError({ status: 429, code: 'SOME_NON_RETRYABLE_CODE' })).toBe(true)
        })

        it('should prioritize fatal status over retryable code', () => {
            expect(shouldRetryRpcError({ status: 400, code: 'TIMEOUT' })).toBe(false)
        })
    })
})
