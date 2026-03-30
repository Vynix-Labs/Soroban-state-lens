/**
 * Validates if a string is a valid Soroban contract function name.
 *
 * Requirements:
 * - Must not be blank after trimming.
 * - Must start with a lowercase letter or underscore.
 * - Must contain only lowercase letters, digits, and underscores.
 * - Maximum 64 characters (Soroban symbol limit).
 *
 * @param value The string to validate.
 * @returns True if the value is a valid function name, false otherwise.
 */
export function isFunctionName(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false
  }
  const trimmed = value.trim()

  if (trimmed.length > 64) {
    return false
  }

  return /^[a-z_][a-z0-9_]*$/.test(trimmed)
}
