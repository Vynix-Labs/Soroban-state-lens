import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it, vi } from 'vitest'

import { InspectShell } from '../../components/explorer/InspectShell'
import { createDemoLedgerEntries } from '../../lib/demo/demoLedgerEntries'
import { parseContractSpec } from '../../lib/spec/parseContractSpec'
import { extractContractspecv0 } from '../../lib/wasm/wasmExtractor'
import { createContractSpecWasm } from '../helpers/contractSpecFixtures'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { useLensStore } from '../../store/lensStore'
import { contractSpecKey } from '../../store/contractSpecSlice'
import type { ContractSpec } from '../../types/contract-spec'

vi.mock('@stellar/design-system', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children, ...props }: React.ComponentProps<'h1'>) => (
    <h1 {...props}>{children}</h1>
  ),
  IconButton: ({
    altText,
    onClick,
    ...props
  }: React.ComponentProps<'button'> & { altText?: string }) => (
    <button aria-label={altText} onClick={onClick} {...props} />
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}))

describe('InspectShell', () => {
  const storedEntry = {
    key: '/state/ledger',
    contractId: 'C123',
    type: 'ContractData' as const,
    durability: 'Persistent' as const,
    value: null,
    lastModifiedLedger: 1234567,
    expirationLedger: 1235000,
    rawXdr: 'known-entry-xdr',
  }

  it('renders contract and key path context', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    expect(screen.getAllByText('C123').length).toBeGreaterThan(0)
    expect(screen.getByText('/state/ledger')).toBeTruthy()
    expect(screen.getByText('Metadata')).toBeTruthy()
    expect(screen.getByText('Persistent')).toBeTruthy()
    expect(screen.getByText('1234567')).toBeTruthy()
    expect(screen.getByText('1235000')).toBeTruthy()
    expect(screen.getByText(storedEntry.rawXdr)).toBeTruthy()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('records an explicit compatible struct for a selected vector key', () => {
    const vectorKey = storedEntry.key
    const symbol = (value: string) => ({
      kind: 'primitive' as const,
      path: [],
      scType: 'symbol' as const,
      value,
      raw: { switch: 'ScvSymbol', value },
    })
    const collection = {
      kind: 'vec' as const,
      path: [],
      items: [
        {
          kind: 'map' as const,
          path: [],
          entries: [
            {
              key: symbol('first_value'),
              value: {
                kind: 'primitive' as const,
                path: [],
                scType: 'u32' as const,
                value: 7,
                raw: { switch: 'ScvU32', value: 7 },
              },
            },
            {
              key: symbol('second_value'),
              value: {
                kind: 'primitive' as const,
                path: [],
                scType: 'u32' as const,
                value: 9,
                raw: { switch: 'ScvU32', value: 9 },
              },
            },
          ],
          raw: { switch: 'ScvMap' },
        },
      ],
      raw: { switch: 'ScvVec' },
    }
    const structWire = new xdr.ScSpecUdtStructV0({
      doc: '',
      lib: '',
      name: 'DemoVector',
      fields: ['first_value', 'second_value'].map(
        (name) =>
          new xdr.ScSpecUdtStructFieldV0({
            doc: '',
            name,
            type: xdr.ScSpecTypeDef.scSpecTypeU32(),
          }),
      ),
    })
    const struct = {
      kind: 'struct' as const,
      name: 'DemoVector',
      fields: structWire.fields(),
      wire: structWire,
    }
    const incompatibleWire = new xdr.ScSpecUdtStructV0({
      doc: '',
      lib: '',
      name: 'Other',
      fields: [
        new xdr.ScSpecUdtStructFieldV0({
          doc: '',
          name: 'unrelated',
          type: xdr.ScSpecTypeDef.scSpecTypeU32(),
        }),
      ],
    })
    useLensStore.setState({
      watchlist: {},
      ledgerData: {
        [storedEntry.key]: { ...storedEntry, value: collection },
      },
    })
    useLensStore.getState().setContractSpec('C123', {
      entries: [
        struct,
        {
          kind: 'struct',
          name: 'Other',
          fields: incompatibleWire.fields(),
          wire: incompatibleWire,
        },
      ],
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath={vectorKey}
      />,
    )

    const selector = screen.getByRole('combobox', {
      name: 'Struct interpretation',
    })
    expect(selector.querySelectorAll('option')).toHaveLength(2)
    fireEvent.change(selector, { target: { value: 'DemoVector' } })

    expect(screen.getByRole('status').textContent).toContain(
      'This collection is explicitly interpreted as',
    )
    expect(screen.getByRole('status').textContent).toContain('DemoVector')
    expect(
      useLensStore
        .getState()
        .getCollectionStructInterpretation('C123', vectorKey),
    ).toBe('DemoVector')
  })

  it('renders the parsed two-field fixture labels only after selection without changing raw paths', () => {
    const entries = createDemoLedgerEntries()
    const entry = entries.find(
      (item) => (item.value as { kind: string }).kind === 'vec',
    )!
    const wire = new xdr.ScSpecUdtStructV0({
      doc: '',
      lib: '',
      name: 'DemoVector',
      fields: ['first_value', 'second_value'].map(
        (name) =>
          new xdr.ScSpecUdtStructFieldV0({
            doc: '',
            name,
            type: xdr.ScSpecTypeDef.scSpecTypeU32(),
          }),
      ),
    })
    const extracted = extractContractspecv0(
      createContractSpecWasm([xdr.ScSpecEntry.scSpecEntryUdtStructV0(wire)]),
    )
    if (!extracted.ok) throw new Error('Fixture extraction failed')
    const parsed = parseContractSpec(extracted.payload)
    if (!parsed.ok) throw new Error(parsed.reason)
    useLensStore.setState({
      ledgerData: Object.fromEntries(entries.map((item) => [item.key, item])),
      collectionStructInterpretations: {},
    })
    const network = useLensStore.getState().networkConfig
    useLensStore.getState().setContractSpec(entry.contractId, parsed.spec)
    const { rerender } = render(
      <InspectShell
        contractId={entry.contractId}
        normalizedContractId={entry.contractId}
        keyPath={entry.key}
      />,
    )
    expect(screen.queryByRole('definition')).toBeNull()
    expect(screen.queryByText('first_value')).toBeNull()
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Struct interpretation' }),
      { target: { value: 'DemoVector' } },
    )
    const fields = screen.getByLabelText('Interpreted fields')
    expect(fields.textContent).toContain('first_value')
    expect(fields.textContent).toContain('second_value')
    expect(fields.textContent).toContain(`${entry.key}.item-0`)
    expect(fields.textContent).toContain(`${entry.key}.item-1.item-0`)
    expect(fields.textContent).toContain('7')
    expect(fields.textContent).toContain('9')
    expect(useLensStore.getState().ledgerData[entry.key]).toBe(entry)
    expect(useLensStore.getState().networkConfig).toBe(network)
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Struct interpretation' }),
      { target: { value: '' } },
    )
    expect(screen.queryByText('first_value')).toBeNull()
    rerender(
      <InspectShell
        contractId="OTHER"
        normalizedContractId="OTHER"
        keyPath={entry.key}
      />,
    )
    expect(screen.queryByText('first_value')).toBeNull()
  })

  it('labels the sample contract as local demo data', () => {
    render(
      <InspectShell
        contractId={SAMPLE_CONTRACT_ID.toLowerCase()}
        normalizedContractId={SAMPLE_CONTRACT_ID}
        keyPath="/state/ledger"
      />,
    )

    expect(
      screen.getByRole('note', {
        name: 'Local demo data. Ledger numbers are illustrative.',
      }).textContent,
    ).toContain('Ledger numbers are illustrative.')
  })

  it('keeps the selected ledger entry visible when contract metadata is stored', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
    })
    const network = useLensStore.getState().networkConfig
    const spec: ContractSpec = { entries: [] }
    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    act(() => useLensStore.getState().setContractSpec('C123', spec))

    expect(screen.getByText(storedEntry.rawXdr)).toBeTruthy()
    expect(useLensStore.getState().ledgerData[storedEntry.key]).toBe(
      storedEntry,
    )
    expect(useLensStore.getState().networkConfig).toBe(network)
    expect(useLensStore.getState().getContractSpec('C123')).toEqual(spec)
  })

  it('shows the affected key path and expected/actual types for a schema mismatch', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
      contractSpecMismatches: {
        [contractSpecKey(useLensStore.getState().networkConfig, 'C123')!]: [
          {
            keyPath: '/state/ledger',
            expectedType: 'i128',
            actualType: 'symbol',
          },
        ],
      },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Schema mismatch')).toBeTruthy()
    expect(screen.getByText('Key path: /state/ledger')).toBeTruthy()
    expect(screen.getByText('i128')).toBeTruthy()
    expect(screen.getByText('symbol')).toBeTruthy()
  })

  it('keeps the inspector clear when schema comparison finds no mismatch', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
      contractSpecMismatches: {
        [contractSpecKey(useLensStore.getState().networkConfig, 'C123')!]: [],
      },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('Schema mismatch')).toBeNull()
  })

  it('renders temporary metadata from the matching stored entry', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: {
        'C123::ContractData::matching-key': {
          key: 'C123::ContractData::matching-key',
          contractId: 'C123',
          type: 'ContractData',
          durability: 'Temporary',
          value: null,
          lastModifiedLedger: 200,
          expirationLedger: 240,
        },
        'C123::ContractData::other-key': {
          key: 'C123::ContractData::other-key',
          contractId: 'C123',
          type: 'ContractData',
          durability: 'Persistent',
          value: null,
          lastModifiedLedger: 300,
        },
      },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="C123::ContractData::matching-key.item-0"
      />,
    )

    expect(screen.getByText('Temporary')).toBeTruthy()
    expect(screen.getByText('200')).toBeTruthy()
    expect(screen.getByText('240')).toBeTruthy()
    expect(screen.queryByText('Persistent')).toBeNull()
    expect(screen.queryByText('300')).toBeNull()
  })

  it('renders N/A when the matching stored entry has no metadata', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: {
        'C123::ContractData::missing-key': {
          key: 'C123::ContractData::missing-key',
          contractId: 'C123',
          type: 'ContractData',
          value: null,
          lastModifiedLedger: 0,
        },
      },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="C123::ContractData::missing-key.item-0"
      />,
    )

    expect(screen.getAllByText('N/A')).toHaveLength(3)
  })

  it('pins the current key path to the watchlist', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
    })
    const addToWatchlist = vi.spyOn(useLensStore.getState(), 'addToWatchlist')

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }))

    expect(addToWatchlist).toHaveBeenCalledWith('C123', '/state/ledger')
  })

  it('pins padded route IDs to the normalized contract watchlist bucket', () => {
    useLensStore.setState({
      watchlist: {},
      ledgerData: { [storedEntry.key]: storedEntry },
    })

    render(
      <InspectShell
        contractId=" c123 "
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }))

    expect(
      useLensStore.getState().getWatchlistForContract('C123'),
    ).toHaveLength(1)
    expect(
      useLensStore.getState().getWatchlistForContract(' c123 '),
    ).toHaveLength(0)
  })

  it('shows feedback when the pinned key already exists', () => {
    useLensStore.setState({
      watchlist: {
        futurenet: {
          C123: [
            { contractId: 'C123', keyPath: '/state/ledger', timestamp: 1 },
          ],
        },
      },
      ledgerData: { [storedEntry.key]: storedEntry },
    })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }))

    expect(screen.getByRole('status').textContent).toBe('Already in watchlist.')
    expect(
      useLensStore.getState().getWatchlistForContract('C123'),
    ).toHaveLength(1)
  })

  it('copies the selected entry raw XDR', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    useLensStore.setState({ ledgerData: { [storedEntry.key]: storedEntry } })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="/state/ledger"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(storedEntry.rawXdr),
    )
    vi.unstubAllGlobals()
  })

  it('shows a missing entry and disables entry actions for a stale key path', () => {
    useLensStore.setState({ watchlist: {}, ledgerData: {} })

    render(
      <InspectShell
        contractId="C123"
        normalizedContractId="C123"
        keyPath="stale-entry-key"
      />,
    )

    expect(screen.getByText('Entry not found')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Add to watchlist' }),
    ).toHaveProperty('disabled', true)
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull()
    expect(screen.queryByText('Metadata')).toBeNull()
  })
})
