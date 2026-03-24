import { NetworkConfig } from './types'

/**
 * Validates a partial network config patch.
 * Ensures only known keys are present and values have the correct types.
 *
 * @param input The input to validate (unknown)
 * @returns { valid: boolean; patch?: Partial<NetworkConfig>; errors?: string[] }
 */
export function validateNetworkConfigPatch(input: unknown): {
  valid: boolean
  patch?: Partial<NetworkConfig>
  errors?: string[]
} {
  const errors: string[] = []

  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return {
      valid: false,
      errors: ['Input must be an object'],
    }
  }

  const patch = input as Record<string, unknown>
  const validatedPatch: Partial<NetworkConfig> = {}
  const allowedKeys: (keyof NetworkConfig)[] = [
    'networkId',
    'networkPassphrase',
    'rpcUrl',
    'horizonUrl',
  ]

  // Check for unknown keys
  for (const key in patch) {
    if (!allowedKeys.includes(key as keyof NetworkConfig)) {
      errors.push(`Unknown key: ${key}`)
    }
  }

  // Check types for allowed keys
  for (const key of allowedKeys) {
    if (key in patch) {
      const value = patch[key]
      if (typeof value !== 'string') {
        errors.push(`Invalid type for ${key}: expected string, got ${typeof value}`)
      } else {
        // If type is correct, add to validated patch
        // Note: horizonUrl is optional, but if present, it must be a string
        ;(validatedPatch as any)[key] = value
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    }
  }

  return {
    valid: true,
    patch: validatedPatch,
  }
}
