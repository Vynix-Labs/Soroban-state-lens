import { describe, expect, it } from 'vitest'
import { validateInspectKeyPathParam } from '../../routes/contracts/$contractId/-validateInspectKeyPathParam'

describe('validateInspectKeyPathParam', () => {
  it('should accept a non-empty key path', () => {
    expect(validateInspectKeyPathParam('ledger-key-1')).toEqual({
      ok: true,
      keyPath: 'ledger-key-1',
    })
  })

  it('should trim surrounding whitespace for valid key paths', () => {
    expect(validateInspectKeyPathParam('  ledger-key-1  ')).toEqual({
      ok: true,
      keyPath: 'ledger-key-1',
    })
  })

  it('should reject an empty key path', () => {
    expect(validateInspectKeyPathParam('')).toEqual({
      ok: false,
      reason: 'EMPTY_INPUT',
    })
  })

  it('should reject whitespace-only key paths', () => {
    expect(validateInspectKeyPathParam('   ')).toEqual({
      ok: false,
      reason: 'EMPTY_INPUT',
    })
  })
})
