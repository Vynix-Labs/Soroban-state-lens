import { xdr } from '@stellar/stellar-sdk'
import { Spec } from '@stellar/stellar-sdk/contract'
import { describe, expect, it } from 'vitest'
import {
  MAX_SPEC_DIAGNOSTICS,
  classifySpecEntries,
} from '../../lib/spec/classifySpecEntries'

describe('classifySpecEntries', () => {
  const fn = xdr.ScSpecEntry.scSpecEntryFunctionV0(
    new xdr.ScSpecFunctionV0({
      doc: '',
      name: 'balance',
      inputs: [],
      outputs: [xdr.ScSpecTypeDef.scSpecTypeI128()],
    }),
  )
  const errorEnum = xdr.ScSpecEntry.scSpecEntryUdtErrorEnumV0(
    new xdr.ScSpecUdtErrorEnumV0({
      doc: '',
      lib: '',
      name: 'Error',
      cases: [],
    }),
  )

  it('keeps functions and reports unsupported variants with their position', () => {
    const parsed = new Spec(Buffer.concat([fn.toXDR(), errorEnum.toXDR()]))
    const result = classifySpecEntries(parsed.entries)
    expect(result.supported).toHaveLength(1)
    expect(result.supported[0].functionV0().name().toString()).toBe('balance')
    expect(result.unsupported).toEqual([
      { index: 1, kind: 'scSpecEntryUdtErrorEnumV0' },
    ])
    expect(result.omittedDiagnostics).toBe(0)
  })

  it('bounds diagnostics while accounting for omitted entries', () => {
    const result = classifySpecEntries(
      Array(MAX_SPEC_DIAGNOSTICS + 5).fill(errorEnum),
    )
    expect(result.unsupported).toHaveLength(MAX_SPEC_DIAGNOSTICS)
    expect(result.omittedDiagnostics).toBe(5)
  })
})
