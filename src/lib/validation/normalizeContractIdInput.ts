/**
 * Utility to normalize raw contract ID input before validation.
 * Trims whitespace, removes internal spaces, and converts to uppercase.
 */
export function normalizeContractIdInput(raw: string): string {
  // Handle cases where non-string values might be passed accidentally
  if (typeof raw !== 'string') {
    return ''
  }

  // Remove all whitespace (leading, trailing, and internal) and uppercase
  return raw.replace(/\s+/g, '').toUpperCase()
}
