import { Outlet } from 'react-router-dom'
import { WhatsAppButton } from '@/components/common/WhatsAppButton'
import { BuyerNavbar } from '@/components/layout/BuyerNavbar'
import { BuyerFooter } from '@/components/layout/BuyerFooter'

export function BuyerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf5]">
      <BuyerNavbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <BuyerFooter />

      <WhatsAppButton />
    </div>
  )
}
