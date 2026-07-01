/**
 * WASM module utilities for extracting custom sections
 */

/**
 * Result of attempting to extract a custom section from a WASM module
 */
export type ExtractSectionResult =
  | { ok: true; payload: Uint8Array }
  | { ok: false; reason: string }

/**
 * Decodes a LEB128-encoded unsigned integer from a Uint8Array
 * @param data - The byte array to read from
 * @param offset - The current offset in the array
 * @returns A tuple of [value, newOffset] or null if decoding fails
 */
function decodeLeb128(
  data: Uint8Array,
  offset: number,
): [number, number] | null {
  let value = 0
  let shift = 0
  let currentOffset = offset

  while (currentOffset < data.length) {
    const byte = data[currentOffset]
    currentOffset++

    value |= (byte & 0x7f) << shift

    if ((byte & 0x80) === 0) {
      return [value, currentOffset]
    }

    shift += 7
    if (shift >= 32) {
      // Prevent overflow for values that should fit in u32
      return null
    }
  }

  return null
}

/**
 * Decodes a LEB128-encoded string (length-prefixed UTF-8)
 * @param data - The byte array to read from
 * @param offset - The current offset in the array
 * @returns A tuple of [string, newOffset] or null if decoding fails
 */
function decodeLeb128String(
  data: Uint8Array,
  offset: number,
): [string, number] | null {
  const result = decodeLeb128(data, offset)
  if (!result) return null

  const [length, newOffset] = result

  if (newOffset + length > data.length) {
    return null
  }

  const bytes = data.slice(newOffset, newOffset + length)
  const str = new TextDecoder().decode(bytes)
  return [str, newOffset + length]
}

/**
 * Safely extracts the contractspecv0 custom section payload from a WASM module
 * @param wasmBytes - The WASM module bytes
 * @returns ExtractSectionResult indicating success or failure with reason
 */
export function extractContractspecv0(
  wasmBytes: unknown,
): ExtractSectionResult {
  // Validate input type
  if (!(wasmBytes instanceof Uint8Array)) {
    return {
      ok: false,
      reason: 'WASM bytes must be a Uint8Array',
    }
  }

  // Check minimum length for magic + version
  if (wasmBytes.length < 8) {
    return {
      ok: false,
      reason: 'WASM module too small (minimum 8 bytes)',
    }
  }

  // Check WASM magic number: 0x00 0x61 0x73 0x6d (\0asm)
  if (
    wasmBytes[0] !== 0x00 ||
    wasmBytes[1] !== 0x61 ||
    wasmBytes[2] !== 0x73 ||
    wasmBytes[3] !== 0x6d
  ) {
    return {
      ok: false,
      reason: 'Invalid WASM magic number',
    }
  }

  // Version is at offset 4-7 (little-endian u32), typically 1
  const version =
    wasmBytes[4] |
    (wasmBytes[5] << 8) |
    (wasmBytes[6] << 16) |
    (wasmBytes[7] << 24)
  if (version !== 1) {
    return {
      ok: false,
      reason: `Unsupported WASM version: ${version}`,
    }
  }

  // Parse sections starting after version (offset 8)
  let offset = 8

  while (offset < wasmBytes.length) {
    // Read section ID
    const sectionId = wasmBytes[offset]
    offset++

    // Read section size
    const sizeResult = decodeLeb128(wasmBytes, offset)
    if (!sizeResult) {
      return {
        ok: false,
        reason: 'Failed to decode section size',
      }
    }

    const [sectionSize, afterSizeOffset] = sizeResult
    offset = afterSizeOffset

    // Check bounds
    if (offset + sectionSize > wasmBytes.length) {
      return {
        ok: false,
        reason: 'Section size exceeds module length',
      }
    }

    // Custom sections have ID 0
    if (sectionId === 0) {
      // Parse custom section: name followed by payload
      const nameResult = decodeLeb128String(wasmBytes, offset)
      if (!nameResult) {
        return {
          ok: false,
          reason: 'Failed to decode custom section name',
        }
      }

      const [name, afterNameOffset] = nameResult

      // Check if this is the contractspecv0 section
      if (name === 'contractspecv0') {
        // Return everything after the name as the payload
        const payloadStart = afterNameOffset
        const payloadEnd = offset + sectionSize

        if (payloadStart > payloadEnd) {
          return {
            ok: false,
            reason: 'Invalid payload bounds',
          }
        }

        const payload = wasmBytes.slice(payloadStart, payloadEnd)
        return {
          ok: true,
          payload,
        }
      }
    }

    // Move to next section
    offset += sectionSize
  }

  // Section not found
  return {
    ok: false,
    reason: 'contractspecv0 section not found in module',
  }
}
