import { describe, expect, it } from 'vitest'
import { ledgerKeyValidator } from '../../../src/lib/validation/ledgerKeyValidator'

describe('ledgerKeyValidator', () => {
  it('accepts a valid serialized ledger key', () => {
    const res = ledgerKeyValidator('contract::type::part')
    expect(res).toEqual({ valid: true })
  })

  it('accepts whitespace padded valid keys', () => {
    const res = ledgerKeyValidator('  contract  ::  type  ::  part  ')
    expect(res).toEqual({ valid: true })
  })

  it('rejects blank input', () => {
    const res = ledgerKeyValidator('   ')
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Ledger key cannot be blank')
  })

  it('rejects wrong segment count', () => {
    const res = ledgerKeyValidator('contract::type')
    expect(res.valid).toBe(false)
    expect(res.error).toBe(
      'Invalid ledger key. Expected format: contractId::entryType::keyPart',
    )
  })

  it('rejects empty segments', () => {
    const res1 = ledgerKeyValidator('::type::part')
    expect(res1.valid).toBe(false)

    const res2 = ledgerKeyValidator('contract::::part')
    expect(res2.valid).toBe(false)

    const res3 = ledgerKeyValidator('contract::type::   ')
    expect(res3.valid).toBe(false)
  })
})

