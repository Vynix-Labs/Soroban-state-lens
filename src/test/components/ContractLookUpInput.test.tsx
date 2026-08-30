import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ContractLookUpInput from '../../components/global/ContractLookUpInput'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../../lib/validation/contractId', () => ({
  validateContractId: vi.fn().mockResolvedValue({
    ok: false,
    error: 'Invalid contract ID',
  }),
}))

describe('ContractLookUpInput validation accessibility', () => {
  it('links an active error to the input and clears the link after editing', async () => {
    render(<ContractLookUpInput />)

    const input = screen.getByPlaceholderText(
      'Search ledger keys / contract IDs...',
    )
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')).toBe(
        'contract-lookup-error',
      )
      expect(screen.getByText('Invalid contract ID').id).toBe(
        'contract-lookup-error',
      )
      expect((input as HTMLInputElement).value).toBe('invalid')
    })

    expect(document.activeElement).toBe(input)

    fireEvent.change(input, { target: { value: 'still-invalid' } })

    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(input.getAttribute('aria-describedby')).toBeNull()
  })
})
