// @vitest-environment node

import {
  Account,
  Contract,
  Keypair,
  Networks,
  SorobanDataBuilder,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import { describe, expect, it, vi } from 'vitest'
import { runFootprintSmoke } from './footprint-smoke.mjs'

const contract = new Contract(
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
)
const transaction = new TransactionBuilder(
  new Account(Keypair.random().publicKey(), '1'),
  { fee: '100', networkPassphrase: Networks.TESTNET },
)
  .addOperation(contract.call('hello'))
  .setTimeout(0)
  .build()
  .toXDR()

function response(result) {
  return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result }) }
}

describe('footprint smoke', () => {
  it('sends only simulation and counts decoded transaction-data keys', async () => {
    const data = new SorobanDataBuilder()
      .setFootprint(
        [contract.getFootprint()],
        [contract.getFootprint(), contract.getFootprint()],
      )
      .build()
      .toXDR('base64')
    const rpc = vi.fn().mockResolvedValue(response({ transactionData: data }))
    expect(
      await runFootprintSmoke(
        'https://example.com',
        Networks.TESTNET,
        transaction,
        rpc,
      ),
    ).toEqual({ readOnly: 1, readWrite: 2 })
    expect(rpc).toHaveBeenCalledOnce()
    expect(JSON.parse(rpc.mock.calls[0][1].body)).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'simulateTransaction',
      params: { transaction },
    })
  })
  it('fails on missing contract simulation errors and malformed data', async () => {
    await expect(
      runFootprintSmoke(
        'https://example.com',
        Networks.TESTNET,
        transaction,
        async () => response({ error: 'contract not found' }),
      ),
    ).rejects.toThrow('contract not found')
    await expect(
      runFootprintSmoke(
        'https://example.com',
        Networks.TESTNET,
        transaction,
        async () => response({}),
      ),
    ).rejects.toThrow('no transaction data')
  })
})
