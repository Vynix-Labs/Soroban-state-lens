/**
 * Validates if a string is a valid RPC URL for local configuration safety.
 *
 * Requirements:
 * - Must be a valid absolute URL.
 * - Must use http or https protocol.
 * - Must have a host.
 * - Must NOT contain credentials (username/password).
 * - Must NOT be whitespace-only.
 * - Rejects ftp, ws, data URLs.
 *
 * @param value The string to validate.
 * @returns True if the value is a valid RPC URL, false otherwise.
 */
export function isRpcUrl(value: string): boolean {
  if (!value || value.trim() === '') {
    return false
  }

  try {
    const url = new URL(value)

    // Enforce protocol (http or https only)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    // Enforce host presence and basic validity
    if (!url.hostname || url.hostname.startsWith('.')) {
      return false
    }

    // Reject credentials
    if (url.username || url.password) {
      return false
    }

    return true
  } catch {
    return false
  }
}
