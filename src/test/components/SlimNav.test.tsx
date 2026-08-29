import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SlimNav from '../../components/global/SlimNav'

describe('SlimNav accessibility', () => {
  it('marks the active item with aria-current while leaving others inactive', () => {
    render(<SlimNav activeItem="history" />)

    const searchButton = screen.getByRole('button', { name: 'Search' })
    const historyButton = screen.getByRole('button', { name: 'History' })
    const watchlistButton = screen.getByRole('button', { name: 'Watchlist' })

    expect(searchButton.getAttribute('aria-current')).toBeNull()
    expect(historyButton.getAttribute('aria-current')).toBe('page')
    expect(watchlistButton.getAttribute('aria-current')).toBeNull()
  })

  it('keeps only one active item for a given activeItem value', () => {
    render(<SlimNav activeItem="settings" />)

    const activeButtons = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-current') === 'page')

    expect(activeButtons).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('aria-current')).toBe(
      'page'
    )
  })
})
