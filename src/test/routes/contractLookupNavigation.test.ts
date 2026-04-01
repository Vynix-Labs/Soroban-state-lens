import { describe, expect, it } from 'vitest'
import { validateContractRouteParam } from '@/routes/contracts/$contractId/-validateContractRouteParam'

const VALID_CONTRACT_ID =
  'CC42QZWUV2R7PUN2SZZW3Y3A43UUB5L2U3B4K3O5EUT7Y4I2O2W34EWM'

describe('contract lookup navigation guard', () => {
  it('returns ok:true for a valid contract ID — navigation should proceed', () => {
    const result = validateContractRouteParam(VALID_CONTRACT_ID)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.contractId).toBe(VALID_CONTRACT_ID)
    }
  })

  it('returns ok:false for empty input — navigation must not proceed', () => {
    expect(validateContractRouteParam('').ok).toBe(false)
    expect(validateContractRouteParam('   ').ok).toBe(false)
  })

  it('returns ok:false for an invalid contract ID — navigation must not proceed', () => {
    expect(validateContractRouteParam('INVALID').ok).toBe(false)
    expect(validateContractRouteParam('not-a-contract').ok).toBe(false)
  })

  it('normalizes lowercase input and still passes — navigation proceeds', () => {
    const result = validateContractRouteParam(VALID_CONTRACT_ID.toLowerCase())
    expect(result.ok).toBe(true)
  })

  it('strips surrounding whitespace and still passes — navigation proceeds', () => {
    const result = validateContractRouteParam(`  ${VALID_CONTRACT_ID}  `)
    expect(result.ok).toBe(true)
  })
})
