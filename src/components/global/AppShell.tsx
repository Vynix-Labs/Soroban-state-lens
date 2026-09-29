import { useEffect, useState } from 'react'

import { startLedgerHeadPoll } from '../../lib/network/ledgerPoller'
import { useLensStore, useNetworkConfig } from '../../store/lensStore'
import { ConnectionStatus } from '../../store/types'
import Header from './Header'
import Sidebar from './Sidebar'
import SlimNav from './SlimNav'

import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  onContractLookup?: (contractId: string) => void
  isLookupLoading?: boolean
}

export default function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [activeNavItem, setActiveNavItem] = useState('watchlist')
  const networkConfig = useNetworkConfig()
  const setConnectionStatus = useLensStore((state) => state.setConnectionStatus)

  useEffect(
    () =>
      startLedgerHeadPoll({
        rpcConfig: { url: networkConfig.rpcUrl, timeout: 5000 },
        onLedgerChange: () => {},
        onError: () => setConnectionStatus(ConnectionStatus.ERROR),
        onRecovery: () => setConnectionStatus(ConnectionStatus.SUCCESS),
      }),
    [networkConfig.rpcUrl, setConnectionStatus],
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - full width */}
      <Header handleToggle={() => setMobileMenuOpen(true)} />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        <SlimNav
          activeItem={activeNavItem}
          onItemClick={(item) => {
            setActiveNavItem(item)
            if (item === 'search') {
              setMobileMenuOpen(true)
            }
          }}
        />

        {/* Desktop Sidebar - Tree Explorer (pinned) */}
        <Sidebar
          open={desktopSidebarOpen}
          onClose={() => setDesktopSidebarOpen(false)}
          variant="pinned"
          activeNavItem={activeNavItem}
        />

        {/* Mobile Sidebar - Tree Explorer (overlay) */}
        <Sidebar
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          variant="overlay"
          activeNavItem={activeNavItem}
        />

        {/* Main Content - empty for now */}
        <main className="flex-1 flex flex-col min-w-0 bg-background-dark overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
