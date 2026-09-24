// src/components/layout/SellerHeader.tsx
import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { roleLabel } from '@/lib/roles'

interface SellerHeaderProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export function SellerHeader({ isSidebarOpen, toggleSidebar }: SellerHeaderProps) {
  const { user } = useAuth()

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="sticky top-4 z-10 mx-6 mt-4 flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-6 py-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="rounded-md p-1.5 text-[#4b2417] hover:bg-[#4b2417]/5 focus:outline-none focus:ring-2 focus:ring-[#E0A04E] transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#4b2417]">
            Hello, {user?.name || user?.username || 'Seller'}!
          </h1>

          <p className="text-sm text-[#6f5448]">{formattedDate}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-[#4b2417]">
          {roleLabel(user?.role)}
        </p>
        <p className="text-xs text-[#8b7166]">
          {user?.username || user?.email || ''}
        </p>
      </div>
    </header>
  )
}
