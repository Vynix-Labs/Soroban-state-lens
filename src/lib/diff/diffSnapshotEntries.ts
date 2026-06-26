/**
 * Represents the diff state of a single ledger snapshot entry.
 */
import { compareNormalizedValuesDeep } from './compareNormalizedValuesDeep'

export type SnapshotEntryDiffStatus =
  | 'created'
  | 'deleted'
  | 'modified'
  | 'unchanged'

export interface SnapshotEntryDiff {
  key: string
  status: SnapshotEntryDiffStatus
  prevEntry?: unknown
  nextEntry?: unknown
}

export function diffSnapshotEntries(
  prevEntries: Record<string, unknown>,
  nextEntries: Record<string, unknown>,
): Array<SnapshotEntryDiff> {
  const diffResults: Array<SnapshotEntryDiff> = []
  const allKeys = new Set([...Object.keys(prevEntries), ...Object.keys(nextEntries)])

  for (const key of allKeys) {
    const hasPrev = Object.prototype.hasOwnProperty.call(prevEntries, key)
    const hasNext = Object.prototype.hasOwnProperty.call(nextEntries, key)
    const prevEntry = prevEntries[key]
    const nextEntry = nextEntries[key]

    if (hasPrev && !hasNext) {
      diffResults.push({ key, status: 'deleted', prevEntry })
      continue
    }

    if (!hasPrev && hasNext) {
      diffResults.push({ key, status: 'created', nextEntry })
      continue
    }

    if (compareNormalizedValuesDeep(prevEntry, nextEntry)) {
      diffResults.push({ key, status: 'unchanged', prevEntry, nextEntry })
    } else {
      diffResults.push({ key, status: 'modified', prevEntry, nextEntry })
    }
  }

  diffResults.sort((a, b) => a.key.localeCompare(b.key))
  return diffResults
}
