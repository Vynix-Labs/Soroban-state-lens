// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPersistedPreferences,
  isValidBigIntDisplayMode,
  isValidByteDisplayMode,
  mergePreferences,
  validateDisplayPreferences,
} from '../../store/persistence'
import {
  BigIntDisplayMode,
  ByteDisplayMode,
  DEFAULT_PREFERENCES,
} from '../../store/types'

// Simple localStorage mock
const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Mock window and localStorage globally
Object.defineProperty(global, 'window', { value: global, writable: true })
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Display Preferences Validation', () => {
  beforeEach(() => {
    clearPersistedPreferences()
    vi.clearAllMocks()
  })

  describe('isValidByteDisplayMode', () => {
    it('should accept valid byte display modes', () => {
      expect(isValidByteDisplayMode(ByteDisplayMode.HEX)).toBe(true)
      expect(isValidByteDisplayMode(ByteDisplayMode.BASE64)).toBe(true)
      expect(isValidByteDisplayMode(ByteDisplayMode.UTF8)).toBe(true)
    })

    it('should accept string enum values', () => {
      expect(isValidByteDisplayMode('hex')).toBe(true)
      expect(isValidByteDisplayMode('base64')).toBe(true)
      expect(isValidByteDisplayMode('utf8')).toBe(true)
    })

    it('should reject invalid values', () => {
      expect(isValidByteDisplayMode('invalid')).toBe(false)
      expect(isValidByteDisplayMode('HEX')).toBe(false)
      expect(isValidByteDisplayMode(null)).toBe(false)
      expect(isValidByteDisplayMode(undefined)).toBe(false)
      expect(isValidByteDisplayMode(123)).toBe(false)
      expect(isValidByteDisplayMode({})).toBe(false)
    })
  })

  describe('isValidBigIntDisplayMode', () => {
    it('should accept valid big int display modes', () => {
      expect(isValidBigIntDisplayMode(BigIntDisplayMode.DECIMAL)).toBe(true)
      expect(isValidBigIntDisplayMode(BigIntDisplayMode.HEX)).toBe(true)
      expect(isValidBigIntDisplayMode(BigIntDisplayMode.SCIENTIFIC)).toBe(true)
    })

    it('should accept string enum values', () => {
      expect(isValidBigIntDisplayMode('decimal')).toBe(true)
      expect(isValidBigIntDisplayMode('hex')).toBe(true)
      expect(isValidBigIntDisplayMode('scientific')).toBe(true)
    })

    it('should reject invalid values', () => {
      expect(isValidBigIntDisplayMode('invalid')).toBe(false)
      expect(isValidBigIntDisplayMode('DECIMAL')).toBe(false)
      expect(isValidBigIntDisplayMode(null)).toBe(false)
      expect(isValidBigIntDisplayMode(undefined)).toBe(false)
      expect(isValidBigIntDisplayMode(123)).toBe(false)
      expect(isValidBigIntDisplayMode({})).toBe(false)
    })
  })

  describe('validateDisplayPreferences', () => {
    it('should return valid preferences unchanged', () => {
      const validPreferences = {
        byteDisplayMode: ByteDisplayMode.HEX,
        bigIntDisplayMode: BigIntDisplayMode.DECIMAL,
      }
      const result = validateDisplayPreferences(validPreferences)
      expect(result).toEqual(validPreferences)
    })

    it('should fallback to defaults for null input', () => {
      const result = validateDisplayPreferences(null)
      expect(result).toEqual(DEFAULT_PREFERENCES)
    })

    it('should fallback to defaults for undefined input', () => {
      const result = validateDisplayPreferences(undefined)
      expect(result).toEqual(DEFAULT_PREFERENCES)
    })

    it('should fallback to defaults for non-object input', () => {
      expect(validateDisplayPreferences('string')).toEqual(DEFAULT_PREFERENCES)
      expect(validateDisplayPreferences(123)).toEqual(DEFAULT_PREFERENCES)
      expect(validateDisplayPreferences([])).toEqual(DEFAULT_PREFERENCES)
    })

    it('should correct invalid byte display mode', () => {
      const invalidPreferences = {
        byteDisplayMode: 'invalid',
        bigIntDisplayMode: BigIntDisplayMode.DECIMAL,
      }
      const result = validateDisplayPreferences(invalidPreferences)
      expect(result.byteDisplayMode).toBe(DEFAULT_PREFERENCES.byteDisplayMode)
      expect(result.bigIntDisplayMode).toBe(BigIntDisplayMode.DECIMAL)
    })

    it('should correct invalid big int display mode', () => {
      const invalidPreferences = {
        byteDisplayMode: ByteDisplayMode.HEX,
        bigIntDisplayMode: 'INVALID',
      }
      const result = validateDisplayPreferences(invalidPreferences)
      expect(result.byteDisplayMode).toBe(ByteDisplayMode.HEX)
      expect(result.bigIntDisplayMode).toBe(DEFAULT_PREFERENCES.bigIntDisplayMode)
    })

    it('should correct both invalid modes', () => {
      const invalidPreferences = {
        byteDisplayMode: 'wrong',
        bigIntDisplayMode: 'also-wrong',
      }
      const result = validateDisplayPreferences(invalidPreferences)
      expect(result).toEqual(DEFAULT_PREFERENCES)
    })

    it('should handle missing fields by applying defaults', () => {
      const partialPreferences = {
        byteDisplayMode: ByteDisplayMode.BASE64,
      }
      const result = validateDisplayPreferences(partialPreferences)
      expect(result.byteDisplayMode).toBe(ByteDisplayMode.BASE64)
      expect(result.bigIntDisplayMode).toBe(DEFAULT_PREFERENCES.bigIntDisplayMode)
    })

    it('should handle extra unknown fields gracefully', () => {
      const extraFields = {
        byteDisplayMode: ByteDisplayMode.HEX,
        bigIntDisplayMode: BigIntDisplayMode.HEX,
        unknownField: 'should be ignored',
        anotherField: 123,
      }
      const result = validateDisplayPreferences(extraFields)
      expect(result).toEqual({
        byteDisplayMode: ByteDisplayMode.HEX,
        bigIntDisplayMode: BigIntDisplayMode.HEX,
      })
    })
  })

  describe('mergePreferences', () => {
    it('should restore valid persisted preferences', () => {
      const persistedState = {
        preferences: {
          byteDisplayMode: ByteDisplayMode.BASE64,
          bigIntDisplayMode: BigIntDisplayMode.HEX,
        },
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(persistedState, currentState)
      expect(result.preferences).toEqual(persistedState.preferences)
    })

    it('should fallback to current state for invalid persisted preferences', () => {
      const persistedState = {
        preferences: {
          byteDisplayMode: 'invalid-mode',
          bigIntDisplayMode: 'another-invalid',
        },
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(persistedState, currentState)
      expect(result.preferences).toEqual(DEFAULT_PREFERENCES)
    })

    it('should correct individual invalid preference fields', () => {
      const persistedState = {
        preferences: {
          byteDisplayMode: ByteDisplayMode.UTF8,
          bigIntDisplayMode: 'INVALID',
        },
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(persistedState, currentState)
      expect(result.preferences.byteDisplayMode).toBe(ByteDisplayMode.UTF8)
      expect(result.preferences.bigIntDisplayMode).toBe(
        DEFAULT_PREFERENCES.bigIntDisplayMode,
      )
    })

    it('should fallback for null persisted state', () => {
      const persistedState = null
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(persistedState, currentState)
      expect(result).toEqual(currentState)
    })

    it('should fallback for missing preferences in persisted state', () => {
      const persistedState = {
        someOtherField: 'value',
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(persistedState, currentState)
      expect(result).toEqual(currentState)
    })

    it('should handle empty persisted preferences object', () => {
      const persistedState = {
        preferences: {},
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(persistedState, currentState)
      expect(result.preferences).toEqual(DEFAULT_PREFERENCES)
    })

    it('should log warning for corrupted preferences', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      const persistedState = {
        preferences: {
          byteDisplayMode: 'corrupted',
          bigIntDisplayMode: BigIntDisplayMode.DECIMAL,
        },
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      mergePreferences(persistedState, currentState)
      expect(warnSpy).toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid values'),
        expect.any(Object),
      )
      warnSpy.mockRestore()
    })
  })

  describe('clearPersistedPreferences', () => {
    it('should remove preferences from localStorage', () => {
      clearPersistedPreferences()
      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      const removeItemError = vi.fn(() => {
        throw new Error('localStorage error')
      })
      localStorageMock.removeItem = removeItemError

      // Should not throw
      expect(() => clearPersistedPreferences()).not.toThrow()
    })
  })

  describe('Hydration integration', () => {
    it('should handle complex corruption scenario', () => {
      const corruptedState = {
        preferences: {
          byteDisplayMode: 'INVALID_MODE_12345',
          bigIntDisplayMode: null,
          someInvalidField: { nested: 'object' },
        },
      }
      const currentState = {
        preferences: {
          byteDisplayMode: ByteDisplayMode.HEX,
          bigIntDisplayMode: BigIntDisplayMode.SCIENTIFIC,
        },
      }
      const result = mergePreferences(corruptedState, currentState)

      // Should use defaults for invalid byte mode
      expect(result.preferences.byteDisplayMode).toBe(
        DEFAULT_PREFERENCES.byteDisplayMode,
      )
      // Should use defaults for invalid big int mode (null)
      expect(result.preferences.bigIntDisplayMode).toBe(
        DEFAULT_PREFERENCES.bigIntDisplayMode,
      )
    })

    it('should preserve valid preferences even if one field is corrupted', () => {
      const partiallyCorruptedState = {
        preferences: {
          byteDisplayMode: ByteDisplayMode.BASE64, // Valid
          bigIntDisplayMode: undefined, // Invalid
        },
      }
      const currentState = {
        preferences: DEFAULT_PREFERENCES,
      }
      const result = mergePreferences(partiallyCorruptedState, currentState)

      expect(result.preferences.byteDisplayMode).toBe(ByteDisplayMode.BASE64)
      expect(result.preferences.bigIntDisplayMode).toBe(
        DEFAULT_PREFERENCES.bigIntDisplayMode,
      )
    })
  })
})
