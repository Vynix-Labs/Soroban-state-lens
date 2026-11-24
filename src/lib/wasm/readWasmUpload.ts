export const MAX_WASM_UPLOAD_BYTES = 8 * 1024 * 1024

export type WasmUploadResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'TOO_LARGE' | 'INVALID_WASM' | 'READ_FAILED' }

/** Read a bounded WASM file without compiling or instantiating it. */
export async function readWasmUpload(
  file: Pick<File, 'size' | 'arrayBuffer'>,
): Promise<WasmUploadResult> {
  if (file.size > MAX_WASM_UPLOAD_BYTES)
    return { ok: false, reason: 'TOO_LARGE' }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.length > MAX_WASM_UPLOAD_BYTES)
      return { ok: false, reason: 'TOO_LARGE' }
    if (
      bytes.length < 8 ||
      bytes[0] !== 0 ||
      bytes[1] !== 97 ||
      bytes[2] !== 115 ||
      bytes[3] !== 109 ||
      bytes[4] !== 1 ||
      bytes[5] !== 0 ||
      bytes[6] !== 0 ||
      bytes[7] !== 0
    ) {
      return { ok: false, reason: 'INVALID_WASM' }
    }
    return { ok: true, bytes }
  } catch {
    return { ok: false, reason: 'READ_FAILED' }
  }
}
