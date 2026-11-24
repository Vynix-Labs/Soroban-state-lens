import {
  Account,
  Asset,
  Contract,
  Networks,
  Operation,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { decodeInvocationPreview } from '../../lib/network/decodeInvocationPreview'

const contractId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
const source = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const args = [xdr.ScVal.scvU32(42), xdr.ScVal.scvSymbol('memo')]
function invocation() {
  return new TransactionBuilder(new Account(source, '1'), {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(new Contract(contractId).call('transfer', ...args))
    .setTimeout(60)
    .build()
}

describe('decodeInvocationPreview', () => {
  it('decodes contract, function and ordered argument XDR from an unsigned envelope', () => {
    expect(decodeInvocationPreview(invocation().toXDR())).toEqual({
      ok: true,
      preview: {
        contractId,
        functionName: 'transfer',
        argumentXdr: args.map((arg) => arg.toXDR('base64')),
      },
    })
  })
  it('decodes the inner invocation of a fee-bump envelope', () => {
    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      source,
      '100',
      invocation(),
      Networks.TESTNET,
    )
    expect(decodeInvocationPreview(feeBump.toXDR())).toMatchObject({
      ok: true,
      preview: { contractId, functionName: 'transfer' },
    })
  })
  it('returns typed errors for malformed and unsupported envelopes', () => {
    expect(decodeInvocationPreview('not-xdr')).toEqual({
      ok: false,
      error: 'invalid_xdr',
    })
    const extraBytes = Buffer.concat([
      Buffer.from(invocation().toXDR(), 'base64'),
      Buffer.from([0, 0, 0, 0]),
    ]).toString('base64')
    expect(decodeInvocationPreview(extraBytes)).toEqual({
      ok: false,
      error: 'invalid_xdr',
    })
    const payment = new TransactionBuilder(new Account(source, '1'), {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: source,
          asset: new Asset('USD', source),
          amount: '1',
        }),
      )
      .setTimeout(60)
      .build()
    expect(decodeInvocationPreview(payment.toXDR())).toEqual({
      ok: false,
      error: 'unsupported_transaction',
    })
  })
})
