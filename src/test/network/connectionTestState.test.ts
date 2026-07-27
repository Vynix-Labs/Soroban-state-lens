import { describe, expect, it } from 'vitest'

import { resetConnectionTestState } from '../../lib/network/connectionTestState'

describe('resetConnectionTestState', () => {
  it('returns idle status with no previous error', () => {
    expect(resetConnectionTestState()).toEqual({ status: 'idle', error: '' })
  })
})
