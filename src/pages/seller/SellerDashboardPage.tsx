import { useRef, useState, useEffect } from 'react'
import { Package, TrendingUp, ShoppingBag, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { fetchReportSummary, type ReportSummary } from '@/api/reports'
import { getOrders, type Order } from '@/services/sellerOrderService'
import { getInventoryItems, type InventoryItem } from '@/services/sellerInventoryService'

export default function SellerDashboardPage() {
  const [reportData, setReportData] = useState<ReportSummary | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState(false)

  const [ordersDueToday, setOrdersDueToday] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(false)

  const [inventoryAttention, setInventoryAttention] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

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

      // Documenting backend requirement:
      // Backend needs to support `GET /orders?due_today=true` or `GET /reports/due-today`
      // to avoid downloading large lists just to find orders due today.
      getOrders({ due_today: true } as any)
        .then(res => {
          if (ignore) return
          const todayStr = new Date().toISOString().split('T')[0]
          // We still filter here as a fallback until the backend implements the due_today parameter
          const dueToday = res.filter(o => o.rawDueDate && o.rawDueDate.split('T')[0] === todayStr)
          setOrdersDueToday(dueToday)
          setOrdersError(false)
          setOrdersLoading(false)
        })
        .catch(err => {
          if (ignore) return
          console.error(err)
          setOrdersError(true)
          setOrdersLoading(false)
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

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth)
  }

  useEffect(() => {
    handleScroll()
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [reportData]) // Re-check when data loads

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Formatting helpers
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  return (
    <div className="space-y-8 pb-10 max-w-full">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Seller Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Toti Cakery store performance summary</p>
      </div>

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
            <div className="w-full flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {inventoryAttention.map(item => (
                <div key={item.id} className={`flex-shrink-0 snap-start border rounded-lg px-4 py-3 min-w-[200px] ${item.stock === 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium text-gray-700">{item.stock} {item.unit}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 w-full text-center">
               <p>No inventory items need attention.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Orders Due Today */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Orders Due Today</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm min-h-[100px]">
          {ordersLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ) : ordersError ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <AlertCircle className="mx-auto h-6 w-6 text-red-500 mb-2" />
              <p className="text-sm text-gray-600">Unable to load this information right now.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : ordersDueToday.length > 0 ? (
            <ul className="space-y-3">
              {ordersDueToday.map((order, i) => (
                <li key={i} className="flex items-center justify-between text-sm p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{order.orderNumber}</span>
                    <span className="text-gray-600">{order.customerName}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full mt-1 capitalize">{order.status.replace(/_/g, ' ')}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full py-4">
              <p className="text-sm text-gray-600">No orders are due today.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. KPI / Summary Cards */}
      <section className="relative group max-w-full">
        
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 md:-ml-4 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Total Products */}
          <div className="snap-start flex-none w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Total Products</p>
            {reportLoading ? (
               <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : reportError ? (
               <p className="text-xl font-black text-gray-900">N/A</p>
            ) : (
               <p className="text-3xl font-black text-gray-900 break-words">{reportData?.total_products ?? 0}</p>
            )}
          </div>

          {/* Active Products */}
          <div className="snap-start flex-none w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Active Products</p>
            {reportLoading ? (
               <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : reportError ? (
               <p className="text-xl font-black text-gray-900">N/A</p>
            ) : (
               <p className="text-3xl font-black text-gray-900 break-words">{reportData?.active_products ?? 0}</p>
            )}
          </div>

          {/* Total Sales */}
          <div className="snap-start flex-none w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Total Sales</p>
            {reportLoading ? (
               <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
            ) : reportError ? (
               <p className="text-xl font-black text-gray-900">N/A</p>
            ) : (
               <p className="text-2xl md:text-3xl font-black text-gray-900 break-words leading-tight">
                 {formatCurrency(reportData?.total_revenue ?? 0)}
               </p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="snap-start flex-none w-[280px] md:w-[300px] lg:flex-1 lg:min-w-[240px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-2">Recent Orders</p>
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
        </div>

        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 md:-mr-4 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

      </section>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
