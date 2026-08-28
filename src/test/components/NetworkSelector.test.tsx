import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NetworkSelector from '../../components/global/NetworkSelector'
import { resetStore, useLensStore } from '../../store/lensStore'
import { DEFAULT_NETWORKS } from '../../store/types'

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
    const passphraseInput = screen.getByLabelText('Custom Network Passphrase input')

    fireEvent.change(urlInput, { target: { value: 'https://custom-rpc.example.com' } })
    fireEvent.change(passphraseInput, { target: { value: 'Test SDF Network ; September 2015' } })

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
    fireEvent.change(urlInput, { target: { value: 'https://custom-rpc2.example.com' } })

    const applyButton = screen.getByRole('button', { name: /apply/i })
    fireEvent.click(applyButton)

    const state = useLensStore.getState()
    expect(state.networkConfig.networkPassphrase).toBe('Custom Network')
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
})
