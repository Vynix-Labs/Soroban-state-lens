import { Spec } from '@stellar/stellar-sdk/contract'
import { bytesToBase64 } from '../format/bytesToBase64'

type StructEntry = ReturnType<Spec['entries'][number]['udtStructV0']>

export type StructSpecParseResult =
  | { ok: true; structs: Array<StructEntry> }
  | { ok: false; reason: 'MALFORMED_SPEC' }

/** Decode struct entries from an extracted contractspecv0 payload. */
export function parseStructSpecEntries(
  payload: Uint8Array,
): StructSpecParseResult {
  try {
    const spec = new Spec(bytesToBase64(payload))
    return {
      ok: true,
      structs: spec.entries
        .filter((entry) => entry.switch().name === 'scSpecEntryUdtStructV0')
        .map((entry) => entry.udtStructV0()),
    }
  } catch {
    return { ok: false, reason: 'MALFORMED_SPEC' }
  }
}
