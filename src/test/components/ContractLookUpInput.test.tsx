import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ContractLookUpInput from '../../components/global/ContractLookUpInput'
import { validateContractId } from '../../lib/validation/contractId'

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
    })

    fireEvent.change(input, { target: { value: 'still-invalid' } })

    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(input.getAttribute('aria-describedby')).toBeNull()
  })

  it('ignores a second submit while validation is pending', async () => {
    vi.clearAllMocks()
    let resolveValidation: (result: {
      ok: false
      error: string
    }) => void = () => {}
    const pendingValidation = new Promise<{ ok: false; error: string }>(
      (resolve) => {
        resolveValidation = resolve
      },
    )
    vi.mocked(validateContractId).mockReturnValueOnce(pendingValidation)

    render(<ContractLookUpInput />)
    const input = screen.getByPlaceholderText(
      'Search ledger keys / contract IDs...',
    )
    fireEvent.change(input, { target: { value: 'invalid' } })
    const form = input.closest('form')!

    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(validateContractId).toHaveBeenCalledTimes(1)

    resolveValidation({ ok: false, error: 'Invalid contract ID' })
    await waitFor(() => {
      expect(screen.getByText('Invalid contract ID')).toBeTruthy()
    })
  })
})
