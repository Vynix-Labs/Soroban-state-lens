/**
 * Removes duplicate keys from an array while preserving the order of first occurrence.
 * Maintains the original key values exactly as they appear.
 *
 * @param keys - The array of key strings, potentially containing duplicates
 * @returns A new array with duplicates removed, preserving first-seen order
 */
export function deduplicateKeys(keys: Array<string>): Array<string> {
  const seen = new Set<string>()
  const deduped: Array<string> = []

  for (const key of keys) {
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(key)
    }
  }

  return deduped
}
