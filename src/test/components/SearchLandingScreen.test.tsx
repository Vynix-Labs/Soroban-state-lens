import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { DEMO_CONTRACT_DATA } from '../../lib/demo/demoContractData'
import { resetStore, useLensStore } from '../../store/lensStore'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('SearchLandingScreen recent history action', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    resetStore()
  })

  it('explains that a contract is required before showing history', () => {
    render(<SearchLandingScreen />)

    fireEvent.click(screen.getByRole('button', { name: /recent history/i }))

    expect(screen.getByRole('status').textContent).toBe(
      'Load a contract to view its recent history.',
    )
  })

  it('navigates to current history when an active contract is present', () => {
    const contractId = SAMPLE_CONTRACT_ID
    useLensStore.getState().setActiveContractId(contractId)

    render(<SearchLandingScreen />)

    fireEvent.click(screen.getByRole('button', { name: /recent history/i }))

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/contracts/$contractId/history',
      params: { contractId },
    })
  })

  it('exposes an accessible name for the contract search input', () => {
    render(<SearchLandingScreen />)

    expect(
      screen.getByRole('textbox', {
        name: 'Contract ID or contract-data ledger key',
      }),
    ).toBeTruthy()
  })

  it('keeps contract ID lookup working when input has whitespace and lowercase', () => {
    render(<SearchLandingScreen />)
    const input = screen.getByRole('textbox', {
      name: 'Contract ID or contract-data ledger key',
    })

    fireEvent.change(input, {
      target: { value: `  ${SAMPLE_CONTRACT_ID.toLowerCase()}  ` },
    })
    fireEvent.submit(input.closest('form')!)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/contracts/$contractId',
      params: { contractId: SAMPLE_CONTRACT_ID },
    })
  })

  it('marks the sample explorer URL as local demo mode', () => {
    render(<SearchLandingScreen />)

    fireEvent.click(
      screen.getByRole('button', { name: /load sample contract/i }),
    )

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/contracts/$contractId/explorer',
      params: { contractId: SAMPLE_CONTRACT_ID },
      search: {
        keys: DEMO_CONTRACT_DATA.map((entry) => entry.keyXdr).join(','),
        mode: 'demo',
      },
    })
  })

  it('disables wallet connection with clear unavailable status', () => {
    render(<SearchLandingScreen />)

    const walletBtn = screen.getByRole('button', {
      name: /Connect Wallet/i,
    })
    expect(walletBtn).toBeTruthy()
    expect(walletBtn.hasAttribute('disabled')).toBe(true)
    expect(walletBtn.getAttribute('aria-disabled')).toBe('true')
    expect(walletBtn.getAttribute('title')).toBe(
      'Wallet connection is currently unavailable',
    )
  })
})
