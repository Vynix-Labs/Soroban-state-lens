import { beforeEach, describe, expect, it, vi } from 'vitest'
import { xdr } from '@stellar/stellar-sdk'
import { decoderWorkerApi } from '../../workers/decoder.worker'
import { isDecoderWorkerError } from '../../types/decoder-worker'
import { useLensStore } from '../../store/lensStore'
import {
  NETWORK_CONFIG_STORAGE_KEY,
  clearPersistedNetworkConfig,
  mergeNetworkConfig,
  sanitizeSnapshots,
} from '../../store/persistence'
import { diffSnapshotEntries } from '../../lib/diff/diffSnapshotEntries'
import { ByteDisplayMode, DEFAULT_NETWORKS } from '../../store/types'
import { formatScBytesByPreference } from '../../lib/format/formatScBytesByPreference'
import type { LedgerEntry } from '../../store/types'

// Simple localStorage mock
const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Mock window and localStorage globally
Object.defineProperty(global, 'window', { value: global, writable: true })
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('LensStore hydration', () => {
  it('preserves exact i128 and u256 decimal strings across snapshot hydration', async () => {
    const i128 = '-170141183460469231731687303715884105728'
    const u256 =
      '11579208973781619542357098500868907907853269984665640564039457584007913129639935'
    useLensStore.getState().addSnapshot(
      'C1',
      {
        i128: {
          key: 'i128',
          contractId: 'C1',
          type: 'ContractData',
          value: i128,
          lastModifiedLedger: 9,
        },
        u256: {
          key: 'u256',
          contractId: 'C1',
          type: 'ContractData',
          value: u256,
          lastModifiedLedger: 9,
        },
      },
      10,
      'Large integer fixture',
    )

    const savedState = localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)
    expect(savedState).not.toBeNull()
    if (savedState === null)
      throw new Error('Integer snapshot state was not saved')
    useLensStore.setState({ snapshots: {} })
    localStorage.setItem(NETWORK_CONFIG_STORAGE_KEY, savedState)
    await useLensStore.persist.rehydrate()

    expect(useLensStore.getState().getSnapshots('C1')).toMatchObject([
      {
        ledgerData: {
          i128: { value: i128 },
          u256: { value: u256 },
        },
      },
    ])
  })

  beforeEach(() => {
    clearPersistedNetworkConfig()
    vi.clearAllMocks()

    // We need to reset the store state manually since Zustand store is a singleton in tests
    useLensStore.setState({
      networkConfig: DEFAULT_NETWORKS.futurenet,
      ledgerData: {},
      expandedNodes: [],
      snapshots: {},
      watchlist: {},
    })
  })

  it('restores valid snapshots and drops malformed snapshots on hydration', async () => {
    const timestamp = Date.now() - 100
    const validSnapshot = {
      id: 'snapshot-valid',
      contractId: 'C1',
      timestamp,
      ledgerSequence: 10,
      ledgerData: {
        key1: {
          key: 'key1',
          contractId: 'C1',
          type: 'ContractData',
          value: { count: 3 },
          lastModifiedLedger: 9,
        },
      },
      label: 'Saved state',
    }
    const malformedSnapshot = {
      ...validSnapshot,
      id: 'snapshot-malformed',
      ledgerData: [],
    }
    localStorage.setItem(
      NETWORK_CONFIG_STORAGE_KEY,
      JSON.stringify({
        state: {
          networkConfig: { kind: 'preset', networkId: 'testnet' },
          snapshots: { C1: [validSnapshot, malformedSnapshot] },
        },
        version: 1,
      }),
    )

    await useLensStore.persist.rehydrate()

    expect(useLensStore.getState().getSnapshots('C1')).toEqual([validSnapshot])
  })

  it('marks snapshots with rejected entries incomplete and preserves valid empty snapshots', () => {
    const sanitized = sanitizeSnapshots({
      C1: [
        {
          id: 'damaged',
          contractId: 'C1',
          timestamp: Date.now() - 1,
          ledgerSequence: 10,
          ledgerData: { rejected: { key: 'wrong-key' } },
        },
        {
          id: 'empty',
          contractId: 'C1',
          timestamp: Date.now() - 1,
          ledgerSequence: 11,
          ledgerData: {},
        },
      ],
    })

    expect(sanitized.C1[0]).toMatchObject({ id: 'damaged', incomplete: true })
    expect(sanitized.C1[0]?.ledgerData).toEqual({})
    expect(sanitized.C1[1]).not.toHaveProperty('incomplete')
    expect(sanitized.C1[1]?.ledgerData).toEqual({})
  })

  it('retains a bounded discarded-entry count for rejected records', () => {
    const sanitized = sanitizeSnapshots({
      C1: [
        {
          id: 'partial',
          contractId: 'C1',
          timestamp: Date.now() - 1,
          ledgerSequence: 10,
          ledgerData: {
            good: {
              key: 'good',
              contractId: 'C1',
              type: 'ContractData',
              value: 42,
              lastModifiedLedger: 9,
            },
            bad: { key: 'wrong-key' },
          },
        },
        {
          id: 'empty',
          contractId: 'C1',
          timestamp: Date.now() - 1,
          ledgerSequence: 11,
          ledgerData: {},
        },
      ],
    })

    expect(sanitized.C1[0]).toMatchObject({
      id: 'partial',
      incomplete: true,
      discardedEntryCount: 1,
    })
    expect(Object.keys(sanitized.C1[0]?.ledgerData ?? {})).toEqual(['good'])
    expect(sanitized.C1[1]).not.toHaveProperty('incomplete')
    expect(sanitized.C1[1]).not.toHaveProperty('discardedEntryCount')
  })

  it('persists snapshots and restores them after a store reload', async () => {
    useLensStore.getState().addSnapshot(
      'C1',
      {
        key1: {
          key: 'key1',
          contractId: 'C1',
          type: 'ContractData',
          value: { count: 4 },
          lastModifiedLedger: 11,
        },
      },
      12,
      'Persisted snapshot',
    )

    const savedState = localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)
    expect(savedState).not.toBeNull()
    if (savedState === null) throw new Error('Snapshot state was not saved')
    useLensStore.setState({ snapshots: {} })
    localStorage.setItem(NETWORK_CONFIG_STORAGE_KEY, savedState)

    await useLensStore.persist.rehydrate()

    expect(useLensStore.getState().getSnapshots('C1')).toHaveLength(1)
    expect(useLensStore.getState().getSnapshots('C1')[0]).toMatchObject({
      contractId: 'C1',
      ledgerSequence: 12,
      label: 'Persisted snapshot',
    })
  })

  it('restores contract snapshots only from their own network bucket after reload', async () => {
    const createEntry = (value: number) => ({
      key: 'value-key',
      contractId: 'C1',
      type: 'ContractData' as const,
      value,
      lastModifiedLedger: value,
    })

    useLensStore.getState().setNetworkConfig(DEFAULT_NETWORKS.testnet)
    useLensStore
      .getState()
      .addSnapshot('C1', { 'value-key': createEntry(42) }, 42, 'Testnet')
    useLensStore.getState().addSnapshot(
      'OtherContract',
      {
        other: {
          ...createEntry(7),
          key: 'other',
          contractId: 'OtherContract',
        },
      },
      7,
      'Other testnet contract',
    )
    useLensStore.getState().setNetworkConfig(DEFAULT_NETWORKS.mainnet)
    useLensStore
      .getState()
      .addSnapshot('C1', { 'value-key': createEntry(99) }, 99, 'Mainnet')

    const savedState = localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)
    expect(savedState).not.toBeNull()

    useLensStore.setState({ snapshots: {} })
    if (savedState === null) throw new Error('Snapshots were not persisted')
    localStorage.setItem(NETWORK_CONFIG_STORAGE_KEY, savedState)
    await useLensStore.persist.rehydrate()

    expect(
      useLensStore.getState().getSnapshots('C1')[0]?.ledgerData,
    ).toMatchObject({
      'value-key': { value: 99 },
    })

    useLensStore.getState().setNetworkConfig(DEFAULT_NETWORKS.testnet)
    expect(
      useLensStore.getState().getSnapshots('C1')[0]?.ledgerData,
    ).toMatchObject({
      'value-key': { value: 42 },
    })
    expect(
      useLensStore.getState().getSnapshots('OtherContract')[0]?.ledgerData,
    ).toMatchObject({ other: { value: 7 } })

    useLensStore.getState().setNetworkConfig(DEFAULT_NETWORKS.mainnet)
    expect(
      useLensStore.getState().getSnapshots('C1')[0]?.ledgerData,
    ).toMatchObject({
      'value-key': { value: 99 },
    })
  })

  it('persists a decoded map entry with key metadata and its child value', async () => {
    const scVal = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('answer'),
        val: xdr.ScVal.scv32(7),
      }),
    ])
    const decodedValue = await decoderWorkerApi.decodeScVal({
      xdr: scVal.toXDR('base64'),
    })
    if (isDecoderWorkerError(decodedValue)) {
      throw new Error(`Map fixture decoding failed: ${decodedValue.message}`)
    }

    const entryKey = 'C1::ContractData::map-entry'
    const entry: LedgerEntry = {
      key: entryKey,
      contractId: 'C1',
      type: 'ContractData',
      value: decodedValue,
      lastModifiedLedger: 42,
    }
    useLensStore
      .getState()
      .addSnapshot('C1', { [entryKey]: entry }, 43, 'Map capture')

    const savedState = localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)
    expect(savedState).not.toBeNull()
    if (savedState === null) throw new Error('Map snapshot was not saved')
    useLensStore.setState({ snapshots: {} })
    localStorage.setItem(NETWORK_CONFIG_STORAGE_KEY, savedState)

    await useLensStore.persist.rehydrate()

    const snapshots = useLensStore.getState().getSnapshots('C1')
    expect(snapshots).toHaveLength(1)
    const restoredValue = snapshots[0].ledgerData[entryKey].value
    expect(restoredValue).toMatchObject({
      kind: 'map',
      entries: [
        {
          key: { kind: 'primitive', scType: 'symbol', value: 'answer' },
          value: { kind: 'primitive', scType: 'u32', value: 7 },
        },
      ],
    })
  })

  it('round-trips byte values including zero bytes and preserves display previews', async () => {
    const bytes = [0, 1, 255]
    const before = {
      hex: formatScBytesByPreference(bytes, ByteDisplayMode.HEX),
      base64: formatScBytesByPreference(bytes, ByteDisplayMode.BASE64),
    }
    useLensStore.getState().addSnapshot(
      'C1',
      {
        bytes: {
          key: 'bytes',
          contractId: 'C1',
          type: 'ContractData',
          value: bytes,
          lastModifiedLedger: 9,
        },
      },
      10,
      'Byte fixture',
    )

    const savedState = localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)
    expect(savedState).not.toBeNull()
    if (savedState === null)
      throw new Error('Byte snapshot state was not saved')
    expect(savedState).toContain('"value":[0,1,255]')

    useLensStore.setState({ snapshots: {} })
    localStorage.setItem(NETWORK_CONFIG_STORAGE_KEY, savedState)
    await useLensStore.persist.rehydrate()

    const restoredValue = useLensStore.getState().getSnapshots('C1')[0]
      ?.ledgerData.bytes?.value
    expect(Array.isArray(restoredValue)).toBe(true)
    if (!Array.isArray(restoredValue))
      throw new Error('Byte snapshot entry was not restored')
    expect(formatScBytesByPreference(restoredValue, ByteDisplayMode.HEX)).toBe(
      before.hex,
    )
    expect(
      formatScBytesByPreference(restoredValue, ByteDisplayMode.BASE64),
    ).toBe(before.base64)
    expect(before).toEqual({ hex: '0x0001ff', base64: 'AAH/' })
  })

  it('keeps one 42-to-43 modifid entry after snapshot reload', async () => {
    useLensStore.getState().addSnapshot(
      'C1',
      {
        value: {
          key: 'value',
          contractId: 'C1',
          type: 'ContractData',
          value: 42,
          lastModifiedLedger: 42,
        },
      },
      42,
      'Before',
    )

    const savedState = localStorage.getItem(NETWORK_CONFIG_STORAGE_KEY)
    expect(savedState).not.toBeNull()
    if (savedState === null) throw new Error('Snapshot was not saved')
    useLensStore.setState({ snapshots: {} })
    localStorage.setItem(NETWORK_CONFIG_STORAGE_KEY, savedState)
    await useLensStore.persist.rehydrate()

    const snapshots = useLensStore.getState().getSnapshots('C1')
    expect(snapshots).toHaveLength(1)
    const restored = snapshots[0]
    expect(restored.ledgerData.value.value).toBe(42)

    const diff = diffSnapshotEntries(
      { value: { ...restored.ledgerData.value, value: 43 } },
      restored.ledgerData,
    )
    expect(diff).toHaveLength(1)
  })

  it('retains hydration diagnostic count for rejected records without mislabeling valid empty snapshots', () => {
    const sanitized = sanitizeSnapshots({
      C1: [
        {
          id: 'mixed',
          contractId: 'C1',
          timestamp: Date.now() - 1,
          ledgerSequence: 10,
          ledgerData: {
            valid: {
              key: 'valid',
              contractId: 'C1',
              type: 'ContractData',
              value: 42,
              lastModifiedLedger: 9,
            },
            invalid: { key: 'wrong-key' },
          },
        },
        {
          id: 'empty',
          contractId: 'C1',
          timestamp: Date.now() - 1,
          ledgerSequence: 11,
          ledgerData: {},
        },
      ],
    })

    expect(sanitized.C1[0]?.discardedEntryCount).toBe(1)
    expect(sanitized.C1[0]?.incomplete).toBe(true)
    expect(sanitized.C1[1]?.discardedEntryCount).toBeUndefined()
    expect(sanitized.C1[1]?.incomplete).toBeUndefined()
  })

  it('preserves network config when hydrating snapshots', () => {
    const merged = mergeNetworkConfig(DEFAULT_NETWORKS.testnet, {
      kind: 'preset',
      networkId: 'mainnet',
    })
    expect(merged).toMatchObject({ networkId: 'mainnet' })
  })
})
