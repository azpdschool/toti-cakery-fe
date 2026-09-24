// src/components/layout/SellerLayout.tsx
import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { SellerSidebar } from './SellerSidebar'
import { SellerHeader } from './SellerHeader'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'
import { isSellerRole } from '@/lib/roles'

export function SellerLayout() {
  const { isAuthenticated, user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  if (!isAuthenticated || !isSellerRole(user?.role)) {
    return <Navigate to={ROUTES.AUTH_SELLER} replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SellerSidebar isOpen={isSidebarOpen} />

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out${isSidebarOpen ? ' ml-64 lg:ml-0' : ''}`}>
        <SellerHeader
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
