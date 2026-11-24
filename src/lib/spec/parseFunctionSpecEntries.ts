import { Spec } from '@stellar/stellar-sdk/contract'
import { bytesToBase64 } from '../format/bytesToBase64'

export type FunctionSpecParseResult =
  | { ok: true; functions: ReturnType<Spec['funcs']> }
  | { ok: false; reason: 'MALFORMED_SPEC' }

/** Decode function entries from an extracted contractspecv0 payload. */
export function parseFunctionSpecEntries(
  payload: Uint8Array,
): FunctionSpecParseResult {
  try {
    const spec = new Spec(bytesToBase64(payload))
    return { ok: true, functions: spec.funcs() }
  } catch {
    return { ok: false, reason: 'MALFORMED_SPEC' }
  }
}
