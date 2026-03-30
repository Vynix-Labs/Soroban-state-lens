import { describe, expect, it } from 'vitest'
import { mapSdsToneToClass } from '@/components/primitives/mapSdsToneToClass'

describe('mapSdsToneToClass', () => {
  // ✅ Happy paths
  it('returns correct class for neutral', () => {
    expect(mapSdsToneToClass('neutral')).toBe('sds-tone-neutral')
  })

  it('returns correct class for success', () => {
    expect(mapSdsToneToClass('success')).toBe('sds-tone-success')
  })

  it('returns correct class for warning', () => {
    expect(mapSdsToneToClass('warning')).toBe('sds-tone-warning')
  })

  it('returns correct class for error', () => {
    expect(mapSdsToneToClass('error')).toBe('sds-tone-error')
  })

  // ⚠️ Edge cases
  it('falls back to neutral for unknown tone', () => {
    expect(mapSdsToneToClass('unknown' as any)).toBe('sds-tone-neutral')
  })

  it('falls back to neutral for empty string', () => {
    expect(mapSdsToneToClass('' as any)).toBe('sds-tone-neutral')
  })

  it('falls back to neutral for null/undefined', () => {
    expect(mapSdsToneToClass(null as any)).toBe('sds-tone-neutral')
    expect(mapSdsToneToClass(undefined as any)).toBe('sds-tone-neutral')
  })
})
