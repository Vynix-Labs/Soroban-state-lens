import { beforeEach, describe, expect, it } from 'vitest'

import {
  getStoreState,
  lensActions,
  resetStore,
  useLensStore,
} from '../../store/lensStore'
import { DEFAULT_NETWORKS } from '../../store/types'
import {
  selectExpandedCount,
  selectExpandedNodes,
  selectHasLedgerData,
  selectHorizonUrl,
  selectIsExpanded,
  selectLedgerData,
  selectLedgerEntriesByContract,
  selectLedgerEntry,
  selectLedgerEntryCount,
  selectNetworkConfig,
  selectNetworkId,
  selectRpcUrl,
} from '../../store/selectors'

import type { LedgerEntry } from '../../store/types'

const mockEntry: LedgerEntry = {
  key: 'contract:ABC123:Balance',
  contractId: 'ABC123',
  type: 'ContractData',
  durability: 'Persistent',
  value: { balance: 1000 },
  lastModifiedLedger: 100,
}

const mockEntry2: LedgerEntry = {
  key: 'contract:ABC123:Admin',
  contractId: 'ABC123',
  type: 'ContractData',
  durability: 'Persistent',
  value: { admin: 'GA...' },
  lastModifiedLedger: 101,
}

const mockEntry3: LedgerEntry = {
  key: 'contract:DEF456:Balance',
  contractId: 'DEF456',
  type: 'ContractData',
  durability: 'Temporary',
  value: { balance: 500 },
  lastModifiedLedger: 102,
}

describe('selectors', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('network selectors', () => {
    it('selectNetworkConfig returns full config', () => {
      const config = selectNetworkConfig(getStoreState())
      expect(config).toEqual(DEFAULT_NETWORKS.futurenet)
    })

    it('selectNetworkId returns the network id', () => {
      expect(selectNetworkId(getStoreState())).toBe('futurenet')

      useLensStore.getState().setNetworkConfig({ networkId: 'testnet' })
      expect(selectNetworkId(getStoreState())).toBe('testnet')
    })

    it('selectRpcUrl returns the rpc url', () => {
      expect(selectRpcUrl(getStoreState())).toBe(
        DEFAULT_NETWORKS.futurenet.rpcUrl,
      )
    })

    it('selectHorizonUrl returns the horizon url', () => {
      expect(selectHorizonUrl(getStoreState())).toBe(
        DEFAULT_NETWORKS.futurenet.horizonUrl,
      )
    })
  })

  describe('ledger data selectors', () => {
    it('selectLedgerData returns empty map initially', () => {
      expect(selectLedgerData(getStoreState())).toEqual({})
    })

    it('selectLedgerEntry returns entry by key', () => {
      useLensStore.getState().upsertLedgerEntry(mockEntry)
      const entry = selectLedgerEntry(mockEntry.key)(getStoreState())
      expect(entry).toEqual(mockEntry)
    })

    it('selectLedgerEntry returns undefined for missing key', () => {
      const entry = selectLedgerEntry('nonexistent')(getStoreState())
      expect(entry).toBeUndefined()
    })

    it('selectLedgerEntriesByContract filters by contractId', () => {
      useLensStore
        .getState()
        .upsertLedgerEntries([mockEntry, mockEntry2, mockEntry3])

      const abc = selectLedgerEntriesByContract('ABC123')(getStoreState())
      expect(abc).toHaveLength(2)
      expect(abc.map((e) => e.key)).toContain(mockEntry.key)
      expect(abc.map((e) => e.key)).toContain(mockEntry2.key)

      const def = selectLedgerEntriesByContract('DEF456')(getStoreState())
      expect(def).toHaveLength(1)
    })

    it('selectLedgerEntryCount returns correct count', () => {
      expect(selectLedgerEntryCount(getStoreState())).toBe(0)

      useLensStore.getState().upsertLedgerEntries([mockEntry, mockEntry3])
      expect(selectLedgerEntryCount(getStoreState())).toBe(2)
    })

    it('selectHasLedgerData reflects presence of data', () => {
      expect(selectHasLedgerData(getStoreState())).toBe(false)

      useLensStore.getState().upsertLedgerEntry(mockEntry)
      expect(selectHasLedgerData(getStoreState())).toBe(true)
    })
  })

  describe('expanded nodes selectors', () => {
    it('selectExpandedNodes returns the list', () => {
      expect(selectExpandedNodes(getStoreState())).toEqual([])
    })

    it('selectIsExpanded checks individual node', () => {
      useLensStore.getState().setExpanded('node-a', true)

      expect(selectIsExpanded('node-a')(getStoreState())).toBe(true)
      expect(selectIsExpanded('node-b')(getStoreState())).toBe(false)
    })

    it('selectExpandedCount returns correct count', () => {
      useLensStore.getState().expandAll(['a', 'b', 'c'])
      expect(selectExpandedCount(getStoreState())).toBe(3)
    })
  })
})

