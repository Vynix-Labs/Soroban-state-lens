/**
 * Footprint key extraction utilities for Soroban State Lens
 * Parses read/write keys from simulation responses
 */

import { compareCodeUnitStrings } from './normalizeFootprintKeys'

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

  // Deduplicate and sort for stable ordering using explicit code-unit ordering.
  const readOnly = [...new Set(footprint.readOnly ?? [])].sort(
    compareCodeUnitStrings,
  )
  const readWrite = [...new Set(footprint.readWrite ?? [])].sort(
    compareCodeUnitStrings,
  )

  return { readOnly, readWrite }
}
