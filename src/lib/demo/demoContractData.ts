import { Address, xdr } from '@stellar/stellar-sdk'
import { SAMPLE_CONTRACT_ID } from '../demoContract'

export interface DemoContractDataRecord {
  name: 'counter' | 'nested-collection'
  keyXdr: string
  entryXdr: string
  valueXdr: string
}

type DemoScVal = ReturnType<typeof xdr.ScVal.scvU32>
type DemoScAddress = ReturnType<typeof xdr.ScAddress.scAddressTypeContract>

/**
 * `Address.fromString` exists at runtime but is absent from the SDK's browser
 * typings, so the cast stays in this one place. The demo fixture tests assert
 * the round trip back to the requested contract id.
 */
function addressFromContractId(contractId: string): DemoScAddress {
  return (
    Address as unknown as {
      fromString: (address: string) => {
        toScAddress: () => DemoScAddress
      }
    }
  )
    .fromString(contractId)
    .toScAddress()
}
function makeNestedCollectionValue(): DemoScVal {
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvU32(7),
    xdr.ScVal.scvVec([xdr.ScVal.scvU32(9)]),
  ])
}

function makeRecord(
  name: DemoContractDataRecord['name'],
  value: DemoScVal,
  contract: DemoScAddress,
): DemoContractDataRecord {
  const key = xdr.ScVal.scvSymbol(name)
  const durability = xdr.ContractDataDurability.persistent()
  const ledgerKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({ contract, key, durability }),
  )
  const ledgerEntry = xdr.LedgerEntryData.contractData(
    new xdr.ContractDataEntry({
      ext: new xdr.ExtensionPoint(0),
      contract,
      key,
      durability,
      val: value,
    }),
  )

  return {
    name,
    keyXdr: ledgerKey.toXDR('base64'),
    entryXdr: ledgerEntry.toXDR('base64'),
    valueXdr: value.toXDR('base64'),
  }
}

/** Keep the decoder fixture bound to the sample contract used by the app. */
const FIXTURE_CONTRACT = addressFromContractId(SAMPLE_CONTRACT_ID)

export const DEMO_CONTRACT_DATA = [
  makeRecord('counter', xdr.ScVal.scvU32(42), FIXTURE_CONTRACT),
  makeRecord(
    'nested-collection',
    makeNestedCollectionValue(),
    FIXTURE_CONTRACT,
  ),
] as const satisfies ReadonlyArray<DemoContractDataRecord>

/**
 * Builds the demo ledger records for the local demo contract. The demo lives
 * entirely in local state: these records are never submitted to a network.
 */
export function createDemoContractData(
  contractId: string,
  counterValue = 42,
): Array<DemoContractDataRecord> {
  if (!Number.isInteger(counterValue) || counterValue < 0) {
    throw new Error('Demo counter value must be a non-negative integer')
  }

  const contract = addressFromContractId(contractId)
  return [
    makeRecord('counter', xdr.ScVal.scvU32(counterValue), contract),
    makeRecord('nested-collection', makeNestedCollectionValue(), contract),
  ]
}
