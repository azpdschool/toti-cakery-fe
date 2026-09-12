// src/pages/buyer/OrderDetailPage.tsx
import { useState, useEffect } from 'react'
import type React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  Store,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  User,
  Phone,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatRupiah } from '@/services/productService'
import {
  getBuyerOrderById,
  type BuyerOrder,
  getOrderPaymentStatus,
  type OrderStatus,
  processPayment,
} from '@/services/buyerOrderService'
import { ROUTES } from '@/constants'

const statusMap: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-50',
  },
  processed: {
    label: 'Sedang Diproses',
    icon: Package,
    color: 'text-blue-600 bg-blue-50',
  },
  shipped: {
    label: 'Dalam Perjalanan',
    icon: Truck,
    color: 'text-purple-600 bg-purple-50',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
  },
  ready: {
    label: 'Siap',
    icon: CheckCircle,
    color: 'text-teal-600 bg-teal-50',
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
  pickup: { label: 'Pickup (Ambil di Toko)', icon: Store },
  delivery_toko: { label: 'Delivery oleh Toko', icon: Truck },
  delivery_third_party: { label: 'Delivery Pihak Ketiga', icon: Send },
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()

  const [order, setOrder] = useState<BuyerOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null)

  const [showPayRemaining, setShowPayRemaining] = useState(false)
  const [payRemainingMethod, setPayRemainingMethod] = useState<'qris' | 'bank_transfer'>('qris')
  const [isPayingRemaining, setIsPayingRemaining] = useState(false)

  const handlePayRemaining = async () => {
    if (!order || !order.amountDue) return;
    setIsPayingRemaining(true);
    setError(null);
    try {
      const result = await processPayment(order.id, payRemainingMethod, 'dp', order.amountDue);
      
      const resultStatus = String(result.status ?? '').toLowerCase();
      const hasInstruction = !!(result.qris_url || result.va_number || result.midtrans_response?.redirect_url);

      if (resultStatus === 'pending' || resultStatus === 'success' || hasInstruction) {
        setPaymentInstructions(result);
        setShowPayRemaining(false);
      } else {
        setError('Gagal mendapatkan instruksi pembayaran untuk pelunasan');
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError('Gagal memproses pembayaran pelunasan: nominal tidak sesuai.');
      } else if (err.response?.status === 409) {
        setError('Terdapat tagihan pembayaran pelunasan yang aktif.');
      } else {
        setError('Gagal memproses pembayaran pelunasan. Silakan coba lagi.');
      }
    } finally {
      setIsPayingRemaining(false);
    }
  }

  useEffect(() => {
    async function loadOrder() {
      if (!id) {
        setError('ID pesanan tidak ditemukan')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getBuyerOrderById(id)

        if (!data) {
          setError('Pesanan tidak ditemukan')
        } else {
          setOrder(data)
          
          const needsPayment = data.paymentStatus === 'unpaid' || (data.paymentStatus === 'partial' && (data.amountDue === undefined || data.amountDue > 0));
          if (data.status !== 'cancelled' && needsPayment) {
            try {
              const paymentData = await getOrderPaymentStatus(id)
              if (paymentData.payments && paymentData.payments.length > 0) {
                // Find the latest pending payment
                const pendingPayment = paymentData.payments.reverse().find((p: any) => p.payment_status.toLowerCase() === 'pending');
                if (pendingPayment && (pendingPayment.qris_url || pendingPayment.va_number)) {
                  setPaymentInstructions(pendingPayment);
                } else {
                  setPaymentInstructions(null);
                }
              }
            } catch (err) {
              console.error('Gagal memuat status pembayaran:', err)
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat detail pesanan:', err)
        setError('Gagal memuat detail pesanan')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.role === 'buyer') {
      loadOrder()
    } else {
      setLoading(false)
    }
  }, [id, isAuthenticated, user])

  // Polling for payment status if there are instructions (pending payment)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkStatus() {
      if (!id || !paymentInstructions) return;
      try {
        const paymentData = await getOrderPaymentStatus(id);
        const pendingPayment = paymentData.payments?.reverse().find((p: any) => p.payment_status.toLowerCase() === 'pending');
        
        if (!pendingPayment) {
          // Payment is no longer pending (either success or failed)
          setPaymentInstructions(null);
          // Reload the order to get the latest amountPaid, amountDue, and paymentStatus
          const updatedOrder = await getBuyerOrderById(id);
          if (updatedOrder) {
            setOrder(updatedOrder);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }

    if (paymentInstructions) {
      intervalId = setInterval(checkStatus, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, paymentInstructions]);

  const getStatusBadge = (order: BuyerOrder) => {
    const status = order.status
    let info = statusMap[status] || statusMap.pending

    if (status === 'ready') {
      const label = order.deliveryMethod === 'pickup' ? 'Siap Diambil' : 'Siap Dikirim'
      info = { ...info, label }
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${info.color}`}
      >
        <info.icon className="h-4 w-4" />
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

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />

        <h2 className="mt-3 text-xl font-semibold text-gray-700">
          {error || 'Pesanan tidak ditemukan'}
        </h2>

        <Link
          to={ROUTES.ORDERS}
          className="mt-4 inline-block text-[#d85b30] transition hover:text-[#c04e28]"
        >
          Kembali ke daftar pesanan
        </Link>
      </div>
    )
  }

  const methodInfo = methodMap[order.deliveryMethod] || methodMap.pickup
  const isDelivery = order.deliveryMethod !== 'pickup'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to={ROUTES.ORDERS}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-[#6f5448] transition hover:text-[#4b2417]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar pesanan
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#ead8ca] bg-white shadow-sm">
        <div className="border-b border-[#ead8ca] bg-[#f8f4f0] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-[#4b2417]">
                {order.orderNumber}
              </h1>

              <p className="text-sm text-[#6f5448]">
                Dipesan {order.date} · {order.time}
              </p>
            </div>

            {getStatusBadge(order)}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                  Metode Pengiriman
                </h3>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e2d7]">
                    <methodInfo.icon className="h-5 w-5 text-[#d85b30]" />
                  </div>

                  <div>
                    <p className="font-medium text-[#4b2417]">
                      {methodInfo.label}
                    </p>

                    {isDelivery && order.address ? (
                      <p className="text-xs text-[#6f5448]">
                        {order.address}
                      </p>
                    ) : (
                      <p className="text-xs text-[#6f5448]">
                        Toti Cakery Batam
                      </p>
                    )}
                  </div>
                </div>

                {isDelivery && (
                  <div className="mt-3 space-y-1 border-t border-[#ead8ca] pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-[#6f5448]" />
                      <span className="text-[#4b2417]">
                        {order.recipientName || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#6f5448]" />
                      <span className="text-[#4b2417]">
                        {order.recipientPhone || '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                  Informasi Pembayaran
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">Metode</span>
                    <span className="font-medium capitalize text-[#4b2417]">
                      {order.paymentMethod}
                    </span>
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
                          ? 'DP Dibayar'
                          : 'Belum Dibayar'}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[#ead8ca] pt-2 font-bold">
                    <span className="text-[#4b2417]">Total</span>
                    <span className="text-[#d85b30]">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                  {order.amountPaid !== undefined && (
                    <div className="flex justify-between mt-1 text-sm">
                      <span className="text-[#6f5448]">Total Dibayar</span>
                      <span className="text-[#4b2417] font-medium">
                        {formatRupiah(order.amountPaid)}
                      </span>
                    </div>
                  )}
                  {order.amountDue !== undefined  && (
                    <div className="flex justify-between mt-1 text-sm font-bold">
                      <span className="text-[#4b2417]">Sisa Tagihan</span>
                      <span className="text-red-600">
                        {formatRupiah(order.amountDue)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bayar Sisa Tagihan */}
                {order.paymentStatus === 'partial' && order.amountDue !== undefined && order.amountDue > 0 && !paymentInstructions && (
                  <div className="mt-4 border-t border-[#ead8ca] pt-4">
                    {!showPayRemaining ? (
                      <button
                        onClick={() => setShowPayRemaining(true)}
                        className="flex h-10 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28]"
                      >
                        Bayar Sisa Tagihan
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-[#4b2417] mb-2">Pilih Metode Pelunasan</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPayRemainingMethod('qris')}
                              className={`flex-1 rounded-lg border-2 p-2 text-xs font-semibold ${payRemainingMethod === 'qris' ? 'border-[#d85b30] text-[#d85b30] bg-[#d85b30]/5' : 'border-gray-200 text-gray-600'}`}
                            >
                              QRIS
                            </button>
                            <button
                              onClick={() => setPayRemainingMethod('bank_transfer')}
                              className={`flex-1 rounded-lg border-2 p-2 text-xs font-semibold ${payRemainingMethod === 'bank_transfer' ? 'border-[#d85b30] text-[#d85b30] bg-[#d85b30]/5' : 'border-gray-200 text-gray-600'}`}
                            >
                              Bank Transfer
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowPayRemaining(false)}
                            disabled={isPayingRemaining}
                            className="flex-1 h-10 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handlePayRemaining}
                            disabled={isPayingRemaining}
                            className="flex-[2] flex h-10 items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
                          >
                            {isPayingRemaining ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              'Dapatkan Kode Bayar'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                    Catatan
                  </h3>

                  <p className="mt-2 text-sm text-[#6f5448]">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                  Item Pesanan ({order.items.length})
                </h3>

                <div className="mt-3 space-y-2">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-[#6f5448]">
                      Item pesanan tidak tersedia.
                    </p>
                  ) : (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between border-b border-[#ead8ca] pb-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-[#4b2417]">
                            {item.productName}
                          </p>

                          <p className="text-xs text-[#8b7166]">
                            {item.variantName} · {item.quantity} pcs
                          </p>
                        </div>

                        <span className="text-[#6f5448]">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 space-y-1 border-t border-[#ead8ca] pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">Subtotal</span>
                    <span className="text-[#4b2417]">
                      {formatRupiah(order.subtotal)}
                    </span>
                  </div>

                  {order.deliveryMethod !== 'pickup' && (
                    <div className="flex justify-between">
                      <span className="text-[#6f5448]">
                        Biaya Pengiriman
                      </span>
                      <span className="text-sm text-[#8b7166]">
                        Dihitung via WhatsApp
                      </span>
                    </div>
                  )}

                  {order.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6f5448]">Biaya Layanan</span>
                      <span className="text-[#4b2417]">
                        {formatRupiah(order.serviceFee)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-[#ead8ca] pt-2 font-bold">
                    <span className="text-[#4b2417]">Total</span>
                    <span className="text-[#d85b30]">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                  {order.amountPaid !== undefined && (
                    <div className="flex justify-between mt-1 text-sm">
                      <span className="text-[#6f5448]">Total Dibayar</span>
                      <span className="text-[#4b2417] font-medium">
                        {formatRupiah(order.amountPaid)}
                      </span>
                    </div>
                  )}
                  {order.amountDue !== undefined  && (
                    <div className="flex justify-between mt-1 text-sm font-bold">
                      <span className="text-[#4b2417]">Sisa Tagihan</span>
                      <span className="text-red-600">
                        {formatRupiah(order.amountDue)}
                      </span>
                    </div>
                  )}

                  {order.deliveryMethod !== 'pickup' && (
                    <p className="mt-2 text-center text-xs text-[#8b7166]">
                      * Biaya pengiriman akan ditambahkan kemudian dan
                      diinformasikan via WhatsApp.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                  Status Pesanan
                </h3>

                
                <div className="mt-3 space-y-3">
                  {paymentInstructions && (
                    <div className="mb-4 rounded-xl border-2 border-[#d85b30] bg-[#f8f4f0] p-4 text-center">
                      <h4 className="text-sm font-bold text-[#4b2417] mb-3">Lanjutkan Pembayaran</h4>
                      {paymentInstructions.qris_url ? (
                        <>
                          <p className="text-xs font-semibold text-[#6f5448] mb-2">Scan QRIS</p>
                          <img src={paymentInstructions.qris_url} alt="QRIS" className="mx-auto w-48 h-48 bg-white p-2 rounded-lg" />
                        </>
                      ) : paymentInstructions.va_number ? (
                        <>
                          <p className="text-xs font-semibold text-[#6f5448] mb-2">Virtual Account Bank Transfer</p>
                          <p className="text-2xl font-mono text-[#d85b30]">{paymentInstructions.va_number}</p>
                        </>
                      ) : null}
                      <p className="mt-2 text-xs text-[#8b7166]">
                        Silakan selesaikan pembayaran agar pesanan dapat diproses.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[#4b2417]">
                        Pesanan Dibuat
                      </p>
                      <p className="text-xs text-[#6f5448]">
                        {order.date} · {order.time}
                      </p>
                    </div>
                  </div>

                  {(order.status === 'processed' ||
                    order.status === 'shipped' ||
                    order.status === 'ready' ||
                    order.status === 'completed') && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">
                          Sedang Diproses
                        </p>
                        <p className="text-xs text-[#6f5448]">
                          Estimasi selesai: {order.estimatedDate || '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {(order.status === 'ready' ||
                    order.status === 'shipped' ||
                    order.status === 'completed') && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">
                          {order.deliveryMethod === 'pickup' ? 'Siap Diambil' : 'Siap Dikirim'}
                        </p>
                      </div>
                    </div>
                  )}

                  {(order.status === 'shipped' ||
                    order.status === 'completed') && order.deliveryMethod !== 'pickup' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                        <Truck className="h-4 w-4 text-purple-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">
                          Dalam Pengiriman
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">
                          Pesanan Selesai
                        </p>
                        <p className="text-xs text-[#6f5448]">
                          {order.completedDate || order.date}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">
                          Pesanan Dibatalkan
                        </p>
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
  )
}
