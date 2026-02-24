/**
 * Tests for custom RPC URL validation
 */

import { describe, expect, test } from 'vitest'

import {
  INVALID_RPC_URLS,
  VALID_RPC_URLS,
  validateRpcUrl,
} from '../../lib/network/validation'

describe('validateRpcUrl', () => {
  describe('valid URLs', () => {
    test.each(VALID_RPC_URLS)('should validate: %s', (url) => {
      const result = validateRpcUrl(url)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('invalid URLs', () => {
    test.each(INVALID_RPC_URLS)('should reject: %s', (url) => {
      const result = validateRpcUrl(url)
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('whitespace handling', () => {
    test('should trim whitespace from valid URLs', () => {
      const urlWithWhitespace = '  https://rpc.example.com  '
      const result = validateRpcUrl(urlWithWhitespace)
      expect(result.isValid).toBe(true)
    })

    test('should reject whitespace-only URLs', () => {
      const result = validateRpcUrl('   ')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('RPC URL is required')
    })
  })

  describe('protocol validation', () => {
    test('should accept HTTP URLs', () => {
      const result = validateRpcUrl('http://localhost:8000')
      expect(result.isValid).toBe(true)
    })

    test('should accept HTTPS URLs', () => {
      const result = validateRpcUrl('https://rpc.stellar.org')
      expect(result.isValid).toBe(true)
    })

    test('should reject FTP protocol', () => {
      const result = validateRpcUrl('ftp://rpc.stellar.org')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL must start with http:// or https://')
    })

    test('should reject WebSocket protocol', () => {
      const result = validateRpcUrl('ws://rpc.stellar.org')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL must start with http:// or https://')
    })
  })

  describe('hostname validation', () => {
    test('should accept domain names', () => {
      const result = validateRpcUrl('https://rpc.example.com')
      expect(result.isValid).toBe(true)
    })

    test('should accept IP addresses', () => {
      const result = validateRpcUrl('http://192.168.1.100:8000')
      expect(result.isValid).toBe(true)
    })

    test('should accept localhost', () => {
      const result = validateRpcUrl('http://localhost:8000')
      expect(result.isValid).toBe(true)
    })

    test('should reject invalid hostname with spaces', () => {
      const result = validateRpcUrl('https://invalid hostname.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })

    test('should reject hostname with consecutive dots', () => {
      const result = validateRpcUrl('https://example..com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid hostname format')
    })
  })

  describe('port validation', () => {
    test('should accept valid port numbers', () => {
      const result = validateRpcUrl('http://localhost:8080')
      expect(result.isValid).toBe(true)
    })

    test('should accept port in valid range', () => {
      const result = validateRpcUrl('https://rpc.example.com:65535')
      expect(result.isValid).toBe(true)
    })

    test('should reject port number too high', () => {
      const result = validateRpcUrl('http://localhost:99999')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Port must be between 1 and 65535')
    })

    test('should reject non-numeric port', () => {
      const result = validateRpcUrl('https://example.com:abc')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })
  })

  describe('edge cases', () => {
    test('should reject URLs without hostname', () => {
      const result = validateRpcUrl('https://')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid hostname')
    })

    test('should reject completely malformed URLs', () => {
      const result = validateRpcUrl('not-a-url')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })

    test('should accept URLs with paths', () => {
      const result = validateRpcUrl('https://rpc.example.com/soroban/rpc')
      expect(result.isValid).toBe(true)
    })

    test('should accept URLs with query parameters', () => {
      const result = validateRpcUrl('https://rpc.example.com?timeout=30')
      expect(result.isValid).toBe(true)
    })
  })
})
