import { describe, expect, it } from 'vitest'
import {
  resolveContractDataLedgerKey,
  resolveLedgerKey,
} from '../../lib/validation/resolveLedgerKey'
import {
  makeAccountFixture,
  makeContractCodeFixture,
  makeContractDataFixture,
} from '../network/ledgerEntryFixtures'

describe('resolveContractDataLedgerKey', () => {
  describe('ContractData LedgerKeys', () => {
    it('parses an SDK counter key and compares contract ID and exact canonical XDR', () => {
      const fixture = makeContractDataFixture('counter')
      const result = resolveContractDataLedgerKey(fixture.keyXdr)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.contractId).toBe(fixture.contractId)
        expect(result.canonicalKey).toBe(fixture.keyXdr)
        expect(result.key).toBe(fixture.keyXdr)
        expect(result.keyXdr).toBe(fixture.keyXdr)
        expect(result.durability).toBe('Persistent')
        expect(result.params).toEqual({ contractId: fixture.contractId })
        expect(result.search).toEqual({ keys: fixture.keyXdr, mode: 'live' })
        expect(result.to).toBe('/contracts/$contractId/explorer')
      }
    })

    it('works identically via resolveLedgerKey alias', () => {
      const fixture = makeContractDataFixture('counter')
      const result = resolveLedgerKey(fixture.keyXdr)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.contractId).toBe(fixture.contractId)
        expect(result.canonicalKey).toBe(fixture.keyXdr)
      }
    })

    it('correctly handles temporary durability entries', () => {
      const fixture = makeContractDataFixture('tempKey', undefined, 'temporary')
      const result = resolveContractDataLedgerKey(fixture.keyXdr)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.contractId).toBe(fixture.contractId)
        expect(result.canonicalKey).toBe(fixture.keyXdr)
        expect(result.durability).toBe('Temporary')
      }
    })

    it('trims leading and trailing whitespace from input', () => {
      const fixture = makeContractDataFixture('padded')
      const result = resolveContractDataLedgerKey(`  ${fixture.keyXdr}  \n`)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.contractId).toBe(fixture.contractId)
        expect(result.canonicalKey).toBe(fixture.keyXdr)
      }
    })
  })

  describe('Non-contract LedgerKeys', () => {
    it('rejects contractCode ledger keys with NOT_CONTRACT_DATA and entryType', () => {
      const fixture = makeContractCodeFixture()
      const result = resolveContractDataLedgerKey(fixture.keyXdr)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('NOT_CONTRACT_DATA')
        expect(result.error).toBe('NOT_CONTRACT_DATA')
        expect(result.entryType).toBe('contractCode')
        expect(result.message).toContain('contractCode')
      }
    })

    it('rejects account ledger keys with NOT_CONTRACT_DATA and entryType', () => {
      const fixture = makeAccountFixture()
      const result = resolveContractDataLedgerKey(fixture.keyXdr)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('NOT_CONTRACT_DATA')
        expect(result.error).toBe('NOT_CONTRACT_DATA')
        expect(result.entryType).toBe('account')
        expect(result.message).toContain('account')
      }
    })
  })

  describe('Malformed and empty inputs', () => {
    it('rejects empty string with EMPTY_INPUT', () => {
      const result = resolveContractDataLedgerKey('')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('EMPTY_INPUT')
        expect(result.error).toBe('EMPTY_INPUT')
      }
    })

    it('rejects whitespace-only string with EMPTY_INPUT', () => {
      const result = resolveContractDataLedgerKey('   \t\n  ')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('EMPTY_INPUT')
      }
    })

    it('rejects non-string input with EMPTY_INPUT', () => {
      const result = resolveContractDataLedgerKey(null as unknown as string)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('EMPTY_INPUT')
      }
    })

    it('rejects invalid base64 string with MALFORMED', () => {
      const result = resolveContractDataLedgerKey('not-valid-base64!@#$%^')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('MALFORMED')
        expect(result.error).toBe('MALFORMED')
      }
    })

    it('rejects valid base64 that is not a valid LedgerKey XDR with MALFORMED', () => {
      const result = resolveContractDataLedgerKey('AAAA')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('MALFORMED')
      }
    })
  })
})
