import { describe, expect, it } from 'vitest'

import { buildParityReport } from '../../../scripts/github-issue-parity.mjs'

describe('issue parity report', () => {
  it('reports missing, duplicate, and mismatched live issues', () => {
    const source = [
      { id: 'A', title: 'Keep', body: 'keep-body' },
      { id: 'B', title: 'Missing', body: 'missing-body' },
      { id: 'C', title: 'Changed', body: 'source-body' },
    ]
    const live = [
      { number: 10, title: 'Keep', body: 'keep-body' },
      { number: 11, title: 'Duplicate', body: 'one' },
      { number: 12, title: 'Duplicate', body: 'two' },
      { number: 13, title: 'Changed', body: 'live-body' },
    ]

    expect(buildParityReport(source, live)).toEqual({
      sourceCount: 3,
      missing: [{ id: 'B', title: 'Missing' }],
      duplicates: [{ title: 'Duplicate', numbers: [11, 12] }],
      bodyMismatches: [{ id: 'C', title: 'Changed' }],
    })
  })
})
