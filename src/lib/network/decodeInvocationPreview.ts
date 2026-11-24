import {
  Address,
  FeeBumpTransaction,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import type { InvocationPreview } from './invocationPreview'

export type InvocationPreviewResult =
  | { ok: true; preview: InvocationPreview }
  | { ok: false; error: 'invalid_xdr' | 'unsupported_transaction' }

/** Decode a single contract invocation without submitting or signing a transaction. */
export function decodeInvocationPreview(
  envelope: string,
): InvocationPreviewResult {
  const encoded = envelope.trim()
  if (
    !encoded ||
    encoded.length > 1_000_000 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      encoded,
    )
  ) {
    return { ok: false, error: 'invalid_xdr' }
  }
  try {
    // The passphrase is only needed to hash or sign; this helper does neither.
    const parsed = TransactionBuilder.fromXDR(encoded, '')
    if (parsed.toXDR() !== encoded) return { ok: false, error: 'invalid_xdr' }
    const transaction =
      parsed instanceof FeeBumpTransaction ? parsed.innerTransaction : parsed
    if (transaction.operations.length !== 1)
      return { ok: false, error: 'unsupported_transaction' }
    const operation = transaction.operations[0]
    if (
      operation.type !== 'invokeHostFunction' ||
      operation.func.switch().name !== 'hostFunctionTypeInvokeContract'
    ) {
      return { ok: false, error: 'unsupported_transaction' }
    }
    const invocation = operation.func.invokeContract()
    const contractId = Address.fromScAddress(
      invocation.contractAddress(),
    ).toString()
    if (!StrKey.isValidContract(contractId))
      return { ok: false, error: 'unsupported_transaction' }
    return {
      ok: true,
      preview: {
        contractId,
        functionName: invocation.functionName().toString(),
        argumentXdr: invocation
          .args()
          .map((argument) => argument.toXDR('base64')),
      },
    }
  } catch {
    return { ok: false, error: 'invalid_xdr' }
  }
}
