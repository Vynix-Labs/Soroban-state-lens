import { expect, test } from '@playwright/test'

test('sample action loads local data and opens the counter', async ({
  page,
}) => {
  const ledgerReads: Array<string> = []
  page.on('request', (request) => {
    const body = request.postData()
    if (body?.includes('getLedgerEntries')) ledgerReads.push(request.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Load Sample Contract' }).click()
  await expect(page).toHaveURL(/mode=demo/)
  await expect(page.getByText('Explorer Rows (2)')).toBeVisible()
  await expect(page.getByText('counter', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('42', { exact: true }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('Explorer Rows (2)')).toBeVisible()
  expect(ledgerReads).toEqual([])
  await page.getByText('counter', { exact: true }).first().dblclick()
  await expect(page).toHaveURL(/\/inspect\//)
  await expect(page.getByText('42', { exact: true }).first()).toBeVisible()
})
