import { describe, expect, it } from 'vitest'
import { simulateTransactionAdapter } from '../../lib/network/simulateTransaction'
import { extractFootprintKeys } from '../../lib/network/footprint'

describe('simulateTransactionAdapter', () => {
  it('should return success false when response is null', () => {
    const result = simulateTransactionAdapter(null)
    expect(result.success).toBe(false)
    expect(result.error).toBe('No response provided')
  })

  it('should return success false when response is undefined', () => {
    const result = simulateTransactionAdapter(undefined)
    expect(result.success).toBe(false)
    expect(result.error).toBe('No response provided')
  })

  it('should return success false when response has error', () => {
    const result = simulateTransactionAdapter({ error: 'Transaction failed' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Transaction failed')
  })

  it('should return typed response shape on success', () => {
    const response = {
      latestLedger: 100,
      results: [{ xdr: 'some-xdr', auth: [] }],
      footprint: {
        readOnly: ['key1', 'key2'],
        readWrite: ['key3'],
      },
    }
    const result = simulateTransactionAdapter(response)
    expect(result.success).toBe(true)
    expect(result.latestLedger).toBe(100)
    expect(result.results).toHaveLength(1)
    expect(result.footprint?.readOnly).toEqual(['key1', 'key2'])
    expect(result.footprint?.readWrite).toEqual(['key3'])
  })

  it('should handle missing footprint safely', () => {
    const result = simulateTransactionAdapter({ latestLedger: 50 })
    expect(result.success).toBe(true)
    expect(result.footprint?.readOnly).toEqual([])
    expect(result.footprint?.readWrite).toEqual([])
  })

  it('should handle empty results safely', () => {
    const result = simulateTransactionAdapter({ latestLedger: 50, results: [] })
    expect(result.success).toBe(true)
    expect(result.results).toEqual([])
  })
})

describe('extractFootprintKeys', () => {
  it('should return empty arrays when footprint is null', () => {
    const result = extractFootprintKeys(null)
    expect(result.readOnly).toEqual([])
    expect(result.readWrite).toEqual([])
  })

  it('should return empty arrays when footprint is undefined', () => {
    const result = extractFootprintKeys(undefined)
    expect(result.readOnly).toEqual([])
    expect(result.readWrite).toEqual([])
  })

  it('should return empty arrays when footprint is empty', () => {
    const result = extractFootprintKeys({})
    expect(result.readOnly).toEqual([])
    expect(result.readWrite).toEqual([])
  })

  it('should deduplicate readOnly keys', () => {
    const result = extractFootprintKeys({
      readOnly: ['key1', 'key2', 'key1', 'key3', 'key2'],
    })
    expect(result.readOnly).toEqual(['key1', 'key2', 'key3'])
  })

  it('should deduplicate readWrite keys', () => {
    const result = extractFootprintKeys({
      readWrite: ['keyA', 'keyB', 'keyA'],
    })
    expect(result.readWrite).toEqual(['keyA', 'keyB'])
  })

  it('should return stable sorted ordering', () => {
    const result = extractFootprintKeys({
      readOnly: ['zzz', 'aaa', 'mmm'],
      readWrite: ['ccc', 'aaa'],
    })
    expect(result.readOnly).toEqual(['aaa', 'mmm', 'zzz'])
    expect(result.readWrite).toEqual(['aaa', 'ccc'])
  })

  it('should handle missing readOnly or readWrite safely', () => {
    const result1 = extractFootprintKeys({ readOnly: ['key1'] })
    expect(result1.readOnly).toEqual(['key1'])
    expect(result1.readWrite).toEqual([])

    const result2 = extractFootprintKeys({ readWrite: ['key1'] })
    expect(result2.readOnly).toEqual([])
    expect(result2.readWrite).toEqual(['key1'])
  })
})
