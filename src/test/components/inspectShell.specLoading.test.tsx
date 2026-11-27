import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InspectShell } from '../../components/explorer/InspectShell'
import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'
import { DEFAULT_PREFERENCES } from '../../store/types'
import {
  OTHER_CONTRACT_ID,
  TEST_CONTRACT_ID,
  createContractSpecWasm,
} from '../helpers/contractSpecFixtures'

import type { ParsedContractSpec } from '../../lib/spec/parseContractSpec'

const { mockGetContractWasm } = vi.hoisted(() => ({
  mockGetContractWasm: vi.fn(),
}))

vi.mock('../../lib/network/getContractWasmForSpec', () => ({
  getContractWasmForSpec: mockGetContractWasm,
}))

vi.mock('@stellar/design-system', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  IconButton: ({
    altText,
    ...props
  }: React.ComponentProps<'button'> & { altText?: string }) => (
    <button aria-label={altText} {...props} />
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}))

function renderInspector() {
  return render(
    <InspectShell
      contractId={TEST_CONTRACT_ID}
      normalizedContractId={TEST_CONTRACT_ID}
      keyPath="balance"
    />,
  )
}

function enableOptIn() {
  useLensStore.setState({
    preferences: { ...DEFAULT_PREFERENCES, autoLoadSpec: true },
  })
}

describe('Inspector opt-in spec loading', () => {
  beforeEach(() => {
    resetStore()
    mockGetContractWasm.mockReset()
    mockGetContractWasm.mockResolvedValue({
      success: true,
      wasm: createContractSpecWasm(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads once with opt-in on and fills the scoped cache', async () => {
    enableOptIn()

    const first = renderInspector()
    await waitFor(() => {
      expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeDefined()
    })
    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)
    expect(mockGetContractWasm).toHaveBeenCalledWith(
      expect.objectContaining({ contractId: TEST_CONTRACT_ID }),
    )

    const loaded = getStoreState().getContractSpec(
      TEST_CONTRACT_ID,
    ) as ParsedContractSpec
    expect(loaded.format).toBe('contractspecv0')
    expect(loaded.enumLookup.Color[0]).toBe('RED')
    expect(loaded.enumLookup.Color[1]).toBe('GREEN')
    expect(screen.getByText('Contract spec loaded.')).toBeTruthy()

    first.unmount()
    renderInspector()
    await waitFor(() => {
      expect(screen.getByText('Contract spec loaded.')).toBeTruthy()
    })
    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)
  })

  it('makes no automatic request when the opt-in is off', async () => {
    renderInspector()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Load contract spec' }),
      ).toBeTruthy()
    })
    expect(mockGetContractWasm).not.toHaveBeenCalled()
    expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeUndefined()
  })

  it('supports the explicit Load contract spec action with the opt-in off', async () => {
    renderInspector()

    fireEvent.click(screen.getByRole('button', { name: 'Load contract spec' }))

    await waitFor(() => {
      expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeDefined()
    })
    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)
  })

  it('preserves unrelated contract and network state', async () => {
    const otherSpec = { entries: [] }
    const ledgerSnapshot = {
      'other-contract-entry': {
        key: 'other-contract-entry',
        contractId: OTHER_CONTRACT_ID,
        type: 'ContractData' as const,
        value: 'untouched',
        lastModifiedLedger: 7,
      },
    }
    useLensStore.setState({
      networkConfig: {
        networkId: 'testnet',
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
      },
      ledgerData: ledgerSnapshot,
    })
    getStoreState().setContractSpec(OTHER_CONTRACT_ID, otherSpec)
    const networkBefore = getStoreState().networkConfig
    const ledgerBefore = getStoreState().ledgerData
    enableOptIn()

    renderInspector()
    await waitFor(() => {
      expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeDefined()
    })

    expect(getStoreState().networkConfig).toBe(networkBefore)
    expect(getStoreState().ledgerData).toBe(ledgerBefore)
    expect(getStoreState().getContractSpec(OTHER_CONTRACT_ID)).toEqual(
      otherSpec,
    )
    expect(mockGetContractWasm).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcUrl: 'https://soroban-testnet.stellar.org',
      }),
    )
  })

  it('surfaces a bounded failure and does not retry on reopen', async () => {
    mockGetContractWasm.mockResolvedValue({
      success: false,
      error: 'RPC unavailable',
    })
    enableOptIn()

    const first = renderInspector()
    await waitFor(() => {
      expect(screen.getByText(/Spec load failed: RPC unavailable/)).toBeTruthy()
    })
    expect(getStoreState().getContractSpecError(TEST_CONTRACT_ID)).toBe(
      'RPC unavailable',
    )
    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)

    first.unmount()
    renderInspector()
    await waitFor(() => {
      expect(screen.getByText(/Spec load failed: RPC unavailable/)).toBeTruthy()
    })
    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)
  })

  it('retries a failed load for the current contract and clears stale failure UI', async () => {
    mockGetContractWasm
      .mockResolvedValueOnce({ success: false, error: 'RPC unavailable' })
      .mockResolvedValueOnce({
        success: true,
        wasm: createContractSpecWasm(),
      })
    enableOptIn()

    renderInspector()
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: 'Retry spec load' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Retry spec load' }))

    await waitFor(() => {
      expect(screen.getByText('Contract spec loaded.')).toBeTruthy()
    })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(mockGetContractWasm).toHaveBeenCalledTimes(2)
    expect(mockGetContractWasm).toHaveBeenLastCalledWith(
      expect.objectContaining({ contractId: TEST_CONTRACT_ID }),
    )
  })
})
