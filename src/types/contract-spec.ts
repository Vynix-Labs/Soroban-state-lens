import type { xdr } from '@stellar/stellar-base'

export interface ContractSpecFunction {
  kind: 'function'
  name: string
  inputs: Array<xdr.ScSpecFunctionInputV0>
  outputs: Array<xdr.ScSpecTypeDef>
  wire: xdr.ScSpecFunctionV0
}

export interface ContractSpecStruct {
  kind: 'struct'
  name: string
  fields: Array<xdr.ScSpecUdtStructFieldV0>
  wire: xdr.ScSpecUdtStructV0
}

export interface ContractSpecEnum {
  kind: 'enum'
  name: string
  cases: Array<xdr.ScSpecUdtEnumCaseV0>
  wire: xdr.ScSpecUdtEnumV0
}

export interface ContractSpecErrorEnum {
  kind: 'error-enum'
  name: string
  cases: Array<xdr.ScSpecUdtErrorEnumCaseV0>
  wire: xdr.ScSpecUdtErrorEnumV0
}

export interface ContractSpecUnion {
  kind: 'union'
  name: string
  cases: Array<xdr.ScSpecUdtUnionCaseVoidV0 | xdr.ScSpecUdtUnionCaseTupleV0>
  wire: xdr.ScSpecUdtUnionV0
}

export type ContractSpecEntry =
  | ContractSpecFunction
  | ContractSpecStruct
  | ContractSpecEnum
  | ContractSpecErrorEnum
  | ContractSpecUnion

export interface ContractSpec {
  entries: Array<ContractSpecEntry>
}
