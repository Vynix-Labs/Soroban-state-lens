/**
 * Footprint key extraction utilities for Soroban State Lens
 * Parses read/write keys from simulation responses
 */

export interface FootprintKeys {
  readOnly: Array<string>
  readWrite: Array<string>
}

/**
 * Extracts and deduplicates footprint keys from a simulation response
 * Returns stable ordered, deduplicated read/write key lists
 */
export function extractFootprintKeys(
  footprint?: {
    readOnly?: Array<string>
    readWrite?: Array<string>
  } | null,
): FootprintKeys {
  if (!footprint) {
    return { readOnly: [], readWrite: [] }
  }

  // Deduplicate and sort for stable ordering
  const readOnly = [...new Set(footprint.readOnly ?? [])].sort()
  const readWrite = [...new Set(footprint.readWrite ?? [])].sort()

  return { readOnly, readWrite }
}
