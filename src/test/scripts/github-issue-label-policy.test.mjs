import { describe, expect, it } from 'vitest'

import {
  PUBLISHER_LABEL,
  getPublisherLabels,
  validatePublisherLabelPolicy,
} from '../../../scripts/github-issue-label-policy.mjs'

describe('publisher label policy', () => {
  it('assigns exactly good first issue to compliant wave entries', () => {
    expect(getPublisherLabels({ id: 'wave-1', goodFirst: true })).toEqual([
      PUBLISHER_LABEL,
    ])
    expect(() =>
      validatePublisherLabelPolicy([{ id: 'wave-1', goodFirst: true }]),
    ).not.toThrow()
  })

  it('rejects entries without the required publisher label', () => {
    expect(() =>
      validatePublisherLabelPolicy([{ id: 'wave-2', goodFirst: false }]),
    ).toThrow('exactly one publisher label')
  })
})
