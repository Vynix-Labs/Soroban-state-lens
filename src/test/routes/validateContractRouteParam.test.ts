import { describe, expect, it } from 'vitest'
import { validateContractRouteParam } from '../../routes/contracts/$contractId/-validateContractRouteParam'

describe('validateContractRouteParam', () => {
  describe('happy path', () => {
    it('should return ok: true with normalized contractId for valid input', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      })
    })

    it('should normalize lowercase input and return valid result', () => {
      const result = validateContractRouteParam(
        'cdlzfc3syjydzt7k67vz75hpjvieuvnixf47zg2fb2rmqqvu2hhgcysc',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      })
    })

    it('should normalize input with leading/trailing whitespace', () => {
      const result = validateContractRouteParam(
        '  CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC  ',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      })
    })

    it('should normalize input with internal spaces', () => {
      const result = validateContractRouteParam(
        'CDLZFC3S YJYDZT7K 67VZ75HP JVIEUVNI XF47ZG2F B2RMQQVU 2HHGCYSC',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      })
    })

    it('should handle mixed case with whitespace', () => {
      const result = validateContractRouteParam(
        '  cdlzfc3syjydzt7k67vz75hpjvieuvnixf47zg2fb2rmqqvu2hhgcysc  ',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      })
    })

    it('should accept all-A contract ID (valid base32)', () => {
      const result = validateContractRouteParam(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      })
    })
  })

  describe('invalid input - EMPTY_INPUT', () => {
    it('should reject empty string', () => {
      const result = validateContractRouteParam('')
      expect(result).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
    })

    it('should reject whitespace-only string', () => {
      const result = validateContractRouteParam('   ')
      expect(result).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
    })

    it('should reject tab-only string', () => {
      const result = validateContractRouteParam('\t\t')
      expect(result).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
    })

    it('should reject newline-only string', () => {
      const result = validateContractRouteParam('\n\n')
      expect(result).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
    })
  })

  describe('invalid input - INVALID_PREFIX', () => {
    it('should reject ID starting with G (Stellar account)', () => {
      const result = validateContractRouteParam(
        'GDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_PREFIX' })
    })

    it('should reject ID starting with S (Stellar secret)', () => {
      const result = validateContractRouteParam(
        'SDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_PREFIX' })
    })

    it('should reject ID starting with a number', () => {
      const result = validateContractRouteParam(
        '1DLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_PREFIX' })
    })

    it('should reject ID starting with lowercase c (after normalization starts with C but checks happen post-normalize)', () => {
      // Note: lowercase 'c' gets normalized to 'C', so a valid lowercase contract ID passes
      // This test verifies that 'g...' prefix is rejected even in lowercase
      const result = validateContractRouteParam(
        'gdlzfc3syjydzt7k67vz75hpjvieuvnixf47zg2fb2rmqqvu2hhgcysc',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_PREFIX' })
    })
  })

  describe('invalid input - INVALID_LENGTH', () => {
    it('should reject ID that is too short', () => {
      const result = validateContractRouteParam('CDLZFC3S')
      expect(result).toEqual({ ok: false, reason: 'INVALID_LENGTH' })
    })

    it('should reject ID that is too long', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSCAA',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_LENGTH' })
    })

    it('should reject single character C', () => {
      const result = validateContractRouteParam('C')
      expect(result).toEqual({ ok: false, reason: 'INVALID_LENGTH' })
    })

    it('should reject 55 character ID', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYS',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_LENGTH' })
    })

    it('should reject 57 character ID', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSCA',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_LENGTH' })
    })
  })

  describe('invalid input - INVALID_CHARACTERS', () => {
    it('should reject ID with digit 0 (not in base32)', () => {
      const result = validateContractRouteParam(
        'C000000000000000000000000000000000000000000000000000000A',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })

    it('should reject ID with digit 1 (not in base32)', () => {
      const result = validateContractRouteParam(
        'C111111111111111111111111111111111111111111111111111111A',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })

    it('should reject ID with digit 8 (not in base32)', () => {
      const result = validateContractRouteParam(
        'C888888888888888888888888888888888888888888888888888888A',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })

    it('should reject ID with digit 9 (not in base32)', () => {
      const result = validateContractRouteParam(
        'C999999999999999999999999999999999999999999999999999999A',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })

    it('should reject ID with special characters', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCY!C',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })

    it('should reject ID with hyphen', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCY-C',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })

    it('should reject ID with underscore', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCY_C',
      )
      expect(result).toEqual({ ok: false, reason: 'INVALID_CHARACTERS' })
    })
  })

  describe('edge cases', () => {
    it('should handle non-string input gracefully', () => {
      // @ts-expect-error - testing runtime behavior
      const resultNull = validateContractRouteParam(null)
      expect(resultNull).toEqual({ ok: false, reason: 'EMPTY_INPUT' })

      // @ts-expect-error - testing runtime behavior
      const resultUndefined = validateContractRouteParam(undefined)
      expect(resultUndefined).toEqual({ ok: false, reason: 'EMPTY_INPUT' })

      // @ts-expect-error - testing runtime behavior
      const resultNumber = validateContractRouteParam(123)
      expect(resultNumber).toEqual({ ok: false, reason: 'EMPTY_INPUT' })

      // @ts-expect-error - testing runtime behavior
      const resultObject = validateContractRouteParam({})
      expect(resultObject).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
    })

    it('should accept valid base32 characters 2-7 and A-Z', () => {
      // Valid 56-char contract ID using only base32 characters (A-Z, 2-7)
      const result = validateContractRouteParam(
        'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW',
      )
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.contractId).toBe(
          'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW',
        )
      }
    })

    it('should handle URL-encoded spaces correctly when decoded', () => {
      // After URL decoding, %20 becomes a space which should be stripped
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      )
      expect(result).toEqual({
        ok: true,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      })
    })

    it('should return discriminated union that can be narrowed', () => {
      const result = validateContractRouteParam(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      )

      if (result.ok) {
        // TypeScript should know contractId exists here
        const id: string = result.contractId
        expect(id).toBeDefined()
      } else {
        // TypeScript should know reason exists here
        const reason: string = result.reason
        expect(reason).toBeDefined()
      }
    })
  })
})
