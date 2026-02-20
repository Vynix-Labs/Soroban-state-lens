import { useState } from 'react'

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
        />

        {/* Mobile Sidebar - Tree Explorer (overlay) */}
        <Sidebar
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          variant="overlay"
        />

        {/* Main Content - empty for now */}
        <main className="flex-1 flex flex-col min-w-0 bg-background-dark overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
