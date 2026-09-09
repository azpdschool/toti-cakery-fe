import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, TrendingUp, ShoppingBag, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function SellerDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  
  // Dashboard mock data - realistically this would come from an API
  const [stats] = useState({
    totalProducts: 120,
    activeProducts: 105,
    totalSales: 5400000,
    recentOrders: 12,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#4b2417]">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-[#6f5448]">{t('dashboard.subtitle')}</p>
        <p className="mt-2 text-sm font-medium text-[#d85b30]">Selamat datang, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
              <Package className="h-5 w-5 text-[#d85b30]" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#4b2417]">{stats.totalProducts}</p>
          <p className="mt-1 text-sm text-[#6f5448]">{t('dashboard.total_products')}</p>
        </div>

        <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#4b2417]">{stats.activeProducts}</p>
          <p className="mt-1 text-sm text-[#6f5448]">{t('dashboard.active_products')}</p>
        </div>

        <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#4b2417]">
            Rp {stats.totalSales.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-sm text-[#6f5448]">{t('dashboard.total_sales')}</p>
        </div>

        <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#4b2417]">{stats.recentOrders}</p>
          <p className="mt-1 text-sm text-[#6f5448]">{t('dashboard.recent_orders')}</p>
        </div>
      </div>
    </div>
  )
}
