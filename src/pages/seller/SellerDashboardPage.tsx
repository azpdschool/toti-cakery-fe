import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, TrendingUp, ShoppingBag, Clock, AlertCircle } from 'lucide-react'
import { fetchReportSummary, type ReportSummary } from '@/api/reports'
import { getInventoryItems, type InventoryItem } from '@/services/sellerInventoryService'
import { HorizontalCardScroller } from '@/components/common/HorizontalCardScroller'
import { PageHeader } from '@/components/ui/PageHeader'
import { OrdersDueTodaySection } from '@/components/seller/OrdersDueTodaySection'
import { ROUTES } from '@/constants'

export default function SellerDashboardPage() {
  const navigate = useNavigate()
  const [reportData, setReportData] = useState<ReportSummary | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState(false)

  const [inventoryAttention, setInventoryAttention] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadData() {
      // Fetch report summary
      fetchReportSummary()
        .then(res => {
          if (ignore) return
          setReportData(res)
          setReportError(false)
          setReportLoading(false)
        })
        .catch(err => {
          if (ignore) return
          console.error(err)
          setReportError(true)
          setReportLoading(false)
        })

      // Inventory needs attention
      getInventoryItems()
        .then(res => {
          if (ignore) return
          const attentionItems = res.filter(item => item.stock <= item.minStock)
          setInventoryAttention(attentionItems)
          setInventoryError(false)
          setInventoryLoading(false)
        })
        .catch(err => {
          if (ignore) return
          console.error(err)
          setInventoryError(true)
          setInventoryLoading(false)
        })
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [])

  // Formatting helpers
  const formatCurrency = (amount: number | string) => {
    const num = Number(amount)
    if (isNaN(num)) return 'Rp 0'
    return 'Rp ' + Math.round(num).toLocaleString('id-ID')
  }

  return (
    <div className="space-y-8 pb-10 max-w-full">
      {/* 1. Page Header */}
      <PageHeader
        title="Seller Dashboard"
        description="Toti Cakery store performance summary"
      />

      {/* 2. Inventory Needs Attention */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Inventory Needs Attention</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm min-h-[100px] flex items-center justify-center">
          {inventoryLoading ? (
            <div className="animate-pulse flex space-x-4 w-full h-full justify-center items-center">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : inventoryError ? (
            <div className="text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-red-500 mb-2" />
              <p className="text-sm text-gray-600">Unable to load this information right now.</p>
            </div>
          ) : inventoryAttention.length > 0 ? (
            <HorizontalCardScroller scrollContainerClassName="gap-3 pb-2">
              {inventoryAttention.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(ROUTES.SELLER_INVENTORY)}
                  className={`flex-shrink-0 snap-start border rounded-lg px-4 py-3 min-w-[200px] cursor-pointer hover:border-red-300 transition-colors ${item.stock === 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
                >
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium text-gray-700">{item.stock} {item.unit}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </HorizontalCardScroller>
          ) : (
            <div className="text-sm text-gray-600 w-full text-center">
               <p>No inventory items need attention.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Orders Due Today */}
      <OrdersDueTodaySection
        onOrderClick={(orderId) => navigate(`/seller/orders?orderId=${orderId}`)}
      />

      {/* 4. KPI / Summary Cards */}
      <section className="relative group max-w-full">
        <HorizontalCardScroller scrollContainerClassName="gap-3 sm:gap-4 pb-3 sm:pb-4 snap-mandatory">
          {/* Total Products */}
          <div className="snap-start flex-none w-[165px] sm:w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-50">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1">Total Products</p>
            {reportLoading ? (
               <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : reportError ? (
               <p className="text-lg sm:text-xl font-black text-gray-900">N/A</p>
            ) : (
               <p className="text-xl sm:text-3xl font-black text-gray-900 break-words truncate" title={String(reportData?.total_products ?? 0)}>{reportData?.total_products ?? 0}</p>
            )}
          </div>

          {/* Active Products */}
          <div className="snap-start flex-none w-[165px] sm:w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-50">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1">Active Products</p>
            {reportLoading ? (
               <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : reportError ? (
               <p className="text-lg sm:text-xl font-black text-gray-900">N/A</p>
            ) : (
               <p className="text-xl sm:text-3xl font-black text-gray-900 break-words truncate" title={String(reportData?.active_products ?? 0)}>{reportData?.active_products ?? 0}</p>
            )}
          </div>

          {/* Total Sales */}
          <div className="snap-start flex-none w-[165px] sm:w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-50">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1">Total Sales</p>
            {reportLoading ? (
               <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
            ) : reportError ? (
               <p className="text-lg sm:text-xl font-black text-gray-900">N/A</p>
            ) : (
               <p className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 break-words leading-tight truncate" title={formatCurrency(reportData?.total_revenue ?? 0)}>
                 {formatCurrency(reportData?.total_revenue ?? 0)}
               </p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="snap-start flex-none w-[200px] sm:w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-5 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-50">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1.5 sm:mb-2">Recent Orders</p>
            {reportLoading ? (
               <div className="space-y-2">
                 <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                 <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
               </div>
            ) : reportError ? (
               <p className="text-sm text-red-500">Unable to load this information right now.</p>
            ) : (
               <div className="flex-1 overflow-y-auto">
                 {reportData?.recent_orders && reportData.recent_orders.length > 0 ? (
                   <ul className="space-y-2">
                     {reportData.recent_orders.slice(0, 3).map((ro) => (
                       <li key={ro.id} className="text-xs border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                         <div className="font-bold text-gray-900 flex justify-between">
                            <span>#{ro.id}</span>
                            <span>{ro.total_price ? formatCurrency(ro.total_price) : ''}</span>
                         </div>
                         <div className="text-gray-500 truncate">{ro.customer_name || 'Unknown'}</div>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-gray-600">No recent orders yet.</p>
                 )}
               </div>
            )}
          </div>
        </HorizontalCardScroller>
      </section>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
