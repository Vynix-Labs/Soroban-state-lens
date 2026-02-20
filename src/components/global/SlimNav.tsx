import { Eye, HelpCircle, History, Search, Settings } from 'lucide-react'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, isActive = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`size-10 flex items-center justify-center rounded-lg transition-colors ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/20'
          : 'text-text-muted hover:text-white hover:bg-white/5'
      }`}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

interface SlimNavProps {
  activeItem?: string
  onItemClick?: (item: string) => void
}

export default function SlimNav({
  activeItem = 'watchlist',
  onItemClick,
}: SlimNavProps) {
  const handleClick = (item: string) => {
    onItemClick?.(item)
  }

  return (
    <aside className="w-16 bg-surface-dark border-r border-border-dark flex flex-col items-center py-4 gap-6 shrink-0 z-10">
      <NavItem
        icon={<Search size={20} />}
        label="Search"
        isActive={activeItem === 'search'}
        onClick={() => handleClick('search')}
      />
      <NavItem
        icon={<History size={20} />}
        label="History"
        isActive={activeItem === 'history'}
        onClick={() => handleClick('history')}
      />
      <NavItem
        icon={<Eye size={20} />}
        label="Watchlist"
        isActive={activeItem === 'watchlist'}
        onClick={() => handleClick('watchlist')}
      />
      <NavItem
        icon={<Settings size={20} />}
        label="Settings"
        isActive={activeItem === 'settings'}
        onClick={() => handleClick('settings')}
      />

      <div className="mt-auto">
        <NavItem
          icon={<HelpCircle size={20} />}
          label="Help"
          isActive={activeItem === 'help'}
          onClick={() => handleClick('help')}
        />
      </div>
    </aside>
  )
}
