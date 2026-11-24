import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import {
  decodeLedgerKeyInfo,
  extractContractValueXdr,
} from '../../lib/network/decodeLedgerEntry'
import { DEMO_CONTRACT_DATA } from '../../lib/demo/demoContractData'
import {
  DEMO_COUNTER_NEXT_VALUE,
  createDemoLedgerEntries,
} from '../../lib/demo/demoLedgerEntries'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { isDecoderWorkerError } from '../../types/decoder-worker'
import { decoderWorkerApi } from '../../workers/decoder.worker'

describe('demo contract data fixtures', () => {
  it('decodes the counter fixture from valid ledger XDR', async () => {
    const counter = DEMO_CONTRACT_DATA[0]

    expect(xdr.LedgerKey.fromXDR(counter.keyXdr, 'base64').switch().name).toBe(
      'contractData',
    )
    expect(
      xdr.LedgerEntryData.fromXDR(counter.entryXdr, 'base64').switch().name,
    ).toBe('contractData')

    const extracted = extractContractValueXdr(counter.entryXdr)
    expect(extracted).toEqual({ supported: true, valueXdr: counter.valueXdr })
    if (!extracted.supported) throw new Error('Counter XDR was not extracted')

    const result = await decoderWorkerApi.decodeScVal({
      xdr: extracted.valueXdr,
    })
    if (isDecoderWorkerError(result) || result.kind !== 'primitive') {
      throw new Error('Counter fixture did not decode as a primitive')
    }

    expect(result).toMatchObject({ scType: 'u32', value: 42 })
  })

  it('decodes values 7 and 9 from the nested collection fixture', async () => {
    const nested = DEMO_CONTRACT_DATA[1]

    expect(xdr.LedgerKey.fromXDR(nested.keyXdr, 'base64').switch().name).toBe(
      'contractData',
    )
    expect(
      xdr.LedgerEntryData.fromXDR(nested.entryXdr, 'base64').switch().name,
    ).toBe('contractData')

    const extracted = extractContractValueXdr(nested.entryXdr)
    expect(extracted).toEqual({ supported: true, valueXdr: nested.valueXdr })
    if (!extracted.supported) throw new Error('Nested XDR was not extracted')

    const result = await decoderWorkerApi.decodeScVal({
      xdr: extracted.valueXdr,
    })
    if (isDecoderWorkerError(result) || result.kind !== 'vec') {
      throw new Error('Nested fixture did not decode as a vector')
    }

    expect(result.items[0]).toMatchObject({
      kind: 'primitive',
      scType: 'u32',
      value: 7,
    })
    const child = result.items[1]
    if (child.kind !== 'vec') {
      throw new Error('Nested fixture child did not decode as a vector')
    }
    expect(child.items[0]).toMatchObject({
      kind: 'primitive',
      scType: 'u32',
      value: 9,
    })
  })

  it('builds sample-contract entries that match the decoded fixtures', async () => {
    const entries = createDemoLedgerEntries()
    const advancedEntries = createDemoLedgerEntries(DEMO_COUNTER_NEXT_VALUE)

    expect(entries).toHaveLength(2)
    for (const entry of entries) {
      expect(entry.contractId).toBe(SAMPLE_CONTRACT_ID)
      expect(entry.type).toBe('ContractData')
    }

    const counter = entries.find((entry) => entry.displayName === 'counter')
    const nested = entries.find(
      (entry) => entry.displayName === 'nested-collection',
    )
    const advancedCounter = advancedEntries.find(
      (entry) => entry.displayName === 'counter',
    )
    if (!counter || !nested || !advancedCounter) {
      throw new Error('Demo entries are missing expected records')
    }

    expect(decodeLedgerKeyInfo(counter.canonicalKey!).contractId).toBe(
      SAMPLE_CONTRACT_ID,
    )
    expect(counter.value).toEqual(
      await decoderWorkerApi.decodeScVal({
        xdr: DEMO_CONTRACT_DATA[0].valueXdr,
      }),
    )
    expect(nested.value).toEqual(
      await decoderWorkerApi.decodeScVal({
        xdr: DEMO_CONTRACT_DATA[1].valueXdr,
      }),
    )
    expect(advancedCounter.value).toEqual(
      await decoderWorkerApi.decodeScVal({
        xdr: xdr.ScVal.scvU32(DEMO_COUNTER_NEXT_VALUE).toXDR('base64'),
      }),
    )
  })
})
