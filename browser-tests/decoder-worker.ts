import { xdr } from '@stellar/stellar-sdk'
import { isDecoderWorkerError } from '../src/types/decoder-worker'
import {
  createDecoderWorker,
  terminateDecoderWorker,
} from '../src/workers/createDecoderWorker'

const vectorXdr = 'AAAAEAAAAAEAAAACAAAAAwAAAAcAAAADAAAACQ=='
const mapXdr = 'AAAAEQAAAAEAAAABAAAADwAAAAVjaGlsZAAAAAAAAAMAAAAH'
const resultElement = document.querySelector<HTMLPreElement>('#result')

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function runRegression(): Promise<void> {
  if (!resultElement) {
    throw new Error('Missing browser regression result element')
  }

  const worker = createDecoderWorker()
  try {
    const vector = await worker.decodeScVal({ xdr: vectorXdr })
    assert(
      !isDecoderWorkerError(vector),
      'Vector decode returned a worker error',
    )
    assert(vector.kind === 'vec', 'Vector decode did not return a vec node')
    assert(vector.items.length === 2, 'Vector did not retain both children')
    assert(
      vector.items[0].kind === 'primitive' &&
        vector.items[0].scType === 'u32' &&
        vector.items[0].value === 7 &&
        vector.items[1].kind === 'primitive' &&
        vector.items[1].scType === 'u32' &&
        vector.items[1].value === 9,
      'Vector children were not received as ordered primitive values',
    )

    const map = await worker.decodeScVal({ xdr: mapXdr })
    assert(!isDecoderWorkerError(map), 'Map decode returned a worker error')
    assert(map.kind === 'map', 'Map decode did not return a map node')
    assert(map.entries.length === 1, 'Map did not retain its child entry')
    const [entry] = map.entries
    assert(
      entry.key.kind === 'primitive' &&
        entry.key.scType === 'symbol' &&
        entry.key.value === 'child',
      'Map child key was not preserved',
    )
    assert(
      entry.value.kind === 'primitive' &&
        entry.value.scType === 'u32' &&
        entry.value.value === 7,
      'Map child value was not preserved',
    )
    assert(
      entry.value.path.length === 1 &&
        entry.value.path[0].type === 'key' &&
        entry.value.path[0].key.kind === 'primitive' &&
        entry.value.path[0].key.value === 'child',
      'Map child path was not preserved',
    )
    structuredClone(vector)
    structuredClone(map)

    // Byte regression: verify 0x00 and 0xff bytes are preserved through Comlink
    const bytesScVal = xdr.ScVal.scvBytes(new Uint8Array([0x00, 0xff, 0x42]))
    const bytesResult = await worker.decodeScVal({
      xdr: bytesScVal.toXDR('base64'),
    })
    if (isDecoderWorkerError(bytesResult)) {
      throw new Error(
        'Bytes decode returned a worker error: ' + bytesResult.message,
      )
    }
    assert(
      bytesResult.kind === 'primitive',
      'Bytes decode did not return a primitive node',
    )
    assert(
      bytesResult.scType === 'bytes',
      'Bytes decode did not return bytes type',
    )
    assert(
      Array.isArray(bytesResult.value) &&
        bytesResult.value.length === 3 &&
        bytesResult.value[0] === 0 &&
        bytesResult.value[1] === 255 &&
        bytesResult.value[2] === 66,
      'Bytes values not preserved through worker transport',
    )

    resultElement.dataset.status = 'passed'
    resultElement.textContent =
      'PASS: vector and map values crossed the real Comlink worker transport.'
  } finally {
    terminateDecoderWorker(worker)
  }
}

void runRegression().catch((error: unknown) => {
  if (resultElement) {
    resultElement.dataset.status = 'failed'
    resultElement.textContent =
      error instanceof Error ? (error.stack ?? error.message) : String(error)
  }
  throw error
})
