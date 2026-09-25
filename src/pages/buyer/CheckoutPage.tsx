import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Store, Send, AlertCircle, Loader2, CreditCard, Banknote
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/services/productService';
import { createOrder, processPayment, getOrderPaymentStatus, type DeliveryMethod, type PaymentMethod, getBuyerOrderById } from '@/services/buyerOrderService';
import { ROUTES } from '@/constants';
import {
  PaymentStatusHeader, PaymentSummaryCard, PaymentMethodSelector,
  VirtualAccountPaymentCard, QrisPaymentCard, PaymentInstructions, PaymentSupportCard
} from '@/components/payment';

type CheckoutStep = 'form' | 'payment';

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, totalPrice, clearCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.AUTH_BUYER);
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState<CheckoutStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(() => sessionStorage.getItem('checkout_pending_order_id'));
  const [midtransMethod, setMidtransMethod] = useState<'qris' | 'bank_transfer'>('qris');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    deliveryMethod: 'pickup' as DeliveryMethod,
    recipientName: user?.name || '',
    recipientPhone: user?.phone || '',
    address: '',
    notes: '',
    paymentMethod: 'lunas' as PaymentMethod,
  });

  const deliveryFee = 0;
  const serviceFee = 0;
  const subtotal = totalPrice;
  const total = subtotal + deliveryFee + serviceFee;
  const payableAmount = useMemo(() => formData.paymentMethod === 'dp' ? Math.round(total / 2) : total, [formData.paymentMethod, total]);

  const [confirmedOrderData, setConfirmedOrderData] = useState<{
    total: number;
    amountDue: number;
    amountPaid?: number;
    paymentMethod: PaymentMethod;
  } | null>(null);
  const [paymentStatusStr, setPaymentStatusStr] = useState<string>('unpaid');

  // Handle restoring pending order state
  useEffect(() => {
    async function restorePendingOrder() {
      if (orderId && step === 'form') {
        setIsLoading(true);
        try {
          const order = await getBuyerOrderById(orderId);
          if (order && order.status !== 'cancelled' && order.status !== 'refunded') {
            if (order.paymentStatus === 'paid' || order.paymentStatus === 'partial' || order.status === 'completed') {
              sessionStorage.removeItem('checkout_pending_order_id');
              navigate(`/orders/${orderId}`);
              return;
            }
            
            // Still unpaid, restore state
            setConfirmedOrderData({
              total: order.total,
              amountDue: ((order.amountPaid || 0) === 0 && order.paymentMethodPreference === 'dp') 
                ? Math.round(order.total / 2) 
                : (order.amountDue !== undefined ? order.amountDue : order.total),
              amountPaid: order.amountPaid || 0,
              paymentMethod: order.paymentMethodPreference as PaymentMethod
            });
            setFormData(prev => ({
              ...prev,
              paymentMethod: order.paymentMethodPreference as PaymentMethod
            }));
            
            // Try fetching existing instructions
            const paymentData = await getOrderPaymentStatus(orderId);
            if (paymentData.payments?.length) {
              const pendingPayment = paymentData.payments.reverse().find((p: any) => p.payment_status.toLowerCase() === 'pending');
              if (pendingPayment && (pendingPayment.qris_url || pendingPayment.va_number)) {
                setPaymentResult(pendingPayment);
              }
            }
            setStep('payment');
          } else {
            sessionStorage.removeItem('checkout_pending_order_id');
            setOrderId(null);
          }
        } catch (err) {
          sessionStorage.removeItem('checkout_pending_order_id');
          setOrderId(null);
        } finally {
          setIsLoading(false);
        }
      }
    }
    restorePendingOrder();
  }, [orderId, navigate, step]);

  // Polling payment
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (step === 'payment' && orderId) {
      intervalId = setInterval(async () => {
        try {
          const status = await getOrderPaymentStatus(orderId);
          if (status.invoice_status) {
            setPaymentStatusStr(status.invoice_status);
            if (status.invoice_status === 'paid' || status.invoice_status === 'partial') {
              clearInterval(intervalId);
              sessionStorage.removeItem('checkout_pending_order_id');
              navigate(`/orders/${orderId}`);
            }
          }
        } catch (err: any) {}
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [step, orderId, navigate]);

  // Restrict going back if empty cart & no pending order
  useEffect(() => {
    if (items.length === 0 && isAuthenticated && step === 'form' && !orderId) {
      navigate('/catalog');
    }
  }, [items, isAuthenticated, navigate, step, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (items.some(item => item.isAvailable === false)) {
      setError(t('checkout.cart_changed'));
      return;
    }

    if (formData.deliveryMethod !== 'pickup') {
      if (!formData.address.trim() || !formData.recipientName.trim() || !formData.recipientPhone.trim()) {
        setError(t('checkout.form_incomplete'));
        return;
      }
    }

    setIsLoading(true);
    try {
      const orderItems = items.map((item) => ({
        id: `item-${Date.now()}-${item.productId}`,
        productId: item.productId,
        productName: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const order = await createOrder({
        items: orderItems,
        total,
        subtotal,
        deliveryFee,
        serviceFee,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        address: formData.address,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        notes: formData.notes,
      });

      setOrderId(order.id);
      sessionStorage.setItem('checkout_pending_order_id', order.id);
      setConfirmedOrderData({
        total: order.total,
        amountDue: ((order.amountPaid || 0) === 0 && order.paymentMethodPreference === 'dp')
          ? Math.round(order.total / 2)
          : (order.amountDue !== undefined ? order.amountDue : order.total),
        amountPaid: order.amountPaid || 0,
        paymentMethod: order.paymentMethodPreference as PaymentMethod
      });
      clearCart();
      setStep('payment');
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response?.data?.detail || t('checkout.cart_changed'));
        // (Refresh logic omitted for brevity, user can go to cart)
      } else if (err.response?.status === 409) {
        setError(t('checkout.active_unpaid_order'));
      } else {
        setError(t('checkout.failed_create_order'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await processPayment(
        orderId, 
        midtransMethod, 
        confirmedOrderData?.paymentMethod || formData.paymentMethod, 
        confirmedOrderData?.amountDue || payableAmount
      );
      
      const resultStatus = String(result.status ?? '').toLowerCase();
      const hasInstruction = !!(result.qris_url || result.va_number || result.midtrans_response?.redirect_url);

      if (resultStatus === 'pending' || resultStatus === 'success' || hasInstruction) {
        setPaymentResult(result);
        setPaymentStatusStr('pending');
      } else {
        setError(t('checkout.failed_get_instruction'));
      }
    } catch (err: any) {
      setError(t('checkout.failed_process_payment'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (step === 'payment') {
    const isPendingInstruction = paymentResult && (paymentResult.qris_url || paymentResult.va_number);
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-black text-[#4b2417]">{t('checkout.payment_title')}</h1>
          {/* Cannot go back easily if order is already created, so we don't show back arrow to form */}
        </div>

        <PaymentStatusHeader status={paymentStatusStr} isPolling={!!paymentResult} />

        <div className="grid gap-6">
          <PaymentSummaryCard
            orderNumber={orderId || ''}
            total={confirmedOrderData?.total || total}
            paymentPreference={confirmedOrderData?.paymentMethod || formData.paymentMethod}
            amountDue={confirmedOrderData?.amountDue || payableAmount}
            amountPaid={confirmedOrderData?.amountPaid}
          />

          {!paymentResult && (
            <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
              <PaymentMethodSelector
                selectedMethod={midtransMethod}
                onSelect={setMidtransMethod}
                disabled={isLoading}
              />
              
              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('checkout.processing')}</>
                ) : (
                  t('checkout.continue_payment')
                )}
              </button>
            </div>
          )}

          {isPendingInstruction && (
            <>
              {paymentResult.qris_url ? (
                <QrisPaymentCard qrisUrl={paymentResult.qris_url} amount={confirmedOrderData?.amountDue || payableAmount} />
              ) : paymentResult.va_number ? (
                <VirtualAccountPaymentCard bankName="BCA" vaNumber={paymentResult.va_number} amount={confirmedOrderData?.amountDue || payableAmount} />
              ) : null}
              
              <PaymentInstructions method={paymentResult.qris_url ? 'qris' : 'bank_transfer'} />
              
              <div className="rounded-2xl border border-[#ead8ca] bg-[#f8f4f0] p-5 text-center shadow-sm">
                <h4 className="font-bold text-[#4b2417] mb-2">{t('checkout.what_happens_next')}</h4>
                <p className="text-sm text-[#6f5448]">{t('checkout.what_happens_next_desc')}</p>
                <p className="mt-3 text-xs font-semibold text-[#d85b30] bg-white inline-block px-3 py-1 rounded-full border border-[#ead8ca]">{t('checkout.please_pay')}</p>
              </div>
            </>
          )}

          <PaymentSupportCard />
          
          <div className="text-center pt-2">
            <Link
              to={ROUTES.ORDERS}
              onClick={() => sessionStorage.removeItem('checkout_pending_order_id')}
              className="text-sm font-semibold text-[#6f5448] hover:text-[#d85b30] underline underline-offset-4"
            >
              {t('checkout.view_order')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to={ROUTES.CART} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#6f5448] hover:text-[#d85b30] transition">
        <ArrowLeft className="h-4 w-4" />
        {t('checkout.back')}
      </Link>

      <h1 className="text-3xl font-black text-[#4b2417] mb-6">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca]">
            <h2 className="text-lg font-bold text-[#4b2417] mb-4">{t('checkout.shipping_method')}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                  formData.deliveryMethod === 'pickup' ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]' : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Store className="h-5 w-5 mb-1" />
                <span className="font-semibold text-sm">{t('checkout.pickup')}</span>
                <span className="text-xs font-bold text-green-600">{t('checkout.free')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery_toko' })}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                  formData.deliveryMethod === 'delivery_toko' ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]' : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Truck className="h-5 w-5 mb-1" />
                <span className="font-semibold text-sm">{t('checkout.delivery_toko')}</span>
                <span className="text-xs text-[#8b7166]">{t('checkout.calculated_via_wa')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery_third_party' })}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                  formData.deliveryMethod === 'delivery_third_party' ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]' : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Send className="h-5 w-5 mb-1" />
                <span className="font-semibold text-sm">{t('checkout.delivery_third_party')}</span>
                <span className="text-xs text-[#8b7166]">{t('checkout.calculated_via_wa')}</span>
              </button>
            </div>
          </div>

          {formData.deliveryMethod !== 'pickup' && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca]">
              <h2 className="text-lg font-bold text-[#4b2417] mb-4">{t('checkout.recipient_data')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4b2417] mb-1">{t('checkout.recipient_name')}</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4b2417] mb-1">{t('checkout.phone_number')}</label>
                  <input
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4b2417] mb-1">{t('checkout.full_address')}</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30] transition"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca]">
            <h2 className="text-lg font-bold text-[#4b2417] mb-4">{t('checkout.notes')}</h2>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-[#d0bfaf] px-4 py-3 text-sm outline-none focus:border-[#d85b30] transition"
              placeholder={t('checkout.notes_placeholder')}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca]">
            <h2 className="text-lg font-bold text-[#4b2417] mb-4">{t('checkout.payment_preference')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'lunas' })}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                  formData.paymentMethod === 'lunas' ? 'border-[#d85b30] bg-[#d85b30]/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className={`h-5 w-5 ${formData.paymentMethod === 'lunas' ? 'text-[#d85b30]' : 'text-[#6f5448]'}`} />
                  <span className={`font-bold text-sm ${formData.paymentMethod === 'lunas' ? 'text-[#d85b30]' : 'text-[#4b2417]'}`}>{t('checkout.pay_full_label')}</span>
                </div>
                <span className="text-xs text-[#6f5448]">{t('checkout.pay_full')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'dp' })}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                  formData.paymentMethod === 'dp' ? 'border-[#d85b30] bg-[#d85b30]/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className={`h-5 w-5 ${formData.paymentMethod === 'dp' ? 'text-[#d85b30]' : 'text-[#6f5448]'}`} />
                  <span className={`font-bold text-sm ${formData.paymentMethod === 'dp' ? 'text-[#d85b30]' : 'text-[#4b2417]'}`}>{t('checkout.pay_dp_label')}</span>
                </div>
                <span className="text-xs text-[#6f5448]">{t('checkout.pay_dp')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 md:max-w-xs xl:max-w-sm">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca] sticky top-24">
            <h2 className="text-lg font-bold text-[#4b2417] mb-4">{t('checkout.order_summary')}</h2>
            
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />}
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-[#4b2417] line-clamp-1">{item.name}</p>
                    <p className="text-xs text-[#6f5448]">{item.variantName} &times; {item.quantity}</p>
                  </div>
                  <div className="font-semibold text-[#4b2417] text-sm">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-[#ead8ca] pt-4">
              <div className="flex justify-between">
                <span className="text-[#6f5448]">{t('checkout.subtotal')}</span>
                <span className="font-semibold text-[#4b2417]">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f5448]">{t('checkout.shipping_fee')}</span>
                <span className="font-semibold text-[#8b7166]">{formData.deliveryMethod === 'pickup' ? t('checkout.free') : t('checkout.calculated_via_wa')}</span>
              </div>
              
              <div className="flex justify-between border-t border-[#ead8ca] pt-3 mt-3 mb-2">
                <span className="font-bold text-[#4b2417]">{t('checkout.total')}</span>
                <span className="font-black text-[#4b2417]">{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#f8f4f0] p-4 mt-4 border border-[#ead8ca] flex justify-between items-center">
              <span className="font-bold text-[#6f5448] text-sm">{t('checkout.due_now')}</span>
              <span className="font-black text-2xl text-[#d85b30]">{formatRupiah(payableAmount)}</span>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60 shadow-md shadow-[#d85b30]/20"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('checkout.processing')}</>
              ) : (
                t('checkout.place_order_continue')
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
