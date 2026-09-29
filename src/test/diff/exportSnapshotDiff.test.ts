import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadSnapshotDiff,
  exportSnapshotDiff,
} from '../../lib/diff/exportSnapshotDiff'
import type { ContractSnapshot } from '../../store/types'

describe('exportSnapshotDiff', () => {
  let prevSnapshot: ContractSnapshot
  let nextSnapshot: ContractSnapshot

  beforeEach(() => {
    prevSnapshot = {
      id: 'prev-123',
      contractId: 'contract-abc123',
      timestamp: 1000000,
      ledgerSequence: 12345,
      label: 'Before',
      ledgerData: {
        'key-1': {
          key: 'key-1',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'old-value' },
          lastModifiedLedger: 100,
        },
        'key-2': {
          key: 'key-2',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'unchanged' },
          lastModifiedLedger: 101,
        },
      },
    }

    nextSnapshot = {
      id: 'next-456',
      contractId: 'contract-abc123',
      timestamp: 2000000,
      ledgerSequence: 12350,
      label: 'After',
      ledgerData: {
        'key-1': {
          key: 'key-1',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'new-value' },
          lastModifiedLedger: 200,
        },
        'key-2': {
          key: 'key-2',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'unchanged' },
          lastModifiedLedger: 101,
        },
        'key-3': {
          key: 'key-3',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'created' },
          lastModifiedLedger: 202,
        },
      },
    }
  })

  it('exports snapshot diff with correct structure', () => {
    const result = exportSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(result).toMatchObject({
      contractId: 'contract-abc123',
      prevSnapshot: {
        id: 'prev-123',
        label: 'Before',
        timestamp: 1000000,
        ledgerSequence: 12345,
      },
      nextSnapshot: {
        id: 'next-456',
        label: 'After',
        timestamp: 2000000,
        ledgerSequence: 12350,
      },
      diff: expect.any(Array),
      summary: expect.any(Object),
      exportedAt: expect.any(Number),
    })
  })

  it('calculates summary counts correctly', () => {
    const result = exportSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(result.summary).toEqual({
      created: 1, // key-3
      deleted: 0,
      modified: 1, // key-1
      unchanged: 1, // key-2
      total: 3,
    })
  })

  it('includes all diff entries with correct statuses', () => {
    const result = exportSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(result.diff).toHaveLength(3)

    const key1Diff = result.diff.find((d) => d.key === 'key-1')
    expect(key1Diff?.status).toBe('modified')

    const key2Diff = result.diff.find((d) => d.key === 'key-2')
    expect(key2Diff?.status).toBe('unchanged')

    const key3Diff = result.diff.find((d) => d.key === 'key-3')
    expect(key3Diff?.status).toBe('created')
  })

  it('handles deleted entries correctly', () => {
    const prevWithDeleted = {
      ...prevSnapshot,
      ledgerData: {
        ...prevSnapshot.ledgerData,
        'key-deleted': {
          key: 'key-deleted',
          contractId: 'contract-abc123',
          type: 'ContractData' as const,
          value: { data: 'deleted' },
          lastModifiedLedger: 99,
        },
      },
    }

    const result = exportSnapshotDiff(prevWithDeleted, nextSnapshot)

    expect(result.summary.deleted).toBe(1)

    const deletedDiff = result.diff.find((d) => d.key === 'key-deleted')
    expect(deletedDiff?.status).toBe('deleted')
  })

  it('sorts diff entries by key', () => {
    const result = exportSnapshotDiff(prevSnapshot, nextSnapshot)

    const keys = result.diff.map((d) => d.key)
    expect(keys).toEqual(['key-1', 'key-2', 'key-3'])
  })

  it('produces JSON-serializable output', () => {
    const result = exportSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('includes exportedAt timestamp', () => {
    const beforeExport = Date.now()
    const result = exportSnapshotDiff(prevSnapshot, nextSnapshot)
    const afterExport = Date.now()

    expect(result.exportedAt).toBeGreaterThanOrEqual(beforeExport)
    expect(result.exportedAt).toBeLessThanOrEqual(afterExport)
  })
})

describe('downloadSnapshotDiff', () => {
  let prevSnapshot: ContractSnapshot
  let nextSnapshot: ContractSnapshot

  beforeEach(() => {
    prevSnapshot = {
      id: 'prev-123',
      contractId: 'contract-abc123',
      timestamp: 1000000,
      ledgerSequence: 12345,
      label: 'Before',
      ledgerData: {
        'key-1': {
          key: 'key-1',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'value' },
          lastModifiedLedger: 100,
        },
      },
    }

    nextSnapshot = {
      id: 'next-456',
      contractId: 'contract-abc123',
      timestamp: 2000000,
      ledgerSequence: 12350,
      label: 'After',
      ledgerData: {
        'key-1': {
          key: 'key-1',
          contractId: 'contract-abc123',
          type: 'ContractData',
          value: { data: 'value' },
          lastModifiedLedger: 200,
        },
      },
    }

    // Mock DOM methods
    global.URL.createObjectURL = vi.fn(() => 'blob:url')
    global.URL.revokeObjectURL = vi.fn()
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a download link and triggers click', () => {
    const linkClickSpy = vi.fn()
    const mockLink = {
      href: '',
      download: '',
      click: linkClickSpy,
    }
    document.createElement = vi.fn(() => mockLink as any)

    downloadSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(linkClickSpy).toHaveBeenCalled()
  })

  it('uses custom filename when provided', () => {
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    document.createElement = vi.fn(() => mockLink as any)

    downloadSnapshotDiff(prevSnapshot, nextSnapshot, 'custom-name.json')

    expect(mockLink.download).toBe('custom-name.json')
  })

  it('generates default filename when not provided', () => {
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    document.createElement = vi.fn(() => mockLink as any)

    downloadSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(mockLink.download).toMatch(/^snapshot-diff-contract-\d+\.json$/)
  })

  it('creates blob with correct MIME type', () => {
    const blobSpy = vi.fn()
    const MockBlob = class {
      constructor(_content: Array<unknown>, options: { type: string }) {
        blobSpy(options)
      }
      type = 'application/json'
    }
    global.Blob = MockBlob as any

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    document.createElement = vi.fn(() => mockLink as any)

    downloadSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(blobSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/json',
      }),
    )
  })

  it('cleans up DOM and URL after download', () => {
    const MockBlob = class {
      constructor(_content: Array<unknown>, _options: { type: string }) {
        // Mock constructor
      }
      type = 'application/json'
    }
    global.Blob = MockBlob as any

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    document.createElement = vi.fn(() => mockLink as any)

    downloadSnapshotDiff(prevSnapshot, nextSnapshot)

    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url')
  })
})
