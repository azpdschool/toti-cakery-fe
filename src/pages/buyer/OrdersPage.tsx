import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from 'react'
import type React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Search,
  Truck,
  Store,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  ShoppingBag,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatRupiah } from '@/services/productService'
import {
  getBuyerOrders,
  type BuyerOrder,
  type OrderStatus,
} from '@/services/buyerOrderService'
import { ROUTES } from '@/constants'
import { toast } from 'react-hot-toast'
import { downloadInvoice } from '@/services/invoiceService'
import { Download, Loader2 } from 'lucide-react'

const statusMap: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    color: 'text-yellow-700 bg-yellow-100 ring-yellow-600/20',
  },
  processed: {
    label: 'Diproses',
    icon: Package,
    color: 'text-blue-700 bg-blue-100 ring-blue-600/20',
  },
  shipped: {
    label: 'Dikirim',
    icon: Truck,
    color: 'text-purple-700 bg-purple-100 ring-purple-600/20',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    color: 'text-green-700 bg-green-100 ring-green-600/20',
  },
  ready: {
    label: 'Siap',
    icon: CheckCircle,
    color: 'text-teal-700 bg-teal-100 ring-teal-600/20',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    color: 'text-red-700 bg-red-100 ring-red-600/20',
  },
  refunded: {
    label: 'Dikembalikan',
    icon: XCircle,
    color: 'text-red-700 bg-red-100 ring-red-600/20',
  },
}

