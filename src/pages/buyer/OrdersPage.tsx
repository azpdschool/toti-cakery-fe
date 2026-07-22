// src/pages/buyer/OrdersPage.tsx
import { useState, useEffect, useMemo } from 'react'
import type React from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Search,
  Truck,
  Store,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Eye,
  ShoppingBag,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatRupiah } from '@/services/productService'
import {
  getBuyerOrders,
  type BuyerOrder,
  type OrderStatus,
} from '@/services/buyerOrderService'
import { ROUTES } from '@/constants'

const statusMap: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-50',
  },
  processed: {
    label: 'Diproses',
    icon: Package,
    color: 'text-blue-600 bg-blue-50',
  },
  shipped: {
    label: 'Dikirim',
    icon: Truck,
    color: 'text-purple-600 bg-purple-50',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    color: 'text-red-600 bg-red-50',
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

  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua Status')

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      setError(null)

      try {
        const data = await getBuyerOrders()
        setOrders(data)
      } catch (err) {
        console.error('Gagal memuat pesanan:', err)
        setError('Gagal memuat pesanan. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }

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

    if (filterStatus !== 'Semua Status') {
      const map: Record<string, OrderStatus> = {
        Menunggu: 'pending',
        Diproses: 'processed',
        Dikirim: 'shipped',
        Selesai: 'completed',
        Dibatalkan: 'cancelled',
      }

      result = result.filter((order) => order.status === map[filterStatus])
    }

    return result
  }, [orders, searchQuery, filterStatus])

  const getStatusBadge = (status: OrderStatus) => {
    const info = statusMap[status] || statusMap.pending

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${info.color}`}
      >
        <info.icon className="h-3 w-3" />
        {info.label}
      </span>
    )
  }

  const getMethodBadge = (method: string) => {
    const info = methodMap[method] || methodMap.pickup

    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#6f5448]">
        <info.icon className="h-3 w-3" />
        {info.label}
      </span>
    )
  }

  if (!isAuthenticated || !user || user.role !== 'buyer') {
    return <Navigate to={ROUTES.AUTH_BUYER} replace />
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#4b2417]">
            Pesanan Saya
          </h1>
          <p className="text-sm text-[#6f5448]">
            Lihat dan pantau semua pesanan Anda
          </p>
        </div>

        <Link
          to={ROUTES.CATALOG}
          className="rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
        >
          Belanja Lagi
        </Link>
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 text-sm text-[#6f5448] shadow-sm">
        Login sebagai{' '}
        <span className="font-bold text-[#4b2417]">
          {user.name || user.email || 'Buyer'}
        </span>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />

          <input
            type="text"
            placeholder="Cari ID pesanan atau produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
        >
          <option value="Semua Status">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Diproses">Diproses</option>
          <option value="Dikirim">Dikirim</option>
          <option value="Selesai">Selesai</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Order List */}
      <div className="mt-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <Package className="mx-auto h-12 w-12 text-gray-300" />

            <h2 className="mt-4 text-lg font-black text-[#4b2417]">
              Belum ada pesanan
            </h2>

            <p className="mt-2 text-sm text-[#6f5448]">
              Anda belum pernah membuat pesanan. Yuk lihat katalog dan pilih kue
              favorit Anda.
            </p>

            <Link
              to={ROUTES.CATALOG}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d85b30] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
            >
              <ShoppingBag className="h-4 w-4" />
              Mulai Belanja
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-xl border border-[#ead8ca] bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ead8ca] bg-[#f8f4f0] px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold text-[#4b2417]">
                    {order.orderNumber}
                  </span>

                  <span className="text-xs text-[#6f5448]">
                    {order.date} · {order.time}
                  </span>

                  {getMethodBadge(order.deliveryMethod)}
                </div>

                {getStatusBadge(order.status)}
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-[#6f5448]">
                      Item pesanan tidak tersedia.
                    </p>
                  ) : (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="font-medium text-[#4b2417]">
                            {item.productName}
                          </span>

                          <span className="ml-2 text-xs text-[#8b7166]">
                            x{item.quantity}
                          </span>

                          <span className="ml-2 text-xs text-[#8b7166]">
                            {item.variantName}
                          </span>
                        </div>

                        <span className="text-[#6f5448]">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ead8ca] pt-4">
                  <div className="text-sm">
                    <span className="text-[#6f5448]">Total </span>

                    <span className="font-bold text-[#d85b30]">
                      {formatRupiah(order.total)}
                    </span>

                    {order.paymentStatus === 'partial' && (
                      <span className="ml-2 text-xs text-yellow-600">(DP)</span>
                    )}
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-1 rounded-lg border border-[#d85b30] px-4 py-1.5 text-xs font-semibold text-[#d85b30] transition hover:bg-[#d85b30]/5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
