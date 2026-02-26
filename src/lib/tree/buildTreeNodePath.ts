/**
 * Builds a canonical tree node path from an array of path parts.
 *
 * Escaping strategy:
 * - Literal dots within path segments are escaped with backslashes (e.g., "a.b" becomes "a\.b")
 * - Backslashes themselves are escaped (e.g., "a\b" becomes "a\\b")
 * - Empty parts are rejected as they would create ambiguous paths
 *
 * The resulting path uses dot notation as separator between escaped segments.
 * This creates deterministic, reversible paths that can be parsed back to original parts.
 *
 * @param parts - Array of path segments to join
 * @returns A deterministic path string with escaped segments joined by dots
 * @throws Error if any part is empty or contains only whitespace
 */
export function buildTreeNodePath(parts: Array<string>): string {
  // Validate input - reject null/undefined or empty parts
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!parts || parts.length === 0) {
    throw new Error('Path parts array cannot be empty')
  }

  // Validate each part is non-empty after trimming
  for (const part of parts) {
    // Handle null/undefined cases for runtime safety (when called with 'any' types)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (part == null) {
      throw new Error('Path part cannot be null or undefined')
    }
    if (part.trim() === '') {
      throw new Error('Path part cannot be empty or whitespace-only')
    }
  }

  // Escape each part and join with dots
  const escapedParts = parts.map(escapePathSegment)
  return escapedParts.join('.')
}

/**
 * Escapes a single path segment for safe inclusion in a tree node path.
 *
 * Escaping rules:
 * - Dots (.) are escaped as (\.)
 * - Backslashes (\) are escaped as (\\)
 * - This ensures dots can be used literally within segment names
 *
 * @param segment - The path segment to escape
 * @returns The escaped segment safe for path joining
 */
function escapePathSegment(segment: string): string {
  // Escape backslashes first, then dots (to avoid double-escaping)
  return segment
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/\./g, '\\.') // Escape dots
}
