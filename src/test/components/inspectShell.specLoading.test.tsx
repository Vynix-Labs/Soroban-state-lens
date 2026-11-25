import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InspectShell } from '../../components/explorer/InspectShell'
import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'
import { DEFAULT_PREFERENCES } from '../../store/types'
import {
  OTHER_CONTRACT_ID,
  TEST_CONTRACT_ID,
  createContractSpecWasm,
  createWasmWithoutSpec,
} from '../helpers/contractSpecFixtures'

import { MAX_WASM_UPLOAD_BYTES } from '../../lib/wasm/readWasmUpload'
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

function uploadWasm(bytes: Uint8Array, size = bytes.length) {
  const file = new File([], 'contract.wasm', { type: 'application/wasm' })
  const buffer = new ArrayBuffer(bytes.length)
  new Uint8Array(buffer).set(bytes)
  Object.defineProperties(file, {
    size: { value: size },
    arrayBuffer: { value: () => Promise.resolve(buffer) },
  })
  fireEvent.change(screen.getByLabelText('Upload contract WASM'), {
    target: { files: [file] },
  })
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

  it('explains a spec-less upload while preserving raw inspection and unrelated state', async () => {
    const load = await getStoreState().loadContractSpec(TEST_CONTRACT_ID)
    expect(load.ok).toBe(true)
    const spec = getStoreState().getContractSpec(TEST_CONTRACT_ID)!
    getStoreState().setContractSpec(OTHER_CONTRACT_ID, spec)
    const entry = {
      key: 'balance',
      contractId: TEST_CONTRACT_ID,
      type: 'ContractData' as const,
      value: null,
      lastModifiedLedger: 7,
      rawXdr: 'raw-entry-remains-visible',
    }
    useLensStore.setState({ ledgerData: { balance: entry } })
    const network = getStoreState().networkConfig
    renderInspector()
    uploadWasm(createWasmWithoutSpec())
    await screen.findByText(
      'This WASM file has no contractspecv0 section. Raw values remain available; schema labels are unavailable.',
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(entry.rawXdr)).toBeTruthy()
    expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeUndefined()
    expect(getStoreState().getContractSpec(OTHER_CONTRACT_ID)).toBe(spec)
    expect(getStoreState().ledgerData.balance).toBe(entry)
    expect(getStoreState().networkConfig).toBe(network)
    expect(screen.getByLabelText('Upload contract WASM')).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('loads a valid uploaded spec and recovers from no-spec state', async () => {
    renderInspector()
    uploadWasm(createWasmWithoutSpec())
    await screen.findByText(/This WASM file has no contractspecv0 section/)
    uploadWasm(createContractSpecWasm())
    await waitFor(() =>
      expect(
        getStoreState().getContractSpec(TEST_CONTRACT_ID)?.entries[0].name,
      ).toBe('Color'),
    )
    expect(
      screen.queryByText(/This WASM file has no contractspecv0 section/),
    ).toBeNull()
    expect(screen.getByText('Contract spec loaded.')).toBeTruthy()
    expect(mockGetContractWasm).not.toHaveBeenCalled()
  })

  it('shows actionable upload errors for invalid and oversized files', async () => {
    renderInspector()
    uploadWasm(new Uint8Array(8))
    await screen.findByRole('alert')
    expect(screen.getByRole('alert').textContent).toContain(
      'Choose a valid WASM version 1 file.',
    )
    uploadWasm(createWasmWithoutSpec(), MAX_WASM_UPLOAD_BYTES + 1)
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Choose a WASM file no larger than 8 MiB.',
      ),
    )
  })

  it('discards an upload finishing after the network context changes', async () => {
    let finish!: (buffer: ArrayBuffer) => void
    const pending = getStoreState().loadContractSpecFromUpload(
      TEST_CONTRACT_ID,
      {
        size: 8,
        arrayBuffer: () =>
          new Promise<ArrayBuffer>((resolve) => {
            finish = resolve
          }),
      },
    )
    const originalNetwork = getStoreState().networkConfig
    getStoreState().setNetworkConfig({ networkId: 'another-network' })
    const wasm = createContractSpecWasm()
    const buffer = new ArrayBuffer(wasm.length)
    new Uint8Array(buffer).set(wasm)
    finish(buffer)
    expect(await pending).toMatchObject({ ok: false, skipped: true })
    expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeUndefined()
    getStoreState().setNetworkConfig(originalNetwork)
    expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBeUndefined()
    expect(getStoreState().getContractSpecLoadStatus(TEST_CONTRACT_ID)).toBe(
      'idle',
    )
  })

  it('distinguishes fetched code identity from unverified uploaded metadata', async () => {
    const wasmHash = 'ab'.repeat(32)
    mockGetContractWasm.mockResolvedValueOnce({
      success: true,
      wasm: createContractSpecWasm(),
      wasmHash,
    })
    renderInspector()
    fireEvent.click(screen.getByRole('button', { name: 'Load contract spec' }))
    await screen.findByText('Metadata source: Stellar RPC')
    expect(screen.getByText(wasmHash)).toBeTruthy()
    expect(screen.getByText(getStoreState().networkConfig.rpcUrl)).toBeTruthy()
    expect(
      screen.getByText(getStoreState().networkConfig.networkId),
    ).toBeTruthy()
    expect(
      screen.queryByText(
        'This file has not been verified against on-chain contract code.',
      ),
    ).toBeNull()
    uploadWasm(createContractSpecWasm())
    await screen.findByText('contract.wasm')
    expect(
      screen.getByText(
        'This file has not been verified against on-chain contract code.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Metadata source: Stellar RPC')).toBeNull()
    expect(screen.queryByText(wasmHash)).toBeNull()
    uploadWasm(createWasmWithoutSpec())
    await screen.findByText(/This WASM file has no contractspecv0 section/)
    expect(screen.queryByText('contract.wasm')).toBeNull()
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
})
