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

  it('should decode a map ScVal with multiple entries into key/value child nodes', async () => {
    const scVal = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('a'),
        val: xdr.ScVal.scvU32(1),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('b'),
        val: xdr.ScVal.scvU32(2),
      }),
    ])
    const xdrString = scVal.toXDR('base64')

    const result = await decoderWorkerApi.decodeScVal({ xdr: xdrString })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result.kind).toBe('map')
    if (result.kind === 'map') {
      expect(result.entries).toHaveLength(2)

      expect(result.entries[0].key).toMatchObject({
        kind: 'primitive',
        scType: 'symbol',
        value: 'a',
      })
      expect(result.entries[0].value).toMatchObject({
        kind: 'primitive',
        scType: 'u32',
        value: 1,
      })

      expect(result.entries[1].key).toMatchObject({
        kind: 'primitive',
        scType: 'symbol',
        value: 'b',
      })
      expect(result.entries[1].value).toMatchObject({
        kind: 'primitive',
        scType: 'u32',
        value: 2,
      })
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
