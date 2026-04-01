import { describe, expect, it } from 'vitest'
// @ts-ignore - module is provided by the runtime bundle
import { Address } from '@stellar/stellar-sdk'

import { normalizeScVal } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - Address integration tests', () => {
  it('normalizes account address through main normalizeScVal function', () => {
    const raw = Buffer.alloc(32, 1)
    const accountAddress = Address.account(raw)
    const scVal = accountAddress.toScVal()

    const normalized = normalizeScVal(scVal)

    expect(normalized).not.toBeNull()
    expect(normalized).toEqual({
      kind: 'address',
      addressType: 'account',
      value: accountAddress.toString(),
    })
  })

  it('normalizes contract address through main normalizeScVal function', () => {
    const raw = Buffer.alloc(32, 2)
    const contractAddress = Address.contract(raw)
    const scVal = contractAddress.toScVal()

    const normalized = normalizeScVal(scVal)

    expect(normalized).not.toBeNull()
    expect(normalized).toEqual({
      kind: 'address',
      addressType: 'contract',
      value: contractAddress.toString(),
    })
  })

  it('handles null/undefined ScVal safely', () => {
    expect(normalizeScVal(null)).toEqual({
      kind: 'unsupported',
      variant: 'Invalid',
      rawData: null,
    })

    expect(normalizeScVal(undefined)).toEqual({
      kind: 'unsupported',
      variant: 'Invalid',
      rawData: null,
    })
  })

  it('handles invalid ScVal objects safely', () => {
    const invalidScVal = { switch: 'InvalidType' as any, value: 'some data' }
    const normalized = normalizeScVal(invalidScVal)

    expect(normalized).toEqual({
      kind: 'unsupported',
      variant: 'InvalidType',
      rawData: 'some data',
    })
  })
})
