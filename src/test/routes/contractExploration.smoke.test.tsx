import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { xdr } from '@stellar/stellar-sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { routeTree } from '../../routeTree.gen'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'
import { ContractLoadStatus } from '../../store/types'
import { createContractDataLedgerEntry } from '../helpers/ledgerEntryFixtures'

import type { ComponentProps, ReactNode } from 'react'

const { mockDecodeScVal, mockGetLedgerEntries } = vi.hoisted(() => ({
  mockDecodeScVal: vi.fn(),
  mockGetLedgerEntries: vi.fn(),
}))
let originalClipboardDescriptor: PropertyDescriptor | undefined

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
      decodeScVal: mockDecodeScVal,
      ping: vi.fn().mockResolvedValue({ status: 'pong' }),
      terminate: vi.fn(),
    }),
  terminateDecoderWorkerSafe: vi.fn(),
}))

vi.mock('../../lib/network/getLedgerEntries', () => ({
  getLedgerEntries: mockGetLedgerEntries,
}))

vi.mock('../../workers/createDecoderWorker', () => ({
  createDecoderWorker: () => ({
    ping: () => Promise.resolve({ status: 'pong' }),
  }),
}))

describe('contract exploration smoke flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    resetStore()
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor)
      originalClipboardDescriptor = undefined
    } else {
      Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('navigates from contract lookup through loaded explorer and inspection', async () => {
    const keyScVal = xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol('owner'),
      xdr.ScVal.scvSymbol('balance'),
    ])
    const entry = createContractDataLedgerEntry({
      contractSeed: 7,
      key: keyScVal,
      value: xdr.ScVal.scvSymbol('stored-value'),
    })
    const contractId = entry.contractId
    const decodedKey = {
      kind: 'vec',
      path: [],
      items: [
        {
          kind: 'primitive',
          path: [],
          scType: 'symbol',
          value: 'owner',
          raw: { switch: 'ScvSymbol', value: 'owner' },
        },
        {
          kind: 'primitive',
          path: [],
          scType: 'symbol',
          value: 'balance',
          raw: { switch: 'ScvSymbol', value: 'balance' },
        },
      ],
      raw: { switch: 'ScvVec' },
    }
    const decodedValue = {
      kind: 'primitive',
      path: [],
      scType: 'symbol',
      value: 'stored-value',
      raw: { switch: 'ScvSymbol', value: 'stored-value' },
    }
    mockGetLedgerEntries.mockResolvedValue({
      entries: [entry],
      latestLedger: 100,
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const request = JSON.parse(String(init?.body)) as {
          id: number | string
          method: string
        }
        const result = { sequence: 100 }
        return {
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: request.id, result }),
        } as Response
      }),
    )
    mockDecodeScVal.mockImplementation(({ xdr: valueXdr }: { xdr: string }) =>
      Promise.resolve(
        valueXdr === keyScVal.toXDR('base64') ? decodedKey : decodedValue,
      ),
    )
    const writeText = vi.fn().mockResolvedValue(undefined)
    originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    )
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
      context: {},
    })
    render(<RouterProvider router={router} />)

    const input = await screen.findByPlaceholderText(
      'Search Contract ID (C...)',
    )
    fireEvent.change(input, { target: { value: contractId } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe(`/contracts/${contractId}`)
      },
      { timeout: 10_000 },
    )

    await router.navigate({
      to: '/contracts/$contractId/explorer',
      params: { contractId },
      search: { keys: entry.key, mode: 'live' },
    })

    await waitFor(() => {
      expect(
        getStoreState().contractLoadStatus,
        getStoreState().contractLoadError ?? 'no error detail',
      ).toBe(ContractLoadStatus.SUCCESS)
    })

    expect(
      await screen.findByText('[owner, balance]', {}, { timeout: 10_000 }),
    ).toBeTruthy()
    expect(screen.queryByRole('note')).toBeNull()

    fireEvent.click(
      screen.getByRole('button', {
        name: `Copy canonical ledger key ${entry.key}`,
      }),
    )
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(entry.key)
    })

    fireEvent.click(
      screen.getByRole('treeitem', { name: 'Open [owner, balance]' }),
    )
    expect(await screen.findByText('Raw XDR')).toBeTruthy()
    expect(screen.getByText('Metadata')).toBeTruthy()
  }, 15_000)

  it('labels the sample explorer and keeps its entries local', async () => {
    resetStore()
    useLensStore.getState().upsertLedgerEntry({
      key: `${SAMPLE_CONTRACT_ID}::ContractData::demo-key`,
      contractId: SAMPLE_CONTRACT_ID,
      type: 'ContractData',
      value: 'demo value',
      lastModifiedLedger: 42,
    })

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: [`/contracts/${SAMPLE_CONTRACT_ID}/explorer`],
      }),
      context: {},
    })
    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('note', {
        name: 'Local demo data. Ledger numbers are illustrative.',
      }),
    ).toBeTruthy()
    expect(
      getStoreState().ledgerData[
        `${SAMPLE_CONTRACT_ID}::ContractData::demo-key`
      ].value,
    ).toBe('demo value')
    expect(mockGetLedgerEntries).not.toHaveBeenCalled()
  })
})
