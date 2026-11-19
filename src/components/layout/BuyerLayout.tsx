import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { WhatsAppButton } from '@/components/common/WhatsAppButton'
import { BuyerNavbar } from '@/components/layout/BuyerNavbar'
import { BuyerFooter } from '@/components/layout/BuyerFooter'
import { BuyerBottomNav } from '@/components/layout/BuyerBottomNav'
import { BuyerBouncingLoader } from '@/components/common/TotiLoader'

export function BuyerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-toti-cream pb-20 md:pb-0 w-full max-w-full overflow-x-clip">
      <BuyerNavbar />

      <main className="flex-1 w-full max-w-full min-w-0">
        <Suspense fallback={<BuyerBouncingLoader mode="section" size="md" />}>
          <Outlet />
        </Suspense>
      </main>

      <BuyerFooter />

      <WhatsAppButton />
      <BuyerBottomNav />
    </div>
  )
}