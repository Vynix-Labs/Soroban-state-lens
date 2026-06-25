import { describe, expect, it } from 'vitest'
import { diffSnapshotEntries } from '../../lib/diff/diffSnapshotEntries'

describe('diffSnapshotEntries', () => {
  it('classifies created entries when only next contains the key', () => {
    const prevEntries = {}
    const nextEntries = {
      'key-1': { kind: 'primitive', primitive: 'u32', value: 1 },
    }

    const diff = diffSnapshotEntries(prevEntries, nextEntries)

    expect(diff).toEqual([
      {
        key: 'key-1',
        status: 'created',
        nextEntry: nextEntries['key-1'],
      },
    ])
  })

  it('classifies deleted entries when only prev contains the key', () => {
    const prevEntries = {
      'key-1': { kind: 'primitive', primitive: 'u32', value: 1 },
    }
    const nextEntries = {}

    const diff = diffSnapshotEntries(prevEntries, nextEntries)

    expect(diff).toEqual([
      {
        key: 'key-1',
        status: 'deleted',
        prevEntry: prevEntries['key-1'],
      },
    ])
  })

  it('classifies unchanged entries when normalized values are deeply equal', () => {
    const prevEntries = {
      'key-1': {
        kind: 'map',
        entries: [
          {
            key: { kind: 'primitive', primitive: 'string', value: 'a' },
            value: { kind: 'primitive', primitive: 'u32', value: 1 },
          },
        ],
      },
    }
    const nextEntries = {
      'key-1': {
        kind: 'map',
        entries: [
          {
            key: { kind: 'primitive', primitive: 'string', value: 'a' },
            value: { kind: 'primitive', primitive: 'u32', value: 1 },
          },
        ],
      },
    }

    const diff = diffSnapshotEntries(prevEntries, nextEntries)

    expect(diff).toEqual([
      {
        key: 'key-1',
        status: 'unchanged',
        prevEntry: prevEntries['key-1'],
        nextEntry: nextEntries['key-1'],
      },
    ])
  })

  it('classifies modified entries when normalized values differ deeply', () => {
    const prevEntries = {
      'key-1': {
        kind: 'vec',
        items: [{ kind: 'primitive', primitive: 'u32', value: 1 }],
      },
    }
    const nextEntries = {
      'key-1': {
        kind: 'vec',
        items: [{ kind: 'primitive', primitive: 'u32', value: 2 }],
      },
    }

    const diff = diffSnapshotEntries(prevEntries, nextEntries)

    expect(diff).toEqual([
      {
        key: 'key-1',
        status: 'modified',
        prevEntry: prevEntries['key-1'],
        nextEntry: nextEntries['key-1'],
      },
    ])
  })

  it('sorts diff results by key name', () => {
    const prevEntries = {
      'key-2': { kind: 'primitive', primitive: 'u32', value: 1 },
      'key-1': { kind: 'primitive', primitive: 'u32', value: 2 },
    }
    const nextEntries = {
      'key-1': { kind: 'primitive', primitive: 'u32', value: 2 },
      'key-2': { kind: 'primitive', primitive: 'u32', value: 3 },
    }

    const diff = diffSnapshotEntries(prevEntries, nextEntries)

    expect(diff.map((item) => item.key)).toEqual(['key-1', 'key-2'])
  })
})
