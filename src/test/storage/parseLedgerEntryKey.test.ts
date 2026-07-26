// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseLedgerEntryKey } from '../../lib/storage/parseLedgerEntryKey'

const VALID_CONTRACT_ID =
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const VALID_CONTRACT_ID_2 =
  'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
const VALID_CONTRACT_ID_3 =
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'

describe('parseLedgerEntryKey', () => {
  it('should parse a valid key into its components', () => {
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID}::persistent::balance`),
    ).toEqual({
      contractId: VALID_CONTRACT_ID,
      entryType: 'persistent',
      keyPart: 'balance',
    })
  })

  it('should handle various valid keys', () => {
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID_2}::temporary::counter`),
    ).toEqual({
      contractId: VALID_CONTRACT_ID_2,
      entryType: 'temporary',
      keyPart: 'counter',
    })
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID_3}::instance::admin`),
    ).toEqual({
      contractId: VALID_CONTRACT_ID_3,
      entryType: 'instance',
      keyPart: 'admin',
    })
  })

  it('should trim whitespace from segments', () => {
    expect(
      parseLedgerEntryKey(` ${VALID_CONTRACT_ID} :: persistent :: balance `),
    ).toEqual({
      contractId: VALID_CONTRACT_ID,
      entryType: 'persistent',
      keyPart: 'balance',
    })
  })

  it('should return null for keys with extra separators', () => {
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID}::persistent::balance::extra`),
    ).toBeNull()
    expect(
      parseLedgerEntryKey(
        `${VALID_CONTRACT_ID}::persistent::balance::extra::more`,
      ),
    ).toBeNull()
  })

  it('should return null for keys with too few segments', () => {
    expect(parseLedgerEntryKey(`${VALID_CONTRACT_ID}::persistent`)).toBeNull()
    expect(parseLedgerEntryKey(VALID_CONTRACT_ID)).toBeNull()
  })

  it('should return null for blank segments', () => {
    expect(parseLedgerEntryKey('::persistent::balance')).toBeNull()
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID}::::balance`),
    ).toBeNull()
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID}::persistent::`),
    ).toBeNull()
  })

  it('should return null for whitespace-only segments', () => {
    expect(parseLedgerEntryKey('   ::persistent::balance')).toBeNull()
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID}::   ::balance`),
    ).toBeNull()
    expect(
      parseLedgerEntryKey(`${VALID_CONTRACT_ID}::persistent::   `),
    ).toBeNull()
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

  it('should return null for a malformed contractId segment', () => {
    expect(parseLedgerEntryKey('CABC::persistent::balance')).toBeNull()
    expect(parseLedgerEntryKey('notacontract::persistent::balance')).toBeNull()
    expect(
      parseLedgerEntryKey(
        'gaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa::persistent::balance',
      ),
    ).toBeNull()
  })

  it('should roundtrip with makeLedgerEntryKey format', () => {
    const key = `${VALID_CONTRACT_ID}::persistent::balance`
    const parsed = parseLedgerEntryKey(key)
    expect(parsed).toEqual({
      contractId: VALID_CONTRACT_ID,
      entryType: 'persistent',
      keyPart: 'balance',
    })
    expect(
      `${parsed!.contractId}::${parsed!.entryType}::${parsed!.keyPart}`,
    ).toBe(key)
  })
})
