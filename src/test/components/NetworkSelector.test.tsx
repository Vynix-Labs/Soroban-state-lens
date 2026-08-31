import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NetworkSelector from '../../components/global/NetworkSelector'
import * as connectionModule from '../../lib/network/testConnection'
import { resetStore, useLensStore } from '../../store/lensStore'
import { DEFAULT_NETWORKS } from '../../store/types'

vi.mock('../../lib/network/testConnection', () => ({
  testRpcConnection: vi.fn(),
}))

describe('NetworkSelector Component', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders with default preset network', () => {
    render(<NetworkSelector />)
    expect(screen.getByRole('button', { name: /select network/i })).toBeTruthy()
    expect(screen.getByText('Futurenet')).toBeTruthy()
  })

  it('opens dropdown and switches to preset network', () => {
    render(<NetworkSelector />)

    const trigger = screen.getByRole('button', { name: /select network/i })
    fireEvent.click(trigger)

    const mainnetOption = screen.getByRole('option', { name: /mainnet/i })
    fireEvent.click(mainnetOption)

    const state = useLensStore.getState()
    expect(state.networkConfig).toEqual(DEFAULT_NETWORKS.mainnet)
  })

  it('opens custom panel and captures custom url and network passphrase on apply', () => {
    render(<NetworkSelector />)

    const trigger = screen.getByRole('button', { name: /select network/i })
    fireEvent.click(trigger)

    const customOption = screen.getByRole('option', { name: /custom/i })
    fireEvent.click(customOption)

    expect(screen.getByText('Custom RPC Configuration')).toBeTruthy()

    const urlInput = screen.getByLabelText('Custom RPC URL input')
    const passphraseInput = screen.getByLabelText(
      'Custom Network Passphrase input',
    )

    fireEvent.change(urlInput, {
      target: { value: 'https://custom-rpc.example.com' },
    })
    fireEvent.change(passphraseInput, {
      target: { value: 'Test SDF Network ; September 2015' },
    })

    const applyButton = screen.getByRole('button', { name: /apply/i })
    fireEvent.click(applyButton)

    const state = useLensStore.getState()
    expect(state.networkConfig).toEqual({
      networkId: 'custom',
      rpcUrl: 'https://custom-rpc.example.com',
      networkPassphrase: 'Test SDF Network ; September 2015',
      horizonUrl: DEFAULT_NETWORKS.futurenet.horizonUrl,
    })
    expect(state.lastCustomUrl).toBe('https://custom-rpc.example.com')
  })

  it('defaults custom network passphrase to Custom Network when left empty', () => {
    render(<NetworkSelector />)

    const trigger = screen.getByRole('button', { name: /select network/i })
    fireEvent.click(trigger)

    const customOption = screen.getByRole('option', { name: /custom/i })
    fireEvent.click(customOption)

    const urlInput = screen.getByLabelText('Custom RPC URL input')
    fireEvent.change(urlInput, {
      target: { value: 'https://custom-rpc2.example.com' },
    })

    const applyButton = screen.getByRole('button', { name: /apply/i })
    fireEvent.click(applyButton)

    const state = useLensStore.getState()
    expect(state.networkConfig.networkPassphrase).toBe('Custom Network')
  })

  it('announces connection test results as a polite status', async () => {
    vi.mocked(connectionModule.testRpcConnection).mockResolvedValueOnce({
      success: true,
    })
    render(<NetworkSelector />)

    fireEvent.click(screen.getByRole('button', { name: /select network/i }))
    fireEvent.click(screen.getByRole('option', { name: /custom/i }))
    fireEvent.change(screen.getByLabelText('Custom RPC URL input'), {
      target: { value: 'https://custom-rpc.example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain(
        'Connection successful',
      )
    })
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
  })

  it('toggles the dropdown once for native Enter activation', () => {
    render(<NetworkSelector />)

    const trigger = screen.getByRole('button', { name: /select network/i })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles the dropdown once for native Space activation', () => {
    render(<NetworkSelector />)

    const trigger = screen.getByRole('button', { name: /select network/i })
    fireEvent.keyDown(trigger, { key: ' ' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(trigger, { key: ' ' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('focuses the custom RPC input after the panel opens and clears the timer on unmount', () => {
    vi.useFakeTimers()
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    const { unmount } = render(<NetworkSelector />)

    const trigger = screen.getByRole('button', { name: /select network/i })
    fireEvent.click(trigger)

    const customOption = screen.getByRole('option', { name: /custom/i })
    fireEvent.click(customOption)

    vi.advanceTimersByTime(50)
    expect(document.activeElement).toBe(
      screen.getByLabelText('Custom RPC URL input'),
    )

    unmount()
    vi.advanceTimersByTime(100)
    expect(focusSpy).toHaveBeenCalledTimes(1)

    focusSpy.mockRestore()
    vi.useRealTimers()
  })

  it('ignores stale success results from an earlier custom RPC URL', async () => {
    const firstResult = new Promise<{ success: true }>((resolve) => {
      ;(
        globalThis as typeof globalThis & {
          __firstResolve?: (value: { success: true }) => void
        }
      ).__firstResolve = resolve
    })
    const secondResult = new Promise<{ success: false; error: string }>(
      (resolve) => {
        ;(
          globalThis as typeof globalThis & {
            __secondResolve?: (value: { success: false; error: string }) => void
          }
        ).__secondResolve = resolve
      },
    )

    vi.spyOn(connectionModule, 'testRpcConnection')
      .mockImplementationOnce(() => firstResult)
      .mockImplementationOnce(() => secondResult)

    render(<NetworkSelector />)

    fireEvent.click(screen.getByRole('button', { name: /select network/i }))
    fireEvent.click(screen.getByRole('option', { name: /custom/i }))

    const input = screen.getByLabelText('Custom RPC URL input')
    fireEvent.change(input, { target: { value: 'https://rpc-a.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    fireEvent.change(input, { target: { value: 'https://rpc-b.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    ;(
      globalThis as typeof globalThis & {
        __firstResolve?: (value: { success: true }) => void
      }
    ).__firstResolve?.({ success: true })
    ;(
      globalThis as typeof globalThis & {
        __secondResolve?: (value: { success: false; error: string }) => void
      }
    ).__secondResolve?.({ success: false, error: 'B failed' })

    await waitFor(() => {
      expect(screen.getByText('B failed')).toBeTruthy()
    })
    expect(screen.queryByText('Connection successful')).toBeNull()
  })

  it('ignores stale error results from an earlier custom RPC URL', async () => {
    const firstResult = new Promise<{ success: false; error: string }>(
      (resolve) => {
        ;(
          globalThis as typeof globalThis & {
            __firstResolve?: (value: { success: false; error: string }) => void
          }
        ).__firstResolve = resolve
      },
    )
    const secondResult = new Promise<{ success: true }>((resolve) => {
      ;(
        globalThis as typeof globalThis & {
          __secondResolve?: (value: { success: true }) => void
        }
      ).__secondResolve = resolve
    })

    vi.spyOn(connectionModule, 'testRpcConnection')
      .mockImplementationOnce(() => firstResult)
      .mockImplementationOnce(() => secondResult)

    render(<NetworkSelector />)

    fireEvent.click(screen.getByRole('button', { name: /select network/i }))
    fireEvent.click(screen.getByRole('option', { name: /custom/i }))

    const input = screen.getByLabelText('Custom RPC URL input')
    fireEvent.change(input, { target: { value: 'https://rpc-a.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    fireEvent.change(input, { target: { value: 'https://rpc-b.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    ;(
      globalThis as typeof globalThis & {
        __firstResolve?: (value: { success: false; error: string }) => void
      }
    ).__firstResolve?.({ success: false, error: 'A failed' })
    ;(
      globalThis as typeof globalThis & {
        __secondResolve?: (value: { success: true }) => void
      }
    ).__secondResolve?.({ success: true })

    await waitFor(() => {
      expect(screen.getByText('Connection successful')).toBeTruthy()
    })
    expect(screen.queryByText('A failed')).toBeNull()
  })
})
