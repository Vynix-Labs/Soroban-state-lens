import { makeLedgerEntryKey } from '../storage/makeLedgerEntryKey'
import type { LedgerEntry as RpcLedgerEntry } from './getLedgerEntries'
import type { LedgerEntry as StoreLedgerEntry } from '../../store/types'

interface MapLedgerEntriesParams {
  contractId: string
  entries: Array<RpcLedgerEntry>
  decodedValuesByKey?: Record<string, unknown>
}

/**
 * Maps raw RPC ledger-entry payloads into the canonical store entry shape.
 */
export function mapLedgerEntriesToStoreEntries(
  params: MapLedgerEntriesParams,
): Array<StoreLedgerEntry> {
  const { contractId, entries, decodedValuesByKey = {} } = params

  return entries.map((entry) => {
    const hasDecodedValue = Object.prototype.hasOwnProperty.call(
      decodedValuesByKey,
      entry.key,
    )
    const expirationLedger =
      typeof entry.liveUntilLedgerSeq === 'number' &&
      Number.isFinite(entry.liveUntilLedgerSeq)
        ? entry.liveUntilLedgerSeq
        : undefined

    return {
      key: makeLedgerEntryKey(contractId, 'Other', entry.key),
      contractId,
      type: 'Other',
      value: hasDecodedValue ? decodedValuesByKey[entry.key] : entry.xdr,
      lastModifiedLedger: entry.lastModifiedLedgerSeq ?? 0,
      expirationLedger,
      rawXdr: entry.xdr,
    }
  })
}
