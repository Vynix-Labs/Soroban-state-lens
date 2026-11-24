import { Spec } from '@stellar/stellar-sdk/contract'
import { bytesToBase64 } from '../format/bytesToBase64'

type SpecEntry = Spec['entries'][number]
export type EnumUnionSpecParseResult =
  | {
      ok: true
      enums: Array<ReturnType<SpecEntry['udtEnumV0']>>
      unions: Array<ReturnType<SpecEntry['udtUnionV0']>>
    }
  | { ok: false; reason: 'MALFORMED_SPEC' }

/** Decode enum and union entries from an extracted contractspecv0 payload. */
export function parseEnumUnionSpecEntries(
  payload: Uint8Array,
): EnumUnionSpecParseResult {
  try {
    const entries = new Spec(bytesToBase64(payload)).entries
    return {
      ok: true,
      enums: entries
        .filter((entry) => entry.switch().name === 'scSpecEntryUdtEnumV0')
        .map((entry) => entry.udtEnumV0()),
      unions: entries
        .filter((entry) => entry.switch().name === 'scSpecEntryUdtUnionV0')
        .map((entry) => entry.udtUnionV0()),
    }
  } catch {
    return { ok: false, reason: 'MALFORMED_SPEC' }
  }
}
