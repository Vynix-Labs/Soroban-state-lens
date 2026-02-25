import { normalizeContractIdInput } from './normalizeContractIdInput'

export interface ContractIdValidationResult {
  ok: boolean
  error?: string
}

/**
 * Validates a Stellar contract ID using Stellar StrKey validation APIs.
 * Returns structured validation result with ok flag and optional error message.
 */
export async function validateContractId(
  input: string,
): Promise<ContractIdValidationResult> {
  // First normalize the input
  const normalized = normalizeContractIdInput(input)

  // Check if empty after normalization
  if (!normalized) {
    return {
      ok: false,
      error: 'Contract ID cannot be empty',
    }
  }

  try {
    // Dynamically import Stellar SDK to avoid TypeScript definition issues
    const stellarSdk = await import('@stellar/stellar-sdk')

    // Use Stellar StrKey to validate contract ID
    const isValidContract = (stellarSdk as any).StrKey.isValidContract(
      normalized,
    )

    if (!isValidContract) {
      return {
        ok: false,
        error:
          'Invalid contract ID format. Must be a valid Stellar contract ID starting with "C"',
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: 'Invalid contract ID format',
    }
  }
}
