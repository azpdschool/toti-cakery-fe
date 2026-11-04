import { Outlet } from 'react-router-dom'
import { WhatsAppButton } from '@/components/common/WhatsAppButton'
import { BuyerNavbar } from '@/components/layout/BuyerNavbar'
import { BuyerFooter } from '@/components/layout/BuyerFooter'
import { BuyerBottomNav } from '@/components/layout/BuyerBottomNav'

export function BuyerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6EFE6] pb-20 md:pb-0">
      <BuyerNavbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <BuyerFooter />

      <WhatsAppButton />
      <BuyerBottomNav />
    </div>
  )
}