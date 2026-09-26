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

function renderDiscoveryRoute() {
  window.history.pushState({}, '', `/contracts/${VALID_CONTRACT_ID}/discovery`)
  const router = createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  return render(<RouterProvider router={router} />)
}

async function fillValidForm() {
  fireEvent.change(await screen.findByLabelText('Function name'), {
    target: { value: 'read_state' },
  })
  fireEvent.change(await screen.findByLabelText('Transaction XDR'), {
    target: { value: 'base64-transaction-xdr' },
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

    expect(fetch).not.toHaveBeenCalled()
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
    expect(fetch).not.toHaveBeenCalled()
  })

  it('simulates the transaction and displays normalized discovered keys', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: {
            footprint: {
              readOnly: ['read-key'],
              readWrite: ['write-key'],
            },
          },
        }),
    } as Response)
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
  })

  it('shows simulation errors without displaying a successful empty state', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32000, message: 'Simulation failed' },
        }),
    } as Response)
    renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )

    expect(
      await screen.findByText('RPC Error (-32000): Simulation failed'),
    ).toBeTruthy()
    expect(
      screen.queryByText('No keys found in the transaction footprint.'),
    ).toBeNull()
  })

  it('aborts a pending simulation when the route unmounts', async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve
        }),
    )
    const view = renderDiscoveryRoute()
    await fillValidForm()
    fireEvent.click(
      screen.getByRole('button', { name: 'Simulate transaction' }),
    )
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal as AbortSignal

    view.unmount()
    expect(signal.aborted).toBe(true)

    await act(async () => {
      resolveResponse({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: { footprint: { readOnly: ['late-key'] } },
          }),
      } as Response)
      await Promise.resolve()
      await Promise.resolve()
    })
  })
})
