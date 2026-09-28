import { describe, expect, it } from 'vitest'
import { redirectContractIndex } from '../../routes/contracts/$contractId/index'

const VALID_CONTRACT_ID =
  'CC42QZWUV2R7PUN2SZZW3Y3A43UUB5L2U3B4K3O5EUT7Y4I2O2W34EWM'

function captureRedirect(callback: () => never): unknown {
  try {
    callback()
  } catch (error) {
    return error
  }

  throw new Error('Expected route guard to redirect')
}

describe('contract index route', () => {
  it('redirects a validated contract ID to the explorer', () => {
    expect(
      captureRedirect(() => redirectContractIndex(VALID_CONTRACT_ID)),
    ).toMatchObject({
      options: {
        to: '/contracts/$contractId/explorer',
        params: { contractId: VALID_CONTRACT_ID },
        search: { keys: '' },
      },
    })
  })

  it('redirects an invalid contract ID to the landing route', () => {
    expect(
      captureRedirect(() => redirectContractIndex('INVALID')),
    ).toMatchObject({
      options: { to: '/' },
    })
  })
})
