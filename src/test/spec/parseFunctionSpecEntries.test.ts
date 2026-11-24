import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { parseFunctionSpecEntries } from '../../lib/spec/parseFunctionSpecEntries'

describe('parseFunctionSpecEntries', () => {
  const entry = xdr.ScSpecEntry.scSpecEntryFunctionV0(
    new xdr.ScSpecFunctionV0({
      doc: '',
      name: 'transfer',
      inputs: [
        new xdr.ScSpecFunctionInputV0({
          doc: '',
          name: 'recipient',
          type: xdr.ScSpecTypeDef.scSpecTypeAddress(),
        }),
        new xdr.ScSpecFunctionInputV0({
          doc: '',
          name: 'amount',
          type: xdr.ScSpecTypeDef.scSpecTypeI128(),
        }),
      ],
      outputs: [xdr.ScSpecTypeDef.scSpecTypeBool()],
    }),
  )

  it('retains the function name, ordered arguments and output type', () => {
    const result = parseFunctionSpecEntries(entry.toXDR())
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected a parsed spec')
    const [fn] = result.functions
    expect(fn.name().toString()).toBe('transfer')
    expect(fn.inputs().map((input) => input.name().toString())).toEqual([
      'recipient',
      'amount',
    ])
    expect(fn.inputs().map((input) => input.type().switch().name)).toEqual([
      'scSpecTypeAddress',
      'scSpecTypeI128',
    ])
    expect(fn.outputs()[0].switch().name).toBe('scSpecTypeBool')
  })

  it('returns a typed error for truncated XDR', () => {
    const payload = entry.toXDR()
    expect(
      parseFunctionSpecEntries(payload.subarray(0, payload.length - 1)),
    ).toEqual({ ok: false, reason: 'MALFORMED_SPEC' })
  })
})
