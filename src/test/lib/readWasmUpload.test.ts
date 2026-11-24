import { describe, expect, it, vi } from 'vitest'
import {
  MAX_WASM_UPLOAD_BYTES,
  readWasmUpload,
} from '../../lib/wasm/readWasmUpload'

describe('readWasmUpload', () => {
  it('reads a valid WASM header without executing bytes', async () => {
    const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])
    const result = await readWasmUpload({
      size: bytes.length,
      arrayBuffer: () => Promise.resolve(bytes.buffer),
    })
    expect(result).toEqual({ ok: true, bytes })
  })

  it('rejects oversized files before reading', async () => {
    const arrayBuffer = vi.fn()
    expect(
      await readWasmUpload({ size: MAX_WASM_UPLOAD_BYTES + 1, arrayBuffer }),
    ).toEqual({ ok: false, reason: 'TOO_LARGE' })
    expect(arrayBuffer).not.toHaveBeenCalled()
  })

  it('rejects bad magic, unsupported versions, and read errors', async () => {
    for (const bytes of [
      new Uint8Array(8),
      new Uint8Array([0, 97, 115, 109, 2, 0, 0, 0]),
    ]) {
      expect(
        await readWasmUpload({
          size: bytes.length,
          arrayBuffer: () => Promise.resolve(bytes.buffer),
        }),
      ).toEqual({ ok: false, reason: 'INVALID_WASM' })
    }
    expect(
      await readWasmUpload({
        size: 1,
        arrayBuffer: () => Promise.reject(new Error('failed')),
      }),
    ).toEqual({ ok: false, reason: 'READ_FAILED' })
  })
})
