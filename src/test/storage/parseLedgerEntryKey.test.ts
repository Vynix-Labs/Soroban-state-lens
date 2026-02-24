// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseLedgerEntryKey } from '../../lib/storage/parseLedgerEntryKey'

describe('parseLedgerEntryKey', () => {
  it('should parse a valid key into its components', () => {
    expect(parseLedgerEntryKey('CABC::persistent::balance')).toEqual({
      contractId: 'CABC',
      entryType: 'persistent',
      keyPart: 'balance',
    })
  })

  it('should handle various valid keys', () => {
    expect(parseLedgerEntryKey('C123::temporary::counter')).toEqual({
      contractId: 'C123',
      entryType: 'temporary',
      keyPart: 'counter',
    })
    expect(parseLedgerEntryKey('CDEF::instance::admin')).toEqual({
      contractId: 'CDEF',
      entryType: 'instance',
      keyPart: 'admin',
    })
  })

  it('should trim whitespace from segments', () => {
    expect(parseLedgerEntryKey(' CABC :: persistent :: balance ')).toEqual({
      contractId: 'CABC',
      entryType: 'persistent',
      keyPart: 'balance',
    })
  })

  it('should return null for keys with extra separators', () => {
    expect(parseLedgerEntryKey('CABC::persistent::balance::extra')).toBeNull()
    expect(
      parseLedgerEntryKey('CABC::persistent::balance::extra::more'),
    ).toBeNull()
  })

  it('should return null for keys with too few segments', () => {
    expect(parseLedgerEntryKey('CABC::persistent')).toBeNull()
    expect(parseLedgerEntryKey('CABC')).toBeNull()
  })

  it('should return null for blank segments', () => {
    expect(parseLedgerEntryKey('::persistent::balance')).toBeNull()
    expect(parseLedgerEntryKey('CABC::::balance')).toBeNull()
    expect(parseLedgerEntryKey('CABC::persistent::')).toBeNull()
  })

  it('should return null for whitespace-only segments', () => {
    expect(parseLedgerEntryKey('   ::persistent::balance')).toBeNull()
    expect(parseLedgerEntryKey('CABC::   ::balance')).toBeNull()
    expect(parseLedgerEntryKey('CABC::persistent::   ')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(parseLedgerEntryKey('')).toBeNull()
  })

  it('should return null for whitespace-only string', () => {
    expect(parseLedgerEntryKey('   ')).toBeNull()
    expect(parseLedgerEntryKey('\t')).toBeNull()
  })

  it('should return null for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(parseLedgerEntryKey(null)).toBeNull()
    // @ts-ignore - testing runtime behavior
    expect(parseLedgerEntryKey(undefined)).toBeNull()
    // @ts-ignore - testing runtime behavior
    expect(parseLedgerEntryKey(123)).toBeNull()
  })

  it('should roundtrip with makeLedgerEntryKey format', () => {
    const key = 'CABC::persistent::balance'
    const parsed = parseLedgerEntryKey(key)
    expect(parsed).toEqual({
      contractId: 'CABC',
      entryType: 'persistent',
      keyPart: 'balance',
    })
    expect(
      `${parsed!.contractId}::${parsed!.entryType}::${parsed!.keyPart}`,
    ).toBe(key)
  })
})
