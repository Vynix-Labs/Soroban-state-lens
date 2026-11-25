import { expect, test } from '@playwright/test'
import { xdr } from '@stellar/stellar-sdk'
import { createContractSpecWasm } from '../src/test/helpers/contractSpecFixtures'

test('WASM upload and explicit selection replace an index label without changing the value', async ({
  page,
}) => {
  const ledgerReads: Array<string> = []
  page.on('request', (request) => {
    if (request.postData()?.includes('getLedgerEntries'))
      ledgerReads.push(request.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Load Sample Contract' }).click()
  await expect(page.getByText('Explorer Rows (2)')).toBeVisible()
  await page.getByText('nested-collection', { exact: true }).first().dblclick()
  await expect(page).toHaveURL(/\/inspect\//)
  const rawField = page.getByLabel('Raw fields').locator(':scope > div').first()
  await expect(rawField.locator('dt')).toHaveText('[0]')
  await expect(rawField.locator('dd span')).toHaveText('7')
  const rawPath = await rawField.locator('code').textContent()
  const rawXdr = page
    .getByRole('heading', { name: 'Raw XDR' })
    .locator('..')
    .locator('..')
    .locator('code')
  const xdrBefore = await rawXdr.textContent()
  const persistedBefore = await page.evaluate(() =>
    localStorage.getItem('ssl.network-config.v1'),
  )

  const struct = new xdr.ScSpecUdtStructV0({
    doc: '',
    lib: '',
    name: 'DemoVector',
    fields: ['first_value', 'second_value'].map(
      (name) =>
        new xdr.ScSpecUdtStructFieldV0({
          doc: '',
          name,
          type: xdr.ScSpecTypeDef.scSpecTypeU32(),
        }),
    ),
  })
  const wasm = createContractSpecWasm([
    xdr.ScSpecEntry.scSpecEntryUdtStructV0(struct),
  ])
  await page.getByLabel('Upload contract WASM').setInputFiles({
    name: 'DemoVector.wasm',
    mimeType: 'application/wasm',
    buffer: Buffer.from(wasm),
  })
  await expect(
    page.getByRole('combobox', { name: 'Struct interpretation' }),
  ).toHaveValue('')
  await expect(page.getByLabel('Raw fields').locator('dt').first()).toHaveText(
    '[0]',
  )
  await page
    .getByRole('combobox', { name: 'Struct interpretation' })
    .selectOption('DemoVector')
  const fields = page.getByLabel('Interpreted fields').locator(':scope > div')
  await expect(fields.nth(0).locator('dt')).toHaveText('first_value')
  await expect(fields.nth(0).locator('dd span')).toHaveText('7')
  await expect(fields.nth(0).locator('code')).toHaveText(rawPath!)
  await expect(fields.nth(1).locator('dt')).toHaveText('second_value')
  await expect(fields.nth(1).locator('dd span')).toHaveText('9')
  await expect(rawXdr).toHaveText(xdrBefore!)
  expect(
    await page.evaluate(() => localStorage.getItem('ssl.network-config.v1')),
  ).toBe(persistedBefore)
  expect(ledgerReads).toEqual([])
  await page.getByRole('link', { name: 'Back to explorer' }).click()
  await expect(page.getByText('counter', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('42', { exact: true }).first()).toBeVisible()
})
