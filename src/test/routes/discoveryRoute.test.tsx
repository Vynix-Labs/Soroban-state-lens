import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '../../routeTree.gen'
import { resetStore, useLensStore } from '../../store/lensStore'

vi.mock('@stellar/design-system', () => ({
  Button: (props: any) => <button {...props} />,
  Card: (props: any) => <div {...props}>{props.children}</div>,
  Heading: (props: any) => <div {...props}>{props.children}</div>,
  IconButton: ({ altText, ...props }: any) => (
    <button aria-label={altText} {...props} />
  ),
}))

const VALID_CONTRACT_ID =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

interface JsonRpcRequest {
  id: number
  method: string
}

function getRpcPayloads(method: string) {
  return vi.mocked(fetch).mock.calls.filter(([, init]) => {
    const request = JSON.parse(String(init?.body)) as JsonRpcRequest
    return request.method === method
  })
}

function mockRpcResponse(
  getResult: (request: JsonRpcRequest) => Record<string, unknown>,
) {
  vi.mocked(fetch).mockImplementation((_input, init) => {
    const request = JSON.parse(String(init?.body)) as JsonRpcRequest
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          jsonrpc: '2.0',
          id: request.id,
          ...getResult(request),
        }),
    } as Response)
  })
}

function renderDiscoveryRoute() {
  window.history.pushState({}, '', `/contracts/${VALID_CONTRACT_ID}/discovery`)
  const router = createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  return { router, ...render(<RouterProvider router={router} />) }
}

async function fillValidForm() {
  fireEvent.change(await screen.findByLabelText('Function name'), {
    target: { value: 'read_state' },
  })
  fireEvent.change(await screen.findByLabelText('Transaction XDR'), {
    target: { value: 'base64-transaction-xdr' },
  })
  fireEvent.change(await screen.findByLabelText('Arguments (JSON reference)'), {
    target: { value: '{"limit": 5}' },
  })
}

