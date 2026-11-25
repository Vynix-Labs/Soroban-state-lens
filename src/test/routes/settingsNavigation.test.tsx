import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { routeTree } from '../../routeTree.gen'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import type { ComponentProps, ReactNode } from 'react'

vi.mock('@stellar/design-system', () => ({
  Button: (props: ComponentProps<'button'>) => <button {...props} />,
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  IconButton: ({ altText }: { altText?: string }) => (
    <button aria-label={altText} />
  ),
}))

vi.mock('../../workers/createDecoderWorkerSafe', () => ({
  createDecoderWorkerSafe: () =>
    Promise.resolve({
      ping: vi.fn().mockResolvedValue({ status: 'pong' }),
      terminate: vi.fn(),
    }),
  terminateDecoderWorkerSafe: vi.fn(),
}))

vi.mock('../../lib/network/ledgerPoller', () => ({
  startLedgerHeadPoll: () => () => {},
}))

describe('Settings navigation', () => {
  it.each(['/', `/contracts/${SAMPLE_CONTRACT_ID}/inspect`])(
    'opens Preferences from %s',
    async (path) => {
      const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
      })
      render(<RouterProvider router={router} />)
      fireEvent.click(await screen.findByRole('button', { name: 'Settings' }))
      await screen.findByRole('combobox', { name: 'Byte Display Mode' })
      expect(router.state.location.pathname).toBe('/settings/preferences')
      expect(
        screen
          .getByRole('button', { name: 'Settings' })
          .getAttribute('aria-current'),
      ).toBe('page')
    },
  )

  it('marks Settings active for a direct Preferences URL', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: ['/settings/preferences'],
      }),
    })
    render(<RouterProvider router={router} />)
    await screen.findByRole('combobox', { name: 'Byte Display Mode' })
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Settings' })
          .getAttribute('aria-current'),
      ).toBe('page'),
    )
  })
})
