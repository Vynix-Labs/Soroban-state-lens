import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'
import ContractLookUpInput from '../../components/global/ContractLookUpInput'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { resolveContractDataLedgerKey } from '../../lib/validation/resolveLedgerKey'
import {
  makeAccountFixture,
  makeContractCodeFixture,
} from '../network/ledgerEntryFixtures'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

const ledgerKey = xdr.LedgerKey.contractData(
  new xdr.LedgerKeyContractData({
    contract: xdr.ScAddress.scAddressTypeContract(Buffer.alloc(32, 1)),
    key: xdr.ScVal.scvSymbol('key'),
    durability: xdr.ContractDataDurability.persistent(),
  }),
).toXDR('base64')
const resolvedLedgerKey = resolveContractDataLedgerKey(ledgerKey)
if (!resolvedLedgerKey.ok) throw new Error('Test ledger key should be valid')

const unsupportedKeys = [
  [makeAccountFixture().keyXdr, /unsupported account type/i],
  [makeContractCodeFixture().keyXdr, /unsupported contractcode type/i],
  [
    'not-valid-base64!@#$%^',
    /malformed ledger key xdr.*contract-data ledger key/i,
  ],
] as const

describe.each([
  [
    'landing',
    SearchLandingScreen,
    'Contract ID or contract-data ledger key',
    'Search Contract ID (C...) or contract-data ledger key',
  ],
  [
    'header',
    ContractLookUpInput,
    'Search contract ID or contract-data ledger key',
    'Search contract ID or contract-data ledger key...',
  ],
])('%s contract lookup', (_name, Component, label, placeholder) => {
  it('accepts a contract ID or contract-data ledger key and rejects invalid input', async () => {
    navigate.mockClear()
    render(<Component />)
    const input = screen.getByRole('textbox', { name: label })
    expect(input.getAttribute('placeholder')).toBe(placeholder)
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() =>
      expect(screen.getByText(/malformed ledger key xdr/i)).toBeTruthy(),
    )
    expect(navigate).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: SAMPLE_CONTRACT_ID } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/contracts/$contractId',
        params: { contractId: SAMPLE_CONTRACT_ID },
      }),
    )

    navigate.mockClear()
    fireEvent.change(input, { target: { value: ledgerKey } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: resolvedLedgerKey.to,
        params: resolvedLedgerKey.params,
        search: resolvedLedgerKey.search,
      }),
    )
  })

  it.each(unsupportedKeys)(
    'explains unsupported or malformed ledger keys and preserves the input',
    async (key, message) => {
      navigate.mockClear()
      render(<Component />)
      const input = screen.getByRole('textbox', { name: label })

      fireEvent.change(input, { target: { value: key } })
      fireEvent.submit(input.closest('form')!)

      await waitFor(() => {
        expect(screen.getByText(message)).toBeTruthy()
        expect((input as HTMLInputElement).value).toBe(key)
      })
      expect(navigate).not.toHaveBeenCalled()
    },
  )
})
