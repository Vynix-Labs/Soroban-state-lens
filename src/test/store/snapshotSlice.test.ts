import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'

import type { LedgerEntry } from '../../store/types'

const makeEntry = (key: string, contractId: string): LedgerEntry => ({
  key,
  contractId,
  type: 'ContractData',
  value: { data: key },
  lastModifiedLedger: 100,
})

describe('snapshotSlice', () => {
  beforeEach(() => {
    resetStore()
  })

  it('initializes with empty snapshots', () => {
    const state = getStoreState()
    expect(state.snapshots).toEqual({})
  })

  it('getSnapshots returns empty array for unknown contract', () => {
    const { getSnapshots } = getStoreState()
    expect(getSnapshots('nonexistent')).toEqual([])
  })

  it('addSnapshot creates a snapshot with correct shape', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()
    const entries = { key1: makeEntry('key1', 'c1') }

    addSnapshot('c1', entries, 'test label')

    const snapshots = getSnapshots('c1')
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].contractId).toBe('c1')
    expect(snapshots[0].label).toBe('test label')
    expect(snapshots[0].ledgerData).toEqual(entries)
    expect(snapshots[0].timestamp).toBeTypeOf('number')
    expect(snapshots[0].id).toBeTypeOf('string')
  })

  it('addSnapshot stores a shallow copy of entries', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()
    const entries = { key1: makeEntry('key1', 'c1') }

    addSnapshot('c1', entries)

    // Mutate original — snapshot should be unaffected
    entries.key1 = makeEntry('key2', 'c2')

    const snapshot = getSnapshots('c1')[0]
    expect(snapshot.ledgerData.key1.key).toBe('key1')
  })

  it('addSnapshot appends multiple snapshots for same contract', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    addSnapshot('c1', { a: makeEntry('a', 'c1') })
    addSnapshot('c1', { b: makeEntry('b', 'c1') })
    addSnapshot('c1', { c: makeEntry('c', 'c1') })

    expect(getSnapshots('c1')).toHaveLength(3)
  })

  it('addSnapshot isolates snapshots across contract IDs', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    addSnapshot('c1', { a: makeEntry('a', 'c1') })
    addSnapshot('c2', { b: makeEntry('b', 'c2') })
    addSnapshot('c1', { c: makeEntry('c', 'c1') })

    expect(getSnapshots('c1')).toHaveLength(2)
    expect(getSnapshots('c2')).toHaveLength(1)
  })

  it('addSnapshot generates unique IDs', () => {
    const { addSnapshot, getSnapshots } = useLensStore.getState()

    addSnapshot('c1', {})
    addSnapshot('c1', {})

    const ids = getSnapshots('c1').map((s) => s.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('removeSnapshot removes only the targeted snapshot', () => {
    const { addSnapshot, getSnapshots, removeSnapshot } = useLensStore.getState()

    addSnapshot('c1', { a: makeEntry('a', 'c1') })
    addSnapshot('c1', { b: makeEntry('b', 'c1') })

    const targetId = getSnapshots('c1')[0].id
    removeSnapshot('c1', targetId)

    expect(getSnapshots('c1')).toHaveLength(1)
    expect(getSnapshots('c1')[0].id).not.toBe(targetId)
  })

  it('removeSnapshot is a no-op for unknown snapshot', () => {
    const { addSnapshot, getSnapshots, removeSnapshot } = useLensStore.getState()

    addSnapshot('c1', {})
    removeSnapshot('c1', 'nonexistent-id')

    expect(getSnapshots('c1')).toHaveLength(1)
  })

  it('clearSnapshots removes all snapshots for a contract', () => {
    const { addSnapshot, getSnapshots, clearSnapshots } = useLensStore.getState()

    addSnapshot('c1', {})
    addSnapshot('c1', {})
    addSnapshot('c2', {})

    clearSnapshots('c1')

    expect(getSnapshots('c1')).toHaveLength(0)
    expect(getSnapshots('c2')).toHaveLength(1)
  })

  it('clearSnapshots is a no-op for unknown contract', () => {
    const { addSnapshot, getSnapshots, clearSnapshots } = useLensStore.getState()

    addSnapshot('c1', {})
    clearSnapshots('nonexistent')

    expect(getSnapshots('c1')).toHaveLength(1)
  })
})
