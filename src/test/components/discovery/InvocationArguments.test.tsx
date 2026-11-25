import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvocationArguments } from '../../../components/discovery/InvocationArguments'
import type { DecodeScValResult } from '../../../types/decoder-worker'

const { decode, terminate } = vi.hoisted(() => ({
  decode: vi.fn<() => Promise<DecodeScValResult>>(),
  terminate: vi.fn(),
}))
vi.mock('../../../workers/recoveringDecoder', () => ({
  RecoveringDecoder: class {
    decodeScVal = decode
    terminate = terminate
  },
}))
const numeric = (value: number): DecodeScValResult => ({
  kind: 'primitive',
  path: [],
  scType: 'u32',
  value,
  raw: { switch: 'ScvU32', value },
})

describe('InvocationArguments', () => {
  beforeEach(() => {
    decode.mockReset()
    terminate.mockReset()
    decode.mockResolvedValue(numeric(42))
  })
  afterEach(cleanup)
  it('bounds the argument count and skips oversized XDR with a visible explanation', async () => {
    const args = Array.from({ length: 17 }, (_, index) =>
      index === 0 ? 'A'.repeat(65537) : `encoded-${index}`,
    )
    render(<InvocationArguments argumentXdr={args} />)
    await screen.findByText(
      'Argument exceeds the 64 KiB encoded XDR preview limit.',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(16)
    expect(decode).toHaveBeenCalledTimes(15)
    expect(
      screen.getByText('Showing the first 16 of 17 arguments.'),
    ).toBeTruthy()
  })
  it('discards late previews after the transaction arguments change', async () => {
    let finish!: (value: DecodeScValResult) => void
    decode.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const { rerender } = render(<InvocationArguments argumentXdr={['old']} />)
    await waitFor(() => expect(decode).toHaveBeenCalledTimes(1))
    rerender(<InvocationArguments argumentXdr={['new']} />)
    await screen.findByText('42')
    await act(async () => {
      finish(numeric(99))
      await Promise.resolve()
    })
    expect(screen.queryByText('99')).toBeNull()
    expect(screen.getByText('42')).toBeTruthy()
    expect(terminate).toHaveBeenCalled()
  })
  it('shows a decoder fallback and supports an invocation with no arguments', async () => {
    decode.mockResolvedValueOnce({ code: 'INVALID_XDR', message: 'bad XDR' })
    const { rerender } = render(<InvocationArguments argumentXdr={['bad']} />)
    await screen.findByText('Unable to decode argument (INVALID_XDR).')
    rerender(<InvocationArguments argumentXdr={[]} />)
    expect(screen.getByText('This invocation has no arguments.')).toBeTruthy()
  })
})
