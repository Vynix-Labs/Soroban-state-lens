import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContractLookUpInput from '../../components/global/ContractLookUpInput'

// Mock the router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const getInput = () => {
  const input = screen.getByPlaceholderText(/search ledger keys/i)
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected contract lookup input')
  }
  return input
}

describe('ContractLookUpInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input field with placeholder', () => {
    render(<ContractLookUpInput />)

    const input = screen.getByPlaceholderText(/search ledger keys/i)
    expect(input).not.toBeNull()
  })

  it('renders submit button', () => {
    render(<ContractLookUpInput />)

    const submitButton = screen.getByRole('button')
    expect(submitButton).not.toBeNull()
  })

  it('updates input value when user types', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.change(input, { target: { value: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4' } })

    expect(input.value).toBe('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4')
  })

  it('maintains input as controlled component', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.change(input, { target: { value: 'test' } })
    expect(input.value).toBe('test')

    fireEvent.change(input, { target: { value: 'test2' } })
    expect(input.value).toBe('test2')
  })

  it('focuses input on Ctrl+K', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(document.activeElement).toBe(input)
  })

  it('focuses input on Meta+K', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    expect(document.activeElement).toBe(input)
  })

  it('does not focus input on other key combinations', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.keyDown(document, { key: 'k' })
    expect(document.activeElement).not.toBe(input)

    fireEvent.keyDown(document, { key: 'j', ctrlKey: true })
    expect(document.activeElement).not.toBe(input)
  })

  it('renders form element', () => {
    render(<ContractLookUpInput />)

    const form = screen.getByPlaceholderText(/search ledger keys/i).closest('form')
    expect(form).not.toBeNull()
  })

  it('has input with proper attributes', () => {
    render(<ContractLookUpInput />)

    const input = getInput()
    
    expect(input.type).toBe('text')
    expect(input.getAttribute('placeholder')).toMatch(/search ledger keys/i)
  })

  it('clears input value when user deletes text', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.change(input, { target: { value: 'test' } })
    expect(input.value).toBe('test')

    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
  })

  it('accepts keyboard focus', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    input.focus()
    expect(input.disabled).toBe(false)
  })

  it('handles multi-character input', () => {
    render(<ContractLookUpInput />)

    const input = getInput()

    fireEvent.change(input, { target: { value: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4' } })

    expect(input.value.length).toBeGreaterThan(0)
  })
})
