import { describe, expect, it } from 'vitest'
import { encodeDecodeRequest } from '../../workers/decoder/encodeDecodeRequest'

describe('encodeDecodeRequest', () => {
  describe('happy path', () => {
    it('should encode valid request with only xdr', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==' }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ=="}')
    })

    it('should encode valid request with xdr and options', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==', options: { maxDepth: 10 } }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":10}}')
    })

    it('should encode valid request with empty options', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==', options: {} }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ==","options":{}}')
    })
  })

  describe('invalid input', () => {
    it('should reject empty xdr string', () => {
      // Arrange
      const input = { xdr: '' }

      // Act & Assert
      expect(() => encodeDecodeRequest(input)).toThrow('xdr cannot be empty')
    })

    it('should reject whitespace-only xdr string', () => {
      // Arrange
      const input = { xdr: '   ' }

      // Act & Assert
      expect(() => encodeDecodeRequest(input)).toThrow('xdr cannot be empty')
    })

    it('should reject null xdr', () => {
      // Arrange
      const input = { xdr: null as any }

      // Act & Assert
      expect(() => encodeDecodeRequest(input)).toThrow('xdr cannot be empty')
    })

    it('should reject undefined xdr', () => {
      // Arrange
      const input = { xdr: undefined as any }

      // Act & Assert
      expect(() => encodeDecodeRequest(input)).toThrow('xdr cannot be empty')
    })
  })

  describe('edge cases', () => {
    it('should clamp maxDepth below minimum to 1', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==', options: { maxDepth: 0 } }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":1}}')
    })

    it('should clamp negative maxDepth to 1', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==', options: { maxDepth: -5 } }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":1}}')
    })

    it('should clamp maxDepth above maximum to 1000', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==', options: { maxDepth: 2000 } }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":1000}}')
    })

    it('should preserve maxDepth within valid range', () => {
      // Arrange
      const input = { xdr: 'AAAAAQ==', options: { maxDepth: 500 } }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":500}}')
    })

    it('should handle boundary values exactly', () => {
      // Arrange
      const input1 = { xdr: 'AAAAAQ==', options: { maxDepth: 1 } }
      const input2 = { xdr: 'AAAAAQ==', options: { maxDepth: 1000 } }

      // Act
      const result1 = encodeDecodeRequest(input1)
      const result2 = encodeDecodeRequest(input2)

      // Assert
      expect(result1).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":1}}')
      expect(result2).toBe('{"xdr":"AAAAAQ==","options":{"maxDepth":1000}}')
    })

    it('should handle complex xdr strings', () => {
      // Arrange
      const input = { xdr: 'AAAAAAABAAAADwAAAAAAAQAAAAAAAAAAAAAAAgAAAAAAAAA=' }

      // Act
      const result = encodeDecodeRequest(input)

      // Assert
      expect(result).toBe(
        '{"xdr":"AAAAAAABAAAADwAAAAAAAQAAAAAAAAAAAAAAAgAAAAAAAAA="}',
      )
    })
  })
})
