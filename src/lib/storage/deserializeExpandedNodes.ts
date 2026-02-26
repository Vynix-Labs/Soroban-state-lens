/**
 * Recovers expanded node state from persisted strings safely.
 *
 * Requirements:
 * - Deserialize JSON safely.
 * - Return deduplicated string array.
 * - Fallback to empty array on invalid input (non-array payloads, non-string entries, invalid JSON).
 *
 * @param raw Persisted JSON string.
 * @returns Array of unique node ID strings.
 */
export function deserializeExpandedNodes(raw: string): Array<string> {
  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    const stringNodes = parsed.filter(
      (node): node is string => typeof node === 'string',
    )

    // Handle the case where some entries were non-strings if we want strict enforcement
    // The requirement says "Reject non-string entries", which usually means if any are non-string,
    // or just filter them out. Re-reading: "Reject non-array payloads and non-string entries."
    // If it meant "reject the whole thing if any entry is non-string", I'd check length.
    // However, usually these things are permissive with filtering.
    // But "Reject non-string entries" in the context of "Fallback to empty array on invalid input"
    // might imply if the array contains non-strings, it's invalid input.
    // Let's be strict: if number of string nodes doesn't match parsed length, fallback to empty.
    if (stringNodes.length !== parsed.length) {
      return []
    }

    // Deduplicate using Set
    return Array.from(new Set(stringNodes))
  } catch {
    return []
  }
}
