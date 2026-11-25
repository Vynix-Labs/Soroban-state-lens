import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { routeTree } from '../../routeTree.gen'
import {
  DEMO_COUNTER_ENTRY_KEY,
  DEMO_COUNTER_INITIAL_VALUE,
  DEMO_COUNTER_NEXT_VALUE,
  readDemoCounterValue,
} from '../../lib/demo/demoLedgerEntries'
import { DEMO_COUNTER_HINT_STORAGE_KEY } from '../../routes/contracts/$contractId/explorer'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { getStoreState, resetStore } from '../../store/lensStore'

import type { ComponentProps, ReactNode } from 'react'

const LIVE_CONTRACT_ID =
  'CC42QZWUV2R7PUN2SZZW3Y3A43UUB5L2U3B4K3O5EUT7Y4I2O2W34EWM'

vi.mock('@stellar/design-system', () => ({
  Button: ({
    children,
    variant: _variant,
    size: _size,
    ...props
  }: ComponentProps<'button'> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: { children?: ReactNode }) => (
    <section>{children}</section>
  ),
  Heading: ({
    as = 'h2',
    children,
    className: _className,
    size: _size,
  }: {
    as?: 'h1' | 'h2' | 'h3'
    children?: ReactNode
    className?: string
    size?: string
  }) => {
    const Tag = as
    return <Tag>{children}</Tag>
  },
  IconButton: ({
    altText,
    icon: _icon,
    ...props
  }: ComponentProps<'button'> & { altText?: string; icon?: string }) => (
    <button aria-label={altText} {...props} />
  ),
}))

vi.mock('../../workers/createDecoderWorkerSafe', () => ({
  createDecoderWorkerSafe: () =>
    Promise.resolve({
      decodeScVal: vi.fn(),
      ping: vi.fn().mockResolvedValue({ status: 'pong' }),
      terminate: vi.fn(),
    }),
  terminateDecoderWorkerSafe: vi.fn(),
}))

vi.mock('../../workers/createDecoderWorker', () => ({
  createDecoderWorker: () => ({
    ping: () => Promise.resolve({ status: 'pong' }),
  }),
}))

vi.mock('../../lib/network/getLedgerEntries', () => ({
  getLedgerEntries: vi.fn(),
}))

function renderExplorer(entry: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [entry] }),
    context: {},
  })
  render(<RouterProvider router={router} />)
}

function counterValue(): number | null {
  return readDemoCounterValue(
    getStoreState().ledgerData[DEMO_COUNTER_ENTRY_KEY],
  )
}

describe('demo counter action (SSL-I050)', () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_COUNTER_HINT_STORAGE_KEY)
  })

  afterEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('is demo-only: absent for live contracts', async () => {
    renderExplorer(`/contracts/${LIVE_CONTRACT_ID}/explorer`)

    await screen.findByRole('heading', { name: LIVE_CONTRACT_ID })
    expect(screen.queryByRole('button', { name: /Demo: counter/ })).toBeNull()
    expect(getStoreState().ledgerData).toEqual({})
  })

  it('advances the sample counter from 42 to 43 locally', async () => {
    renderExplorer(`/contracts/${SAMPLE_CONTRACT_ID}/explorer?mode=demo`)

    const demoButton = await screen.findByRole('button', {
      name: /Demo: counter/,
    })
    await waitFor(() => {
      expect(counterValue()).toBe(DEMO_COUNTER_INITIAL_VALUE)
    })

    fireEvent.click(demoButton)

    await waitFor(() => {
      expect(counterValue()).toBe(DEMO_COUNTER_NEXT_VALUE)
    })
    expect(
      await screen.findByText(/Demo counter advanced from 42 to 43/),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /Demo: counter/ }),
    ).toHaveProperty('disabled', true)
  })

  it('shows a dismissible first-run hint only for the demo explorer', async () => {
    renderExplorer(`/contracts/${SAMPLE_CONTRACT_ID}/explorer?mode=demo`)

    expect(
      await screen.findByRole('heading', { name: /Try the counter row/i }),
    ).toBeTruthy()
    expect(screen.getByText(/Find the counter row/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))

    expect(
      screen.queryByRole('heading', { name: /Try the counter row/i }),
    ).toBeNull()
    expect(window.localStorage.getItem(DEMO_COUNTER_HINT_STORAGE_KEY)).toBe(
      'true',
    )

    renderExplorer(`/contracts/${LIVE_CONTRACT_ID}/explorer`)
    await screen.findByRole('heading', { name: LIVE_CONTRACT_ID })
    expect(
      screen.queryByRole('heading', { name: /Try the counter row/i }),
    ).toBeNull()
  })

  it('dismisses and inspects the real demo counter key', async () => {
    renderExplorer(`/contracts/${SAMPLE_CONTRACT_ID}/explorer?mode=demo`)

    const inspectButton = await screen.findByRole('button', {
      name: /Inspect counter/i,
    })
    fireEvent.click(inspectButton)

    await waitFor(() => {
      expect(getStoreState().selectedKeyPath).toBe(DEMO_COUNTER_ENTRY_KEY)
    })
    expect(window.localStorage.getItem(DEMO_COUNTER_HINT_STORAGE_KEY)).toBe(
      'true',
    )
  })
})
