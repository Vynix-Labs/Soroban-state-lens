import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { xdr } from '@stellar/stellar-sdk'
import { InspectorEnum } from '../../components/explorer/InspectorEnum'
import { resetStore, useLensStore } from '../../store/lensStore'
import { parseContractSpec } from '../../lib/spec/parseContractSpec'
import { createEnumSpecEntry } from '../helpers/contractSpecFixtures'
import type { LedgerEntry } from '../../store/types'
import type { PrimitiveNode } from '../../types/node'

const numeric = (value: number): PrimitiveNode => ({
  kind: 'primitive',
  path: [],
  scType: 'u32',
  value,
  raw: { switch: 'ScvU32', value },
})
const entry = (value: number): LedgerEntry => ({
  key: 'root',
  contractId: 'C123',
  type: 'ContractData',
  value: numeric(value),
  lastModifiedLedger: 1,
})
function loadSpec(contractId = 'C123') {
  const parsed = parseContractSpec(
    new Uint8Array(createEnumSpecEntry().toXDR()),
  )
  if (!parsed.ok) throw new Error(parsed.reason)
  useLensStore.getState().setContractSpec(contractId, parsed.spec)
}

describe('Inspector explicit enum interpretation', () => {
  beforeEach(() => {
    resetStore()
    loadSpec()
  })
  afterEach(cleanup)
  it('adds a parsed case label only after selection and keeps an unknown discriminant visible', () => {
    const network = useLensStore.getState().networkConfig
    const ledger = useLensStore.getState().ledgerData
    const { rerender } = render(
      <InspectorEnum contractId="C123" keyPath="root" entry={entry(1)} />,
    )
    expect(screen.queryByText('Color.GREEN')).toBeNull()
    fireEvent.change(screen.getByLabelText('Choose an enum for this value'), {
      target: { value: 'Color' },
    })
    expect(screen.getByRole('status').textContent).toBe('Color.GREEN')
    rerender(
      <InspectorEnum contractId="C123" keyPath="root" entry={entry(99)} />,
    )
    expect(screen.getByRole('status').textContent).toContain(
      'Unknown Color case (99)',
    )
    expect(screen.getByText('99')).toBeTruthy()
    expect(useLensStore.getState().networkConfig).toBe(network)
    expect(useLensStore.getState().ledgerData).toBe(ledger)
    fireEvent.change(screen.getByLabelText('Choose an enum for this value'), {
      target: { value: '' },
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('resolves the selected enum when two enums share a discriminant', () => {
    const second = xdr.ScSpecEntry.scSpecEntryUdtEnumV0(
      new xdr.ScSpecUdtEnumV0({
        doc: '',
        lib: '',
        name: 'State',
        cases: [
          new xdr.ScSpecUdtEnumCaseV0({ doc: '', name: 'READY', value: 1 }),
        ],
      }),
    )
    const bytes = new Uint8Array([
      ...createEnumSpecEntry().toXDR(),
      ...second.toXDR(),
    ])
    const parsed = parseContractSpec(bytes)
    if (!parsed.ok) throw new Error(parsed.reason)
    useLensStore.getState().setContractSpec('C123', parsed.spec)
    render(<InspectorEnum contractId="C123" keyPath="root" entry={entry(1)} />)
    fireEvent.change(screen.getByLabelText('Choose an enum for this value'), {
      target: { value: 'State' },
    })
    expect(screen.getByRole('status').textContent).toBe('State.READY')
  })
  it('drops the label across keys, contracts, networks, and replaced specs', () => {
    const { rerender } = render(
      <InspectorEnum contractId="C123" keyPath="root" entry={entry(1)} />,
    )
    const choose = () =>
      fireEvent.change(screen.getByLabelText('Choose an enum for this value'), {
        target: { value: 'Color' },
      })
    choose()
    rerender(
      <InspectorEnum
        contractId="C123"
        keyPath="other"
        entry={{ ...entry(1), key: 'other' }}
      />,
    )
    expect(screen.queryByRole('status')).toBeNull()
    choose()
    act(() => loadSpec('OTHER'))
    rerender(
      <InspectorEnum
        contractId="OTHER"
        keyPath="other"
        entry={{ ...entry(1), contractId: 'OTHER', key: 'other' }}
      />,
    )
    expect(screen.queryByRole('status')).toBeNull()
    choose()
    act(() => loadSpec('OTHER'))
    expect(screen.queryByRole('status')).toBeNull()
    choose()
    act(() => {
      useLensStore.getState().setNetworkConfig({ networkId: 'other-network' })
      loadSpec('OTHER')
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('resolves nested numeric paths and hides enum choices for incompatible data', () => {
    const nested: LedgerEntry = {
      ...entry(1),
      value: {
        kind: 'vec',
        path: [],
        raw: { switch: 'ScvVec' },
        items: [numeric(1)],
      },
    }
    const { rerender } = render(
      <InspectorEnum contractId="C123" keyPath="root.item-0" entry={nested} />,
    )
    fireEvent.change(screen.getByLabelText('Choose an enum for this value'), {
      target: { value: 'Color' },
    })
    expect(screen.getByRole('status').textContent).toBe('Color.GREEN')
    rerender(<InspectorEnum contractId="C123" keyPath="root" entry={nested} />)
    expect(screen.queryByRole('region')).toBeNull()
  })
})
