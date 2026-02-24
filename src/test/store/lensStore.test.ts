import { beforeEach, describe, expect, it } from 'vitest'

import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'
import { DEFAULT_NETWORKS } from '../../store/types'

import type { LedgerEntry } from '../../store/types'

describe('lensStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('initializes with futurenet as default network', () => {
      const state = getStoreState()
      expect(state.networkConfig.networkId).toBe('futurenet')
      expect(state.networkConfig.rpcUrl).toBe(DEFAULT_NETWORKS.futurenet.rpcUrl)
    })

    it('initializes with empty ledger data', () => {
      const state = getStoreState()
      expect(state.ledgerData).toEqual({})
    })

    it('initializes with no expanded nodes', () => {
      const state = getStoreState()
      expect(state.expandedNodes).toEqual([])
    })
  })

  describe('networkConfig slice', () => {
    it('setNetworkConfig updates network configuration', () => {
      const { setNetworkConfig } = useLensStore.getState()

      setNetworkConfig({ networkId: 'testnet', rpcUrl: 'https://test.rpc.url' })

      const state = getStoreState()
      expect(state.networkConfig.networkId).toBe('testnet')
      expect(state.networkConfig.rpcUrl).toBe('https://test.rpc.url')
      // Original fields should be preserved
      expect(state.networkConfig.networkPassphrase).toBe(
        DEFAULT_NETWORKS.futurenet.networkPassphrase,
      )
    })

    it('setNetworkConfig merges partial updates', () => {
      const { setNetworkConfig } = useLensStore.getState()

      setNetworkConfig({ networkId: 'mainnet' })
      setNetworkConfig({ rpcUrl: 'https://custom.rpc.url' })

      const state = getStoreState()
      expect(state.networkConfig.networkId).toBe('mainnet')
      expect(state.networkConfig.rpcUrl).toBe('https://custom.rpc.url')
    })

    it('resetNetworkConfig restores default network', () => {
      const { setNetworkConfig, resetNetworkConfig } = useLensStore.getState()

      setNetworkConfig({ networkId: 'mainnet', rpcUrl: 'https://custom.url' })
      resetNetworkConfig()

      const state = getStoreState()
      expect(state.networkConfig).toEqual(DEFAULT_NETWORKS.futurenet)
    })
  })

  describe('ledgerData slice', () => {
    const mockEntry: LedgerEntry = {
      key: 'contract:ABC123:Balance',
      contractId: 'ABC123',
      type: 'ContractData',
      durability: 'Persistent',
      value: { balance: 1000 },
      lastModifiedLedger: 12345,
    }

    it('upsertLedgerEntry adds a new entry', () => {
      const { upsertLedgerEntry } = useLensStore.getState()

      upsertLedgerEntry(mockEntry)

      const state = getStoreState()
      expect(state.ledgerData[mockEntry.key]).toEqual(mockEntry)
    })

    it('upsertLedgerEntry updates existing entry', () => {
      const { upsertLedgerEntry } = useLensStore.getState()

      upsertLedgerEntry(mockEntry)
      upsertLedgerEntry({ ...mockEntry, value: { balance: 2000 } })

      const state = getStoreState()
      expect(state.ledgerData[mockEntry.key].value).toEqual({ balance: 2000 })
    })

    it('upsertLedgerEntries adds multiple entries', () => {
      const { upsertLedgerEntries } = useLensStore.getState()

      const entries: Array<LedgerEntry> = [
        mockEntry,
        { ...mockEntry, key: 'contract:DEF456:Balance', contractId: 'DEF456' },
      ]

      upsertLedgerEntries(entries)

      const state = getStoreState()
      expect(Object.keys(state.ledgerData)).toHaveLength(2)
    })

    it('removeLedgerEntry removes an entry', () => {
      const { upsertLedgerEntry, removeLedgerEntry } = useLensStore.getState()

      upsertLedgerEntry(mockEntry)
      removeLedgerEntry(mockEntry.key)

      const state = getStoreState()
      expect(state.ledgerData[mockEntry.key]).toBeUndefined()
    })

    it('clearLedgerData removes all entries', () => {
      const { upsertLedgerEntries, clearLedgerData } = useLensStore.getState()

      upsertLedgerEntries([
        mockEntry,
        { ...mockEntry, key: 'contract:DEF456:Balance' },
      ])
      clearLedgerData()

      const state = getStoreState()
      expect(state.ledgerData).toEqual({})
    })

    it('ledgerData changes do not affect other slices', () => {
      const { upsertLedgerEntry, setNetworkConfig } = useLensStore.getState()

      setNetworkConfig({ networkId: 'testnet' })
      upsertLedgerEntry(mockEntry)

      const state = getStoreState()
      expect(state.networkConfig.networkId).toBe('testnet')
      expect(state.expandedNodes).toEqual([])
    })
  })

  describe('expandedNodes slice', () => {
    it('setExpanded adds node to expanded list', () => {
      const { setExpanded } = useLensStore.getState()

      setExpanded('node-1', true)

      const state = getStoreState()
      expect(state.expandedNodes).toContain('node-1')
    })

    it('setExpanded removes node from expanded list', () => {
      const { setExpanded } = useLensStore.getState()

      setExpanded('node-1', true)
      setExpanded('node-1', false)

      const state = getStoreState()
      expect(state.expandedNodes).not.toContain('node-1')
    })

    it('setExpanded does not duplicate nodes', () => {
      const { setExpanded } = useLensStore.getState()

      setExpanded('node-1', true)
      setExpanded('node-1', true)

      const state = getStoreState()
      expect(state.expandedNodes.filter((n) => n === 'node-1')).toHaveLength(1)
    })

    it('toggleExpanded toggles node state', () => {
      const { toggleExpanded } = useLensStore.getState()

      toggleExpanded('node-1')
      expect(getStoreState().expandedNodes).toContain('node-1')

      toggleExpanded('node-1')
      expect(getStoreState().expandedNodes).not.toContain('node-1')
    })

    it('expandAll adds multiple nodes', () => {
      const { expandAll } = useLensStore.getState()

      expandAll(['node-1', 'node-2', 'node-3'])

      const state = getStoreState()
      expect(state.expandedNodes).toContain('node-1')
      expect(state.expandedNodes).toContain('node-2')
      expect(state.expandedNodes).toContain('node-3')
    })

    it('expandAll does not duplicate existing nodes', () => {
      const { setExpanded, expandAll } = useLensStore.getState()

      setExpanded('node-1', true)
      expandAll(['node-1', 'node-2'])

      const state = getStoreState()
      expect(state.expandedNodes.filter((n) => n === 'node-1')).toHaveLength(1)
    })

    it('collapseAll removes all expanded nodes', () => {
      const { expandAll, collapseAll } = useLensStore.getState()

      expandAll(['node-1', 'node-2', 'node-3'])
      collapseAll()

      const state = getStoreState()
      expect(state.expandedNodes).toEqual([])
    })

    it('expandedNodes changes do not affect other slices', () => {
      const { toggleExpanded, upsertLedgerEntry } = useLensStore.getState()

      const mockEntry: LedgerEntry = {
        key: 'test-key',
        contractId: 'ABC',
        type: 'ContractData',
        value: {},
        lastModifiedLedger: 1,
      }

      upsertLedgerEntry(mockEntry)
      toggleExpanded('node-1')

      const state = getStoreState()
      expect(state.ledgerData['test-key']).toBeDefined()
      expect(state.networkConfig.networkId).toBe('futurenet')
    })
  })
})
