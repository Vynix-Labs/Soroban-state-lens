import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
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
      screen.getByRole('textbox', { name: 'Contract ID or ledger key' }),
    ).toBeTruthy()
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
