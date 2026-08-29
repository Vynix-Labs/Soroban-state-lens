import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

describe('SearchLandingScreen', () => {
  it('exposes an accessible name for the contract search input', () => {
    render(<SearchLandingScreen />)

    expect(
      screen.getByRole('textbox', { name: 'Contract ID or ledger key' }),
    ).toBeTruthy()
  })
})
