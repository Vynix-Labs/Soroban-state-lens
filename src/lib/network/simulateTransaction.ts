/**
 * simulateTransaction adapter for Soroban State Lens
 * Translates simulation responses into reusable discovery data
 */

export interface SimulateTransactionResponse {
  results?: Array<{
    auth?: unknown[]
    xdr?: string
  }>
  footprint?: {
    readOnly?: string[]
    readWrite?: string[]
  }
  error?: string
  latestLedger?: number
}

export interface SimulateTransactionResult {
  success: boolean
  latestLedger?: number
  results?: Array<{
    auth?: unknown[]
    xdr?: string
  }>
  footprint?: {
    readOnly: string[]
    readWrite: string[]
  }
  error?: string
}

/**
 * Adapts a raw simulateTransaction response into a typed result shape
 */
export function simulateTransactionAdapter(
  response: SimulateTransactionResponse | null | undefined
): SimulateTransactionResult {
  if (!response) {
    return { success: false, error: 'No response provided' }
  }

  if (response.error) {
    return { success: false, error: response.error }
  }

  return {
    success: true,
    latestLedger: response.latestLedger,
    results: response.results ?? [],
    footprint: {
      readOnly: response.footprint?.readOnly ?? [],
      readWrite: response.footprint?.readWrite ?? [],
    },
  }
}
