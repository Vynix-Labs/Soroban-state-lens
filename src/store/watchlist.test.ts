import { beforeEach, describe, expect, it } from 'vitest'
import { resetStore, useLensStore } from './lensStore'

describe('Watchlist Slice', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should add a key to watchlist', () => {
    const { addToWatchlist, getWatchlistForContract } = useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key')

    const watchlist = getWatchlistForContract('contract-1')
    expect(watchlist).toHaveLength(1)
    expect(watchlist[0].keyPath).toBe('/path/to/key')
    expect(watchlist[0].contractId).toBe('contract-1')
    expect(watchlist[0].timestamp).toBeDefined()
  })

  it('should prevent duplicate additions', () => {
    const { addToWatchlist, getWatchlistForContract } = useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key')
    addToWatchlist('contract-1', '/path/to/key')

    const watchlist = getWatchlistForContract('contract-1')
    expect(watchlist).toHaveLength(1)
  })

  it('should handle multiple keys for same contract', () => {
    const { addToWatchlist, getWatchlistForContract } = useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key1')
    addToWatchlist('contract-1', '/path/to/key2')

    const watchlist = getWatchlistForContract('contract-1')
    expect(watchlist).toHaveLength(2)
    expect(watchlist.map((item) => item.keyPath)).toContain('/path/to/key1')
    expect(watchlist.map((item) => item.keyPath)).toContain('/path/to/key2')
  })

  it('should handle same key for different contracts', () => {
    const { addToWatchlist, getWatchlistForContract } = useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key')
    addToWatchlist('contract-2', '/path/to/key')

    const watchlist1 = getWatchlistForContract('contract-1')
    const watchlist2 = getWatchlistForContract('contract-2')

    expect(watchlist1).toHaveLength(1)
    expect(watchlist2).toHaveLength(1)
    expect(watchlist1[0].contractId).toBe('contract-1')
    expect(watchlist2[0].contractId).toBe('contract-2')
  })

  it('should remove a key from watchlist', () => {
    const { addToWatchlist, removeFromWatchlist, getWatchlistForContract } =
      useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key1')
    addToWatchlist('contract-1', '/path/to/key2')

    removeFromWatchlist('contract-1', '/path/to/key1')

    const watchlist = getWatchlistForContract('contract-1')
    expect(watchlist).toHaveLength(1)
    expect(watchlist[0].keyPath).toBe('/path/to/key2')
  })

  it('removes the contract bucket when the final item is removed', () => {
    const { addToWatchlist, removeFromWatchlist, getWatchlistForContract } =
      useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key1')

    removeFromWatchlist('contract-1', '/path/to/key1')

    const watchlist = getWatchlistForContract('contract-1')
    expect(watchlist).toEqual([])
    expect(useLensStore.getState().watchlist['contract-1']).toBeUndefined()
  })

  it('does nothing for unknown contracts or key paths', () => {
    const { removeFromWatchlist, getWatchlistForContract } = useLensStore.getState()

    removeFromWatchlist('unknown-contract', '/path/to/key')

    const watchlist = getWatchlistForContract('unknown-contract')
    expect(watchlist).toEqual([])
  })

  it('should clear all watchlist items for a contract', () => {
    const { addToWatchlist, clearWatchlist, getWatchlistForContract } =
      useLensStore.getState()

    addToWatchlist('contract-1', '/path/to/key1')
    addToWatchlist('contract-1', '/path/to/key2')

    clearWatchlist('contract-1')

    const watchlist = getWatchlistForContract('contract-1')
    expect(watchlist).toHaveLength(0)
  })

  it('should return empty array for non-existent contract', () => {
    const { getWatchlistForContract } = useLensStore.getState()

    const watchlist = getWatchlistForContract('non-existent')
    expect(watchlist).toEqual([])
  })

  it('should accept same key pinned from different routes', () => {
    const { addToWatchlist, getWatchlistForContract } = useLensStore.getState()

    // Simulate pinning from discovery
    addToWatchlist('contract-1', '/state/key1')

    // Simulate pinning same key from inspector
    addToWatchlist('contract-1', '/state/key1')

    const watchlist = getWatchlistForContract('contract-1')
    // Should still be only one item due to duplicate protection
    expect(watchlist).toHaveLength(1)
  })

  it('should deduplicate hydrated watchlist buckets by key path', () => {
    useLensStore.setState({
      watchlist: {
        'contract-1': [
          {
            contractId: 'contract-1',
            keyPath: '/state/key1',
            timestamp: 1,
          },
          {
            contractId: 'contract-1',
            keyPath: '/state/key1',
            timestamp: 2,
          },
          {
            contractId: 'contract-1',
            keyPath: '/state/key2',
            timestamp: 3,
          },
        ],
      },
    })

    const watchlist = useLensStore
      .getState()
      .getWatchlistForContract('contract-1')

    expect(watchlist).toHaveLength(2)
    expect(watchlist[0]).toMatchObject({
      keyPath: '/state/key1',
      timestamp: 1,
    })
    expect(watchlist[1]).toMatchObject({
      keyPath: '/state/key2',
      timestamp: 3,
    })
  })

  it('should reject items with mismatched contractId during hydration', () => {
    useLensStore.setState({
      watchlist: {
        'contract-1': [
          {
            contractId: 'contract-1',
            keyPath: '/state/key1',
            timestamp: 1,
          },
          {
            contractId: 'contract-2',
            keyPath: '/state/key2',
            timestamp: 2,
          },
          {
            contractId: 'contract-1',
            keyPath: '/state/key3',
            timestamp: 3,
          },
        ],
      },
    })

    const watchlist = useLensStore
      .getState()
      .getWatchlistForContract('contract-1')

    expect(watchlist).toHaveLength(2)
    expect(watchlist.map((item) => item.keyPath)).toEqual([
      '/state/key1',
      '/state/key3',
    ])
    expect(watchlist.every((item) => item.contractId === 'contract-1')).toBe(
      true,
    )
  })

  it('should handle bucket with all mismatched contractIds', () => {
    useLensStore.setState({
      watchlist: {
        'contract-1': [
          {
            contractId: 'contract-2',
            keyPath: '/state/key1',
            timestamp: 1,
          },
          {
            contractId: 'contract-3',
            keyPath: '/state/key2',
            timestamp: 2,
          },
        ],
      },
    })

    const watchlist = useLensStore
      .getState()
      .getWatchlistForContract('contract-1')

    expect(watchlist).toHaveLength(0)
  })
})
