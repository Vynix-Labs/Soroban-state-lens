import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { resetStore, useLensStore } from '../../store/lensStore'
import { BigIntDisplayMode, ByteDisplayMode } from '../../store/types'

vi.mock('@stellar/design-system', () => ({
  Button: (props: any) => <button {...props} />,
  Card: (props: any) => <div {...props}>{props.children}</div>,
  Heading: (props: any) => <div {...props}>{props.children}</div>,
}))

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

describe('Preferences route', () => {
  beforeEach(() => {
    resetStore()
  })

  it('exposes accessible names and updates preferences when selecting options', async () => {
    window.history.pushState({}, '', '/settings/preferences')

    const router = createTestRouter()
    render(<RouterProvider router={router} />)

    const byteSelect = await screen.findByRole('combobox', {
      name: 'Byte Display Mode',
    })
    const bigIntSelect = await screen.findByRole('combobox', {
      name: 'BigInt Display Mode',
    })

    expect(byteSelect).toBeTruthy()
    expect(bigIntSelect).toBeTruthy()

    fireEvent.change(byteSelect, {
      target: { value: ByteDisplayMode.BASE64 },
    })
    fireEvent.change(bigIntSelect, {
      target: { value: BigIntDisplayMode.HEX },
    })

    await waitFor(() => {
      expect(useLensStore.getState().preferences.byteDisplayMode).toBe(
        ByteDisplayMode.BASE64,
      )
      expect(useLensStore.getState().preferences.bigIntDisplayMode).toBe(
        BigIntDisplayMode.HEX,
      )
    })
  })
})
