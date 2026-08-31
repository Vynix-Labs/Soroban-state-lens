import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import Sidebar from '../../components/global/Sidebar'
import { resetStore, useLensStore } from '../../store/lensStore'

const contractId = 'CABC123'

describe('Sidebar snapshot controls', () => {
  beforeEach(() => {
    resetStore()
    const store = useLensStore.getState()
    store.setActiveContractId(contractId)
    store.addSnapshot(contractId, {}, 'First snapshot')
    store.addSnapshot(contractId, {}, 'Second snapshot')
  })

  it('gives destructive snapshot controls names with their target identity', () => {
    render(
      <Sidebar
        open
        onClose={() => {}}
        variant="pinned"
        activeNavItem="history"
      />,
    )

    expect(
      screen.getByRole('button', {
        name: `Clear all snapshots for ${contractId}`,
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: `Delete snapshot First snapshot for ${contractId}`,
      }),
    ).toBeTruthy()
  })
})
