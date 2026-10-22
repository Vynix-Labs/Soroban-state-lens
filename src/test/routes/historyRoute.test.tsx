import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '../../routeTree.gen'
import { resetStore, useLensStore } from '../../store/lensStore'

vi.mock('@stellar/design-system', () => ({
  Button: (props: any) => <button {...props} />,
  Card: (props: any) => <div {...props}>{props.children}</div>,
  Heading: (props: any) => <div {...props}>{props.children}</div>,
}))

const CONTRACT_ID =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQqqAVU2HHGCYSC'

function renderHistoryRoute() {
  window.history.pushState({}, '', `/contracts/${CONTRACT_ID}/history`)
  const router = createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  return render(<RouterProvider router={router} />)
}

describe('Contract history route', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders an empty state when the contract has no snapshots', async () => {
    renderHistoryRoute()

    expect(await screen.findByText('No snapshots yet.')).toBeTruthy()
  })

  it('renders snapshot labels, timestamps, and entry counts', async () => {
    useLensStore
      .getState()
      .addSnapshot(
        CONTRACT_ID,
        {
          entry: {
            key: 'entry',
            contractId: CONTRACT_ID,
            type: 'ContractData',
            value: {},
            lastModifiedLedger: 123,
          },
        },
        123,
        'Review',
      )

    renderHistoryRoute()

    expect(await screen.findByText('Review')).toBeTruthy()
    expect(screen.getByText('1 entries')).toBeTruthy()
    expect(screen.getByText(/\d{4}/)).toBeTruthy()
  })

  it('does not show snapshots belonging to another contract', async () => {
    useLensStore
      .getState()
      .addSnapshot('another-contract', {}, 123, 'Other contract')

    renderHistoryRoute()

    expect(await screen.findByText('No snapshots yet.')).toBeTruthy()
    expect(screen.queryByText('Other contract')).toBeNull()
  })

  it('shows a discarded-entry count when a persisted snapshot has rejected entries', async () => {
    useLensStore.getState().addSnapshot(
      CONTRACT_ID,
      {
        entry: {
          key: 'entry',
          contractId: CONTRACT_ID,
          type: 'ContractData',
          value: {},
          lastModifiedLedger: 123,
        },
      },
      123,
      'Mixed capture',
      { discardedEntryCount: 2 },
    )

    renderHistoryRoute()

    expect(await screen.findByText('Mixed capture')).toBeTruthy()
    expect(screen.getByText('2 discarded entries')).toBeTruthy()
  })

  it('does not label a valid empty snapshot as having discarded entries', async () => {
    useLensStore.getState().addSnapshot(CONTRACT_ID, {}, 123, 'Empty capture')

    renderHistoryRoute()

    expect(await screen.findByText('Empty capture')).toBeTruthy()
    expect(screen.queryByText(/discarded entries/i)).toBeNull()
  })
})
