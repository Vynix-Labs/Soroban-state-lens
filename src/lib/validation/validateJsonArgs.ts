export interface JsonArgsValidatorResult {
  valid: boolean
  error?: string
  parsed?: unknown
}

/**
 * Safely parses and validates a string as JSON arguments.
 *
 * Requirements:
 * - Empty or whitespace-only inputs are treated as valid (resolving to an empty array).
 * - Non-empty inputs must be valid parseable JSON.
 * - Safely handles non-string inputs by returning a validation failure.
 *
 * @param input The input string to validate.
 * @returns A validation result indicating success/failure and any parsing errors.
 */
export function validateJsonArgs(input: unknown): JsonArgsValidatorResult {
  if (input === null || input === undefined) {
    return { valid: true, parsed: [] }
  }

  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' }
  }

  const trimmed = input.trim()
  if (trimmed === '') {
    return { valid: true, parsed: [] }
  }

  try {
    const parsed = JSON.parse(trimmed)
    return { valid: true, parsed }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid JSON'
    return {
      valid: false,
      error: `Invalid JSON format: ${errorMessage}`,
    }
  }
}
