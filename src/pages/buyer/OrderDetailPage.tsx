// src/pages/buyer/OrderDetailPage.tsx
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import type React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
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
  Star,
  Upload,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { downloadInvoice } from '@/services/invoiceService'
import { Download } from 'lucide-react'
import { formatRupiah } from '@/services/productService'
import { submitReview, getProductReviews, deleteReviewImage } from '@/services/reviewService'
import type { ReviewResponse } from '@/api/review'
import {
  getBuyerOrderById,
  type BuyerOrder,
  getOrderPaymentStatus,
  type OrderStatus,
  processPayment,
} from '@/services/buyerOrderService'
import { ROUTES } from '@/constants'
import {
  PaymentMethodSelector,
  VirtualAccountPaymentCard,
  QrisPaymentCard,
  PaymentInstructions
} from '@/components/payment'

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
  refunded: {
    label: 'Dikembalikan',
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

  const { t, i18n } = useTranslation()
  const [order, setOrder] = useState<BuyerOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null)

  const [showPayRemaining, setShowPayRemaining] = useState(false)
  const [payRemainingMethod, setPayRemainingMethod] = useState<'qris' | 'bank_transfer'>('qris')
  const [isPayingRemaining, setIsPayingRemaining] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Review states
  const [reviewModalItem, setReviewModalItem] = useState<{ productId: string; productName: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [selectedLightBoxUrl, setSelectedLightBoxUrl] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())
  const [orderReviewsMap, setOrderReviewsMap] = useState<Record<string, ReviewResponse>>({})

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setIsDownloading(true);
    setError(null);
    try {
      const lang = i18n.language === 'en' ? 'en' : 'id'
      await downloadInvoice(order.id, lang);
    } catch (err: any) {
      setError(err.message || t('orders.invoice_download_failed'));
    } finally {
      setIsDownloading(false);
    }
  }

  const handlePayRemaining = async () => {
    if (!order) return;
    setIsPayingRemaining(true);
    setError(null);
    try {
      // paymentType is 'dp' if it's an unpaid order with preference 'dp', OR if it's a partial order paying the remaining half
      const isDp = (order.paymentStatus === 'unpaid' && String(order.paymentMethodPreference).toLowerCase() === 'dp') || order.paymentStatus === 'partial';
      const paymentType = isDp ? 'dp' : 'full';
      
      const amountToPay = (order.paymentStatus === 'unpaid' && isDp) 
        ? Math.round(order.total / 2) 
        : (order.amountDue || 0);

      const result = await processPayment(order.id, payRemainingMethod, paymentType, amountToPay);
      
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${t('review.invalid_format')}`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name}: ${t('review.file_too_large')}`);
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedImageFiles((prev) => [...prev, ...newFiles]);
    setSelectedImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  }

  const handleRemoveSelectedImage = (index: number) => {
    URL.revokeObjectURL(selectedImagePreviews[index]);
    setSelectedImageFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  const handleSubmitReview = async () => {
    if (!order || !reviewModalItem) return;
    if (reviewRating === 0) {
      setReviewError(t('review.rating_required'));
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError(t('review.review_required'));
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const newReview = await submitReview({
        orderId: Number(order.id),
        productId: Number(reviewModalItem.productId),
        rating: reviewRating,
        comment: reviewComment.trim(),
        images: selectedImageFiles.length > 0 ? selectedImageFiles : undefined,
      });
      
      toast.success(t('review.submitted_success'));
      setReviewedProductIds(prev => new Set(prev).add(reviewModalItem.productId));
      setOrderReviewsMap(prev => ({ ...prev, [reviewModalItem.productId]: newReview }));
      closeReviewModal();
    } catch (err: any) {
      toast.error(t('review.submit_failed'));
      setReviewError(err.response?.data?.detail || err.message || t('review.submit_failed'));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const handleDeleteReviewImage = async (reviewId: number, imageId: number, productId: string) => {
    setDeletingImageId(imageId);
    try {
      await deleteReviewImage(reviewId, imageId);
      toast.success('Foto ulasan berhasil dihapus.');
      setOrderReviewsMap(prev => {
        const currentRev = prev[productId];
        if (!currentRev) return prev;
        const updatedImages = (currentRev.images || []).filter(img => img.id !== imageId);
        return {
          ...prev,
          [productId]: {
            ...currentRev,
            images: updatedImages,
          },
        };
      });
    } catch (err: any) {
      toast.error('Gagal menghapus foto ulasan.');
    } finally {
      setDeletingImageId(null);
    }
  }

  const closeReviewModal = () => {
    selectedImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setReviewModalItem(null);
    setReviewRating(0);
    setReviewComment('');
    setSelectedImageFiles([]);
    setSelectedImagePreviews([]);
    setReviewError(null);
  }

  useEffect(() => {
    async function loadOrder() {
      if (!id) {
        setError(t('order_detail.not_found'))
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getBuyerOrderById(id)

        if (!data) {
          setError(t('order_detail.not_found'))
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

          if (data.status === 'completed') {
            try {
              const uniqueProductIds = Array.from(new Set(data.items.map(item => Number(item.productId)).filter(Boolean)));
              const reviewsPromises = uniqueProductIds.map(pid => getProductReviews(pid));
              const reviewsResults = await Promise.all(reviewsPromises);
              
              const reviewedSet = new Set<string>();
              const revMap: Record<string, ReviewResponse> = {};
              reviewsResults.forEach(reviews => {
                 reviews.forEach(r => {
                    if (String(r.order_id) === String(data.id)) {
                       reviewedSet.add(String(r.product_id));
                       revMap[String(r.product_id)] = r;
                    }
                 });
              });
              setReviewedProductIds(reviewedSet);
              setOrderReviewsMap(revMap);
            } catch (err) {
              console.error("Gagal memuat status review produk:", err);
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat detail pesanan:', err)
        setError(t('order_detail.failed_load'))
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
      const label = order.deliveryMethod === 'pickup' ? t('orders.ready_pickup') : t('orders.ready_delivery')
      info = { ...info, label }
    } else {
      info = { ...info, label: t(`orders.status_${status}`) }
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
          {error || t('order_detail.not_found')}
        </h2>

        <Link
          to={ROUTES.ORDERS}
          className="mt-4 inline-block text-[#d85b30] transition hover:text-[#c04e28]"
        >
          {t('order_detail.back_to_list')}
        </Link>
      </div>
    )
  }

  const methodInfo = methodMap[order.deliveryMethod] || methodMap.pickup
  const isDelivery = order.deliveryMethod !== 'pickup'

  const activePaymentAmount = paymentInstructions?.jumlah_bayar 
    ?? paymentInstructions?.amount 
    ?? ((order.paymentStatus === 'unpaid' && String(order.paymentMethodPreference).toLowerCase() === 'dp')
      ? Math.round(order.total / 2)
      : (order.amountDue || 0));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to={ROUTES.ORDERS}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-[#6f5448] transition hover:text-[#4b2417]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('order_detail.back_to_list')}
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#ead8ca] bg-white shadow-sm">
        <div className="border-b border-[#ead8ca] bg-[#f8f4f0] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-[#4b2417]">
                {order.orderNumber}
              </h1>

              <p className="text-sm text-[#6f5448]">
                {t('order_detail.ordered_on')} {order.date} · {order.time}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge(order)}
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex items-center gap-1.5 rounded-lg border border-[#d85b30] bg-white px-3 py-1.5 text-xs font-semibold text-[#d85b30] transition hover:bg-[#fff9f6] disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('order_detail.downloading')}
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    {t('order_detail.download_invoice')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 items-start">
            <div>
              <div className="rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                  {t('order_detail.shipping_method')}
                </h3>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e2d7]">
                    <methodInfo.icon className="h-5 w-5 text-[#d85b30]" />
                  </div>

                  <div>
                    <p className="font-medium text-[#4b2417]">
                      {t(`orders.method_${order.deliveryMethod}`)}
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
                  {t('order_detail.payment_information')}
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">{t('checkout.payment_preference')}</span>
                    <span className="font-medium capitalize text-[#4b2417]">
                      {String(order.paymentMethodPreference).toLowerCase() === 'dp' ? t('checkout.pay_dp_label') : t('checkout.pay_full_label')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">{t('order_detail.method')}</span>
                    <span className="font-medium text-[#4b2417]">
                      {(() => {
                        const activeMethod = paymentInstructions?.payment_method || (order.paymentChannel !== '-' ? order.paymentChannel : null);
                        if (activeMethod === 'qris') return t('checkout.qris');
                        if (activeMethod === 'bank_transfer') return t('checkout.bca_va');
                        return i18n.language === 'en' ? 'Not selected' : 'Belum dipilih';
                      })()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#6f5448]">{t('order_detail.status')}</span>
                    <span
                      className={`font-medium capitalize ${
                        order.paymentStatus === 'paid'
                          ? 'text-green-600'
                          : order.paymentStatus === 'partial'
                            ? 'text-yellow-600'
                            : order.paymentStatus === 'refunded'
                              ? 'text-gray-500'
                              : 'text-red-600'
                      }`}
                    >
                      {order.paymentStatus === 'paid'
                        ? t('order_detail.paid')
                        : order.paymentStatus === 'partial'
                          ? t('order_detail.dp_paid')
                          : order.paymentStatus === 'refunded'
                            ? t('orders.status_refunded')
                            : t('order_detail.unpaid')}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[#ead8ca] pt-2 font-bold">
                    <span className="text-[#4b2417]">{t('checkout.due_now')}</span>
                    <span className="text-red-600">
                      {formatRupiah(activePaymentAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between mt-1 text-sm">
                    <span className="text-[#6f5448]">{t('order_detail.total_paid')}</span>
                    <span className="text-[#4b2417] font-medium">
                      {formatRupiah(order.amountPaid || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between mt-1 text-sm">
                    <span className="text-[#6f5448]">{t('order_detail.remaining_bill')}</span>
                    <span className="text-[#4b2417] font-medium">
                      {formatRupiah(order.amountDue || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between mt-1 text-sm font-bold">
                    <span className="text-[#4b2417]">{t('order_detail.total')}</span>
                    <span className="text-[#d85b30]">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                </div>

                {/* Pembayaran Tagihan (Unpaid / Partial) */}
                {(order.paymentStatus === 'unpaid' || (order.paymentStatus === 'partial' && order.amountDue !== undefined && order.amountDue > 0)) && !paymentInstructions && (
                  <div className="mt-4 border-t border-[#ead8ca] pt-4">
                    {!showPayRemaining ? (
                      <button
                        onClick={() => setShowPayRemaining(true)}
                        className="flex h-10 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28]"
                      >
                        {order.paymentStatus === 'unpaid' ? t('checkout.continue_payment') : t('order_detail.pay_remaining')}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <PaymentMethodSelector
                          selectedMethod={payRemainingMethod}
                          onSelect={setPayRemainingMethod}
                          disabled={isPayingRemaining}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowPayRemaining(false)}
                            disabled={isPayingRemaining}
                            className="flex-1 h-10 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {t('order_detail.cancel')}
                          </button>
                          <button
                            onClick={handlePayRemaining}
                            disabled={isPayingRemaining}
                            className="flex-[2] flex h-10 items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
                          >
                            {isPayingRemaining ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('order_detail.processing')}
                              </>
                            ) : (
                              t('order_detail.get_pay_code')
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
                    {t('order_detail.notes')}
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
                  {t('order_detail.items')} ({order.items.length})
                </h3>

                <div className="mt-3 space-y-2">
                  {order.items.length === 0 ? (
                    <p className="text-sm text-[#6f5448]">
                      {t('order_detail.item_unavailable')}
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

                          {order.status === 'completed' && item.productId && (
                            <div className="mt-2 space-y-2">
                              {reviewedProductIds.has(item.productId) ? (
                                <div>
                                  <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    {t('review.already_reviewed')}
                                  </span>
                                  {orderReviewsMap[item.productId] && (
                                    <div className="mt-1 text-xs text-[#6f5448] bg-[#f8f4f0] p-2.5 rounded-lg border border-[#ead8ca]">
                                      <div className="flex items-center gap-1 text-[#f59e0b] font-bold mb-1">
                                        {'★'.repeat(orderReviewsMap[item.productId].rating)}
                                      </div>
                                      <p>{orderReviewsMap[item.productId].comment}</p>
                                      {orderReviewsMap[item.productId].images && orderReviewsMap[item.productId].images!.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {orderReviewsMap[item.productId].images!.map((img) => (
                                            <div key={img.id} className="relative group h-12 w-12 rounded-lg overflow-hidden border border-[#ead8ca]">
                                              <img
                                                src={img.image_url}
                                                alt="Review"
                                                className="h-full w-full object-cover cursor-pointer"
                                                onClick={() => setSelectedLightBoxUrl(img.image_url)}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteReviewImage(orderReviewsMap[item.productId!].id, img.id, item.productId!)}
                                                disabled={deletingImageId === img.id}
                                                title={t('review.remove_photo')}
                                                className="absolute top-0.5 right-0.5 bg-red-600/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                                              >
                                                {deletingImageId === img.id ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <Trash2 className="h-3 w-3" />
                                                )}
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => setReviewModalItem({ productId: item.productId!, productName: item.productName })}
                                  className="flex items-center gap-1 rounded-md border border-[#d85b30] px-2 py-1 text-xs font-semibold text-[#d85b30] transition hover:bg-[#fff9f6]"
                                >
                                  <Star className="h-3.5 w-3.5" />
                                  {t('review.give_review')}
                                </button>
                              )}
                            </div>
                          )}
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
                    <span className="text-[#6f5448]">{t('order_detail.subtotal')}</span>
                    <span className="text-[#4b2417]">
                      {formatRupiah(order.subtotal)}
                    </span>
                  </div>

                  {order.deliveryMethod !== 'pickup' && (
                    <div className="flex justify-between">
                      <span className="text-[#6f5448]">
                        {t('order_detail.shipping_fee')}
                      </span>
                      <span className="text-sm text-[#8b7166]">
                        {t('order_detail.calculated_via_wa')}
                      </span>
                    </div>
                  )}

                  {order.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#6f5448]">{t('order_detail.service_fee')}</span>
                      <span className="text-[#4b2417]">
                        {formatRupiah(order.serviceFee)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-[#ead8ca] pt-2 font-bold">
                    <span className="text-[#4b2417]">{t('order_detail.total', 'Total')}</span>
                    <span className="text-[#d85b30]">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                  {order.amountPaid !== undefined && (
                    <div className="flex justify-between mt-1 text-sm">
                      <span className="text-[#6f5448]">{t('order_detail.total_paid', 'Total Dibayar')}</span>
                      <span className="text-[#4b2417] font-medium">
                        {formatRupiah(order.amountPaid)}
                      </span>
                    </div>
                  )}
                  {order.amountDue !== undefined  && (
                    <div className="flex justify-between mt-1 text-sm font-bold">
                      <span className="text-[#4b2417]">{t('order_detail.remaining_bill', 'Sisa Tagihan')}</span>
                      <span className="text-red-600">
                        {formatRupiah(order.amountDue)}
                      </span>
                    </div>
                  )}

                  {order.deliveryMethod !== 'pickup' && (
                    <p className="mt-2 text-center text-xs text-[#8b7166]">
                      {t('order_detail.shipping_fee_note')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#ead8ca] p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                  {t('order_detail.status')}
                </h3>

                
                <div className="mt-3 space-y-3">
                  {paymentInstructions && (
                    <div className="mb-4 grid gap-4">
                      {paymentInstructions.qris_url ? (
                        <QrisPaymentCard qrisUrl={paymentInstructions.qris_url} amount={activePaymentAmount} />
                      ) : paymentInstructions.va_number ? (
                        <VirtualAccountPaymentCard bankName="BCA" vaNumber={paymentInstructions.va_number} amount={activePaymentAmount} />
                      ) : null}
                      <PaymentInstructions method={paymentInstructions.qris_url ? 'qris' : 'bank_transfer'} />
                    </div>
                  )}

                  <div className="flex items-center gap-3">

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[#4b2417]">
                        {t('order_detail.status_created')}
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
                          {t('orders.status_processed')}
                        </p>
                        <p className="text-xs text-[#6f5448]">
                          {t('order_detail.estimated_completion')}: {order.estimatedDate || '-'}
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
                          {order.deliveryMethod === 'pickup' ? t('order_detail.ready_pickup') : t('order_detail.ready_delivery')}
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
                          {t('order_detail.in_delivery')}
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
                          {t('order_detail.status_completed')}
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
                          {t('order_detail.status_cancelled')}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === 'refunded' && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#4b2417]">
                          {t('order_detail.status_refunded')}
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

      {reviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#4b2417]">
              {t('review.give_review')} — {reviewModalItem.productName}
            </h2>

            {reviewError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {reviewError}
              </div>
            )}

            <div className="mt-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${t('review.rating')} ${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      reviewRating >= star
                        ? 'fill-[#f59e0b] text-[#f59e0b]'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-[#6f5448]">
                {t('review.product_review')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t('review.placeholder')}
                className="w-full rounded-xl border border-[#ead8ca] p-3 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
              ></textarea>
            </div>

            {/* Photo Upload Section */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[#6f5448]">
                {t('review.review_photos')}
              </label>
              
              <div className="flex flex-wrap gap-2.5 items-center">
                {selectedImagePreviews.map((previewUrl, index) => (
                  <div key={index} className="relative h-16 w-16 rounded-xl overflow-hidden border border-[#ead8ca] group">
                    <img src={previewUrl} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedImage(index)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                      title={t('review.remove_photo')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#ead8ca] bg-[#f8f4f0] text-[#6f5448] transition hover:border-[#d85b30] hover:text-[#d85b30]">
                  <Upload className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-bold">{t('review.add_photos')}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-1.5 text-[11px] text-[#8b7166]">
                JPG, PNG, WEBP (Maks 5 MB per file)
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeReviewModal}
                disabled={isSubmittingReview}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('review.cancel')}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                className="flex flex-1 items-center justify-center rounded-xl bg-[#d85b30] py-2.5 text-sm font-bold text-white hover:bg-[#c04e28] disabled:opacity-60"
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('review.submitting')}
                  </>
                ) : (
                  t('review.submit_review')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedLightBoxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedLightBoxUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={selectedLightBoxUrl} alt="Enlarged review photo" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <button
              onClick={() => setSelectedLightBoxUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 focus:outline-none"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