describe('lensActions', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('toggleExpanded', () => {
    it('expands a collapsed node', () => {
      lensActions.toggleExpanded('node-1')
      expect(getStoreState().expandedNodes).toContain('node-1')
    })

    it('collapses an expanded node', () => {
      lensActions.toggleExpanded('node-1')
      lensActions.toggleExpanded('node-1')
      expect(getStoreState().expandedNodes).not.toContain('node-1')
    })
  })

  describe('expandAll / collapseAll', () => {
    it('expandAll adds multiple nodes', () => {
      lensActions.expandAll(['a', 'b'])
      expect(getStoreState().expandedNodes).toEqual(
        expect.arrayContaining(['a', 'b']),
      )
    })

    it('collapseAll clears expanded nodes', () => {
      lensActions.expandAll(['a', 'b'])
      lensActions.collapseAll()
      expect(getStoreState().expandedNodes).toEqual([])
    })
  })

  describe('batchLedgerUpdate', () => {
    it('applies upserts and removals in a single update', () => {
      useLensStore.getState().upsertLedgerEntry(mockEntry)

      lensActions.batchLedgerUpdate([mockEntry2, mockEntry3], [mockEntry.key])

      const state = getStoreState()
      expect(state.ledgerData[mockEntry.key]).toBeUndefined()
      expect(state.ledgerData[mockEntry2.key]).toEqual(mockEntry2)
      expect(state.ledgerData[mockEntry3.key]).toEqual(mockEntry3)
    })

    it('handles empty upserts with removals only', () => {
      useLensStore.getState().upsertLedgerEntry(mockEntry)
      lensActions.batchLedgerUpdate([], [mockEntry.key])

      expect(getStoreState().ledgerData[mockEntry.key]).toBeUndefined()
    })

    it('handles upserts with empty removals', () => {
      lensActions.batchLedgerUpdate([mockEntry, mockEntry2], [])

      const state = getStoreState()
      expect(Object.keys(state.ledgerData)).toHaveLength(2)
    })

    it('upsert overwrites existing entry in same batch', () => {
      useLensStore.getState().upsertLedgerEntry(mockEntry)

      const updated = { ...mockEntry, value: { balance: 9999 } }
      lensActions.batchLedgerUpdate([updated], [])

      expect(getStoreState().ledgerData[mockEntry.key].value).toEqual({
        balance: 9999,
      })
    })
  })

  describe('network actions', () => {
    it('setNetworkConfig updates config', () => {
      lensActions.setNetworkConfig({ networkId: 'mainnet' })
      expect(getStoreState().networkConfig.networkId).toBe('mainnet')
    })

    it('resetNetworkConfig restores default', () => {
      lensActions.setNetworkConfig({ networkId: 'mainnet' })
      lensActions.resetNetworkConfig()
      expect(getStoreState().networkConfig).toEqual(DEFAULT_NETWORKS.futurenet)
    })
  })
})
