import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, TrendingUp, ShoppingBag, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { getStockItems, StockOut } from '@/api/stock'

export default function SellerDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 'BE GAP' as string | number,
    recentOrders: 'BE GAP' as string | number,
  })

  const [stockItems, setStockItems] = useState<StockOut[]>([])
  const [stockLoading, setStockLoading] = useState(true)
  const [stockError, setStockError] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStockLoading(true)
        
        // Parallel requests using existing API
        const [stockData, allProducts, activeProducts] = await Promise.all([
          getStockItems().catch(() => []),
          import('@/api/product').then(m => m.getAllProducts(false)).catch(() => []),
          import('@/api/product').then(m => m.getAllProducts(true)).catch(() => [])
        ])

        setStockItems(stockData)
        setStats({
          totalProducts: allProducts.length,
          activeProducts: activeProducts.length,
          totalSales: 'BE GAP',
          recentOrders: 'BE GAP',
        })
        setStockError(false)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setStockError(true)
      } finally {
        setStockLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const emptyStock = stockItems.filter(item => Number(item.stok_tersedia) <= 0);
  const lowStock = stockItems.filter(item => {
    const tersedia = Number(item.stok_tersedia);
    const minAlert = Number(item.alert_min_stok);
    return tersedia > 0 && tersedia <= minAlert;
  });
  
  const hasIssue = emptyStock.length > 0 || lowStock.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#4b2417]">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-[#6f5448]">{t('dashboard.subtitle')}</p>
        <p className="mt-2 text-sm font-medium text-[#d85b30]">Selamat datang, {user?.name}!</p>
      </div>

      {/* Stock Alert Section */}
      <div>
        <h2 className="text-lg font-bold text-[#4b2417] mb-3">Stok Bahan Baku</h2>
        {stockLoading ? (
          <div className="rounded-2xl border border-[#ead8ca] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6f5448]">Memuat data stok...</p>
          </div>
        ) : stockError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm text-red-600">Gagal memuat data stok. Silakan muat ulang halaman.</p>
          </div>
        ) : (
          <div className={`rounded-2xl border ${hasIssue ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'} p-5 shadow-sm`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {hasIssue ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <h3 className={`font-bold ${hasIssue ? 'text-orange-800' : 'text-green-800'}`}>
                    {hasIssue ? 'Stok perlu diperhatikan' : 'Semua stok aman'}
                  </h3>
                </div>
                
                {hasIssue && (
                  <div className="mt-2 space-y-1">
                    {emptyStock.length > 0 && (
                      <p className="text-sm text-orange-700 font-medium">
                        {emptyStock.length} bahan habis
                      </p>
                    )}
                    {lowStock.length > 0 && (
                      <p className="text-sm text-orange-700 font-medium">
                        {lowStock.length} bahan stok rendah
                      </p>
                    )}
                    
                    <ul className="mt-3 space-y-1">
                      {emptyStock.slice(0, 3).map(item => (
                        <li key={item.id} className="text-sm text-orange-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {item.nama_item} — Habis
                        </li>
                      ))}
                      {lowStock.slice(0, 3 - Math.min(emptyStock.length, 3)).map(item => (
                        <li key={item.id} className="text-sm text-orange-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          {item.nama_item} — {item.stok_tersedia} {item.satuan} tersisa
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate(ROUTES.SELLER_INVENTORY)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${hasIssue ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                Lihat Stok
              </button>
            </div>
          </div>
        )}
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
            {stats.totalSales === 'BE GAP' ? 'BE GAP' : `Rp ${Number(stats.totalSales).toLocaleString('id-ID')}`}
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