const methodMap: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  pickup: { label: 'Pickup', icon: Store },
  delivery_toko: { label: 'Delivery Toko', icon: Truck },
  delivery_third_party: { label: 'Third Party', icon: Send },
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getBuyerOrders()
      setOrders(data)
    } catch (err) {
      console.error('Gagal memuat pesanan:', err)
      setError(t('orders.failed_load'))
      toast.error(t('orders.failed_load_retry'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    setDownloadingId(orderId)
    toast.success(t('orders.invoice_download_started'))
    try {
      const lang = i18n.language === 'en' ? 'en' : 'id'
      await downloadInvoice(orderId, lang)
    } catch (err: any) {
      toast.error(err.message || t('orders.invoice_download_failed'))
    } finally {
      setDownloadingId(null)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer') {
      loadOrders()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const filteredOrders = useMemo(() => {
    let result = orders

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()

      result = result.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(q) ||
          order.items.some((item) =>
            item.productName.toLowerCase().includes(q),
          ),
      )
    }

    if (filterStatus !== 'all') {
      const map: Record<string, OrderStatus> = {
        pending: 'pending',
        processed: 'processed',
        ready: 'ready',
        shipped: 'shipped',
        completed: 'completed',
        cancelled: 'cancelled',
        refunded: 'refunded'
      }

      result = result.filter((order) => order.status === map[filterStatus])
    }

    return result
  }, [orders, searchQuery, filterStatus])

  const getStatusBadge = (order: BuyerOrder) => {
    const status = order.status
    let info = statusMap[status] || statusMap.pending

    if (status === 'ready') {
      const label = order.deliveryMethod === 'pickup' 
          ? t('orders.ready_pickup') 
          : t('orders.ready_delivery')
      info = { ...info, label }
    } else {
      info = { ...info, label: t(`orders.status_${status}`) }
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset ${info.color}`}
      >
        <info.icon className="h-3.5 w-3.5" />
        {info.label}
      </span>
    )
  }

  const getMethodBadge = (method: string) => {
    const info = methodMap[method] || methodMap.pickup
    const labelKey = `orders.method_${method}`
    const label = t(labelKey)

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D0BFAF] bg-white px-2.5 py-0.5 text-xs font-bold text-[#6B4A3C]">
        <info.icon className="h-3.5 w-3.5 text-[#9C8478]" />
        {label}
      </span>
    )
  }

  if (!isAuthenticated || !user || user.role !== 'buyer') {
    return <Navigate to={ROUTES.AUTH_BUYER} replace />
  }

  if (loading) {
    return (
      <div className="bg-[#F6EFE6] min-h-screen pb-10">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <div className="mb-6 flex justify-between">
            <div className="space-y-3">
              <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-64 animate-pulse rounded-lg bg-gray-200" />
            </div>
            <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-200" />
          </div>
          <div className="h-16 w-full animate-pulse rounded-xl bg-gray-200" />
          <div className="mt-6 space-y-4">
             {[1,2,3].map(i => (
                <div key={i} className="h-56 w-full animate-pulse rounded-2xl bg-gray-200" />
             ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F6EFE6] min-h-screen pb-12">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#3A1F16] tracking-tight">
              {t('orders.my_orders')}
            </h1>
            <p className="mt-2 text-sm text-[#6B4A3C]">
              {t('orders.subtitle')}
            </p>
          </div>

          <Link
            to={ROUTES.CATALOG}
            className="flex items-center gap-2 rounded-xl bg-[#9B4A2F] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#7E3A24] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
          >
            <ShoppingBag className="h-4 w-4" />
            {t('orders.shop_again')}
          </Link>
        </div>

        <div className="mb-8 rounded-xl bg-white p-4 text-sm font-medium text-[#6B4A3C] shadow-sm ring-1 ring-[#EAD8CA]">
          {t('orders.logged_in_as')}{' '}
          <span className="font-black text-[#3A1F16]">
            {user.name || user.email || 'Buyer'}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex h-11 w-full sm:flex-1 min-w-[200px] items-center rounded-xl border border-[#D0BFAF] bg-white px-3.5 focus-within:border-[#9B4A2F] focus-within:ring-2 focus-within:ring-[#9B4A2F]/20 shadow-sm transition">
            <Search className="h-4 w-4 shrink-0 text-[#9C8478]" />
            <input
              type="text"
              placeholder={t('orders.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-2.5 text-sm text-[#3A1F16] outline-none placeholder:text-[#9C8478]"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 w-full sm:w-auto appearance-none rounded-xl border border-[#D0BFAF] bg-white pl-4 pr-10 text-sm font-bold text-[#3A1F16] outline-none focus:border-[#9B4A2F] focus:ring-2 focus:ring-[#9B4A2F]/20 shadow-sm transition"
            >
              <option value="all">{t('orders.all_status')}</option>
              <option value="pending">{t('orders.status_pending')}</option>
              <option value="processed">{t('orders.status_processed')}</option>
              <option value="ready">{t('orders.status_ready')}</option>
              <option value="shipped">{t('orders.status_shipped')}</option>
              <option value="completed">{t('orders.status_completed')}</option>
              <option value="cancelled">{t('orders.status_cancelled')}</option>
              <option value="refunded">{t('orders.status_refunded')}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <p className="text-lg font-black text-red-700">❌ {error}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-4 flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 shadow"
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Order List */}
        <div className="mt-8 space-y-4">
          {!error && filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-[#EAD8CA]">
              <Package className="mx-auto h-16 w-16 text-[#D0BFAF]" />
              <h2 className="mt-5 text-xl font-black text-[#3A1F16]">
                {t('orders.empty')}
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#6B4A3C] leading-relaxed">
                {t('orders.empty_desc')}
              </p>
              <Link
                to={ROUTES.CATALOG}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#9B4A2F] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#7E3A24] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
              >
                <ShoppingBag className="h-4 w-4" />
                {t('cart.view_products')}
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#EAD8CA] transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/orders/${order.id}`)
                  }
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAD8CA] bg-[#F6EFE6]/50 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-black text-[#3A1F16] tracking-wide">
                      {order.orderNumber}
                    </span>

                    <span className="text-xs font-semibold text-[#6B4A3C]">
                      {order.date} · {order.time}
                    </span>

                    {getMethodBadge(order.deliveryMethod)}
                  </div>

                  {getStatusBadge(order)}
                </div>

                <div className="p-5">
                  <div className="space-y-4">
                    {order.items.length === 0 ? (
                      <p className="text-sm text-[#6B4A3C]">
                        {t('orders.item_unavailable', 'Item pesanan tidak tersedia.')}
                      </p>
                    ) : (
                      order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-[#3A1F16]">
                              {item.productName}
                            </span>
                            <span className="rounded-md bg-[#F6EFE6] px-2 py-0.5 text-[11px] font-bold text-[#6B4A3C] uppercase tracking-wide">
                              {item.variantName}
                            </span>
                            <span className="text-xs font-black text-[#9C8478]">
                              x{item.quantity}
                            </span>
                          </div>

                          <span className="font-black text-[#3A1F16]">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#EAD8CA] pt-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#6B4A3C] uppercase tracking-wide">{t('orders.total', 'Total')}</span>
                      <span className="text-lg font-black text-[#9B4A2F]">
                        {formatRupiah(order.total)}
                      </span>
                      {order.paymentStatus === 'partial' && (
                        <span className="ml-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          DP
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleDownloadInvoice(e, order.id)}
                      disabled={downloadingId === order.id}
                      className="flex items-center gap-1.5 rounded-xl border border-[#D0BFAF] bg-white px-5 py-2 text-sm font-bold text-[#3A1F16] transition hover:bg-[#F6EFE6] focus:outline-none focus:ring-2 focus:ring-[#D0BFAF]/50 disabled:opacity-50"
                    >
                      {downloadingId === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#9C8478]" />
                          {t('orders.download_invoice')}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 text-[#9C8478]" />
                          {t('orders.download_invoice')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
