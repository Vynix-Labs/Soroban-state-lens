import { Contract, xdr } from '@stellar/stellar-sdk'
import { getLedgerEntries } from './getLedgerEntries'
import type {
  GetContractWasmParams,
  GetContractWasmResult,
} from './getContractWasm'

/** Read the instance and its referenced WASM code using Stellar RPC ledger entries. */
export async function getContractWasmForSpec(
  params: GetContractWasmParams,
): Promise<GetContractWasmResult> {
  try {
    const instanceKey = new Contract(params.contractId)
      .getFootprint()
      .toXDR('base64')
    const options = {
      rpcUrl: params.rpcUrl,
      timeout: params.timeout,
      timeoutMs: params.timeoutMs,
      signal: params.signal,
    }
    const instance = await getLedgerEntries({ ...options, keys: [instanceKey] })
    const instanceEntry = instance.entries.find(
      (entry) => entry.key === instanceKey,
    )
    if (!instanceEntry)
      return { success: false, error: 'Contract instance not found' }
    const instanceData = xdr.LedgerEntryData.fromXDR(
      instanceEntry.xdr,
      'base64',
    )
    if (instanceData.switch().name !== 'contractData')
      return { success: false, error: 'Invalid contract instance entry' }
    const value = instanceData.contractData().val()
    if (value.switch().name !== 'scvContractInstance')
      return { success: false, error: 'Invalid contract instance value' }
    const executable = value.instance().executable()
    if (executable.switch().name !== 'contractExecutableWasm')
      return { success: false, error: 'Contract has no WASM executable' }
    const hash: Uint8Array = executable.wasmHash()
    const codeKey = xdr.LedgerKey.contractCode(
      new xdr.LedgerKeyContractCode({ hash }),
    ).toXDR('base64')
    const code = await getLedgerEntries({ ...options, keys: [codeKey] })
    const codeEntry = code.entries.find((entry) => entry.key === codeKey)
    if (!codeEntry) return { success: false, error: 'Contract code not found' }
    const codeData = xdr.LedgerEntryData.fromXDR(codeEntry.xdr, 'base64')
    if (codeData.switch().name !== 'contractCode')
      return { success: false, error: 'Invalid contract code entry' }
    if (!codeData.contractCode().hash().equals(hash))
      return { success: false, error: 'Contract code hash mismatch' }
    return {
      success: true,
      wasm: new Uint8Array(codeData.contractCode().code()),
      wasmHash: Array.from(hash, (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(''),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to load contract WASM',
    }
  }
}
