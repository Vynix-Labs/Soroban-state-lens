/**
 * Serializes an array of expanded node IDs into a compact JSON string.
 *
 * Requirements:
 * - Deterministic order preservation of the first occurrence.
 * - Duplicates removed.
 * - Compact JSON output.
 *
 * @param nodes Array of node IDs.
 * @returns Serialized JSON string.
 */
export function serializeExpandedNodes(nodes: Array<string>): string {
  if (!Array.isArray(nodes)) {
    return '[]'
  }

  // Filter out blank strings, then remove duplicates while preserving the first occurrence using a Set
  const validNodes = nodes.filter(
    (node) => typeof node === 'string' && node.trim().length > 0,
  )
  const uniqueNodes = Array.from(new Set(validNodes))

  return JSON.stringify(uniqueNodes)
}
