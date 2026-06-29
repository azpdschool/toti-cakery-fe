// src/pages/buyer/OrdersPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/services/productService';
import { getBuyerOrders, type BuyerOrder, type OrderStatus } from '@/services/buyerOrderService';
import { ROUTES } from '@/constants';

const statusMap: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Menunggu', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  processed: { label: 'Diproses', icon: Package, color: 'text-blue-600 bg-blue-50' },
  shipped: { label: 'Dikirim', icon: Truck, color: 'text-purple-600 bg-purple-50' },
  completed: { label: 'Selesai', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

const methodMap: Record<string, { label: string; icon: React.ElementType }> = {
  pickup: { label: 'Pickup', icon: Store },
  delivery_toko: { label: 'Delivery Toko', icon: Truck },
  delivery_third_party: { label: 'Third Party', icon: Send },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const data = await getBuyerOrders();
        setOrders(data);
      } catch (error) {
        console.error('Gagal memuat pesanan:', error);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.items.some((item) => item.productName.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== 'Semua Status') {
      result = result.filter((o) => {
        const map: Record<string, string> = {
          'Menunggu': 'pending',
          'Diproses': 'processed',
          'Selesai': 'completed',
          'Dibatalkan': 'cancelled',
        };
        return o.status === map[filterStatus];
      });
    }
    return result;
  }, [orders, searchQuery, filterStatus]);

  const getStatusBadge = (status: OrderStatus) => {
    const info = statusMap[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${info.color}`}>
        <info.icon className="h-3 w-3" />
        {info.label}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const info = methodMap[method] || methodMap['pickup'];
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#6f5448]">
        <info.icon className="h-3 w-3" />
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#4b2417]">Pesanan Saya</h1>
          <p className="text-sm text-[#6f5448]">Lihat dan pantau semua pesanan Anda</p>
        </div>
        <Link
          to={ROUTES.CATALOG}
          className="rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] transition"
        >
          Belanja Lagi
        </Link>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
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
          <option value="Selesai">Selesai</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
      </div>

      {/* Order List */}
      <div className="mt-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-[#6f5448]">Tidak ada pesanan ditemukan</p>
            <Link
              to={ROUTES.CATALOG}
              className="mt-4 inline-block text-sm font-semibold text-[#d85b30] hover:text-[#c04e28] transition"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-xl bg-white shadow-sm border border-[#ead8ca]"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#ead8ca] bg-[#f8f4f0] px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#4b2417]">{order.orderNumber}</span>
                  <span className="text-xs text-[#6f5448]">
                    {order.date} · {order.time}
                  </span>
                  {getMethodBadge(order.deliveryMethod)}
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-[#4b2417]">{item.productName}</span>
                        <span className="ml-2 text-xs text-[#8b7166]">x{item.quantity}</span>
                        <span className="ml-2 text-xs text-[#8b7166]">{item.variantName}</span>
                      </div>
                      <span className="text-[#6f5448]">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#ead8ca] pt-4">
                  <div className="text-sm">
                    <span className="text-[#6f5448]">Total </span>
                    <span className="font-bold text-[#d85b30]">{formatRupiah(order.total)}</span>
                    {order.paymentMethod === 'dp' && (
                      <span className="ml-2 text-xs text-yellow-600">(DP)</span>
                    )}
                  </div>
                  <Link
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-1 rounded-lg border border-[#d85b30] px-4 py-1.5 text-xs font-semibold text-[#d85b30] hover:bg-[#d85b30]/5 transition"
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
  );
}