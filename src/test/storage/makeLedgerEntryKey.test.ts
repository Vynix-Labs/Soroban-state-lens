// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeLedgerEntryKey } from '../../lib/storage/makeLedgerEntryKey'

describe('makeLedgerEntryKey', () => {
  it('should build a key in contract::entryType::keyPart format', () => {
    expect(makeLedgerEntryKey('CABC', 'persistent', 'balance')).toBe(
      'CABC::persistent::balance',
    )
  })

  it('should trim whitespace from all components', () => {
    expect(makeLedgerEntryKey('  CABC  ', ' persistent ', ' balance ')).toBe(
      'CABC::persistent::balance',
    )
  })

  it('should handle various valid inputs', () => {
    expect(makeLedgerEntryKey('C123', 'temporary', 'counter')).toBe(
      'C123::temporary::counter',
    )
    expect(makeLedgerEntryKey('CDEF', 'instance', 'admin')).toBe(
      'CDEF::instance::admin',
    )
  })

  it('should throw for empty contractId', () => {
    expect(() => makeLedgerEntryKey('', 'persistent', 'balance')).toThrow(
      'contractId must be a non-empty string',
    )
  })

  it('should throw for empty entryType', () => {
    expect(() => makeLedgerEntryKey('CABC', '', 'balance')).toThrow(
      'entryType must be a non-empty string',
    )
  })

  it('should throw for empty keyPart', () => {
    expect(() => makeLedgerEntryKey('CABC', 'persistent', '')).toThrow(
      'keyPart must be a non-empty string',
    )
  })

  it('should throw for whitespace-only components', () => {
    expect(() => makeLedgerEntryKey('   ', 'persistent', 'balance')).toThrow(
      'contractId must be a non-empty string',
    )
    expect(() => makeLedgerEntryKey('CABC', '  ', 'balance')).toThrow(
      'entryType must be a non-empty string',
    )
    expect(() => makeLedgerEntryKey('CABC', 'persistent', '\t')).toThrow(
      'keyPart must be a non-empty string',
    )
  })

  it('should throw for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(() => makeLedgerEntryKey(null, 'persistent', 'balance')).toThrow()
    // @ts-ignore - testing runtime behavior
    expect(() => makeLedgerEntryKey('CABC', undefined, 'balance')).toThrow()
    // @ts-ignore - testing runtime behavior
    expect(() => makeLedgerEntryKey('CABC', 'persistent', 123)).toThrow()
  })

  it('should produce deterministic output for the same inputs', () => {
    const a = makeLedgerEntryKey('CABC', 'persistent', 'balance')
    const b = makeLedgerEntryKey('CABC', 'persistent', 'balance')
    expect(a).toBe(b)
  })
})
