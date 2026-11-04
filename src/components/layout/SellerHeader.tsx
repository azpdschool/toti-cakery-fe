// src/components/layout/SellerHeader.tsx
import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/common/NotificationBell'

interface SellerHeaderProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export function SellerHeader({ isSidebarOpen, toggleSidebar }: SellerHeaderProps) {
  const { user } = useAuth()

  const today = new Date()
  const formattedDateDesktop = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedDateMobile = today.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="sticky top-3 sm:top-4 z-20 mx-3 sm:mx-6 mt-2 sm:mt-4 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between rounded-xl border border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="rounded-md p-1.5 text-[#4b2417] hover:bg-[#4b2417]/5 focus:outline-none focus:ring-2 focus:ring-[#E0A04E] transition-colors shrink-0"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-[#4b2417] truncate leading-snug">
            Hello, {user?.name || user?.username || 'Seller'}!
          </h1>

          <p className="text-xs sm:text-sm text-[#6f5448] truncate leading-snug mt-0.5">
            <span className="inline sm:hidden">{formattedDateMobile}</span>
            <span className="hidden sm:inline">{formattedDateDesktop}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 text-right shrink-0">
        <NotificationBell />
        {(user?.username || user?.email) && (
          <p className="hidden sm:block text-xs text-[#8b7166]">
            {user?.username || user?.email}
          </p>
        )}
      </div>
    </header>
  )
}
