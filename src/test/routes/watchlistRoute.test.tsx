import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@stellar/design-system', () => ({
  Button: (props: any) => <button {...props} />,
  Card: (props: any) => <div {...props}>{props.children}</div>,
  Heading: (props: any) => <div {...props}>{props.children}</div>,
}))

import { render, screen } from '@testing-library/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { resetStore, useLensStore } from '../../store/lensStore'

const VALID_CONTRACT_ID =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

function createTestRouter() {
  return createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
  })
}

describe('Watchlist route', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders an empty state when no watchlist items exist for the contract', async () => {
    window.history.pushState({}, '', `/contracts/${VALID_CONTRACT_ID}/watchlist`)

    const router = createTestRouter()
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('No saved watchlist items')).toBeTruthy()
    expect(
      screen.getByText(/You do not have any pinned keys for this contract yet/),
    ).toBeTruthy()
  })

  it('renders saved watchlist items and an inspect action', async () => {
    useLensStore.getState().addToWatchlist(VALID_CONTRACT_ID, '/test/key')
    window.history.pushState({}, '', `/contracts/${VALID_CONTRACT_ID}/watchlist`)

    const router = createTestRouter()
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('/test/key')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Inspect' })).toBeTruthy()
  })
})
