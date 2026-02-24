/**
 * Returns the immediate parent path for a given tree node path.
 * Paths use dot notation (e.g., 'a.b.c').
 * Dots can be escaped with a backslash (e.g., 'a.b\.c') to be treated as part of the node name.
 *
 * @param path The node path to find the parent for.
 * @returns {string | null} The parent path, or null if the path is at the root or invalid.
 */
export function parentTreeNodePath(path: string): string | null {
  if (!path) {
    return null
  }

  // Find all dots that are NOT preceded by a backslash
  // We use a lookbehind assertion to ensure we only split on unescaped dots
  const segments = path.split(/(?<!\\)\./)

  // If there's only one segment (or none), there is no parent
  if (segments.length <= 1) {
    return null
  }

  // Re-join all segments except the last one
  return segments.slice(0, -1).join('.')
}
