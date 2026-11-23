import { getContractWasmForSpec } from '../network/getContractWasmForSpec'
import { extractContractspecv0 } from '../wasm/wasmExtractor'
import type { GetContractWasmParams } from '../network/getContractWasm'

export type SpecParser<T> = (
  payload: Uint8Array,
) => { ok: true; value: T } | { ok: false; reason: string }

export type LoadContractSpecResult<T> =
  | { ok: true; spec: T }
  | { ok: false; stage: 'fetch' | 'section' | 'parse'; reason: string }

/** Fetch and inspect a contract's WASM without executing it. */
export async function loadContractSpec<T>(
  params: GetContractWasmParams,
  parse: SpecParser<T>,
): Promise<LoadContractSpecResult<T>> {
  const fetched = await getContractWasmForSpec(params)
  if (!fetched.success)
    return { ok: false, stage: 'fetch', reason: fetched.error }
  const extracted = extractContractspecv0(fetched.wasm)
  if (!extracted.ok)
    return { ok: false, stage: 'section', reason: extracted.reason }
  try {
    const parsed = parse(extracted.payload)
    return parsed.ok
      ? { ok: true, spec: parsed.value }
      : { ok: false, stage: 'parse', reason: parsed.reason }
  } catch {
    return {
      ok: false,
      stage: 'parse',
      reason: 'Invalid contract spec payload',
    }
  }
}
