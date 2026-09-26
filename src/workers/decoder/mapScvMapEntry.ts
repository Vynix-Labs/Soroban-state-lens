/**
 * Maps a single ScvMap key/value entry into a [string, unknown] tuple
 * suitable for use with Object.fromEntries.
 *
 * Returns undefined when the key cannot be serialized to a string,
 * preventing collisions between multiple invalid keys.
 *
 * @param entry - Object with `key` and `val` fields
 * @param normalize - Function to normalize the value
 * @returns A tuple of [stringifiedKey, normalizedValue], or undefined if key is invalid
 */
export function mapScvMapEntry(
  entry: { key: unknown; val: unknown },
  normalize: (item: unknown) => unknown,
): [string, unknown] | undefined {
  let key: string | undefined
  try {
    const serialized = JSON.stringify(entry.key)
    key = typeof serialized === 'string' ? serialized : undefined
  } catch {
    key = undefined
  }

  // Return undefined if key cannot be serialized
  if (key === undefined) {
    return undefined
  }

  return [key, normalize(entry.val)]
}
