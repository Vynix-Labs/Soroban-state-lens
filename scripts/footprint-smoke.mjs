import { SorobanDataBuilder, TransactionBuilder } from '@stellar/stellar-sdk'
import { pathToFileURL } from 'node:url'

export async function runFootprintSmoke(
  rpcUrl,
  networkPassphrase,
  transaction,
  fetchImpl = fetch,
) {
  if (!rpcUrl || !networkPassphrase || !transaction) {
    throw new Error(
      'RPC URL, network passphrase and transaction XDR are required',
    )
  }
  const tx = TransactionBuilder.fromXDR(transaction, networkPassphrase)
  if (
    !Array.isArray(tx.operations) ||
    tx.operations.length !== 1 ||
    tx.operations[0].type !== 'invokeHostFunction' ||
    tx.operations[0].func.switch().name !== 'hostFunctionTypeInvokeContract'
  ) {
    throw new Error('Expected one contract invocation operation')
  }
  const response = await fetchImpl(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'simulateTransaction',
      params: { transaction },
    }),
  })
  if (!response.ok) throw new Error(`RPC HTTP error: ${response.status}`)
  const payload = await response.json()
  if (payload?.jsonrpc !== '2.0' || payload.id !== 1)
    throw new Error('Invalid JSON-RPC response')
  if (payload.error) throw new Error(`RPC error: ${payload.error.message}`)
  const result = payload.result
  if (!result || typeof result !== 'object')
    throw new Error('Invalid simulation result')
  if (result.error) throw new Error(`Simulation failed: ${result.error}`)
  if (typeof result.transactionData !== 'string' || !result.transactionData)
    throw new Error('Simulation returned no transaction data')
  const footprint = new SorobanDataBuilder(
    result.transactionData,
  ).getFootprint()
  return {
    readOnly: footprint.readOnly().length,
    readWrite: footprint.readWrite().length,
  }
}

async function main() {
  const [rpcUrl, networkPassphrase, transaction] = process.argv.slice(2)
  if (!rpcUrl || !networkPassphrase || !transaction)
    throw new Error(
      'Usage: bun run smoke:footprint -- <rpc-url> <network-passphrase> <transaction-xdr>',
    )
  const { readOnly, readWrite } = await runFootprintSmoke(
    rpcUrl,
    networkPassphrase,
    transaction,
  )
  console.log(
    `Footprint: ${readOnly} read-only keys, ${readWrite} read-write keys`,
  )
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
