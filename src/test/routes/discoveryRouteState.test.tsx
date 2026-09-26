import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { dedupeExplorerKeys } from '../../routes/contracts/$contractId/explorer'
import {
  DiscoveryStateView,
  buildDiscoveryLoadState,
} from '../../routes/contracts/$contractId/discovery'

vi.mock('@stellar/design-system', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  IconButton: ({
    altText,
    onClick,
    'aria-label': ariaLabel,
  }: {
    altText?: string
    onClick?: () => void
    'aria-label'?: string
  }) => (
    <button
      aria-label={ariaLabel ?? altText ?? 'icon-button'}
      onClick={onClick}
    >
      {altText ?? 'icon'}
    </button>
  ),
}))

describe('discovery route state', () => {
  it('renders loading, empty, error, and success states from route data', () => {
    const retry = vi.fn()

    const { rerender } = render(
      <DiscoveryStateView
        state={buildDiscoveryLoadState({ status: 'loading' })}
        onRetry={retry}
      />,
    )
    expect(screen.getByText('Loading discovered keys…')).toBeTruthy()

    rerender(
      <DiscoveryStateView
        state={buildDiscoveryLoadState({
          status: 'empty',
          requestedKeyCount: 0,
        })}
        onRetry={retry}
      />,
    )
    expect(screen.getByText(/No keys discovered yet/i)).toBeTruthy()

    rerender(
      <DiscoveryStateView
        state={buildDiscoveryLoadState({
          status: 'error',
          error: 'Network failure',
          requestedKeyCount: 3,
        })}
        onRetry={retry}
      />,
    )
    expect(screen.getByText('Network failure')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledTimes(1)

    rerender(
      <DiscoveryStateView
        state={buildDiscoveryLoadState({
          status: 'success',
          keys: [
            { keyPath: '/contracts/key1', type: 'ContractData' },
            { keyPath: '/contracts/key1', type: 'ContractData' },
          ],
          requestedKeyCount: 2,
        })}
        onRetry={retry}
      />,
    )
    expect(screen.getByText('/contracts/key1')).toBeTruthy()
    expect(
      screen.getAllByRole('button', { name: 'Add to watchlist' }),
    ).toHaveLength(1)
  })

  it('deduplicates explorer keys while preserving first-seen order', () => {
    expect(dedupeExplorerKeys('a, b, a, c, , b')).toBe('a,b,c')
    expect(dedupeExplorerKeys('  zzz ,  aaa , zzz , aaa  ')).toBe('zzz,aaa')
  })
})
