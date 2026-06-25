// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { extractContractspecv0 } from '../../lib/wasm/wasmExtractor'

/**
 * Helper to create a minimal valid WASM module
 * This creates just the header without sections (empty module)
 */
function createEmptyWasmModule(): Uint8Array {
  const buffer = new ArrayBuffer(8)
  const view = new Uint8Array(buffer)

  // Magic number: 0x00 0x61 0x73 0x6d
  view[0] = 0x00
  view[1] = 0x61
  view[2] = 0x73
  view[3] = 0x6d

  // Version: 1 (little-endian u32)
  view[4] = 0x01
  view[5] = 0x00
  view[6] = 0x00
  view[7] = 0x00

  return view
}

/**
 * Helper to add a custom section to a WASM module
 */
function addCustomSection(
  baseModule: Uint8Array,
  name: string,
  payload: Uint8Array,
): Uint8Array {
  // Encode LEB128 length
  function encodeLeb128(num: number): Uint8Array {
    const bytes: number[] = []
    while (true) {
      const byte = num & 0x7f
      num >>= 7
      if (num === 0) {
        bytes.push(byte)
        break
      }
      bytes.push(byte | 0x80)
    }
    return new Uint8Array(bytes)
  }

  // Encode LEB128 string
  function encodeLeb128String(str: string): Uint8Array {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(str)
    const lengthBytes = encodeLeb128(encoded.length)
    const result = new Uint8Array(lengthBytes.length + encoded.length)
    result.set(lengthBytes)
    result.set(encoded, lengthBytes.length)
    return result
  }

  const nameBytes = encodeLeb128String(name)
  const sectionPayload = new Uint8Array(nameBytes.length + payload.length)
  sectionPayload.set(nameBytes)
  sectionPayload.set(payload, nameBytes.length)

  const sectionSize = encodeLeb128(sectionPayload.length)

  // Custom section has ID 0
  const customSection = new Uint8Array(
    1 + sectionSize.length + sectionPayload.length,
  )
  customSection[0] = 0 // Section ID
  let offset = 1
  customSection.set(sectionSize, offset)
  offset += sectionSize.length
  customSection.set(sectionPayload, offset)

  const result = new Uint8Array(baseModule.length + customSection.length)
  result.set(baseModule)
  result.set(customSection, baseModule.length)

  return result
}

