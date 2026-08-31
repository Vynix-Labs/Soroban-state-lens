import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

describe('SearchLandingScreen recent history action', () => {
  it('explains that a contract is required before showing history', () => {
    render(<SearchLandingScreen />)

    fireEvent.click(screen.getByRole('button', { name: /recent history/i }))

    expect(screen.getByRole('status').textContent).toBe(
      'Load a contract to view its recent history.',
    )
  })

  it('exposes an accessible name for the contract search input', () => {
    render(<SearchLandingScreen />)

    expect(
      screen.getByRole('textbox', { name: 'Contract ID or ledger key' }),
    ).toBeTruthy()
  })
})
