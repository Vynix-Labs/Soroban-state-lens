/**
 * Serializes an array of expanded node IDs into a compact JSON string.
 *
 * Requirements:
 * - Deterministic order preservation of the first occurrence.
 * - Duplicates removed.
 * - Compact JSON output.
 * - Capped by a strict serialized-size budget so hydration remains safe.
 *
 * @param nodes Array of node IDs.
 * @param maxBytes Maximum serialized output size in UTF-16 code units.
 * @returns Serialized JSON string.
 */
export const MAX_SERIALIZED_EXPANDED_NODES_BYTES = 4096

export function serializeExpandedNodes(
  nodes: Array<string>,
  maxBytes: number = MAX_SERIALIZED_EXPANDED_NODES_BYTES,
): string {
  if (!Array.isArray(nodes)) {
    return '[]'
  }

  // Filter out blank strings, then remove duplicates while preserving the first occurrence using a Set
  const validNodes = nodes.filter(
    (node) => typeof node === 'string' && node.trim().length > 0,
  )
  const uniqueNodes = Array.from(new Set(validNodes))

  if (maxBytes <= 0) {
    return '[]'
  }

  const fullPayload = JSON.stringify(uniqueNodes)
  if (fullPayload.length <= maxBytes) {
    return fullPayload
  }

  let trimmedNodes: Array<string> = []
  let serialized = '[]'

  for (const node of uniqueNodes) {
    const candidate = JSON.stringify([...trimmedNodes, node])
    if (candidate.length > maxBytes) {
      break
    }
    trimmedNodes = [...trimmedNodes, node]
    serialized = candidate
  }

  return serialized
}
