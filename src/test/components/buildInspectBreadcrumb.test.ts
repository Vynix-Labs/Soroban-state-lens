import { describe, expect, it } from 'vitest'
import { buildInspectBreadcrumb } from '../../components/explorer/buildInspectBreadcrumb'

describe('buildInspectBreadcrumb', () => {
  const contractId = 'CDR3Q7WWNW7UKCR2O5JTD3NT2XZCOWHUZYEYO5DUOWDRYZ7P7XN25QJD'

  it('shortens the contract id and parses a single key segment', () => {
    const { segments } = buildInspectBreadcrumb(contractId, 'counter')
    expect(segments).toHaveLength(2)
    expect(segments[0].label).toBe('CDR3Q7...5QJD')
    expect(segments[0].title).toBe(contractId)
    expect(segments[1]).toEqual({ label: 'counter' })
  })

  it('parses a dotted key path into ordered segments', () => {
    const { segments } = buildInspectBreadcrumb(
      contractId,
      'admin.address',
    )
    expect(segments.map((s) => s.label)).toEqual([
      'CDR3Q7...5QJD',
      'admin',
      'address',
    ])
  })

  it('honours escaped dots in the key path', () => {
    const { segments } = buildInspectBreadcrumb(contractId, 'a\\.b.c')
    expect(segments.map((s) => s.label)).toEqual([
      'CDR3Q7...5QJD',
      'a.b',
      'c',
    ])
  })

  it('middle-truncates very long segments and keeps the full value as title', () => {
    const longKey = 'z'.repeat(60)
    const { segments } = buildInspectBreadcrumb(contractId, longKey)
    expect(segments).toHaveLength(2)
    expect(segments[1].label.length).toBeLessThan(longKey.length)
    expect(segments[1].label).toContain('…')
    expect(segments[1].title).toBe(longKey)
  })

  it('falls back to a Root segment for an invalid path', () => {
    const { segments } = buildInspectBreadcrumb(contractId, 'trailing\\')
    expect(segments.map((s) => s.label)).toEqual(['CDR3Q7...5QJD', 'Root'])
  })

  it('shows a No key segment when the path is empty', () => {
    const { segments } = buildInspectBreadcrumb(contractId, '')
    expect(segments.map((s) => s.label)).toEqual(['CDR3Q7...5QJD', 'No key'])
  })

  it('renders a neutral contract label when the contract id is blank', () => {
    const { segments } = buildInspectBreadcrumb('', 'counter')
    expect(segments[0].label).toBe('Contract')
    expect(segments[1].label).toBe('counter')
  })
})