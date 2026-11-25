// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getStoreState, resetStore } from '../../store/lensStore'
import { ContractSpecLoadStatus } from '../../store/types'
import {
  TEST_CONTRACT_ID,
  createContractSpecWasm,
} from '../helpers/contractSpecFixtures'

const { mockGetContractWasm } = vi.hoisted(() => ({
  mockGetContractWasm: vi.fn(),
}))

vi.mock('../../lib/network/getContractWasmForSpec', () => ({
  getContractWasmForSpec: mockGetContractWasm,
}))

describe('loadContractSpec', () => {
  beforeEach(() => {
    resetStore()
    mockGetContractWasm.mockReset()
    mockGetContractWasm.mockResolvedValue({
      success: true,
      wasm: createContractSpecWasm(),
    })
  })

  it('de-duplicates concurrent loads for the same contract', async () => {
    const [first, second] = await Promise.all([
      getStoreState().loadContractSpec(TEST_CONTRACT_ID),
      getStoreState().loadContractSpec(TEST_CONTRACT_ID),
    ])

    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)
    expect(first.ok).toBe(true)
    expect(second.skipped).toBe(true)
    expect(getStoreState().getContractSpecLoadStatus(TEST_CONTRACT_ID)).toBe(
      ContractSpecLoadStatus.SUCCESS,
    )
  })

  it('reuses the cached spec and only refetches on an explicit force', async () => {
    await getStoreState().loadContractSpec(TEST_CONTRACT_ID)
    const cached = getStoreState().getContractSpec(TEST_CONTRACT_ID)

    const cachedResult =
      await getStoreState().loadContractSpec(TEST_CONTRACT_ID)
    expect(cachedResult.skipped).toBe(true)
    expect(getStoreState().getContractSpec(TEST_CONTRACT_ID)).toBe(cached)
    expect(mockGetContractWasm).toHaveBeenCalledTimes(1)

    const forced = await getStoreState().loadContractSpec(TEST_CONTRACT_ID, {
      force: true,
    })
    expect(forced.ok).toBe(true)
    expect(mockGetContractWasm).toHaveBeenCalledTimes(2)
  })

  it('skips invalid contract IDs without touching the network', async () => {
    const result = await getStoreState().loadContractSpec('not-a-contract')
    expect(result.ok).toBe(false)
    expect(mockGetContractWasm).not.toHaveBeenCalled()
  })

  it('records extraction failures as a bounded error state', async () => {
    mockGetContractWasm.mockResolvedValue({
      success: true,
      wasm: new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
    })

    const result = await getStoreState().loadContractSpec(TEST_CONTRACT_ID)
    expect(result.ok).toBe(false)
    expect(getStoreState().getContractSpecError(TEST_CONTRACT_ID)).toContain(
      'contractspecv0',
    )
    expect(getStoreState().getContractSpecLoadStatus(TEST_CONTRACT_ID)).toBe(
      ContractSpecLoadStatus.ERROR,
    )
  })
})
