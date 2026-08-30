import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Header from '../../components/global/Header'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

describe('Header sidebar toggle', () => {
  it('has an accessible name and explicit button type', () => {
    render(<Header handleToggle={vi.fn()} />)

    const toggle = screen.getByRole('button', {
      name: 'Toggle ledger state sidebar',
    })
    expect(toggle.getAttribute('type')).toBe('button')
    expect(toggle.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})
