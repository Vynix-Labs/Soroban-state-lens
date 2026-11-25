import {
  Account,
  Address,
  BASE_FEE,
  Operation,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'
import { expect, test } from '@playwright/test'

const source = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const networkPassphrase = 'Test SDF Network ; September 2015'

function createFixture() {
  const contractBytes = new Uint8Array(32).fill(7)
  const contract = xdr.ScAddress.scAddressTypeContract(contractBytes)
  const contractId = Address.contract(contractBytes).toString()
  const specs = [
    { key: 'read-one', durability: xdr.ContractDataDurability.persistent() },
    { key: 'write-two', durability: xdr.ContractDataDurability.temporary() },
  ]
  const entries = specs.map(({ key, durability }, index) => {
    const storageKey = xdr.ScVal.scvSymbol(key)
    const ledgerKey = xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract,
        key: storageKey,
        durability,
      }),
    )
    const entryData = xdr.LedgerEntryData.contractData(
      new xdr.ContractDataEntry({
        ext: new xdr.ExtensionPoint(0),
        contract,
        key: storageKey,
        durability,
        val: xdr.ScVal.scvU32(index + 1),
      }),
    )
    return {
      key: ledgerKey.toXDR('base64'),
      xdr: entryData.toXDR('base64'),
      lastModifiedLedgerSeq: 100,
    }
  })
  const transaction = new TransactionBuilder(new Account(source, '1'), {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: 'read_state',
        args: [],
      }),
    )
    .setTimeout(60)
    .build()

  return { contractId, entries, transaction: transaction.toXDR() }
}

test('browser: discovery preview and explorer use submitted invocation and footprint keys', async ({
  page,
}) => {
  const fixture = createFixture()
  let submittedTransaction = ''
  const ledgerQueries: Array<Array<string>> = []

  await page.route('https://rpc-futurenet.stellar.org/**', async (route) => {
    const request = route.request().postDataJSON() as {
      id: number
      method: string
      params?: { transaction?: string; keys?: Array<string> }
    }
    if (request.method === 'simulateTransaction') {
      submittedTransaction = request.params?.transaction ?? ''
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            footprint: {
              readOnly: [fixture.entries[0].key],
              readWrite: [fixture.entries[1].key],
            },
          },
        }),
      })
      return
    }
    if (request.method === 'getLatestLedger') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: { sequence: 101 },
        }),
      })
      return
    }

    expect(request.method).toBe('getLedgerEntries')
    const keys = request.params?.keys ?? []
    ledgerQueries.push(keys)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          entries: fixture.entries.filter((entry) => keys.includes(entry.key)),
          latestLedger: 101,
        },
      }),
    })
  })

  await page.goto(`/contracts/${fixture.contractId}/discovery`)
  await page.getByLabel('Transaction XDR').fill(fixture.transaction)
  await expect(page.getByTestId('invocation-preview')).toContainText(
    `${fixture.contractId} · read_state`,
  )
  await page.getByRole('button', { name: 'Simulate transaction' }).click()
  await expect(page.getByText(fixture.entries[0].key)).toBeVisible()
  await expect(page.getByText(fixture.entries[1].key)).toBeVisible()
  expect(submittedTransaction).toBe(fixture.transaction)

  await page.getByRole('button', { name: 'Open in Explorer' }).click()
  await expect(page).toHaveURL(/\/explorer\?keys=/)
  await expect(page.getByText('Explorer Rows (2)')).toBeVisible()
  expect(ledgerQueries.length).toBeGreaterThan(0)
  expect(ledgerQueries).toEqual(
    ledgerQueries.map(() => [fixture.entries[0].key, fixture.entries[1].key]),
  )
})
