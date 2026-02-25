// Normalized representations for decoder outputs

export type PrimitiveKind = 'bool' | 'u32' | 'i32' | 'string' | 'symbol' | 'void'

export interface NormalizedPrimitive {
  kind: 'primitive'
  primitive: PrimitiveKind
  value: boolean | number | string | null
}

export interface NormalizedVec {
  kind: 'vec'
  items: NormalizedValue[]
}

export interface NormalizedMapEntry {
  key: NormalizedValue
  value: NormalizedValue
}

export interface NormalizedMap {
  kind: 'map'
  entries: NormalizedMapEntry[]
}

export type NormalizedAddressType =
  | 'account'
  | 'contract'
  | 'muxedAccount'
  | 'claimableBalance'
  | 'liquidityPool'
  | 'unknown'

export interface NormalizedAddress {
  kind: 'address'
  addressType: NormalizedAddressType
  value: string
}

export interface NormalizedTruncated {
  kind: 'truncated'
  depth?: number
}

export interface NormalizedUnsupported {
  kind: 'unsupported'
  variant: string
  rawData: unknown
}

export type NormalizedValue =
  | NormalizedPrimitive
  | NormalizedVec
  | NormalizedMap
  | NormalizedAddress
  | NormalizedTruncated
  | NormalizedUnsupported

export { NormalizedMapEntry }
