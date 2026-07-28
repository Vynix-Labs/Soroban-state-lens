import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NetworkSelector from '../../components/global/NetworkSelector'

// Mock the store
vi.mock('../../store/lensStore', () => ({
  useLensStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      networkConfig: { networkId: 'mainnet', rpcUrl: 'https://example.com', networkPassphrase: '' },
      lastCustomUrl: '',
      setNetworkConfig: vi.fn(),
      setLastCustomUrl: vi.fn(),
    }),
}))

describe('NetworkSelector', () => {
  it('toggles dropdown on mouse click', () => {
    render(<NetworkSelector />)

    const button = screen.getByRole('button', { name: 'Select network' })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles dropdown exactly once on Enter key', () => {
    render(<NetworkSelector />)

    const button = screen.getByRole('button', { name: 'Select network' })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles dropdown exactly once on Space key', () => {
    render(<NetworkSelector />)

    const button = screen.getByRole('button', { name: 'Select network' })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    fireEvent.keyDown(button, { key: ' ' })
    expect(button.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(button, { key: ' ' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes dropdown on Escape key', () => {
    render(<NetworkSelector />)

    const button = screen.getByRole('button', { name: 'Select network' })

    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})
