import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InspectShell } from '../../components/explorer/InspectShell'
import { useLensStore } from '../../store/lensStore'

vi.mock('@stellar/design-system', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children, ...props }: React.ComponentProps<'h1'>) => (
    <h1 {...props}>{children}</h1>
  ),
  IconButton: ({
    altText,
    onClick,
    ...props
  }: React.ComponentProps<'button'> & { altText?: string }) => (
    <button aria-label={altText} onClick={onClick} {...props} />
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}))

describe('InspectShell', () => {
  it('renders contract and key path context', () => {
    useLensStore.setState({ watchlist: {} })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    expect(screen.getAllByText('C123').length).toBeGreaterThan(0)
    expect(screen.getByText('/state/ledger')).toBeTruthy()
    expect(screen.getByText('Metadata')).toBeTruthy()
  })

  it('pins the current key path to the watchlist', () => {
    useLensStore.setState({ watchlist: {} })
    const addToWatchlist = vi.spyOn(useLensStore.getState(), 'addToWatchlist')

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }))

    expect(addToWatchlist).toHaveBeenCalledWith('C123', '/state/ledger')
  })
})
