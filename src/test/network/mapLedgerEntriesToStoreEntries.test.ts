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
        key: 'CONTRACT_1:Other:ledger-key-1',
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
        key: 'CONTRACT_2:Other:ledger-key-2',
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
    expect(result[0]?.key).toBe('CONTRACT_3:Other:a')
    expect(result[1]?.key).toBe('CONTRACT_3:Other:b')
  })
})
