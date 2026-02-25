import { describe, expect, it, vi } from 'vitest'
import { validateContractId } from '../../lib/validation/contractId'

// Mock the stellar-sdk module
vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    StrKey: {
      isValidContract: vi.fn(),
    },
  }
})

describe('validateContractId', () => {
  it('should validate a correct contract ID', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockReturnValue(true)

    const result = await validateContractId(
      'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
    )

    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject invalid contract ID format', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockReturnValue(false)

    const result = await validateContractId('INVALID_CONTRACT_ID')

    expect(result.ok).toBe(false)
    expect(result.error).toBe(
      'Invalid contract ID format. Must be a valid Stellar contract ID starting with "C"',
    )
  })

  it('should reject empty input', async () => {
    const result = await validateContractId('')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Contract ID cannot be empty')
  })

  it('should reject whitespace-only input', async () => {
    const result = await validateContractId('   ')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Contract ID cannot be empty')
  })

  it('should normalize input before validation', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockReturnValue(true)

    const result = await validateContractId(
      '  ca3d5krym6cb7owq6twyrr3z4t7gnzlkeyrnzggga5soaopify6yqgaxe  ',
    )

    expect(result.ok).toBe(true)
    expect(stellarSdk.StrKey.isValidContract).toHaveBeenCalledWith(
      'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
    )
  })

  it('should handle malformed input with internal spaces', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockReturnValue(false)

    const result = await validateContractId('CA3D5KRY M6CB7OW Q6TWYRR3Z4T7GNZ')

    expect(result.ok).toBe(false)
    expect(stellarSdk.StrKey.isValidContract).toHaveBeenCalledWith(
      'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZ',
    )
  })

  it('should handle validation errors gracefully', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockImplementation(() => {
      throw new Error('Validation error')
    })

    const result = await validateContractId(
      'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
    )

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Invalid contract ID format')
  })

  it('should handle contract ID that does not start with C', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockReturnValue(false)

    const result = await validateContractId(
      'GA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
    )

    expect(result.ok).toBe(false)
    expect(result.error).toBe(
      'Invalid contract ID format. Must be a valid Stellar contract ID starting with "C"',
    )
  })

  it('should handle contract ID with incorrect length', async () => {
    const stellarSdk = (await import('@stellar/stellar-sdk')) as any
    vi.mocked(stellarSdk.StrKey.isValidContract).mockReturnValue(false)

    const result = await validateContractId('C123')

    expect(result.ok).toBe(false)
    expect(result.error).toBe(
      'Invalid contract ID format. Must be a valid Stellar contract ID starting with "C"',
    )
  })
})
