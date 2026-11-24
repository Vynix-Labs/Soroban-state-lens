import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'
import ContractLookUpInput from '../../components/global/ContractLookUpInput'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

const ledgerKey = xdr.LedgerKey.contractData(
  new xdr.LedgerKeyContractData({
    contract: xdr.ScAddress.scAddressTypeContract(Buffer.alloc(32, 1)),
    key: xdr.ScVal.scvSymbol('key'),
    durability: xdr.ContractDataDurability.persistent(),
  }),
).toXDR('base64')

describe.each([
  ['landing', SearchLandingScreen, 'Contract ID', 'Search Contract ID (C...)'],
  [
    'header',
    ContractLookUpInput,
    'Search contract ID',
    'Search contract ID...',
  ],
])('%s contract lookup', (_name, Component, label, placeholder) => {
  it('requests a contract ID, rejects a ledger key and accepts a contract ID', async () => {
    navigate.mockClear()
    render(<Component />)
    const input = screen.getByRole('textbox', { name: label })
    expect(input.getAttribute('placeholder')).toBe(placeholder)
    fireEvent.change(input, { target: { value: ledgerKey } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() =>
      expect(screen.getByText(/invalid contract id/i)).toBeTruthy(),
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
  })
})
