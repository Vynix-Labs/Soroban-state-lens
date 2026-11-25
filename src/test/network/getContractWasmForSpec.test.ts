import { Contract, xdr } from '@stellar/stellar-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLedgerEntries } from '../../lib/network/getLedgerEntries'
import { getContractWasmForSpec } from '../../lib/network/getContractWasmForSpec'

vi.mock('../../lib/network/getLedgerEntries', () => ({
  getLedgerEntries: vi.fn(),
}))

describe('getContractWasmForSpec', () => {
  const contractId = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE'
  const instanceKey = new Contract(contractId).getFootprint()
  const hash = Buffer.alloc(32, 7)
  const codeKey = xdr.LedgerKey.contractCode(
    new xdr.LedgerKeyContractCode({ hash }),
  )
  const instance = xdr.LedgerEntryData.contractData(
    new xdr.ContractDataEntry({
      ext: new xdr.ExtensionPoint(0),
      contract: instanceKey.contractData().contract(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
      val: xdr.ScVal.scvContractInstance(
        new xdr.ScContractInstance({
          executable: xdr.ContractExecutable.contractExecutableWasm(hash),
          storage: null,
        }),
      ),
    }),
  )
  const code = xdr.LedgerEntryData.contractCode(
    new xdr.ContractCodeEntry({
      ext: new xdr.ContractCodeEntryExt(0),
      hash,
      code: Buffer.from([0, 97, 115, 109]),
    }),
  )
  const params = {
    rpcUrl: 'https://example.test',
    contractId,
    timeoutMs: 1000,
    signal: new AbortController().signal,
  }
  beforeEach(() => vi.clearAllMocks())

  it('fetches the instance and referenced code with ledger keys', async () => {
    vi.mocked(getLedgerEntries)
      .mockResolvedValueOnce({
        entries: [
          { key: instanceKey.toXDR('base64'), xdr: instance.toXDR('base64') },
        ],
        latestLedger: 1,
      })
      .mockResolvedValueOnce({
        entries: [{ key: codeKey.toXDR('base64'), xdr: code.toXDR('base64') }],
        latestLedger: 1,
      })
    expect(await getContractWasmForSpec(params)).toEqual({
      success: true,
      wasm: new Uint8Array([0, 97, 115, 109]),
    })
    expect(getLedgerEntries).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        keys: [instanceKey.toXDR('base64')],
        signal: params.signal,
        timeoutMs: 1000,
      }),
    )
    expect(getLedgerEntries).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        keys: [codeKey.toXDR('base64')],
        signal: params.signal,
      }),
    )
  })

  it('fails when an instance or its code is absent', async () => {
    vi.mocked(getLedgerEntries).mockResolvedValueOnce({
      entries: [],
      latestLedger: 1,
    })
    expect(await getContractWasmForSpec(params)).toEqual({
      success: false,
      error: 'Contract instance not found',
    })
    vi.mocked(getLedgerEntries)
      .mockResolvedValueOnce({
        entries: [
          { key: instanceKey.toXDR('base64'), xdr: instance.toXDR('base64') },
        ],
        latestLedger: 1,
      })
      .mockResolvedValueOnce({ entries: [], latestLedger: 1 })
    expect(await getContractWasmForSpec(params)).toEqual({
      success: false,
      error: 'Contract code not found',
    })
  })

  it('rejects a code entry whose stored hash differs from the requested hash', async () => {
    const mismatchedCode = xdr.LedgerEntryData.contractCode(
      new xdr.ContractCodeEntry({
        ext: new xdr.ContractCodeEntryExt(0),
        hash: Buffer.alloc(32, 8),
        code: Buffer.from([0]),
      }),
    )
    vi.mocked(getLedgerEntries)
      .mockResolvedValueOnce({
        entries: [
          { key: instanceKey.toXDR('base64'), xdr: instance.toXDR('base64') },
        ],
        latestLedger: 1,
      })
      .mockResolvedValueOnce({
        entries: [
          { key: codeKey.toXDR('base64'), xdr: mismatchedCode.toXDR('base64') },
        ],
        latestLedger: 1,
      })
    expect(await getContractWasmForSpec(params)).toEqual({
      success: false,
      error: 'Contract code hash mismatch',
    })
  })
})
