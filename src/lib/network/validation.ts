/**
 * RPC URL validation utilities for Soroban State Lens
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates a custom RPC URL format
 *
 * Requirements:
 * - Must be HTTP or HTTPS protocol
 * - Must have valid hostname/domain
 * - Trims whitespace automatically
 *
 * @param url - The URL to validate
 * @returns ValidationResult with validity status and error message
 */
export function validateRpcUrl(url: string): ValidationResult {
  // Trim whitespace
  const trimmedUrl = url.trim()

  // Check if empty after trimming
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: 'RPC URL is required',
    }
  }

  // Check for completely malformed URLs (no protocol)
  if (!trimmedUrl.includes('://')) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    }
  }

  // Check protocol
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return {
      isValid: false,
      error: 'URL must start with http:// or https://',
    }
  }

  // Manual port validation before URL constructor since it throws on invalid ports
  const portMatch = trimmedUrl.match(/:(\d+)(?:\/|$)/)
  if (portMatch) {
    const port = parseInt(portMatch[1], 10)
    if (port < 1 || port > 65535) {
      return {
        isValid: false,
        error: 'Port must be between 1 and 65535',
      }
    }
  }

  try {
    // Use URL constructor to validate format
    const parsedUrl = new URL(trimmedUrl)

    // Ensure protocol is HTTP or HTTPS (URL constructor handles this, but double-check)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS protocols are supported',
      }
    }

    // Check if hostname exists
    if (!parsedUrl.hostname) {
      return {
        isValid: false,
        error: 'Invalid hostname',
      }
    }

    // Basic hostname validation (no spaces, valid characters)
    const hostnameRegex = /^[a-zA-Z0-9.-]+$/
    if (!hostnameRegex.test(parsedUrl.hostname)) {
      return {
        isValid: false,
        error: 'Hostname contains invalid characters',
      }
    }

    // Check for consecutive dots in hostname
    if (parsedUrl.hostname.includes('..')) {
      return {
        isValid: false,
        error: 'Invalid hostname format',
      }
    }

    // Optional: Validate port if specified
    if (parsedUrl.port) {
      const portNum = parseInt(parsedUrl.port, 10)
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return {
          isValid: false,
          error: 'Port must be between 1 and 65535',
        }
      }
    }

    return { isValid: true }
  } catch (error) {
    // URL constructor throws on invalid URLs
    // Check specific error cases for better error messages
    if (
      trimmedUrl.endsWith('://') ||
      (trimmedUrl.startsWith('https://') && trimmedUrl.length === 8) ||
      (trimmedUrl.startsWith('http://') && trimmedUrl.length === 7)
    ) {
      return {
        isValid: false,
        error: 'Invalid hostname',
      }
    }

    if (
      trimmedUrl.includes('://') &&
      !trimmedUrl.startsWith('http://') &&
      !trimmedUrl.startsWith('https://')
    ) {
      return {
        isValid: false,
        error: 'URL must start with http:// or https://',
      }
    }

    return {
      isValid: false,
      error: 'Invalid URL format',
    }
  }
}

/**
 * Sanitizes and validates a custom RPC URL
 * Returns the trimmed URL if valid, null otherwise
 */
export function sanitizeRpcUrl(url: string): string | null {
  const result = validateRpcUrl(url)
  return result.isValid ? url.trim() : null
}

/**
 * Common RPC URL patterns for testing
 */
export const VALID_RPC_URLS = [
  'https://rpc.stellar.org',
  'http://localhost:8000',
  'https://soroban-testnet.stellar.org',
  'https://my-rpc-server.com:443',
  'http://192.168.1.100:8000',
  'https://rpc.example.org/soroban',
  'http://127.0.0.1:8000',
]

export const INVALID_RPC_URLS = [
  '', // Empty
  '   ', // Whitespace only
  'ftp://rpc.stellar.org', // Wrong protocol
  'rpc.stellar.org', // Missing protocol
  'https://', // Missing hostname
  'https://', // Incomplete
  'http://invalid hostname.com', // Space in hostname
  'https://example..com', // Consecutive dots
  'http://localhost:99999', // Invalid port
  'not-a-url', // Invalid format
  'https://example.com:abc', // Non-numeric port
]
