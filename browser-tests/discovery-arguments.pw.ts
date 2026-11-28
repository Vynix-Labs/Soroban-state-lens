import { expect, test } from '@playwright/test'
import {
  Account,
  Contract,
  Networks,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'

const contractId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

test('actual numeric and byte argument previews come from XDR and ignore reference notes', async ({
  page,
}) => {
  const envelope = new TransactionBuilder(
    new Account(
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      '1',
    ),
    { fee: '100', networkPassphrase: Networks.TESTNET },
  )
    .addOperation(
      new Contract(contractId).call(
        'read_state',
        xdr.ScVal.scvU64(xdr.Uint64.fromString('18446744073709551615')),
        xdr.ScVal.scvBytes(Buffer.from([0, 255, 16])),
      ),
    )
    .setTimeout(60)
    .build()
    .toXDR()
  const simulations: Array<string> = []
  page.on('request', (request) => {
    if (request.postData()?.includes('simulateTransaction'))
      simulations.push(request.url())
  })
  await page.goto(`/contracts/${contractId}/discovery`)
  await page
    .getByRole('textbox', { name: 'Transaction XDR', exact: true })
    .fill(envelope)
  const argumentsView = page.getByRole('region', {
    name: 'Arguments from transaction XDR',
  })
  const previews = argumentsView.locator('li')
  await expect(previews.nth(0).locator('pre')).toHaveText(
    '18446744073709551615',
  )
  await expect(previews.nth(1).locator('pre')).toHaveText('0x00ff10')
  const before = await argumentsView.textContent()
  await page
    .getByLabel('Arguments (JSON reference)')
    .fill('{"amount": 1, "bytes": "different"}')
  await expect(argumentsView).toHaveText(before!)
  await expect(
    page.getByRole('textbox', { name: 'Transaction XDR', exact: true }),
  ).toHaveValue(envelope)
  expect(simulations).toEqual([])
})
