import { BigIntDisplayMode, ByteDisplayMode } from './types'
import type { LensStore, PreferencesSlice } from './types'

export const createPreferencesSlice = (
  set: (fn: (state: LensStore) => Partial<LensStore>) => void,
): PreferencesSlice => ({
  byteDisplayMode: ByteDisplayMode.HEX,
  bigIntDisplayMode: BigIntDisplayMode.RAW,

  setByteDisplayMode: (mode: ByteDisplayMode) =>
    set(() => ({ byteDisplayMode: mode })),

  setBigIntDisplayMode: (mode: BigIntDisplayMode) =>
    set(() => ({ bigIntDisplayMode: mode })),

  resetPreferences: () =>
    set(() => ({
      byteDisplayMode: ByteDisplayMode.HEX,
      bigIntDisplayMode: BigIntDisplayMode.RAW,
    })),
})
