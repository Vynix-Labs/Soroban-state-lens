import { beforeEach, describe, expect, it } from 'vitest'
import { getStoreState, resetStore, useLensStore } from '../../store/lensStore'
import { ConnectionStatus } from '../../store/types'

describe('resetNetworkConfig', () => {
  beforeEach(() => {
    resetStore()
  })

  it('resets network config and clears connection metadata', () => {
    const { setNetworkConfig, setConnectionStatus, setLastCustomUrl, resetNetworkConfig } =
      useLensStore.getState()

    setNetworkConfig({ networkId: 'custom', rpcUrl: 'https://custom.example' } as any)
    setConnectionStatus(ConnectionStatus.SUCCESS)
    setLastCustomUrl('https://custom.example')

    // preconditions
    expect(getStoreState().networkConfig.rpcUrl).toBe('https://custom.example')
    expect(getStoreState().connectionStatus).toBe(ConnectionStatus.SUCCESS)
    expect(getStoreState().lastCustomUrl).toBe('https://custom.example')

    // perform reset
    resetNetworkConfig()

    const state = getStoreState()
    expect(state.networkConfig).toBeDefined()
    expect(state.connectionStatus).toBe(ConnectionStatus.IDLE)
    expect(state.lastCustomUrl).toBeUndefined()
  })
})
