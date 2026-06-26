import { describe, expect, it } from 'vitest'
import { xdr } from '@stellar/stellar-sdk'
import { decoderWorkerApi } from '../../workers/decoder.worker'
import { isDecoderWorkerError } from '../../types/decoder-worker'

describe('decoderWorkerApi.decodeScVal', () => {
  it('should decode a boolean ScVal', async () => {
    const scVal = xdr.ScVal.scvBool(true)
    const xdrString = scVal.toXDR('base64')

    const result = await decoderWorkerApi.decodeScVal({ xdr: xdrString })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result.kind).toBe('primitive')
    if (result.kind === 'primitive') {
      expect(result.scType).toBe('bool')
      expect(result.value).toBe(true)
    }
  })

  it('should decode a u32 ScVal', async () => {
    const scVal = xdr.ScVal.scvU32(42)
    const xdrString = scVal.toXDR('base64')

    const result = await decoderWorkerApi.decodeScVal({ xdr: xdrString })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result.kind).toBe('primitive')
    if (result.kind === 'primitive') {
      expect(result.scType).toBe('u32')
      expect(result.value).toBe(42)
    }
  })

  it('should return an error for invalid XDR', async () => {
    const result = await decoderWorkerApi.decodeScVal({ xdr: 'invalid-xdr' })

    expect(isDecoderWorkerError(result)).toBe(true)
    if (isDecoderWorkerError(result)) {
      expect(result.code).toBe('DECODE_FAILED')
    }
  })

  it('should respect maxDepth and truncate nested vec children', async () => {
    const scVal = xdr.ScVal.scvVec([
      xdr.ScVal.scvVec([xdr.ScVal.scvI32(1)]),
      xdr.ScVal.scvVec([xdr.ScVal.scvI32(2)]),
    ])
    const xdrString = scVal.toXDR('base64')

    const result = await decoderWorkerApi.decodeScVal({
      xdr: xdrString,
      maxDepth: 1,
    })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result.kind).toBe('vec')
    if (result.kind !== 'vec') {
      throw new Error('expected vec node')
    }
    expect(result.items).toHaveLength(2)
    expect(result.items[0].kind).toBe('truncated')
    expect(result.items[1].kind).toBe('truncated')
    expect(result.items[0].path).toEqual([{ type: 'index', index: 0 }])
    expect(result.items[1].path).toEqual([{ type: 'index', index: 1 }])
  })
})
