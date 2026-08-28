import { describe, expect, it } from 'vitest'
import { mapLedgerEntriesToStoreEntries } from '../../lib/network/mapLedgerEntriesToStoreEntries'

describe('mapLedgerEntriesToStoreEntries', () => {
  it('maps representative entries into stable store records', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_1',
      entries: [
        {
          key: 'ledger-key-1',
          xdr: 'xdr-1',
          lastModifiedLedgerSeq: 42,
          liveUntilLedgerSeq: 99,
        },
      ],
      decodedValuesByKey: {
        'ledger-key-1': { kind: 'primitive', scType: 'string', value: 'hello' },
      },
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_1::Other::ledger-key-1',
        contractId: 'CONTRACT_1',
        type: 'Other',
        value: { kind: 'primitive', scType: 'string', value: 'hello' },
        lastModifiedLedger: 42,
        expirationLedger: 99,
        rawXdr: 'xdr-1',
      },
    ])
  })

  it('falls back safely when optional metadata is missing', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_2',
      entries: [{ key: 'ledger-key-2', xdr: 'xdr-2' }],
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_2::Other::ledger-key-2',
        contractId: 'CONTRACT_2',
        type: 'Other',
        value: 'xdr-2',
        lastModifiedLedger: 0,
        expirationLedger: undefined,
        rawXdr: 'xdr-2',
      },
    ])
  })

  it('maps multiple entries deterministically', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_3',
      entries: [
        { key: 'a', xdr: 'xdr-a', lastModifiedLedgerSeq: 1 },
        { key: 'b', xdr: 'xdr-b', lastModifiedLedgerSeq: 2 },
      ],
    })

    expect(result).toHaveLength(2)
    expect(result[0]?.key).toBe('CONTRACT_3::Other::a')
    expect(result[1]?.key).toBe('CONTRACT_3::Other::b')
  })

  // ── Fallback paths (#305) ────────────────────────────────────────────

  it('defaults lastModifiedLedger to 0 when lastModifiedLedgerSeq is missing (#305)', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_4',
      entries: [
        {
          key: 'ledger-key-4',
          xdr: 'xdr-4',
          // no lastModifiedLedgerSeq — optional field absent
        },
      ],
      decodedValuesByKey: {
        'ledger-key-4': { kind: 'primitive', scType: 'u64', value: '123' },
      },
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_4::Other::ledger-key-4',
        contractId: 'CONTRACT_4',
        type: 'Other',
        value: { kind: 'primitive', scType: 'u64', value: '123' },
        lastModifiedLedger: 0,
        expirationLedger: undefined,
        rawXdr: 'xdr-4',
      },
    ])
  })

  it('falls back to raw XDR when the decoded value is absent (#305)', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_5',
      entries: [
        {
          key: 'ledger-key-5',
          xdr: 'xdr-5',
          lastModifiedLedgerSeq: 7,
          liveUntilLedgerSeq: 10,
        },
      ],
      decodedValuesByKey: {
        // decoded value absent for this key
        'other-key': { kind: 'primitive', scType: 'string', value: 'ignored' },
      },
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_5::Other::ledger-key-5',
        contractId: 'CONTRACT_5',
        type: 'Other',
        value: 'xdr-5',
        lastModifiedLedger: 7,
        expirationLedger: 10,
        rawXdr: 'xdr-5',
      },
    ])
  })

  it('treats an explicitly empty decoded map like an absent one (#305)', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_6',
      entries: [
        { key: 'ledger-key-6', xdr: 'xdr-6', lastModifiedLedgerSeq: 3 },
      ],
      decodedValuesByKey: {},
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_6::Other::ledger-key-6',
        contractId: 'CONTRACT_6',
        type: 'Other',
        value: 'xdr-6',
        lastModifiedLedger: 3,
        expirationLedger: undefined,
        rawXdr: 'xdr-6',
      },
    ])
  })

  it('falls back per-entry when only some entries have decoded values (#305)', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_7',
      entries: [
        { key: 'decoded', xdr: 'xdr-decoded', lastModifiedLedgerSeq: 1 },
        { key: 'raw', xdr: 'xdr-raw', lastModifiedLedgerSeq: 2 },
      ],
      decodedValuesByKey: {
        decoded: { kind: 'primitive', scType: 'string', value: 'present' },
      },
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_7::Other::decoded',
        contractId: 'CONTRACT_7',
        type: 'Other',
        value: { kind: 'primitive', scType: 'string', value: 'present' },
        lastModifiedLedger: 1,
        expirationLedger: undefined,
        rawXdr: 'xdr-decoded',
      },
      {
        key: 'CONTRACT_7::Other::raw',
        contractId: 'CONTRACT_7',
        type: 'Other',
        value: 'xdr-raw',
        lastModifiedLedger: 2,
        expirationLedger: undefined,
        rawXdr: 'xdr-raw',
      },
    ])
  })

  it('treats an explicit undefined decoded value as absent (#305)', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_8',
      entries: [{ key: 'k', xdr: 'xdr-k', lastModifiedLedgerSeq: 5 }],
      decodedValuesByKey: { k: undefined },
    })

    expect(result).toEqual([
      {
        key: 'CONTRACT_8::Other::k',
        contractId: 'CONTRACT_8',
        type: 'Other',
        value: 'xdr-k',
        lastModifiedLedger: 5,
        expirationLedger: undefined,
        rawXdr: 'xdr-k',
      },
    ])
  })

  it('returns an empty array when there are no entries (#305)', () => {
    const result = mapLedgerEntriesToStoreEntries({
      contractId: 'CONTRACT_9',
      entries: [],
    })

    expect(result).toEqual([])
  })
})
