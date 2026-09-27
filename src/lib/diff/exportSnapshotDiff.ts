import { diffSnapshotEntries } from './diffSnapshotEntries'

import type { ContractSnapshot } from '../../store/types'
import type { SnapshotEntryDiff } from './diffSnapshotEntries'

export interface SnapshotDiffExport {
  contractId: string
  prevSnapshot: {
    id: string
    label: string | undefined
    timestamp: number
  }
  nextSnapshot: {
    id: string
    label: string | undefined
    timestamp: number
  }
  diff: Array<SnapshotEntryDiff>
  summary: {
    created: number
    deleted: number
    modified: number
    unchanged: number
    total: number
  }
  exportedAt: number
}

/**
 * Exports a snapshot comparison as a readable JSON structure.
 * @param prevSnapshot - The previous snapshot
 * @param nextSnapshot - The next snapshot
 * @returns A JSON-serializable object containing the diff
 */
export function exportSnapshotDiff(
  prevSnapshot: ContractSnapshot,
  nextSnapshot: ContractSnapshot,
): SnapshotDiffExport {
  const diff = diffSnapshotEntries(
    prevSnapshot.ledgerData,
    nextSnapshot.ledgerData,
  )

  const summary = {
    created: diff.filter((d) => d.status === 'created').length,
    deleted: diff.filter((d) => d.status === 'deleted').length,
    modified: diff.filter((d) => d.status === 'modified').length,
    unchanged: diff.filter((d) => d.status === 'unchanged').length,
    total: diff.length,
  }

  return {
    contractId: prevSnapshot.contractId,
    prevSnapshot: {
      id: prevSnapshot.id,
      label: prevSnapshot.label,
      timestamp: prevSnapshot.timestamp,
    },
    nextSnapshot: {
      id: nextSnapshot.id,
      label: nextSnapshot.label,
      timestamp: nextSnapshot.timestamp,
    },
    diff,
    summary,
    exportedAt: Date.now(),
  }
}

/**
 * Downloads a snapshot diff as a JSON file.
 * @param prevSnapshot - The previous snapshot
 * @param nextSnapshot - The next snapshot
 * @param filename - Optional custom filename (defaults to auto-generated name)
 */
export function downloadSnapshotDiff(
  prevSnapshot: ContractSnapshot,
  nextSnapshot: ContractSnapshot,
  filename?: string,
): void {
  const exportData = exportSnapshotDiff(prevSnapshot, nextSnapshot)
  const json = JSON.stringify(exportData, null, 2)

  const defaultFilename = `snapshot-diff-${prevSnapshot.contractId.slice(0, 8)}-${Date.now()}.json`
  const finalFilename = filename || defaultFilename

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
