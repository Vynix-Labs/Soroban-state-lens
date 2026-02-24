/**
 * Normalizes an RPC URL into a stable persisted form.
 *
 * Normalization Rules:
 * - Trim whitespace.
 * - Remove trailing slash (including repeated ones).
 * - Mixed-case protocol handled safely (lowercased).
 * - Preserve pathname, query parameters, and hashes.
 * - Return empty string if invalid.
 *
 * @param raw The raw URL string to normalize.
 * @returns The normalized URL string or an empty string if invalid.
 */
export function normalizeRpcUrl(raw: string): string {
  if (!raw || raw.trim() === '') {
    return ''
  }

  try {
    const url = new URL(raw.trim())

    // URL constructor handles lowercasing the protocol and basic normalization.
    // We need to construct the result carefully to handle trailing slashes.

    let normalized = url.protocol + '//' + url.host + url.pathname

    // Remove trailing slashes from the pathname part
    while (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }

    // Append search and hash if present
    normalized += url.search + url.hash

    return normalized
  } catch {
    return ''
  }
}
