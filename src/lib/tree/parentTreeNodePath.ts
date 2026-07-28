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

  // A dot is a separator when preceded by an even number of backslashes.
  // An odd count means the dot is escaped; scanning from the end finds the
  // immediate parent without rewriting the encoded path.
  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (path[index] !== '.') {
      continue
    }

    let backslashCount = 0
    for (let preceding = index - 1; preceding >= 0 && path[preceding] === '\\'; preceding -= 1) {
      backslashCount += 1
    }

    if (backslashCount % 2 === 0) {
      return path.slice(0, index)
    }
  }

  return null
}
