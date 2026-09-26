import { isValidBigIntDisplayMode, isValidByteDisplayMode } from './persistence'
import { DEFAULT_PREFERENCES } from './types'
import type { BigIntDisplayMode, ByteDisplayMode, LensStore, PreferencesSlice } from './types'

export const createPreferencesSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): PreferencesSlice => ({
  preferences: DEFAULT_PREFERENCES,

  setByteDisplayMode: (mode: ByteDisplayMode) =>
    set((state) => {
      if (!isValidByteDisplayMode(mode)) {
        return state
      }

      return {
        preferences: { ...state.preferences, byteDisplayMode: mode },
      }
    }),

  setBigIntDisplayMode: (mode: BigIntDisplayMode) =>
    set((state) => {
      if (!isValidBigIntDisplayMode(mode)) {
        return state
      }

      return {
        preferences: { ...state.preferences, bigIntDisplayMode: mode },
      }
    }),

  resetPreferences: () =>
    set(() => ({
      preferences: DEFAULT_PREFERENCES,
    })),
})
