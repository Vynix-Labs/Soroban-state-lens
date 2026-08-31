/**
 * Footprint key extraction utilities for Soroban State Lens
 * Parses read/write keys from simulation responses
 */

import { normalizeFootprintSection } from './normalizeFootprintKeys'

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

  const readOnly = normalizeFootprintSection(footprint.readOnly)
  const readWrite = normalizeFootprintSection(footprint.readWrite)

  return { readOnly, readWrite }
}
