import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'
import ContractLookUpInput from '../../components/global/ContractLookUpInput'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { resolveContractDataLedgerKey } from '../../lib/validation/resolveLedgerKey'

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
})
