import { beforeEach, describe, expect, it } from 'vitest'
import { resetStore, useLensStore } from './lensStore'
import type { LedgerEntry } from './types'

describe('Snapshot Slice', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should capture a snapshot with current contract state', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    const entries: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value1' },
        lastModifiedLedger: 100,
      },
      'key-2': {
        key: 'key-2',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value2' },
        lastModifiedLedger: 101,
      },
    }

    addSnapshot('contract-1', entries)

    const snapshots = getSnapshots('contract-1')
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].contractId).toBe('contract-1')
    expect(snapshots[0].timestamp).toBeDefined()
    expect(Object.keys(snapshots[0].ledgerData)).toContain('key-1')
    expect(Object.keys(snapshots[0].ledgerData)).toContain('key-2')
  })

  it('should create immutable snapshots', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    const originalEntry: LedgerEntry = {
      key: 'key-1',
      contractId: 'contract-1',
      type: 'ContractData',
      value: { data: 'value1' },
      lastModifiedLedger: 100,
    }

    const entries: Record<string, LedgerEntry> = {
      'key-1': originalEntry,
    }

    addSnapshot('contract-1', entries)

    // Modify the original entry
    originalEntry.value = { data: 'modified' }

    const snapshots = getSnapshots('contract-1')
    // Snapshot should still have the original value
    expect(snapshots[0].ledgerData['key-1'].value).toEqual({
      data: 'value1',
    })
  })

  it('should preserve snapshots when live state changes', () => {
    const {
      addSnapshot,
      getSnapshots,
      upsertLedgerEntry,
    } = useLensStore.getState()

    const initialEntries: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'initial' },
        lastModifiedLedger: 100,
      },
    }

    addSnapshot('contract-1', initialEntries)

    // Now modify the live ledger data
    const updatedEntry: LedgerEntry = {
      key: 'key-1',
      contractId: 'contract-1',
      type: 'ContractData',
      value: { data: 'updated' },
      lastModifiedLedger: 200,
    }

    upsertLedgerEntry(updatedEntry)

    const snapshots = getSnapshots('contract-1')
    // Snapshot should still have the original value
    expect(snapshots[0].ledgerData['key-1'].value).toEqual({
      data: 'initial',
    })
    // Live ledger should have the updated value
    const state = useLensStore.getState()
    expect(state.ledgerData['key-1'].value).toEqual({ data: 'updated' })
  })

  it('should support optional snapshot labels', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    const entries: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value1' },
        lastModifiedLedger: 100,
      },
    }

    addSnapshot('contract-1', entries, 'Labeled Snapshot')

    const snapshots = getSnapshots('contract-1')
    expect(snapshots[0].label).toBe('Labeled Snapshot')
  })

  it('should allow multiple snapshots per contract', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    const entries1: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'snapshot1' },
        lastModifiedLedger: 100,
      },
    }

    const entries2: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'snapshot2' },
        lastModifiedLedger: 200,
      },
    }

    addSnapshot('contract-1', entries1, 'First')
    addSnapshot('contract-1', entries2, 'Second')

    const snapshots = getSnapshots('contract-1')
    expect(snapshots).toHaveLength(2)
    expect(snapshots[0].label).toBe('First')
    expect(snapshots[1].label).toBe('Second')
  })

  it('should store snapshots per contract separately', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    const entries1: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'contract1-value' },
        lastModifiedLedger: 100,
      },
    }

    const entries2: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-2',
        type: 'ContractData',
        value: { data: 'contract2-value' },
        lastModifiedLedger: 100,
      },
    }

    addSnapshot('contract-1', entries1)
    addSnapshot('contract-2', entries2)

    const snapshots1 = getSnapshots('contract-1')
    const snapshots2 = getSnapshots('contract-2')

    expect(snapshots1).toHaveLength(1)
    expect(snapshots2).toHaveLength(1)
    expect(snapshots1[0].ledgerData['key-1'].value).toEqual({
      data: 'contract1-value',
    })
    expect(snapshots2[0].ledgerData['key-1'].value).toEqual({
      data: 'contract2-value',
    })
  })

  it('should remove a specific snapshot', () => {
    const { addSnapshot, getSnapshots, removeSnapshot } =
      useLensStore.getState()

    const entries: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value1' },
        lastModifiedLedger: 100,
      },
    }

    addSnapshot('contract-1', entries, 'Snapshot 1')
    addSnapshot('contract-1', entries, 'Snapshot 2')

    const snapshotsBefore = getSnapshots('contract-1')
    expect(snapshotsBefore).toHaveLength(2)

    const snapshotIdToRemove = snapshotsBefore[0].id
    removeSnapshot('contract-1', snapshotIdToRemove)

    const snapshotsAfter = getSnapshots('contract-1')
    expect(snapshotsAfter).toHaveLength(1)
    expect(snapshotsAfter[0].label).toBe('Snapshot 2')
  })

  it('should clear all snapshots for a contract', () => {
    const { addSnapshot, getSnapshots, clearSnapshots } =
      useLensStore.getState()

    const entries: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value1' },
        lastModifiedLedger: 100,
      },
    }

    addSnapshot('contract-1', entries)
    addSnapshot('contract-1', entries)

    clearSnapshots('contract-1')

    const snapshots = getSnapshots('contract-1')
    expect(snapshots).toHaveLength(0)
  })

  it('should return empty array for non-existent contract', () => {
    const { getSnapshots } = useLensStore.getState()

    const snapshots = getSnapshots('non-existent')
    expect(snapshots).toEqual([])
  })

  it('should include unique snapshot IDs', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    const entries: Record<string, LedgerEntry> = {
      'key-1': {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value1' },
        lastModifiedLedger: 100,
      },
    }

    addSnapshot('contract-1', entries)
    addSnapshot('contract-1', entries)

    const snapshots = getSnapshots('contract-1')
    const ids = snapshots.map((s) => s.id)
    
    // All IDs should be unique
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should capture current live state as snapshot', () => {
    const {
      addSnapshot,
      getSnapshots,
      upsertLedgerEntry,
    } = useLensStore.getState()

    const entries: Array<LedgerEntry> = [
      {
        key: 'key-1',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value1' },
        lastModifiedLedger: 100,
      },
      {
        key: 'key-2',
        contractId: 'contract-1',
        type: 'ContractData',
        value: { data: 'value2' },
        lastModifiedLedger: 101,
      },
    ]

    // Add entries to live ledger
    entries.forEach((entry) => upsertLedgerEntry(entry))

    // Capture snapshot of current state
    const state = useLensStore.getState()
    const ledgerDataEntries = Object.fromEntries(
      entries.map((entry) => [entry.key, entry]),
    )
    addSnapshot('contract-1', ledgerDataEntries)

    const snapshots = getSnapshots('contract-1')
    expect(snapshots).toHaveLength(1)
    expect(Object.keys(snapshots[0].ledgerData)).toHaveLength(2)
  })
})
