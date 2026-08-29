import { makeLedgerEntryKey } from '../storage/makeLedgerEntryKey'
import type { LedgerEntry as RpcLedgerEntry } from './getLedgerEntries'
import type { LedgerEntry as StoreLedgerEntry } from '../../store/types'

interface MapLedgerEntriesParams {
  contractId: string
  entries: Array<RpcLedgerEntry>
  decodedValuesByKey?: Record<string, unknown>
}

function inferLedgerEntryType(key: string): StoreLedgerEntry['type'] {
  const normalized = key.trim().toLowerCase()
  const tokens = normalized.split('::').map((segment) => segment.trim())
  const haystack = tokens.join('::')

  if (haystack.includes('contractcode') || haystack.includes('contract_code')) {
    return 'ContractCode'
  }
  if (haystack.includes('contractdata') || haystack.includes('contract_data')) {
    return 'ContractData'
  }
  if (haystack.includes('account')) {
    return 'Account'
  }
  if (haystack.includes('trustline')) {
    return 'Trustline'
  }

  return 'Other'
}

/**
 * Maps raw RPC ledger-entry payloads into the canonical store entry shape.
 */
export function mapLedgerEntriesToStoreEntries(
  params: MapLedgerEntriesParams,
): Array<StoreLedgerEntry> {
  const { contractId, entries, decodedValuesByKey = {} } = params
  return entries.map((entry) => {
    const last = entry.lastModifiedLedgerSeq
    const live = entry.liveUntilLedgerSeq

    const lastModifiedLedger =
      typeof last === 'number' && Number.isFinite(last) && last >= 0 && Number.isInteger(last)
        ? last
        : 0

    const expirationLedger =
      typeof live === 'number' && Number.isFinite(live) && live >= 0 && Number.isInteger(live)
        ? live
        : undefined

    return {
      key: makeLedgerEntryKey(contractId, 'Other', entry.key),
      contractId,
      type: 'Other',
      value:
        decodedValuesByKey[entry.key] !== undefined
          ? decodedValuesByKey[entry.key]
          : entry.xdr,
      lastModifiedLedger,
      expirationLedger,
      rawXdr: entry.xdr,
    }
  })
}
