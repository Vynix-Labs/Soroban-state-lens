import { xdr } from '@stellar/stellar-sdk'
import { Spec } from '@stellar/stellar-sdk/contract'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getContractWasmForSpec } from '../../lib/network/getContractWasmForSpec'
import { loadContractSpec } from '../../lib/spec/loadContractSpec'

vi.mock('../../lib/network/getContractWasmForSpec', () => ({
  getContractWasmForSpec: vi.fn(),
}))

describe('loadContractSpec', () => {
  const params = { rpcUrl: 'https://example.test', contractId: 'C123' }
  const entry = xdr.ScSpecEntry.scSpecEntryFunctionV0(
    new xdr.ScSpecFunctionV0({
      doc: '',
      name: 'balance',
      inputs: [],
      outputs: [],
    }),
  )
  const payload = entry.toXDR()
  const name = new TextEncoder().encode('contractspecv0')
  const wasm = new Uint8Array([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    0,
    1 + name.length + payload.length,
    name.length,
    ...name,
    ...payload,
  ])
  const parse = (bytes: Uint8Array) => ({
    ok: true as const,
    value: new Spec(Buffer.from(bytes))
      .funcs()
      .map((fn) => fn.name().toString()),
  })

  beforeEach(() => vi.clearAllMocks())

  it('fetches, extracts and parses a fixture without executing it', async () => {
    vi.mocked(getContractWasmForSpec).mockResolvedValue({ success: true, wasm })
    expect(await loadContractSpec(params, parse)).toEqual({
      ok: true,
      spec: ['balance'],
    })
    expect(getContractWasmForSpec).toHaveBeenCalledWith(params)
  })

  it('distinguishes fetch, section and parser failures', async () => {
    vi.mocked(getContractWasmForSpec).mockResolvedValueOnce({
      success: false,
      error: 'offline',
    })
    expect(await loadContractSpec(params, parse)).toEqual({
      ok: false,
      stage: 'fetch',
      reason: 'offline',
    })
    vi.mocked(getContractWasmForSpec).mockResolvedValueOnce({
      success: true,
      wasm: new Uint8Array([0]),
    })
    expect(await loadContractSpec(params, parse)).toMatchObject({
      ok: false,
      stage: 'section',
    })
    vi.mocked(getContractWasmForSpec).mockResolvedValueOnce({
      success: true,
      wasm,
    })
    expect(
      await loadContractSpec(params, () => ({ ok: false, reason: 'bad spec' })),
    ).toEqual({ ok: false, stage: 'parse', reason: 'bad spec' })
    vi.mocked(getContractWasmForSpec).mockResolvedValueOnce({
      success: true,
      wasm,
    })
    expect(
      await loadContractSpec(params, () => {
        throw new Error('details')
      }),
    ).toEqual({
      ok: false,
      stage: 'parse',
      reason: 'Invalid contract spec payload',
    })
  })
})
