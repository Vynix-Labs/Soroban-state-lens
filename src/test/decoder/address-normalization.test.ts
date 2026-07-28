import { describe, expect, it } from 'vitest'
// @ts-ignore - module is provided by the runtime bundle
import { Address } from '@stellar/stellar-sdk'

import { normalizeScAddress } from '../../workers/decoder/normalizeScVal'

describe('normalizeScAddress - ScAddress normalization', () => {
  it('converts an account ScAddress to a StrKey string', () => {
    const raw = Buffer.alloc(32, 1)
    const accountAddress = Address.account(raw)
    const scVal = accountAddress.toScVal()

    const normalized = normalizeScAddress(scVal)

    expect(normalized).not.toBeNull()
    expect(normalized).toEqual({
      kind: 'address',
      addressType: 'account',
      value: accountAddress.toString(),
    })
  })

  it('converts a contract ScAddress to a StrKey string', () => {
    const raw = Buffer.alloc(32, 2)
    const contractAddress = Address.contract(raw)
    const scVal = contractAddress.toScVal()

    const normalized = normalizeScAddress(scVal)

    expect(normalized).not.toBeNull()
    expect(normalized).toEqual({
      kind: 'address',
      addressType: 'contract',
      value: contractAddress.toString(),
    })
  })

  it('returns null for malformed address-like inputs', () => {
    expect(normalizeScAddress(undefined as any)).toBeNull()
    expect(
      normalizeScAddress({ switch: () => { throw new Error('boom') } } as any),
    ).toBeNull()
    expect(
      normalizeScAddress({
        switch: () => ({ value: 42 }),
        value: { bad: true },
      } as any),
    ).toBeNull()
  })
})
