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

  return entries
    .filter((entry) => typeof entry?.key === 'string' && entry.key.trim() !== '')
    .map((entry) => {
      const type = inferLedgerEntryType(entry.key)

      return {
        key: makeLedgerEntryKey(contractId, type, entry.key),
        contractId,
        type,
        value:
          decodedValuesByKey[entry.key] !== undefined
            ? decodedValuesByKey[entry.key]
            : entry.xdr,
        lastModifiedLedger: entry.lastModifiedLedgerSeq ?? 0,
        expirationLedger: entry.liveUntilLedgerSeq,
        rawXdr: entry.xdr,
      }
    })
}
