import { describe, expect, it } from 'vitest'
import { formatArgumentPreview } from '../../lib/network/formatArgumentPreview'
import type { Node } from '../../types/node'

describe('argument value previews', () => {
  it('preserves a large integer and byte order without numeric conversion', () => {
    expect(
      formatArgumentPreview({
        kind: 'primitive',
        path: [],
        scType: 'u64',
        value: '18446744073709551615',
        raw: { switch: 'ScvU64' },
      }),
    ).toBe('18446744073709551615')
    expect(
      formatArgumentPreview({
        kind: 'primitive',
        path: [],
        scType: 'bytes',
        value: [0, 255, 16],
        raw: { switch: 'ScvBytes' },
      }),
    ).toBe('0x00ff10')
  })
  it('bounds nested collections and text with visible truncation', () => {
    let node: Node = {
      kind: 'primitive',
      path: [],
      scType: 'string',
      value: 'x'.repeat(10000),
      raw: { switch: 'ScvString' },
    }
    for (let depth = 0; depth < 8; depth++)
      node = { kind: 'vec', path: [], items: [node], raw: { switch: 'ScvVec' } }
    const preview = formatArgumentPreview(node)
    expect(preview).toContain('…')
    expect(preview.length).toBeLessThanOrEqual(512)
  })
})
