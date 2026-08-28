import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WatermarkBg from '../../components/Home/WatermarkBg'

describe('WatermarkBg', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without React unknown-property warnings', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(<WatermarkBg />)

    const unknownPropWarnings = errorSpy.mock.calls.filter((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('unrecognized in this browser') ||
            arg.includes('Invalid DOM property')),
      ),
    )
    expect(unknownPropWarnings).toHaveLength(0)

    const strokedPaths = container.querySelectorAll('path[stroke-width]')
    expect(strokedPaths).toHaveLength(2)
    strokedPaths.forEach((path) => {
      expect(path.getAttribute('stroke-width')).toBe('0.5')
      expect(path.getAttribute('stroke')).toBe('currentColor')
    })
  })
})
