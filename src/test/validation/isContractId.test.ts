// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isContractId } from '../../lib/validation/isContractId'

describe('isContractId', () => {
  it('should return true for a valid contract ID', () => {
    expect(
      isContractId('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
    ).toBe(true)
    expect(
      isContractId('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),
    ).toBe(true)
  })

  it('should return false for empty strings', () => {
    expect(isContractId('')).toBe(false)
  })

  it('should return false for whitespace-only values', () => {
    expect(isContractId('   ')).toBe(false)
    expect(isContractId('\t')).toBe(false)
    expect(isContractId('\n')).toBe(false)
  })

  it('should return false for lowercase input', () => {
    expect(
      isContractId('cdlzfc3syjydzt7k67vz75hpjvieuvnixf47zg2fb2rmqqvu2hhgcysc'),
    ).toBe(false)
    expect(
      isContractId('Cdlzfc3syjydzt7k67vz75hpjvieuvnixf47zg2fb2rmqqvu2hhgcysc'),
    ).toBe(false)
  })

  it('should return false for values not starting with C', () => {
    expect(
      isContractId('GDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),
    ).toBe(false)
    expect(
      isContractId('SDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),
    ).toBe(false)
    expect(
      isContractId('1DLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),
    ).toBe(false)
  })

  it('should return false for values with leading or trailing whitespace', () => {
    expect(
      isContractId(' CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),
    ).toBe(false)
    expect(
      isContractId('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC '),
    ).toBe(false)
  })

  it('should return false for wrong length', () => {
    expect(isContractId('CDLZFC3S')).toBe(false)
    expect(
      isContractId(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSCAA',
      ),
    ).toBe(false)
  })

  it('should return false for invalid base32 characters', () => {
    // Characters 0, 1, 8, 9 are not in base32 alphabet
    expect(
      isContractId('C000000000000000000000000000000000000000000000000000000Q'),
    ).toBe(false)
    expect(
      isContractId('C111111111111111111111111111111111111111111111111111111Q'),
    ).toBe(false)
    expect(
      isContractId('C888888888888888888888888888888888888888888888888888888Q'),
    ).toBe(false)
    expect(
      isContractId('C999999999999999999999999999999999999999999999999999999Q'),
    ).toBe(false)
  })

  it('should return false for special characters', () => {
    expect(
      isContractId('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYS!'),
    ).toBe(false)
    expect(
      isContractId('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYS-'),
    ).toBe(false)
  })

  it('should return false for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior for non-string
    expect(isContractId(null)).toBe(false)
    // @ts-ignore - testing runtime behavior for non-string
    expect(isContractId(undefined)).toBe(false)
    // @ts-ignore - testing runtime behavior for non-string
    expect(isContractId(123)).toBe(false)
  })
})
