import { describe, expect, it } from 'vitest'
import { SpecLoadGuard } from '../../lib/spec/specLoadGuard'
import type { SpecLoadScope } from '../../lib/spec/specLoadGuard'

const first: SpecLoadScope = {
  networkId: 'testnet',
  networkPassphrase: 'test',
  rpcUrl: 'https://one.example',
  contractId: 'contract-a',
}
const second: SpecLoadScope = {
  networkId: 'futurenet',
  networkPassphrase: 'future',
  rpcUrl: 'https://two.example',
  contractId: 'contract-b',
}

describe('spec load guard', () => {
  it('aborts the old load and rejects success and error commits after a context change', () => {
    const guard = new SpecLoadGuard()
    const old = guard.start(first)
    const current = guard.start(second)
    const metadata: Record<string, string> = { unrelated: 'preserved' }
    expect(old.signal.aborted).toBe(true)
    expect(
      current.commitIfCurrent(second, () => {
        metadata.current = 'new'
      }),
    ).toBe(true)
    expect(
      old.commitIfCurrent(second, () => {
        metadata.current = 'old'
      }),
    ).toBe(false)
    expect(
      old.commitIfCurrent(second, () => {
        metadata.error = 'old error'
      }),
    ).toBe(false)
    expect(metadata).toEqual({ unrelated: 'preserved', current: 'new' })
  })
  it('rejects scope changes even before another load starts', () => {
    const guard = new SpecLoadGuard()
    const attempt = guard.start(first)
    for (const changed of [
      { ...first, networkId: 'other' },
      { ...first, networkPassphrase: 'other' },
      { ...first, rpcUrl: 'https://other.example' },
      { ...first, contractId: 'other' },
    ])
      expect(
        attempt.commitIfCurrent(changed, () => {
          throw new Error('must not commit')
        }),
      ).toBe(false)
    guard.cancel()
    expect(attempt.signal.aborted).toBe(true)
    expect(
      attempt.commitIfCurrent(first, () => {
        throw new Error('must not commit')
      }),
    ).toBe(false)
  })
})
