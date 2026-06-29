// src/pages/buyer/OrderDetailPage.tsx

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Store,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  CreditCard,
  User,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/services/productService';
import { getBuyerOrderById, type BuyerOrder } from '@/services/buyerOrderService';
import { ROUTES } from '@/constants';

const statusMap: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Menunggu Konfirmasi', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  processed: { label: 'Sedang Diproses', icon: Package, color: 'text-blue-600 bg-blue-50' },
  shipped: { label: 'Dalam Perjalanan', icon: Truck, color: 'text-purple-600 bg-purple-50' },
  completed: { label: 'Selesai', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

const methodMap: Record<string, { label: string; icon: React.ElementType }> = {
  pickup: { label: 'Pickup (Ambil di Toko)', icon: Store },
  delivery_toko: { label: 'Delivery oleh Toko', icon: Truck },
  delivery_third_party: { label: 'Delivery Pihak Ketiga', icon: Send },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/buyer');
      return;
    }

    async function loadOrder() {
      if (!id) {
        setError('ID pesanan tidak ditemukan');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getBuyerOrderById(id);
        if (!data) {
          setError('Pesanan tidak ditemukan');
        } else {
          setOrder(data);
        }
      } catch (err) {
        setError('Gagal memuat detail pesanan');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id, isAuthenticated, navigate]);

  const getStatusBadge = (status: string) => {
    const info = statusMap[status] || statusMap['pending'];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${info.color}`}>
        <info.icon className="h-4 w-4" />
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

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-3 text-xl font-semibold text-gray-700">{error || 'Pesanan tidak ditemukan'}</h2>
        <Link
          to={ROUTES.ORDERS}
          className="mt-4 inline-block text-[#d85b30] hover:text-[#c04e28] transition"
        >
          Kembali ke daftar pesanan
        </Link>
      </div>
    );
  }

  const methodInfo = methodMap[order.deliveryMethod] || methodMap['pickup'];
  const isDelivery = order.deliveryMethod !== 'pickup';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to={ROUTES.ORDERS}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-[#6f5448] hover:text-[#4b2417] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar pesanan
      </Link>

      <div className="rounded-2xl bg-white shadow-sm border border-[#ead8ca] overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#ead8ca] bg-[#f8f4f0] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-[#4b2417]">{order.orderNumber}</h1>
              <p className="text-sm text-[#6f5448]">
                Dipesan {order.date} · {order.time}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div>
              {/* Metode Pengiriman */}
              <div className="rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold text-[#6f5448] uppercase tracking-wider">Metode Pengiriman</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e2d7]">
                    <methodInfo.icon className="h-5 w-5 text-[#d85b30]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#4b2417]">{methodInfo.label}</p>
                    {isDelivery && order.address && (
                      <p className="text-xs text-[#6f5448]">{order.address}</p>
                    )}
                    {!isDelivery && (
                      <p className="text-xs text-[#6f5448]">Toti Cakery Batam</p>
                    )}
                  </div>
                </div>
                {isDelivery && (
                  <div className="mt-3 space-y-1 border-t border-[#ead8ca] pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-[#6f5448]" />
                      <span className="text-[#4b2417]">{order.recipientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#6f5448]" />
                      <span className="text-[#4b2417]">{order.recipientPhone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pembayaran */}
              <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold text-[#6f5448] uppercase tracking-wider">Informasi Pembayaran</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">Metode</span>
                    <span className="font-medium text-[#4b2417] capitalize">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">Status</span>
                    <span
                      className={`font-medium capitalize ${
                        order.paymentStatus === 'paid'
                          ? 'text-green-600'
                          : order.paymentStatus === 'partial'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {order.paymentStatus === 'paid'
                        ? 'Lunas'
                        : order.paymentStatus === 'partial'
                        ? 'DP'
                        : 'Belum Dibayar'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#ead8ca] pt-2 font-bold">
                    <span className="text-[#4b2417]">Total</span>
                    <span className="text-[#d85b30]">{formatRupiah(order.total)}</span>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                  <h3 className="text-sm font-bold text-[#6f5448] uppercase tracking-wider">Catatan</h3>
                  <p className="mt-2 text-sm text-[#6f5448]">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Items */}
            <div>
              <div className="rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold text-[#6f5448] uppercase tracking-wider">
                  Item Pesanan ({order.items.length})
                </h3>
                <div className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-[#ead8ca] pb-2 text-sm">
                      <div>
                        <p className="font-medium text-[#4b2417]">{item.productName}</p>
                        <p className="text-xs text-[#8b7166]">
                          {item.variantName} · {item.quantity} pcs
                        </p>
                      </div>
                      <span className="text-[#6f5448]">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1 border-t border-[#ead8ca] pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">Subtotal</span>
                    <span className="text-[#4b2417]">{formatRupiah(order.subtotal)}</span>
                  </div>

                  {/* Biaya Pengiriman - hanya tampil jika bukan pickup */}
                  {order.deliveryMethod !== 'pickup' && (
                    <div className="flex justify-between">
                      <span className="text-[#6f5448]">Biaya Pengiriman</span>
                      <span className="text-[#8b7166] text-sm">Dihitung via WhatsApp</span>
                    </div>
                  )}

                  {/* Biaya Layanan - selalu tampil */}
                  {order.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6f5448]">Biaya Layanan</span>
                      <span className="text-[#4b2417]">{formatRupiah(order.serviceFee)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between border-t border-[#ead8ca] pt-2 font-bold">
                    <span className="text-[#4b2417]">Total</span>
                    <span className="text-[#d85b30]">{formatRupiah(order.total)}</span>
                  </div>

                  {/* Catatan tambahan untuk delivery */}
                  {order.deliveryMethod !== 'pickup' && (
                    <p className="mt-2 text-center text-xs text-[#8b7166]">
                      * Biaya pengiriman akan ditambahkan kemudian (diinfokan via WhatsApp)
                    </p>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold text-[#6f5448] uppercase tracking-wider">Status Pesanan</h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#4b2417]">Pesanan Dibuat</p>
                      <p className="text-xs text-[#6f5448]">{order.date} · {order.time}</p>
                    </div>
                  </div>
                  {order.status === 'processed' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">Sedang Diproses</p>
                        <p className="text-xs text-[#6f5448]">Estimasi selesai: {order.estimatedDate || '-'}</p>
                      </div>
                    </div>
                  )}
                  {order.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">Pesanan Selesai</p>
                        <p className="text-xs text-[#6f5448]">{order.completedDate || order.date}</p>
                      </div>
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">Pesanan Dibatalkan</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}