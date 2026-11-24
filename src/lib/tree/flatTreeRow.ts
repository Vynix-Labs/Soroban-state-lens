import type { Node } from '../../types/node'
import type { LedgerEntry } from '../../store/types'

export type FlatTreeRowKind = Node['kind']

export interface FlatTreeRow {
  id: string
  parentId: string | null
  depth: number
  keyPath: string
  label: string
  kind: FlatTreeRowKind
  hasChildren: boolean
  childCount: number
  canonicalKey?: string
  durability?: LedgerEntry['durability']
  ledgerType?: LedgerEntry['type']
  node: Node
  expired?: boolean
}

export interface FlattenTreeRoot {
  id: string
  label: string
  canonicalKey?: string
  durability?: LedgerEntry['durability']
  ledgerType?: LedgerEntry['type']
  node: Node
  expired?: boolean
}
