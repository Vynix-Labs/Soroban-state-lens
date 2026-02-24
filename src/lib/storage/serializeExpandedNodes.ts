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

  // Remove duplicates while preserving the first occurrence using a Set
  const uniqueNodes = Array.from(new Set(nodes))

  return JSON.stringify(uniqueNodes)
}
