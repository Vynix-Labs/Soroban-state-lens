import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { parseStructSpecEntries } from '../../lib/spec/parseStructSpecEntries'

describe('parseStructSpecEntries', () => {
  const entry = xdr.ScSpecEntry.scSpecEntryUdtStructV0(
    new xdr.ScSpecUdtStructV0({
      doc: '',
      lib: '',
      name: 'Payment',
      fields: [
        new xdr.ScSpecUdtStructFieldV0({
          doc: '',
          name: 'owner',
          type: xdr.ScSpecTypeDef.scSpecTypeAddress(),
        }),
        new xdr.ScSpecUdtStructFieldV0({
          doc: '',
          name: 'asset',
          type: xdr.ScSpecTypeDef.scSpecTypeUdt(
            new xdr.ScSpecTypeUdt({ name: 'Asset' }),
          ),
        }),
      ],
    }),
  )

  it('retains struct name, field order, and wire type references', () => {
    const result = parseStructSpecEntries(entry.toXDR())
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected a parsed spec')
    const [struct] = result.structs
    expect(struct.name().toString()).toBe('Payment')
    expect(struct.fields().map((field) => field.name().toString())).toEqual([
      'owner',
      'asset',
    ])
    expect(struct.fields()[0].type().switch().name).toBe('scSpecTypeAddress')
    expect(struct.fields()[1].type().udt().name().toString()).toBe('Asset')
  })

  it('rejects truncated XDR', () => {
    const payload = entry.toXDR()
    expect(
      parseStructSpecEntries(payload.subarray(0, payload.length - 1)),
    ).toEqual({ ok: false, reason: 'MALFORMED_SPEC' })
  })
})
