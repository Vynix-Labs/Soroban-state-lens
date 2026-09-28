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
    useLensStore.setState({
      watchlist: {},
      ledgerData: {
        '/state/ledger': {
          key: '/state/ledger',
          contractId: 'C123',
          type: 'ContractData',
          durability: 'Persistent',
          value: null,
          lastModifiedLedger: 1234567,
          expirationLedger: 1235000,
        },
      },
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
    expect(screen.getByText('Persistent')).toBeTruthy()
    expect(screen.getByText('1234567')).toBeTruthy()
    expect(screen.getByText('1235000')).toBeTruthy()
  })

  it('renders temporary metadata from the matching stored entry', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: {
        'C123::ContractData::matching-key': {
          key: 'C123::ContractData::matching-key',
          contractId: 'C123',
          type: 'ContractData',
          durability: 'Temporary',
          value: null,
          lastModifiedLedger: 200,
          expirationLedger: 240,
        },
        'C123::ContractData::other-key': {
          key: 'C123::ContractData::other-key',
          contractId: 'C123',
          type: 'ContractData',
          durability: 'Persistent',
          value: null,
          lastModifiedLedger: 300,
        },
      },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="C123::ContractData::matching-key.item-0"
      />,
    )

    expect(screen.getByText('Temporary')).toBeTruthy()
    expect(screen.getByText('200')).toBeTruthy()
    expect(screen.getByText('240')).toBeTruthy()
    expect(screen.queryByText('Persistent')).toBeNull()
    expect(screen.queryByText('300')).toBeNull()
  })

  it('renders N/A when no matching stored metadata exists', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: {
        'OTHER::ContractData::ledger-key': {
          key: 'OTHER::ContractData::ledger-key',
          contractId: 'OTHER',
          type: 'ContractData',
          durability: 'Persistent',
          value: null,
          lastModifiedLedger: 1234567,
        },
      },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="C123::ContractData::missing-key"
      />,
    )

    expect(screen.getAllByText('N/A')).toHaveLength(3)
  })

  it('pins the current key path to the watchlist', () => {
    useLensStore.setState({ watchlist: {}, ledgerData: {} })
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
