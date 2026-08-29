import { describe, expect, it, vi } from 'vitest'
import * as workerModule from '../../workers/createDecoderWorkerSafe'
import { probeDecoderWorker } from '../../routes/initializeDecoderWorkerPing'

describe('probeDecoderWorker', () => {
  it('handles ping rejection without throwing', async () => {
    const ping = vi.fn().mockRejectedValue(new Error('ping failed'))
    const spy = vi.spyOn(workerModule, 'createDecoderWorkerSafe').mockResolvedValue({ ping } as any)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await probeDecoderWorker()

    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls[0][0]).toContain('Decoder worker ping failed')

    warn.mockRestore()
    spy.mockRestore()
  })

  it('handles initialization rejection gracefully', async () => {
    const spy = vi.spyOn(workerModule, 'createDecoderWorkerSafe').mockRejectedValue(new Error('init failed'))

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await probeDecoderWorker()

    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls[0][0]).toContain('Decoder worker initialization failed')

    warn.mockRestore()
    spy.mockRestore()
  })
})
