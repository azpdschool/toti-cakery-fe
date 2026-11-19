import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/components/common/AuthProvider'
import { CartProvider } from '@/context/CartContext'
import { WhatsAppProvider } from '@/context/WhatsAppContext'
import { WishlistProvider } from '@/hooks/useWishlist'
import { ToastProvider } from '@/components/ui/Toast'
import { SmartToaster, setupSmartToastDurations } from '@/components/ui/SmartToastBar'
import { router } from '@/router'
import { BuyerBouncingLoader, SellerSquareMorphLoader } from '@/components/common/TotiLoader'
import '@/lib/i18n'

setupSmartToastDurations()

function RootRouteLoader() {
  const isSellerPath =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/seller') ||
      window.location.pathname.startsWith('/auth/seller') ||
      window.location.pathname === '/auth/login')

  return isSellerPath ? (
    <SellerSquareMorphLoader mode="fullScreen" size="lg" />
  ) : (
    <BuyerBouncingLoader mode="fullScreen" size="lg" />
  )
}

export default function App() {
  return (
    <ToastProvider>
      <SmartToaster />
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <WhatsAppProvider>
              <Suspense fallback={<RootRouteLoader />}>
                <RouterProvider router={router} />
              </Suspense>
            </WhatsAppProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

