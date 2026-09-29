import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  const storedEntry = {
    key: '/state/ledger',
    contractId: 'C123',
    type: 'Other' as const,
    value: { kind: 'primitive', scType: 'u32', value: 42 },
    lastModifiedLedger: 123,
    expirationLedger: 456,
    rawXdr: 'known-entry-xdr',
  }

  it('renders contract and key path context', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
    })

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
    expect(screen.getByText('123')).toBeTruthy()
    expect(screen.getByText('456')).toBeTruthy()
    expect(screen.getByText(storedEntry.rawXdr)).toBeTruthy()
  })

  it('pins the current key path to the watchlist', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
    })
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

  it('copies the selected entry raw XDR', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    useLensStore.setState({ ledgerData: { [storedEntry.key]: storedEntry } })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(storedEntry.rawXdr),
    )
    vi.unstubAllGlobals()
  })

  it('shows a missing entry and disables entry actions for a stale key path', () => {
    useLensStore.setState({ watchlist: {}, ledgerData: {} })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="stale-entry-key"
      />,
    )

    expect(screen.getByText('Entry not found')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Add to watchlist' }),
    ).toHaveProperty('disabled', true)
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull()
    expect(screen.queryByText('Metadata')).toBeNull()
  })
})
