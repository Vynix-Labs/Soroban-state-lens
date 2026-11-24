import { Address, xdr } from '@stellar/stellar-sdk'
import { SAMPLE_CONTRACT_ID } from '../demoContract'

export interface DemoContractDataRecord {
  name: 'counter' | 'nested-collection'
  keyXdr: string
  entryXdr: string
  valueXdr: string
}

const contract = new Address(SAMPLE_CONTRACT_ID).toScAddress()

function makeRecord(
  name: DemoContractDataRecord['name'],
  value: ReturnType<typeof xdr.ScVal.scvU32>,
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

export const DEMO_CONTRACT_DATA = [
  makeRecord('counter', xdr.ScVal.scvU32(42)),
  makeRecord(
    'nested-collection',
    xdr.ScVal.scvVec([
      xdr.ScVal.scvU32(7),
      xdr.ScVal.scvVec([xdr.ScVal.scvU32(9)]),
    ]),
  ),
] as const satisfies ReadonlyArray<DemoContractDataRecord>
