import { useEffect } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getStoreState } from '../../store/lensStore'

export const Route = createFileRoute('/contracts/$contractId')({
  component: ContractLayoutRoute,
})


export function clearActiveContractContext(): void {
  const state = getStoreState()
  state.clearActiveContractId()
  state.clearSelectedKeyPath()
}


export function ContractLayoutRoute() {
  useEffect(() => {
    return () => {
      clearActiveContractContext()
    }
  }, [])

  return <Outlet />
}