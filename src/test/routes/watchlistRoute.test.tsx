import { beforeEach, describe, expect, it, vi } from 'vitest'

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))

vi.mock('@stellar/design-system', () => ({
  Button: (props: any) => <button {...props} />,
  Card: (props: any) => <div {...props}>{props.children}</div>,
  Heading: (props: any) => <div {...props}>{props.children}</div>,
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

import { fireEvent, render, screen } from '@testing-library/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { resetStore, useLensStore } from '../../store/lensStore'
import SearchLandingScreen from '../../components/Home/SearchLandingScreen'

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
  function renderRoute(path: string) {
    window.history.pushState({}, '', path)

    const router = createTestRouter()
    render(<RouterProvider router={router} />)
    return router
  }

  beforeEach(() => {
    resetStore()
    navigateMock.mockReset()
  })

  it('renders an empty state when no watchlist items exist for the contract', async () => {
    renderRoute(`/contracts/${VALID_CONTRACT_ID}/watchlist`)

    expect(await screen.findByText('No saved watchlist items')).toBeTruthy()
    expect(
      screen.getByText(/You do not have any pinned keys for this contract yet/),
    ).toBeTruthy()
  })

  it('renders saved watchlist items and an inspect action', async () => {
    useLensStore.getState().addToWatchlist(VALID_CONTRACT_ID, '/test/key')
    renderRoute(`/contracts/${VALID_CONTRACT_ID}/watchlist`)

    expect(await screen.findByText('/test/key')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Inspect' })).toBeTruthy()
  })
})

describe('SearchLandingScreen', () => {
  beforeEach(() => {
    resetStore()
    navigateMock.mockReset()
  })

  it('navigates to the contract route for a valid contract ID', () => {
    render(<SearchLandingScreen />)

    const input = screen.getByPlaceholderText(
      'Search Contract ID (C...) or Ledger Key',
    )
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: VALID_CONTRACT_ID } })
    fireEvent.submit(form as HTMLFormElement)

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/contracts/$contractId',
      params: { contractId: VALID_CONTRACT_ID },
    })
  })

  it('shows a validation error for an invalid contract ID', () => {
    render(<SearchLandingScreen />)

    const input = screen.getByPlaceholderText(
      'Search Contract ID (C...) or Ledger Key',
    )
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: 'not-a-contract' } })
    fireEvent.submit(form as HTMLFormElement)

    expect(screen.getByText('Invalid contract ID')).toBeTruthy()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
