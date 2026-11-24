import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import type {
  ContractSpec,
  ContractSpecEnum,
  ContractSpecFunction,
  ContractSpecStruct,
} from '../../types/contract-spec'

const functionInput = new xdr.ScSpecFunctionInputV0({
  doc: 'Amount to transfer',
  name: 'amount',
  type: xdr.ScSpecTypeDef.scSpecTypeU32(),
})
const functionWire = new xdr.ScSpecFunctionV0({
  doc: 'Transfers tokens',
  name: 'transfer',
  inputs: [functionInput],
  outputs: [xdr.ScSpecTypeDef.scSpecTypeBool()],
})
const transferFunction = {
  kind: 'function',
  name: 'transfer',
  inputs: [functionInput],
  outputs: [xdr.ScSpecTypeDef.scSpecTypeBool()],
  wire: functionWire,
} satisfies ContractSpecFunction

const balanceField = new xdr.ScSpecUdtStructFieldV0({
  doc: 'Token balance',
  name: 'balance',
  type: xdr.ScSpecTypeDef.scSpecTypeU32(),
})
const balanceWire = new xdr.ScSpecUdtStructV0({
  doc: 'Account data',
  lib: '',
  name: 'Account',
  fields: [balanceField],
})
const accountType = {
  kind: 'struct',
  name: 'Account',
  fields: [balanceField],
  wire: balanceWire,
} satisfies ContractSpecStruct

const statusCase = new xdr.ScSpecUdtEnumCaseV0({
  doc: 'The transfer succeeded',
  name: 'success',
  value: 0,
})
const statusWire = new xdr.ScSpecUdtEnumV0({
  doc: 'Transfer result',
  lib: '',
  name: 'TransferStatus',
  cases: [statusCase],
})
const transferStatus = {
  kind: 'enum',
  name: 'TransferStatus',
  cases: [statusCase],
  wire: statusWire,
} satisfies ContractSpecEnum

const tokenContractSpec = {
  entries: [transferFunction, accountType, transferStatus],
} satisfies ContractSpec

describe('contract spec model', () => {
  it('keeps function parameters, outputs, and named fields on concrete SDK wire types', () => {
    expect(tokenContractSpec.entries).toHaveLength(3)
    expect(transferFunction.inputs[0]?.type().switch().name).toBe(
      'scSpecTypeU32',
    )
    expect(transferFunction.outputs[0]?.switch().name).toBe('scSpecTypeBool')
    expect(accountType.fields[0]?.type().switch().name).toBe('scSpecTypeU32')
    expect(transferStatus.cases[0]?.value()).toBe(0)
  })
})
