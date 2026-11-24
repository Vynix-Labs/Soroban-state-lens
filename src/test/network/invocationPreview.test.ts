import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import type { InvocationPreview } from '../../lib/network/invocationPreview'

const contractId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

describe('invocation preview', () => {
  it('represents a function with no arguments', () => {
    const preview = {
      contractId,
      functionName: 'decimals',
      argumentXdr: [],
    } satisfies InvocationPreview
    expect(preview.contractId).toBe(contractId)
    expect(preview.functionName).toBe('decimals')
    expect(preview.argumentXdr).toEqual([])
  })

  it('preserves ordered ScVal argument bytes for UI consumers', () => {
    const preview = {
      contractId,
      functionName: 'transfer',
      argumentXdr: [
        xdr.ScVal.scvU32(42).toXDR('base64'),
        xdr.ScVal.scvSymbol('memo').toXDR('base64'),
      ],
    } satisfies InvocationPreview
    const args = preview.argumentXdr.map((encoded) =>
      xdr.ScVal.fromXDR(encoded, 'base64'),
    )
    expect(args[0].u32()).toBe(42)
    expect(args[1].sym().toString()).toBe('memo')
  })
})
