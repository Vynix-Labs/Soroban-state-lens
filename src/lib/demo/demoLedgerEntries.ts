import { SAMPLE_CONTRACT_ID } from '../demoContract'
import {
  decodeLedgerEntryMetadata,
  decodeLedgerKeyInfo,
} from '../network/decodeLedgerEntry'
import { makeLedgerEntryKey } from '../storage/makeLedgerEntryKey'
import { createDemoContractData } from './demoContractData'
import type { LedgerEntry } from '../../store/types'
import type { Node, PrimitiveNode, VecNode } from '../../types/node'

/** Symbol key of the demo counter entry inside the sample contract. */
export const DEMO_COUNTER_NAME = 'counter'

/** Value the demo counter starts at, mirrored by `DEMO_CONTRACT_DATA`. */
export const DEMO_COUNTER_INITIAL_VALUE = 42

/** Value the demo action writes, one step above the initial fixture. */
export const DEMO_COUNTER_NEXT_VALUE = 43

/**
 * Ledger sequence reported for demo entries. The local demo notice labels
 * ledger numbers as illustrative, so the fixture stays deterministic.
 */
export const DEMO_LAST_MODIFIED_LEDGER = 0

function u32Node(
  value: number,
  path: PrimitiveNode['path'] = [],
): PrimitiveNode {
  return {
    kind: 'primitive',
    path,
    scType: 'u32',
    value,
    raw: { switch: 'ScvU32', value },
  }
}

/** Mirrors the decoder output for `[7, [9]]` without touching the worker. */
function nestedCollectionNode(path: VecNode['path'] = []): VecNode {
  return {
    kind: 'vec',
    path,
    items: [
      u32Node(7, [{ type: 'index', index: 0 }]),
      {
        kind: 'vec',
        path: [{ type: 'index', index: 1 }],
        items: [
          u32Node(9, [
            { type: 'index', index: 1 },
            { type: 'index', index: 0 },
          ]),
        ],
        raw: { switch: 'ScvVec', value: [{ switch: 'ScvU32', value: 9 }] },
      },
    ],
    raw: {
      switch: 'ScvVec',
      value: [
        { switch: 'ScvU32', value: 7 },
        { switch: 'ScvVec', value: [{ switch: 'ScvU32', value: 9 }] },
      ],
    },
  }
}

/**
 * Local demo entries for the sample contract. They are ordinary store entries
 * bound to the sample contract id, so live contract ids never see them and no
 * RPC call is involved.
 */
export function createDemoLedgerEntries(
  counterValue: number = DEMO_COUNTER_INITIAL_VALUE,
): Array<LedgerEntry> {
  return createDemoContractData(SAMPLE_CONTRACT_ID, counterValue).map(
    (record) => {
      const metadata = decodeLedgerEntryMetadata({
        key: record.keyXdr,
        xdr: record.entryXdr,
      })
      const keyInfo = decodeLedgerKeyInfo(record.keyXdr)

      return {
        key: makeLedgerEntryKey(
          SAMPLE_CONTRACT_ID,
          'ContractData',
          record.keyXdr,
        ),
        contractId: SAMPLE_CONTRACT_ID,
        type: 'ContractData',
        ...(metadata.durability ? { durability: metadata.durability } : {}),
        ...(keyInfo.displayName ? { displayName: keyInfo.displayName } : {}),
        canonicalKey: record.keyXdr,
        value:
          record.name === DEMO_COUNTER_NAME
            ? u32Node(counterValue)
            : nestedCollectionNode(),
        lastModifiedLedger: DEMO_LAST_MODIFIED_LEDGER,
        rawXdr: record.entryXdr,
      } satisfies LedgerEntry
    },
  )
}

/** Map key of the demo counter entry. */
export const DEMO_COUNTER_ENTRY_KEY = createDemoLedgerEntries(
  DEMO_COUNTER_INITIAL_VALUE,
).find((entry) => entry.displayName === DEMO_COUNTER_NAME)!.key

/** Reads the decoded demo counter value from a store entry, when present. */
export function readDemoCounterValue(
  entry: LedgerEntry | undefined,
): number | null {
  const node = entry?.value as Node | undefined
  if (!node || typeof node !== 'object' || node.kind !== 'primitive') {
    return null
  }
  return node.scType === 'u32' && typeof node.value === 'number'
    ? node.value
    : null
}
