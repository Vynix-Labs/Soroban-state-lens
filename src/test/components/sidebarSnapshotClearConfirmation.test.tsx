import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Sidebar from '../../components/global/Sidebar'
import { resetStore, useLensStore } from '../../store/lensStore'

const contractId = 'CABC123'

describe('Sidebar snapshot clear confirmation', () => {
  beforeEach(() => {
    resetStore()
    const store = useLensStore.getState()
    store.setActiveContractId(contractId)
    store.addSnapshot(contractId, {}, 'First snapshot')
    store.addSnapshot(contractId, {}, 'Second snapshot')
  })

  it('keeps snapshots when the confirmation is cancelled', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <Sidebar
        open
        onClose={() => {}}
        variant="pinned"
        activeNavItem="history"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /clear/i }))

    expect(confirm).toHaveBeenCalledWith(
      `Clear all snapshots for ${contractId}? This action cannot be undone.`,
    )
    expect(useLensStore.getState().getSnapshots(contractId)).toHaveLength(2)
    confirm.mockRestore()
  })

  it('clears snapshots after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <Sidebar
        open
        onClose={() => {}}
        variant="pinned"
        activeNavItem="history"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /clear/i }))

    expect(useLensStore.getState().getSnapshots(contractId)).toHaveLength(0)
    vi.restoreAllMocks()
  })
})
