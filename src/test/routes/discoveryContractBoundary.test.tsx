import {
  Account,
  BASE_FEE,
  Operation,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'
import { fireEvent, render, screen } from '@testing-library/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '../../routeTree.gen'
import { resetStore } from '../../store/lensStore'

vi.mock('@stellar/design-system', () => ({
  Button: (props: React.ComponentProps<'button'>) => <button {...props} />,
  Card: (props: React.ComponentProps<'div'>) => <div {...props} />,
  Heading: ({
    as: _as,
    size: _size,
    ...props
  }: React.ComponentProps<'div'> & { as?: string; size?: string }) => (
    <div {...props} />
  ),
  IconButton: ({
    altText,
    ...props
  }: React.ComponentProps<'button'> & { altText: string }) => (
    <button aria-label={altText} {...props} />
  ),
}))
const routeContract = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
const otherContract = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4'
const source = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

function envelope(contract: string): string {
  return new TransactionBuilder(new Account(source, '1'), {
    fee: BASE_FEE,
    networkPassphrase: 'Test SDF Network ; September 2015',
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract,
        function: 'read_state',
        args: [xdr.ScVal.scvU32(7)],
      }),
    )
    .setTimeout(60)
    .build()
    .toXDR()
}
async function submit(contract: string) {
  window.history.pushState({}, '', `/contracts/${routeContract}/discovery`)
  const router = createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  render(<RouterProvider router={router} />)
  fireEvent.change(await screen.findByLabelText('Function name'), {
    target: { value: 'read_state' },
  })
  fireEvent.change(screen.getByLabelText('Transaction XDR'), {
    target: { value: envelope(contract) },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Simulate transaction' }))
}
function simulationCalls() {
  return vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) =>
        (JSON.parse(String(init?.body)) as { method: string }).method ===
        'simulateTransaction',
    )
}

describe('discovery invocation contract boundary', () => {
  beforeEach(() => {
    resetStore()
    vi.stubGlobal(
      'fetch',
      vi.fn((_input, init) => {
        const request = JSON.parse(String(init?.body)) as {
          id: number
          method: string
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: '2.0',
              id: request.id,
              result:
                request.method === 'getLatestLedger'
                  ? { sequence: 123 }
                  : { footprint: { readOnly: ['matching-key'] } },
            }),
        } as Response)
      }),
    )
  })
  it('rejects a foreign invocation and explains both identities before RPC', async () => {
    await submit(otherContract)
    const error = await screen.findByRole('status')
    expect(error.textContent).toContain(otherContract)
    expect(error.textContent).toContain(routeContract)
    expect(simulationCalls()).toHaveLength(0)
  })
  it('allows a matching invocation to simulate', async () => {
    await submit(routeContract)
    expect(await screen.findByText('matching-key')).toBeTruthy()
    expect(simulationCalls()).toHaveLength(1)
  })
})
