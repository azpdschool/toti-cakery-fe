import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/components/common/AuthProvider'
import { CartProvider } from '@/context/CartContext'
import { WhatsAppProvider } from '@/context/WhatsAppContext'
import { ToastProvider } from '@/components/ui/Toast'
import { router } from '@/router'
import '@/lib/i18n'

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf5]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#d85b30]" />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WhatsAppProvider>
          <Suspense fallback={<Loading />}>
            <RouterProvider router={router} />
          </Suspense>
        </WhatsAppProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
