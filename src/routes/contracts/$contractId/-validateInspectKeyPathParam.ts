/**
 * Stable reason codes for inspect key path validation failures.
 */
export type InspectKeyPathValidationReason = 'EMPTY_INPUT'

/**
 * Discriminated union result for inspect key path route parameter validation.
 */
export type ValidateInspectKeyPathParamResult =
  | { ok: true; keyPath: string }
  | { ok: false; reason: InspectKeyPathValidationReason }

/**
 * Validates and normalizes an inspect key path route parameter.
 *
 * This deliberately stays lightweight: key path parsing belongs to the decoder
 * layer, while the route only needs to guard against empty or whitespace-only
 * params that produce a broken inspector state.
 */
export function validateInspectKeyPathParam(
  keyPathParam: string,
): ValidateInspectKeyPathParamResult {
  const keyPath = keyPathParam.trim()

  if (!keyPath) {
    return { ok: false, reason: 'EMPTY_INPUT' }
  }

  return { ok: true, keyPath }
}
