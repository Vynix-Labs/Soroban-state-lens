import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { parseEnumUnionSpecEntries } from '../../lib/spec/parseEnumUnionSpecEntries'

describe('parseEnumUnionSpecEntries', () => {
  const enumEntry = xdr.ScSpecEntry.scSpecEntryUdtEnumV0(
    new xdr.ScSpecUdtEnumV0({
      doc: '',
      lib: '',
      name: 'Status',
      cases: [
        new xdr.ScSpecUdtEnumCaseV0({ doc: '', name: 'Pending', value: 3 }),
        new xdr.ScSpecUdtEnumCaseV0({ doc: '', name: 'Done', value: 7 }),
      ],
    }),
  )
  const unionEntry = xdr.ScSpecEntry.scSpecEntryUdtUnionV0(
    new xdr.ScSpecUdtUnionV0({
      doc: '',
      lib: '',
      name: 'Result',
      cases: [
        xdr.ScSpecUdtUnionCaseV0.scSpecUdtUnionCaseVoidV0(
          new xdr.ScSpecUdtUnionCaseVoidV0({ doc: '', name: 'Empty' }),
        ),
        xdr.ScSpecUdtUnionCaseV0.scSpecUdtUnionCaseTupleV0(
          new xdr.ScSpecUdtUnionCaseTupleV0({
            doc: '',
            name: 'Value',
            type: [xdr.ScSpecTypeDef.scSpecTypeU32()],
          }),
        ),
      ],
    }),
  )
  const payload = Buffer.concat([enumEntry.toXDR(), unionEntry.toXDR()])

  it('retains enum discriminants and union payload types', () => {
    const result = parseEnumUnionSpecEntries(payload)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected a parsed spec')
    expect(result.enums[0].name().toString()).toBe('Status')
    expect(
      result.enums[0]
        .cases()
        .map((item) => [item.name().toString(), item.value()]),
    ).toEqual([
      ['Pending', 3],
      ['Done', 7],
    ])
    expect(result.unions[0].name().toString()).toBe('Result')
    const cases = result.unions[0].cases()
    expect(cases[0].voidCase().name().toString()).toBe('Empty')
    expect(cases[1].tupleCase().name().toString()).toBe('Value')
    expect(cases[1].tupleCase().type()[0].switch().name).toBe('scSpecTypeU32')
  })

  it('rejects truncated XDR', () => {
    expect(
      parseEnumUnionSpecEntries(payload.subarray(0, payload.length - 1)),
    ).toEqual({ ok: false, reason: 'MALFORMED_SPEC' })
  })
})
