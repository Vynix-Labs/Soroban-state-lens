import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NetworkSelector from '../../components/global/NetworkSelector'
import { resetStore } from '../../store/lensStore'
import * as networkValidation from '../../lib/network/validation'
import * as testConnection from '../../lib/network/testConnection'

// Mock the network functions
vi.mock('../../lib/network/validation')
vi.mock('../../lib/network/testConnection')

const getRpcInput = async () => {
  const input = await screen.findByPlaceholderText(/rpc.example.com|rpc/i)
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected custom RPC input')
  }
  return input
}

const getApplyButton = () => {
  const button = screen.getByRole('button', { name: /Apply/i })
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected Apply button')
  }
  return button
}

describe('NetworkSelector', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(networkValidation.validateRpcUrl).mockReturnValue({ isValid: true })
    vi.mocked(testConnection.testRpcConnection).mockResolvedValue({ success: true })
  })

  it('renders network selector button', () => {
    render(<NetworkSelector />)
    const button = screen.getByRole('button', { name: /Select network/i })
    expect(button).not.toBeNull()
  })

  it('toggles dropdown visibility on button click', () => {
    render(<NetworkSelector />)
    const button = screen.getByRole('button', { name: /Select network/i })

    fireEvent.click(button)
    expect(screen.queryByRole('listbox')).not.toBeNull()

    fireEvent.click(button)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('shows custom input when Custom is selected', async () => {
    render(<NetworkSelector />)
    const button = screen.getByRole('button', { name: /Select network/i })
    fireEvent.click(button)

    const customOption = screen.getByRole('option', { name: /Custom/i })
    fireEvent.click(customOption)

    const input = await screen.findByPlaceholderText(/rpc.example.com|rpc/i)
    expect(input).not.toBeNull()
  })

  it('updates URL input and preserves controlled value', async () => {
    render(<NetworkSelector />)
    const button = screen.getByRole('button', { name: /Select network/i })
    fireEvent.click(button)

    const customOption = screen.getByRole('option', { name: /Custom/i })
    fireEvent.click(customOption)

    const urlInput = await getRpcInput()
    fireEvent.change(urlInput, { target: { value: 'https://test1.com' } })
    expect(urlInput.value).toBe('https://test1.com')

    fireEvent.change(urlInput, { target: { value: 'https://test2.com' } })
    expect(urlInput.value).toBe('https://test2.com')
  })

  it('disables Apply button with invalid URL and enables with valid', async () => {
    vi.mocked(networkValidation.validateRpcUrl).mockReturnValue({ isValid: false, error: 'Invalid URL format' })

    render(<NetworkSelector />)
    const button = screen.getByRole('button', { name: /Select network/i })
    fireEvent.click(button)

    const customOption = screen.getByRole('option', { name: /Custom/i })
    fireEvent.click(customOption)

    const urlInput = await getRpcInput()
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } })

    await waitFor(() => {
      const applyButton = getApplyButton()
      expect(applyButton.disabled).toBe(true)
    })

    // make valid
    vi.mocked(networkValidation.validateRpcUrl).mockReturnValue({ isValid: true })
    fireEvent.change(urlInput, { target: { value: 'https://valid.rpc' } })

    await waitFor(() => {
      const applyButton = getApplyButton()
      expect(applyButton.disabled).toBe(false)
    })
  })

  it('tests RPC connection and shows messages', async () => {
    vi.mocked(testConnection.testRpcConnection).mockResolvedValue({ success: true })

    render(<NetworkSelector />)
    const button = screen.getByRole('button', { name: /Select network/i })
    fireEvent.click(button)

    const customOption = screen.getByRole('option', { name: /Custom/i })
    fireEvent.click(customOption)

    const urlInput = await getRpcInput()
    fireEvent.change(urlInput, { target: { value: 'https://valid.rpc' } })

    const testButton = screen.getByRole('button', { name: /Test Connection/i })
    fireEvent.click(testButton)

    await waitFor(() => {
      expect(screen.queryByText(/Connection successful/i)).not.toBeNull()
    })

    // simulate failure
    vi.mocked(testConnection.testRpcConnection).mockResolvedValue({ success: false, error: 'Connection timeout' })
    fireEvent.click(testButton)

    await waitFor(() => {
      expect(screen.queryByText(/Connection timeout/i)).not.toBeNull()
    })
  })

  it('preserves last custom URL when switching networks', async () => {
    render(<NetworkSelector />)

    const button = screen.getByRole('button', { name: /Select network/i })
    fireEvent.click(button)
    fireEvent.click(screen.getByRole('option', { name: /Custom/i }))

    const urlInput = await getRpcInput()
    fireEvent.change(urlInput, { target: { value: 'https://persistent.rpc.url' } })

    const applyButton = getApplyButton()
    fireEvent.click(applyButton)

    // close custom panel
    const cancelCustom = screen.getByRole('button', { name: /Cancel custom RPC/i })
    fireEvent.click(cancelCustom)

    // open dropdown then select Testnet
    fireEvent.click(button)
    fireEvent.click(screen.getByText(/Testnet/i))

    // open dropdown and re-select Custom
    fireEvent.click(button)
    fireEvent.click(screen.getByText(/Custom/i))

    await waitFor(async () => {
      const restoredInput = await getRpcInput()
      expect(restoredInput.value).toBe('https://persistent.rpc.url')
    })
  })
})
