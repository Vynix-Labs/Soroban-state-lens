import { normalizeContractIdInput } from '../../../lib/validation/normalizeContractIdInput'
import { isContractId } from '../../../lib/validation/isContractId'

/**
 * Stable reason codes for contract ID validation failures.
 */
export type ContractIdValidationReason =
  | 'EMPTY_INPUT'
  | 'INVALID_PREFIX'
  | 'INVALID_LENGTH'
  | 'INVALID_CHARACTERS'

/**
 * Discriminated union result for contract route parameter validation.
 */
export type ValidateContractRouteParamResult =
  | { ok: true; contractId: string }
  | { ok: false; reason: ContractIdValidationReason }

/**
 * Validates and normalizes a contract ID route parameter.
 *
 * This function is designed for route-layer integration, providing:
 * - Input normalization (whitespace removal, uppercase conversion)
 * - Format validation (C prefix, 56 chars, base32 alphabet)
 * - Stable reason codes for rejection
 *
 * @param contractIdParam - The raw contract ID from the route parameter
 * @returns Discriminated result with normalized contractId on success, or reason code on failure
 */
export function validateContractRouteParam(
  contractIdParam: string,
): ValidateContractRouteParamResult {
  const normalized = normalizeContractIdInput(contractIdParam)

  if (!normalized) {
    return { ok: false, reason: 'EMPTY_INPUT' }
  }

  if (!normalized.startsWith('C')) {
    return { ok: false, reason: 'INVALID_PREFIX' }
  }

  if (normalized.length !== 56) {
    return { ok: false, reason: 'INVALID_LENGTH' }
  }

  if (!isContractId(normalized)) {
    return { ok: false, reason: 'INVALID_CHARACTERS' }
  }

  return { ok: true, contractId: normalized }
}
