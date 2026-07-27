import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '../../components/global/Sidebar'
import { resetStore, useLensStore } from '../../store/lensStore'
import type { LedgerEntry } from '../../store/types'

const makeEntry = (key: string, contractId: string, value: unknown = 'value'): LedgerEntry => ({
  key,
  contractId,
  type: 'ContractData',
  value,
  lastModifiedLedger: 100,
})

describe('Sidebar History Panel', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders default tree placeholder when activeNavItem is not history', () => {
    render(<Sidebar open={true} onClose={vi.fn()} activeNavItem="watchlist" />)
    
    expect(screen.getByText('Ledger State')).toBeTruthy()
    expect(screen.getByText('Contract_Registry')).toBeTruthy()
    expect(screen.queryByText('Capture First')).toBeNull()
  })

  it('renders no active contract message when activeNavItem is history but activeContractId is null', () => {
    render(<Sidebar open={true} onClose={vi.fn()} activeNavItem="history" />)

    expect(screen.getByText('Compare History')).toBeTruthy()
    expect(screen.getByText('No Active Contract')).toBeTruthy()
    expect(screen.getByText(/Load a contract in the explorer/i)).toBeTruthy()
  })

  it('renders capture first empty state when activeContractId is set but snapshots < 2', () => {
    // Set active contract ID
    useLensStore.getState().setActiveContractId('c1')

    render(<Sidebar open={true} onClose={vi.fn()} activeNavItem="history" />)

    expect(screen.getByText('Compare History')).toBeTruthy()
    expect(screen.getByText('Capture First')).toBeTruthy()
    expect(screen.getByText(/No history comparison available/i)).toBeTruthy()
    expect(screen.getByText('0 / 2')).toBeTruthy()
  })

  it('allows capturing snapshot when ledger entries are loaded', () => {
    const state = useLensStore.getState()
    state.setActiveContractId('c1')
    
    // Mock loaded ledger entries in store
    state.upsertLedgerEntries([
      makeEntry('key1', 'c1', 'val1'),
      makeEntry('key2', 'c1', 'val2'),
    ])

    render(<Sidebar open={true} onClose={vi.fn()} activeNavItem="history" />)

    const captureButton = screen.getByRole('button', { name: /Capture Snapshot/i })
    expect(captureButton).toBeTruthy()
    expect(captureButton.hasAttribute('disabled')).toBe(false)

    // Capture first snapshot
    fireEvent.click(captureButton)
    expect(screen.getByText('1 / 2')).toBeTruthy()

    // Capture second snapshot (which triggers diff view)
    fireEvent.click(captureButton)

    // Now it should show Diff Summary instead of Capture First
    expect(screen.queryByText('Capture First')).toBeNull()
    expect(screen.getByText('Diff Summary')).toBeTruthy()
  })

  it('displays counts for created, deleted, modified, and unchanged entries', () => {
    const state = useLensStore.getState()
    state.setActiveContractId('c1')

    // Snapshot 1 entries
    const snap1 = {
      key_unchanged: makeEntry('key_unchanged', 'c1', 'same'),
      key_modified: makeEntry('key_modified', 'c1', 'old_val'),
      key_deleted: makeEntry('key_deleted', 'c1', 'gone'),
    }

    // Snapshot 2 entries
    const snap2 = {
      key_unchanged: makeEntry('key_unchanged', 'c1', 'same'),
      key_modified: makeEntry('key_modified', 'c1', 'new_val'),
      key_created: makeEntry('key_created', 'c1', 'newly_created'),
    }

    // Programmatically add snapshots
    state.addSnapshot('c1', snap1, 'Snapshot #1')
    state.addSnapshot('c1', snap2, 'Snapshot #2')

    render(<Sidebar open={true} onClose={vi.fn()} activeNavItem="history" />)

    expect(screen.getByText('Diff Summary')).toBeTruthy()
    expect(screen.getAllByText('Snapshot #1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Snapshot #2').length).toBeGreaterThan(0)

    // Verify diff counts
    // Created should be 1 (+1)
    expect(screen.getByText('+1')).toBeTruthy()
    expect(screen.getByText('Created')).toBeTruthy()

    // Deleted should be 1 (-1)
    expect(screen.getByText('-1')).toBeTruthy()
    expect(screen.getByText('Deleted')).toBeTruthy()

    // Modified should be 1 (~1)
    expect(screen.getByText('~1')).toBeTruthy()
    expect(screen.getByText('Modified')).toBeTruthy()

    // Unchanged should be 1
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('Unchanged')).toBeTruthy()
  })
})
