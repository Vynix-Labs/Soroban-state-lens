import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingSkeleton } from '../../components/explorer/LoadingSkeleton'

describe('LoadingSkeleton', () => {
  it('exposes aria-busy and a live loading status', () => {
    render(<LoadingSkeleton />)

    const region = screen.getByRole('region', { name: /loading state/i })
    expect(region.getAttribute('aria-busy')).toBe('true')

    const status = screen.getByRole('status', { name: /loading explorer rows/i })
    expect(status).toBeTruthy()
  })
})