describe('wasmExtractor - extractContractspecv0', () => {
  describe('valid WASM modules', () => {
    it('should extract contractspecv0 section from valid WASM module', () => {
      const baseModule = createEmptyWasmModule()
      const payload = new TextEncoder().encode('test payload data')
      const wasmWithSection = addCustomSection(baseModule, 'contractspecv0', payload)

      const result = extractContractspecv0(wasmWithSection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload).toEqual(payload)
      }
    })

    it('should extract empty contractspecv0 payload', () => {
      const baseModule = createEmptyWasmModule()
      const emptyPayload = new Uint8Array(0)
      const wasmWithSection = addCustomSection(baseModule, 'contractspecv0', emptyPayload)

      const result = extractContractspecv0(wasmWithSection)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload.length).toBe(0)
      }
    })

    it('should extract contractspecv0 from module with multiple custom sections', () => {
      let wasm = createEmptyWasmModule()
      wasm = addCustomSection(wasm, 'other-section', new TextEncoder().encode('other'))
      const payload = new TextEncoder().encode('contract spec content')
      wasm = addCustomSection(wasm, 'contractspecv0', payload)
      wasm = addCustomSection(wasm, 'another-section', new TextEncoder().encode('more data'))

      const result = extractContractspecv0(wasm)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload).toEqual(payload)
      }
    })

    it('should handle large contractspecv0 payload', () => {
      const baseModule = createEmptyWasmModule()
      const largePayload = new Uint8Array(10000)
      for (let i = 0; i < largePayload.length; i++) {
        largePayload[i] = i % 256
      }
      const wasm = addCustomSection(baseModule, 'contractspecv0', largePayload)

      const result = extractContractspecv0(wasm)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload).toEqual(largePayload)
      }
    })
  })

  describe('WASM without contractspecv0', () => {
    it('should fail gracefully when contractspecv0 section is not present', () => {
      const baseModule = createEmptyWasmModule()
      const wasm = addCustomSection(baseModule, 'other-section', new TextEncoder().encode('data'))

      const result = extractContractspecv0(wasm)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('contractspecv0 section not found')
      }
    })

    it('should fail gracefully for empty WASM module', () => {
      const baseModule = createEmptyWasmModule()

      const result = extractContractspecv0(baseModule)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('contractspecv0 section not found')
      }
    })
  })

  describe('invalid inputs', () => {
    it('should reject non-Uint8Array input', () => {
      const result1 = extractContractspecv0('not bytes')
      expect(result1.ok).toBe(false)
      if (!result1.ok) {
        expect(result1.reason).toContain('Uint8Array')
      }

      const result2 = extractContractspecv0([1, 2, 3])
      expect(result2.ok).toBe(false)

      const result3 = extractContractspecv0(null)
      expect(result3.ok).toBe(false)

      const result4 = extractContractspecv0(undefined)
      expect(result4.ok).toBe(false)
    })

    it('should reject WASM module that is too small', () => {
      const tooSmall = new Uint8Array([0x00, 0x61, 0x73])

      const result = extractContractspecv0(tooSmall)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('too small')
      }
    })

    it('should reject invalid WASM magic number', () => {
      const invalidMagic = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, // Wrong magic
        0x01, 0x00, 0x00, 0x00, // Valid version
      ])

      const result = extractContractspecv0(invalidMagic)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('magic')
      }
    })

    it('should reject WASM with unsupported version', () => {
      const wrongVersion = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, // Valid magic
        0x02, 0x00, 0x00, 0x00, // Version 2 (not 1)
      ])

      const result = extractContractspecv0(wrongVersion)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('version')
      }
    })

    it('should handle corrupted section size', () => {
      const baseModule = createEmptyWasmModule()
      const corrupted = new Uint8Array(baseModule.length + 10)
      corrupted.set(baseModule)
      // Add section header with invalid LEB128 size encoding
      corrupted[8] = 0 // Section ID
      corrupted[9] = 0xff // Invalid continuation byte without proper encoding
      corrupted[10] = 0xff
      corrupted[11] = 0xff
      corrupted[12] = 0xff
      corrupted[13] = 0xff // LEB128 overflow

      const result = extractContractspecv0(corrupted)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('section size')
      }
    })

    it('should handle section size exceeding module length', () => {
      // Manually construct a corrupted module with section size larger than available data
      const corrupted = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, // Magic
        0x01, 0x00, 0x00, 0x00, // Version
        0x00, // Custom section ID
        0xff, 0xff, 0xff, 0xff, // Large size (LEB128 overflow)
      ])

      const result = extractContractspecv0(corrupted)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        // The LEB128 decoder will detect this as overflow/invalid
        expect(result.reason).toContain('section')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle contractspecv0 as first section', () => {
      const baseModule = createEmptyWasmModule()
      const payload = new TextEncoder().encode('first section')
      const wasm = addCustomSection(baseModule, 'contractspecv0', payload)

      const result = extractContractspecv0(wasm)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload).toEqual(payload)
      }
    })

    it('should handle contractspecv0 as last section', () => {
      let wasm = createEmptyWasmModule()
      wasm = addCustomSection(wasm, 'first', new TextEncoder().encode('first data'))
      const payload = new TextEncoder().encode('last section')
      wasm = addCustomSection(wasm, 'contractspecv0', payload)

      const result = extractContractspecv0(wasm)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload).toEqual(payload)
      }
    })

    it('should not crash with maximum safe integer payload', () => {
      const baseModule = createEmptyWasmModule()
      // Create a reasonably large payload (1MB)
      const largePayload = new Uint8Array(1024 * 1024)
      const wasm = addCustomSection(baseModule, 'contractspecv0', largePayload)

      const result = extractContractspecv0(wasm)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.payload.length).toBe(1024 * 1024)
      }
    })
  })
})
