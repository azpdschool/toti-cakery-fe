// src/components/layout/SellerLayout.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { SellerSidebar } from './SellerSidebar'
import { SellerHeader } from './SellerHeader'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants'
import { isSellerRole } from '@/lib/roles'

export function SellerLayout() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !isSellerRole(user?.role)) {
    return <Navigate to={ROUTES.AUTH_SELLER} replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SellerSidebar />

      <div className="flex flex-1 flex-col">
        <SellerHeader />

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
