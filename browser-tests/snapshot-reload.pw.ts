import { expect, test } from '@playwright/test'
import { Address, xdr } from '@stellar/stellar-sdk'

test('a decoded scalar snapshot survives browser reload', async ({ page }) => {
  const contractBytes = new Uint8Array(32).fill(2)
  const contract = xdr.ScAddress.scAddressTypeContract(contractBytes)
  const key = xdr.ScVal.scvSymbol('counter')
  const durability = xdr.ContractDataDurability.persistent()
  const ledgerKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({ contract, key, durability }),
  ).toXDR('base64')
  const entry = xdr.LedgerEntryData.contractData(
    new xdr.ContractDataEntry({
      ext: new xdr.ExtensionPoint(0),
      contract,
      key,
      durability,
      val: xdr.ScVal.scvU32(42),
    }),
  ).toXDR('base64')
  const contractId = Address.contract(contractBytes).toString()

  await page.route('https://rpc-futurenet.stellar.org/**', async (route) => {
    const request = route.request().postDataJSON()
    expect(['getLatestLedger', 'getLedgerEntries']).toContain(request.method)
    const result =
      request.method === 'getLatestLedger'
        ? { sequence: 103 }
        : {
            entries: [
              { key: ledgerKey, xdr: entry, lastModifiedLedgerSeq: 102 },
            ],
            latestLedger: 103,
          }
    await route.fulfill({ json: { jsonrpc: '2.0', id: request.id, result } })
  })
  await page.goto(
    `/contracts/${contractId}/explorer?keys=${encodeURIComponent(ledgerKey)}`,
  )
  await expect(page.getByText('Explorer Rows (1)')).toBeVisible()
  await expect(page.getByText('42', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await page
    .getByRole('button', { name: 'Capture Snapshot', exact: true })
    .first()
    .click()
  await expect(page.getByText('Captured Snapshot #1.').first()).toBeVisible()
  await page.getByRole('link', { name: 'History', exact: true }).click()
  await expect(page.getByText('1 entries', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Snapshot #1').first()).toBeVisible()
  await expect(page.getByText('1 entries', { exact: true })).toBeVisible({
    timeout: 3000,
  })
})
