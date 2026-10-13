import { normalizeContractIdInput } from './validation/normalizeContractIdInput'
import type { LedgerDataMap } from '../store/types'

/**
 * The deterministic local example from the landing screen ("Load Sample
 * Contract"). It is an explicit demo, not live chain state: entries cached
 * for it must never leak into live exploration (SSL-I045, SSL#733).
 */
export const SAMPLE_CONTRACT_ID =
  'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE'

/** Whether the id addresses the sample contract (case-insensitive). */
export function isSampleContractId(contractId: string): boolean {
  return normalizeContractIdInput(contractId) === SAMPLE_CONTRACT_ID
}

/**
 * A copy of the ledger map without sample-contract records.
 * Comparison is normalized so lowercase sample URLs purge too.
 */
export function withoutDemoRecords(ledgerData: LedgerDataMap): {
  data: LedgerDataMap
  purged: number
} {
  const data: LedgerDataMap = {}
  let purged = 0
  for (const [key, entry] of Object.entries(ledgerData)) {
    if (isSampleContractId(entry.contractId)) {
      purged += 1
    } else {
      data[key] = entry
    }
  }
  return { data, purged }
}
