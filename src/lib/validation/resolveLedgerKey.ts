import { Address, xdr } from '@stellar/stellar-sdk'

/**
 * Reason codes for ledger key resolution failures.
 */
export type LedgerKeyResolutionReason =
  | 'EMPTY_INPUT'
  | 'MALFORMED'
  | 'NOT_CONTRACT_DATA'

export type LedgerKeyResolutionError = LedgerKeyResolutionReason

export interface ResolveLedgerKeySuccess {
  ok: true
  /**
   * The resolved StrKey contract ID starting with 'C'.
   */
  contractId: string
  /**
   * The canonical base64-encoded LedgerKey XDR.
   */
  canonicalKey: string
  /**
   * Alias for canonicalKey.
   */
  key: string
  /**
   * Alias for canonicalKey.
   */
  keyXdr: string
  /**
   * Base64-encoded storage key ScVal XDR.
   */
  storageKeyXdr: string
  /**
   * Normalized durability of the contract data entry.
   */
  durability: 'Persistent' | 'Temporary'
  /**
   * Matching path parameters for the contract route.
   */
  params: {
    contractId: string
  }
  /**
   * Matching search query parameters for explorer view.
   */
  search: {
    keys: string
    mode: 'live'
  }
  /**
   * Target route path for explorer view.
   */
  to: '/contracts/$contractId/explorer'
}

export interface ResolveLedgerKeyFailure {
  ok: false
  reason: LedgerKeyResolutionReason
  error: LedgerKeyResolutionReason
  message: string
  entryType?: string
}

export type ResolveLedgerKeyResult =
  | ResolveLedgerKeySuccess
  | ResolveLedgerKeyFailure

/**
 * Resolves a base64-encoded LedgerKey XDR string into contract ID and lookup parameters.
 *
 * For valid `contractData` LedgerKeys, returns `ok: true` with normalized contractId,
 * exact canonical key XDR, route params, and search params.
 *
 * For empty input, malformed XDR, or non-contract-data keys, returns `ok: false`
 * with discriminated reason codes ('EMPTY_INPUT' | 'MALFORMED' | 'NOT_CONTRACT_DATA').
 *
 * @param input - Base64 encoded LedgerKey XDR
 * @returns Discriminated result with route parameters on success or error details on failure
 */
export function resolveContractDataLedgerKey(
  input: string,
): ResolveLedgerKeyResult {
  if (typeof input !== 'string') {
    return {
      ok: false,
      reason: 'EMPTY_INPUT',
      error: 'EMPTY_INPUT',
      message: 'Ledger key input must be a string',
    }
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return {
      ok: false,
      reason: 'EMPTY_INPUT',
      error: 'EMPTY_INPUT',
      message: 'Ledger key input cannot be empty',
    }
  }

  let ledgerKey: ReturnType<typeof xdr.LedgerKey.fromXDR>
  try {
    ledgerKey = xdr.LedgerKey.fromXDR(trimmed, 'base64')
  } catch (err) {
    return {
      ok: false,
      reason: 'MALFORMED',
      error: 'MALFORMED',
      message:
        err instanceof Error
          ? err.message
          : 'Invalid base64 XDR encoding for LedgerKey',
    }
  }

  const keyType = ledgerKey.switch().name
  if (keyType !== 'contractData') {
    return {
      ok: false,
      reason: 'NOT_CONTRACT_DATA',
      error: 'NOT_CONTRACT_DATA',
      entryType: keyType,
      message: `Expected contractData ledger key, received: ${keyType}`,
    }
  }

  const contractData = ledgerKey.contractData()
  let contractId: string
  try {
    contractId = Address.fromScVal(
      xdr.ScVal.scvAddress(contractData.contract()),
    ).toString()
  } catch (err) {
    return {
      ok: false,
      reason: 'MALFORMED',
      error: 'MALFORMED',
      message: 'Unable to decode contract address from contractData LedgerKey',
    }
  }

  if (!contractId.startsWith('C')) {
    return {
      ok: false,
      reason: 'NOT_CONTRACT_DATA',
      error: 'NOT_CONTRACT_DATA',
      entryType: keyType,
      message: `LedgerKey address is not a contract: ${contractId}`,
    }
  }

  const canonicalKey = ledgerKey.toXDR('base64')
  const storageKeyXdr = contractData.key().toXDR('base64')
  const durabilityRaw = contractData.durability().name
  const durability = durabilityRaw === 'temporary' ? 'Temporary' : 'Persistent'

  return {
    ok: true,
    contractId,
    canonicalKey,
    key: canonicalKey,
    keyXdr: canonicalKey,
    storageKeyXdr,
    durability,
    params: {
      contractId,
    },
    search: {
      keys: canonicalKey,
      mode: 'live',
    },
    to: '/contracts/$contractId/explorer',
  }
}

export const resolveLedgerKey = resolveContractDataLedgerKey
export default resolveContractDataLedgerKey
