/**
 * Tiny mapper for ScvMap-like decoded collections
 * Converts entry arrays to normalized objects with deterministic key handling
 */

/**
 * Represents a single map entry with key and value
 */
export interface MapEntry {
  key: unknown
  val: unknown
}

/**
 * Converts a single map entry to a normalized key-value pair
 * Returns undefined for invalid entries
 */
export function mapScvMapEntry(
  entry: unknown,
  normalize: (item: unknown) => unknown,
): [string, unknown] | undefined {
  // Check if entry is valid object with key and val properties
  if (
    !entry ||
    typeof entry !== 'object' ||
    !('key' in entry) ||
    !('val' in entry)
  ) {
    return undefined
  }

  const { key, val } = entry as MapEntry

  try {
    // Normalize both key and value
    const normalizedKey = normalize(key)
    const normalizedValue = normalize(val)

    // Convert normalized key to string for object property
    // Use JSON.stringify for complex keys to ensure uniqueness
    const stringKey =
      typeof normalizedKey === 'string'
        ? normalizedKey
        : typeof normalizedKey === 'number' ||
            typeof normalizedKey === 'boolean'
          ? String(normalizedKey)
          : JSON.stringify(normalizedKey)

    return [stringKey, normalizedValue]
  } catch {
    // If normalization fails, skip this entry
    return undefined
  }
}

/**
 * Converts an array of map entries to a Record object
 * Uses deterministic overwrite-on-duplicate-key behavior
 * Skips invalid entries without throwing
 */
export function mapScvMap(
  entries: Array<{ key: unknown; val: unknown }>,
  normalize: (item: unknown) => unknown,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const entry of entries) {
    const mappedEntry = mapScvMapEntry(entry, normalize)

    if (mappedEntry) {
      const [key, value] = mappedEntry
      // Deterministic overwrite: later entries overwrite earlier ones
      result[key] = value
    }
    // Invalid entries are silently skipped
  }

  return result
}
