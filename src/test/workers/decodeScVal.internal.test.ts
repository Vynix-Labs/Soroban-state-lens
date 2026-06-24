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

  it('should decode a nested vec ScVal', async () => {
    const scVal = xdr.ScVal.scvVec([
      xdr.ScVal.scvU32(10),
      xdr.ScVal.scvVec([xdr.ScVal.scvU32(20), xdr.ScVal.scvU32(30)]),
    ])
    const xdrString = scVal.toXDR('base64')

    const result = await decoderWorkerApi.decodeScVal({ xdr: xdrString })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result.kind).toBe('vec')
    if (result.kind === 'vec') {
      expect(result.items).toHaveLength(2)

      expect(result.items[0]).toMatchObject({
        kind: 'primitive',
        scType: 'u32',
        value: 10,
      })

      expect(result.items[1].kind).toBe('vec')
      if (result.items[1].kind === 'vec') {
        expect(result.items[1].items).toHaveLength(2)
        expect(result.items[1].items[0]).toMatchObject({
          kind: 'primitive',
          scType: 'u32',
          value: 20,
        })
        expect(result.items[1].items[1]).toMatchObject({
          kind: 'primitive',
          scType: 'u32',
          value: 30,
        })
      }
    }
  })

  it('should return an error for invalid XDR', async () => {
    const result = await decoderWorkerApi.decodeScVal({ xdr: 'invalid-xdr' })

    expect(isDecoderWorkerError(result)).toBe(true)
    if (isDecoderWorkerError(result)) {
      expect(result.code).toBe('DECODE_FAILED')
    }
  })
})