describe('Discovery route', () => {
  beforeEach(() => {
    resetStore()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('validates function names inline and blocks invalid submissions', async () => {
    renderDiscoveryRoute()
    fireEvent.change(await screen.findByLabelText('Function name'), {
      target: { value: 'ReadState' },
    })
    fireEvent.change(await screen.findByLabelText('Transaction XDR'), {
      target: { value: 'base64-transaction-xdr' },
    })

    expect(screen.getByRole('alert').textContent).toContain(
      'valid Soroban function name',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(getRpcPayloads('simulateTransaction')).toHaveLength(0)
    expect(
      screen.getByLabelText('Function name').getAttribute('aria-invalid'),
    ).toBe('true')
  })

  it('reports an empty transaction without making an RPC request', async () => {
    renderDiscoveryRoute()
    fireEvent.change(await screen.findByLabelText('Function name'), {
      target: { value: 'read_state' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(await screen.findByText('Transaction XDR is required.')).toBeTruthy()
    expect(getRpcPayloads('simulateTransaction')).toHaveLength(0)
  })

  it('simulates the transaction and displays normalized discovered keys', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : {
            result: {
              footprint: {
                readOnly: ['read-key'],
                readWrite: ['write-key'],
              },
            },
          },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(await screen.findByText('read-key')).toBeTruthy()
    expect(screen.getByText('write-key')).toBeTruthy()
    expect(screen.getByText('Read-only')).toBeTruthy()
    expect(screen.getByText('Read-write')).toBeTruthy()
    expect(useLensStore.getState().networkConfig.rpcUrl).toBeTruthy()

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add to watchlist' })[0],
    )
    expect(await screen.findByText('Added to watchlist.')).toBeTruthy()
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add to watchlist' })[0],
    )
    expect(screen.getByText('Already in watchlist.')).toBeTruthy()
    expect(
      useLensStore.getState().getWatchlistForContract(VALID_CONTRACT_ID),
    ).toHaveLength(1)
  })

  it('clears footprint results only when transaction XDR changes', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : {
            result: {
              footprint: { readOnly: ['read-key'], readWrite: ['write-key'] },
            },
          },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await screen.findByText('read-key')
    const network = useLensStore.getState().networkConfig

    fireEvent.change(screen.getByLabelText('Arguments (JSON reference)'), {
      target: { value: 'new notes' },
    })
    expect(screen.getByText('read-key')).toBeTruthy()
    expect(screen.getByText('write-key')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Transaction XDR'), {
      target: { value: 'different-transaction-xdr' },
    })
    expect(screen.queryByText('read-key')).toBeNull()
    expect(screen.queryByText('write-key')).toBeNull()
    expect(useLensStore.getState().networkConfig).toEqual(network)
    expect(screen.getByLabelText('Arguments (JSON reference)')).toHaveProperty(
      'value',
      'new notes',
    )
  })

  it('shows simulation errors without displaying a successful empty state', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : { error: { code: -32000, message: 'Simulation failed' } },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(
      await screen.findByText('RPC Error (-32000): Simulation failed'),
    ).toBeTruthy()
    expect(screen.getByLabelText('Function name')).toHaveProperty(
      'value',
      'read_state',
    )
    expect(screen.getByLabelText('Transaction XDR')).toHaveProperty(
      'value',
      'base64-transaction-xdr',
    )
    expect(screen.getByLabelText('Arguments (JSON reference)')).toHaveProperty(
      'value',
      '{"limit": 5}',
    )
    expect(
      screen.queryByText('No keys found in the transaction footprint.'),
    ).toBeNull()
  })

  it('maps common authorization failures to actionable discovery messages', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : {
            error: {
              code: -32001,
              message: 'Unauthorized: invalid auth token',
            },
          },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(
      await screen.findByText(
        'Authorization failed: check your RPC credentials and try again.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('RPC Error (-32001)')).toBeNull()
  })

  it('maps expired authorization to an actionable discovery message', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : {
            error: {
              code: -32002,
              message: 'Auth token has expired',
            },
          },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(
      await screen.findByText(
        'Authorization expired: refresh your RPC credentials and try again.',
      ),
    ).toBeTruthy()
  })

  it('maps missing authorization to an actionable discovery message', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : {
            error: {
              code: -32003,
              message: 'Missing authorization header',
            },
          },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(
      await screen.findByText(
        'Authorization required: add your RPC credentials and try again.',
      ),
    ).toBeTruthy()
  })

  it('ignores an old simulation response after the XDR changes', async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    vi.mocked(fetch).mockImplementation((_input, init) => {
      const request = JSON.parse(String(init?.body)) as JsonRpcRequest
      if (request.method === 'getLatestLedger') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: '2.0',
              id: request.id,
              result: { sequence: 123 },
            }),
        } as Response)
      }
      return new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })
    })
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await waitFor(() =>
      expect(getRpcPayloads('simulateTransaction')).toHaveLength(1),
    )
    const [, init] = getRpcPayloads('simulateTransaction')[0]
    fireEvent.change(screen.getByLabelText('Transaction XDR'), {
      target: { value: 'new-xdr' },
    })
    expect(init?.signal?.aborted).toBe(true)
    await act(async () => {
      resolveResponse({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: JSON.parse(String(init?.body)).id,
            result: { footprint: { readOnly: ['late-key'] } },
          }),
      } as Response)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.queryByText('late-key')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    ).toHaveProperty('disabled', false)
  })

  it('aborts a pending simulation when the route unmounts', async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    vi.mocked(fetch).mockImplementation((_input, init) => {
      const request = JSON.parse(String(init?.body)) as JsonRpcRequest
      if (request.method === 'getLatestLedger') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: '2.0',
              id: request.id,
              result: { sequence: 123 },
            }),
        } as Response)
      }
      return new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })
    })
    const view = renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await waitFor(() =>
      expect(getRpcPayloads('simulateTransaction')).toHaveLength(1),
    )
    const [, init] = getRpcPayloads('simulateTransaction')[0]
    const signal = init?.signal as AbortSignal

    view.unmount()
    expect(signal.aborted).toBe(true)

    await act(async () => {
      resolveResponse({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: JSON.parse(String(init?.body)).id,
            result: { footprint: { readOnly: ['late-key'] } },
          }),
      } as Response)
      await Promise.resolve()
      await Promise.resolve()
    })
  })

  it('aborts on a same-route network change and ignores a late footprint', async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    vi.mocked(fetch).mockImplementation((_input, init) => {
      const request = JSON.parse(String(init?.body)) as JsonRpcRequest
      if (request.method === 'getLatestLedger') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: '2.0',
              id: request.id,
              result: { sequence: 123 },
            }),
        } as Response)
      }
      return new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })
    })
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await waitFor(() =>
      expect(getRpcPayloads('simulateTransaction')).toHaveLength(1),
    )
    const [, init] = getRpcPayloads('simulateTransaction')[0]
    const signal = init?.signal as AbortSignal
    const before = useLensStore.getState().networkConfig
    act(() =>
      useLensStore.getState().setNetworkConfig({ networkId: 'other-network' }),
    )
    expect(signal.aborted).toBe(true)
    expect(useLensStore.getState().networkConfig.rpcUrl).toBe(before.rpcUrl)
    await act(async () => {
      resolveResponse({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: JSON.parse(String(init?.body)).id,
            result: { footprint: { readOnly: ['late-network-key'] } },
          }),
      } as Response)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.queryByText('late-network-key')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Add to watchlist' }),
    ).toBeNull()
    expect(screen.getByLabelText('Transaction XDR')).toHaveProperty(
      'value',
      'base64-transaction-xdr',
    )
    expect(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    ).not.toHaveProperty('disabled', true)
  })

  it('clears completed footprints when the network passphrase changes', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : { result: { footprint: { readOnly: ['old-network-key'] } } },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await screen.findByText('old-network-key')
    act(() =>
      useLensStore.getState().setNetworkConfig({
        networkPassphrase: 'different network passphrase',
      }),
    )
    expect(screen.queryByText('old-network-key')).toBeNull()
    expect(screen.getByLabelText('Function name')).toHaveProperty(
      'value',
      'read_state',
    )
  })

  it('does not warn when leaving a clean discovery form', async () => {
    renderDiscoveryRoute()
    await screen.findByLabelText('Function name')

    const event = new Event('beforeunload', { cancelable: true })
    const result = window.dispatchEvent(event)

    expect(result).toBe(true)
    expect(event.defaultPrevented).toBe(false)
  })

  it('warns when leaving with a dirty discovery transaction draft', async () => {
    renderDiscoveryRoute()
    fireEvent.change(await screen.findByLabelText('Transaction XDR'), {
      target: { value: 'base64-transaction-xdr' },
    })

    const event = new Event('beforeunload', { cancelable: true })
    const result = window.dispatchEvent(event)

    expect(result).toBe(false)
    expect(event.defaultPrevented).toBe(true)
  })

  it('blocks in-app navigation when the draft is dirty', async () => {
    const { router } = renderDiscoveryRoute()
    fireEvent.change(await screen.findByLabelText('Transaction XDR'), {
      target: { value: 'base64-transaction-xdr' },
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    void router.navigate({ to: '/settings/preferences' })

    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith(
        'You have unsaved discovery input. Leave this page?',
      ),
    )
    expect(window.location.pathname).toBe(
      `/contracts/${VALID_CONTRACT_ID}/discovery`,
    )
  })

  it('allows in-app navigation after confirming the dirty draft warning', async () => {
    const { router } = renderDiscoveryRoute()
    fireEvent.change(await screen.findByLabelText('Transaction XDR'), {
      target: { value: 'base64-transaction-xdr' },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    void router.navigate({ to: '/settings/preferences' })

    await waitFor(() =>
      expect(window.location.pathname).toBe('/settings/preferences'),
    )
  })

  it('warns when leaving with a dirty discovery argument draft', async () => {
    renderDiscoveryRoute()
    fireEvent.change(
      await screen.findByLabelText('Arguments (JSON reference)'),
      {
        target: { value: '{"limit": 5}' },
      },
    )

    const event = new Event('beforeunload', { cancelable: true })
    const result = window.dispatchEvent(event)

    expect(result).toBe(false)
    expect(event.defaultPrevented).toBe(true)
  })

  it('stops warning after a successful simulation clears the dirty state', async () => {
    mockRpcResponse((request) =>
      request.method === 'getLatestLedger'
        ? { result: { sequence: 123 } }
        : { result: { footprint: { readOnly: ['read-key'] } } },
    )
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await screen.findByText('read-key')

    const event = new Event('beforeunload', { cancelable: true })
    const result = window.dispatchEvent(event)

    expect(result).toBe(true)
    expect(event.defaultPrevented).toBe(false)
    expect(screen.getByLabelText('Function name')).toHaveProperty(
      'value',
      'read_state',
    )
    expect(screen.getByLabelText('Transaction XDR')).toHaveProperty(
      'value',
      'base64-transaction-xdr',
    )
  })
})
