/**
 * Validates if a string is a valid Soroban contract ID.
 *
 * Requirements:
 * - Must start with 'C'.
 * - Must be exactly 56 characters long.
 * - Must contain only uppercase A-Z and digits 2-7 (base32 alphabet).
 * - Must be trimmed (no leading/trailing whitespace).
 * - Rejects empty strings, lowercase input, and whitespace-only values.
 *
 * @param value The string to validate.
 * @returns True if the value is a valid contract ID, false otherwise.
 */
export function isContractId(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '' || value !== value.trim()) {
    return false
  }

  if (!value.startsWith('C')) {
    return false
  }

  if (value.length !== 56) {
    return false
  }

  // Base32 uppercase alphanumerics: A-Z and 2-7
  return /^[A-Z2-7]+$/.test(value)
}
