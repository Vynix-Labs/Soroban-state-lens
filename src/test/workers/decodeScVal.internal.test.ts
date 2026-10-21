import { MessageChannel } from 'node:worker_threads'
import { xdr } from '@stellar/stellar-sdk'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter'
import { describe, expect, it } from 'vitest'
import { isDecoderWorkerError } from '../../types/decoder-worker'
import { isMap, isVec } from '../../types/node'
import { MAX_CHILDREN_DEFAULT } from '../../workers/decoder/normalizeNode'
import { decoderWorkerApi } from '../../workers/decoder.worker'
import type { Node } from '../../types/node'
import type { DecoderWorkerApi } from '../../types/decoder-worker'

function pathValues(node: Node): Array<number | string> {
  return node.path.map((segment) => {
    if (segment.type === 'index') return segment.index
    return segment.key.kind === 'primitive'
      ? String(segment.key.value)
      : segment.key.kind
  })
}

describe('decoderWorkerApi.decodeScVal', () => {
  function expectPlainCloneSafe(value: unknown): void {
    expect(structuredClone(value)).toEqual(value)

    const visit = (candidate: unknown): void => {
      expect(typeof candidate).not.toBe('function')
      if (candidate === null || typeof candidate !== 'object') {
        return
      }

      const prototype = Object.getPrototypeOf(candidate)
      expect([Object.prototype, Array.prototype, null]).toContain(prototype)

      for (const descriptor of Object.values(
        Object.getOwnPropertyDescriptors(candidate),
      )) {
        expect('value' in descriptor).toBe(true)
        visit(descriptor.value)
      }
    }

    visit(value)
  }

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

  it('should decode byte values for preference-aware previews', async () => {
    const scVal = xdr.ScVal.scvBytes(Buffer.from([72, 105]))
    const result = await decoderWorkerApi.decodeScVal({
      xdr: scVal.toXDR('base64'),
    })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result).toMatchObject({
      kind: 'primitive',
      scType: 'bytes',
      value: [72, 105],
    })
  })

  it('should preserve 0x00 and 0xff byte values through worker transport', async () => {
    const scVal = xdr.ScVal.scvBytes(new Uint8Array([0x00, 0xff, 0x42]))
    const result = await decoderWorkerApi.decodeScVal({
      xdr: scVal.toXDR('base64'),
    })

    if (isDecoderWorkerError(result)) {
      throw new Error(`Expected success, got error: ${result.message}`)
    }

    expect(result).toMatchObject({
      kind: 'primitive',
      scType: 'bytes',
      value: [0, 255, 66],
    })
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
      expectPlainCloneSafe(result)

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

    expect(() => structuredClone(result)).not.toThrow()
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
      expectPlainCloneSafe(result)
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

  it('limits oversized vectors and reports omitted children', async () => {
    const scVal = xdr.ScVal.scvVec(
      Array.from({ length: MAX_CHILDREN_DEFAULT + 1 }, (_, index) =>
        xdr.ScVal.scvU32(index),
      ),
    )
    const result = await decoderWorkerApi.decodeScVal({
      xdr: scVal.toXDR('base64'),
    })

    if (isDecoderWorkerError(result) || result.kind !== 'vec') {
      throw new Error('Expected a decoded vector')
    }

    expect(result.items).toHaveLength(MAX_CHILDREN_DEFAULT + 1)
    expect(result.childLimit).toBe(MAX_CHILDREN_DEFAULT)
    expect(result.omittedChildren).toBe(1)
    expect(result.items.at(-1)?.kind).toBe('truncated')
  })

  it('limits oversized maps and reports omitted entries', async () => {
    const scVal = xdr.ScVal.scvMap(
      Array.from(
        { length: MAX_CHILDREN_DEFAULT + 1 },
        (_, index) =>
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvU32(index),
            val: xdr.ScVal.scvU32(index),
          }),
      ),
    )
    const result = await decoderWorkerApi.decodeScVal({
      xdr: scVal.toXDR('base64'),
    })

    if (isDecoderWorkerError(result) || result.kind !== 'map') {
      throw new Error('Expected a decoded map')
    }

    expect(result.entries).toHaveLength(MAX_CHILDREN_DEFAULT + 1)
    expect(result.childLimit).toBe(MAX_CHILDREN_DEFAULT)
    expect(result.omittedChildren).toBe(1)
    expect(result.entries.at(-1)?.key.kind).toBe('truncated')
  })

  it('preserves mixed nested collections across Comlink transport', async () => {
    const channel = new MessageChannel()
    Comlink.expose(decoderWorkerApi, nodeEndpoint(channel.port1))
    channel.port1.start()
    channel.port2.start()
    const worker = Comlink.wrap<DecoderWorkerApi>(nodeEndpoint(channel.port2))

    try {
      const scVal = xdr.ScVal.scvVec([
        xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('map-child'),
            val: xdr.ScVal.scvVec([xdr.ScVal.scvU32(11), xdr.ScVal.scvU32(12)]),
          }),
        ]),
        xdr.ScVal.scvVec([
          xdr.ScVal.scvMap([
            new xdr.ScMapEntry({
              key: xdr.ScVal.scvSymbol('vector-child'),
              val: xdr.ScVal.scvU32(21),
            }),
            new xdr.ScMapEntry({
              key: xdr.ScVal.scvSymbol('second-child'),
              val: xdr.ScVal.scvU32(22),
            }),
          ]),
        ]),
      ])
      const result = await worker.decodeScVal({
        xdr: scVal.toXDR('base64'),
      })

      if (isDecoderWorkerError(result) || !isVec(result)) {
        throw new Error('Expected a decoded root vector')
      }

      const mapValue = result.items[0]
      const vectorValue = result.items[1]
      if (!isMap(mapValue) || !isVec(vectorValue)) {
        throw new Error('Expected map and vector root children')
      }
      expect(mapValue.entries).toHaveLength(1)
      expect(mapValue.entries[0]?.key).toMatchObject({
        kind: 'primitive',
        value: 'map-child',
      })

      const mapChildVector = mapValue.entries[0].value
      if (!isVec(mapChildVector)) {
        throw new Error('Expected map value to contain a vector')
      }
      expect(
        mapChildVector.items.map((node) =>
          node.kind === 'primitive' ? node.value : null,
        ),
      ).toEqual([11, 12])
      expect(mapChildVector.items.map(pathValues)).toEqual([
        [0, 'map-child', 0],
        [0, 'map-child', 1],
      ])

      expect(vectorValue.items).toHaveLength(1)
      const vectorChildMap = vectorValue.items[0]
      if (!isMap(vectorChildMap)) {
        throw new Error('Expected vector value to contain a map')
      }
      expect(
        vectorChildMap.entries.map((entry) =>
          entry.key.kind === 'primitive' ? entry.key.value : null,
        ),
      ).toEqual(['vector-child', 'second-child'])
      expect(
        vectorChildMap.entries.map((entry) =>
          entry.value.kind === 'primitive' ? entry.value.value : null,
        ),
      ).toEqual([21, 22])
      expect(
        vectorChildMap.entries.map((entry) => pathValues(entry.value)),
      ).toEqual([
        [1, 0, 'vector-child'],
        [1, 0, 'second-child'],
      ])
    } finally {
      worker[Comlink.releaseProxy]()
      channel.port1.close()
      channel.port2.close()
    }
  })
})
