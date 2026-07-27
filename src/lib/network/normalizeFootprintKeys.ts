/**
 * Footprint key normalization for Soroban State Lens.
 *
 * Turns a simulation result's footprint into a list of candidate discovery
 * keys. Where {@link extractFootprintKeys} performs a lightweight extraction of
 * the raw read/write string arrays, this module operates on the typed
 * simulation result and normalizes every key into one stable identity shape so
 * downstream discovery code can treat read and write keys uniformly.
 */

import type { SimulateTransactionResult } from './simulateTransaction'

/** Whether a footprint key belongs to the read-only or read-write section. */
export type FootprintAccess = 'read' | 'write'

/** A footprint ledger key normalized into one stable identity shape. */
export interface FootprintKey {
  /** Stable identity of the ledger key (its base64-encoded XDR string). */
  id: string
  /** Whether the key was found in the read-only or read-write footprint. */
  access: FootprintAccess
}

/** Candidate discovery keys derived from a simulation footprint. */
export interface NormalizedFootprint {
  /** Deduplicated, lexically ordered read-only keys. */
  readOnly: Array<string>
  /** Deduplicated, lexically ordered read-write keys. */
  readWrite: Array<string>
  /**
   * Flat, deduplicated, ordered list of every candidate key with its access
   * classification. Read keys come first (ordered), followed by write keys
   * (ordered). A key present in both footprint sections is reported once as
   * `write`, since write access implies read access.
   */
  keys: Array<FootprintKey>
}

/**
 * Extracts and normalizes read and write footprint keys from a simulation
 * result.
 *
 * Keys are trimmed, blank entries are dropped, duplicates are removed both
 * within and across the read/write sections, and the output is returned in a
 * predictable, lexically sorted order.
 *
 * @param result A simulation result, or null/undefined for none.
 * @returns Normalized read/write keys plus a unified, classified key list.
 */
export function normalizeFootprintKeys(
  result: SimulateTransactionResult | null | undefined,
): NormalizedFootprint {
  const footprint = result?.success ? result.footprint : undefined
  if (!footprint) {
    return { readOnly: [], readWrite: [], keys: [] }
  }

  const readOnly = normalizeSection(footprint.readOnly)
  const readWrite = normalizeSection(footprint.readWrite)

  const writeSet = new Set(readWrite)
  const keys: Array<FootprintKey> = [
    ...readOnly
      .filter((id) => !writeSet.has(id))
      .map((id): FootprintKey => ({ id, access: 'read' })),
    ...readWrite.map((id): FootprintKey => ({ id, access: 'write' })),
  ]

  return { readOnly, readWrite, keys }
}

/**
 * Trims, drops blanks, deduplicates, and lexically sorts a footprint section.
 */
function normalizeSection(section: Array<string> | undefined): Array<string> {
  if (!section) {
    return []
  }

  const seen = new Set<string>()
  for (const raw of section) {
    if (typeof raw !== 'string') {
      continue
    }
    const id = raw.trim()
    if (id !== '') {
      seen.add(id)
    }
  }

  return [...seen].sort()
}
