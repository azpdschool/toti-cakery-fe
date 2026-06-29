// src/pages/buyer/CheckoutPage.tsx

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Store,
  Send,
  CreditCard,
  Banknote,
  AlertCircle,
  CheckCircle,
  Loader2,
  QrCode,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/services/productService';
import { createOrder, simulatePayment, type DeliveryMethod, type PaymentMethod } from '@/services/buyerOrderService';
import { ROUTES } from '@/constants';

type CheckoutStep = 'form' | 'payment' | 'success';

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();

  // Protected route
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/buyer');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (items.length === 0 && isAuthenticated) {
      navigate('/catalog');
    }
  }, [items, isAuthenticated, navigate]);

  const [step, setStep] = useState<CheckoutStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    deliveryMethod: 'pickup' as DeliveryMethod,
    recipientName: user?.name || '',
    recipientPhone: user?.phone || '',
    address: '',
    notes: '',
    paymentMethod: 'lunas' as PaymentMethod,
  });

  // 🚚 Biaya pengiriman = 0 (akan diinfokan via WhatsApp)
  const deliveryFee = 0;
  // 💰 Biaya layanan = 0 (dihapus)
  const serviceFee = 0;
  const subtotal = totalPrice;
  const total = subtotal + deliveryFee + serviceFee; // = subtotal

  // Jumlah yang harus dibayar (jika DP, 50% dari total)
  const payableAmount = useMemo(() => {
    if (formData.paymentMethod === 'dp') {
      return Math.round(total / 2);
    }
    return total;
  }, [formData.paymentMethod, total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.deliveryMethod !== 'pickup') {
      if (!formData.address.trim()) {
        setError('Alamat pengiriman wajib diisi');
        return;
      }
      if (!formData.recipientName.trim()) {
        setError('Nama penerima wajib diisi');
        return;
      }
      if (!formData.recipientPhone.trim()) {
        setError('Nomor telepon penerima wajib diisi');
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
      setStep('payment');
    } catch (err) {
      setError('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await simulatePayment(orderId);
      if (result.success) {
        clearCart();
        setStep('success');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Gagal memproses pembayaran. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  // Step: Payment
  if (step === 'payment') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => setStep('form')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#6f5448] hover:text-[#4b2417] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca]">
          <h1 className="text-2xl font-black text-[#4b2417]">Pembayaran</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            {formData.paymentMethod === 'dp'
              ? 'Lakukan pembayaran DP 50% untuk memproses pesanan Anda'
              : 'Selesaikan pembayaran untuk memproses pesanan Anda'}
          </p>

          <div className="mt-6 rounded-xl bg-[#f8f4f0] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6f5448]">
                {formData.paymentMethod === 'dp' ? 'Total DP (50%)' : 'Total Pembayaran'}
              </span>
              <span className="text-2xl font-black text-[#d85b30]">{formatRupiah(payableAmount)}</span>
            </div>
            {formData.deliveryMethod !== 'pickup' && (
              <p className="mt-2 text-xs text-[#8b7166] text-center">
                * Biaya pengiriman akan diinfokan melalui WhatsApp setelah pesanan dibuat
              </p>
            )}
            {formData.paymentMethod === 'dp' && (
              <p className="mt-1 text-xs text-[#8b7166] text-center">
                * Sisa pembayaran Rp {formatRupiah(total - payableAmount)} akan dibayarkan saat pickup/delivery
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[#ead8ca] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d85b30]/10">
                  <QrCode className="h-6 w-6 text-[#d85b30]" />
                </div>
                <div>
                  <p className="font-semibold text-[#4b2417]">QRIS</p>
                  <p className="text-xs text-[#6f5448]">Scan QR Code untuk membayar</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <div className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-[#d0bfaf] bg-gray-50">
                  <div className="text-center">
                    <QrCode className="mx-auto h-16 w-16 text-[#6f5448]" />
                    <p className="mt-2 text-xs text-[#8b7166]">QR Code Simulasi</p>
                    <p className="text-xs font-mono text-[#d85b30]">{orderId?.slice(0, 8) || 'ORD-XXXX'}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[#8b7166]">
                Scan QRIS di atas atau transfer ke rekening yang tersedia
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Pembayaran...
                </>
              ) : (
                'Saya Sudah Bayar'
              )}
            </button>

            <p className="text-center text-xs text-[#8b7166]">
              Klik tombol di atas setelah melakukan pembayaran
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step: Success
  if (step === 'success') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-[#ead8ca]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-[#4b2417]">
            {formData.paymentMethod === 'dp' ? 'DP Berhasil Dibayar! 🎉' : 'Pembayaran Berhasil! 🎉'}
          </h1>
          <p className="mt-2 text-sm text-[#6f5448]">
            {formData.paymentMethod === 'dp'
              ? 'DP Anda telah diterima. Pesanan akan segera diproses.'
              : 'Pesanan Anda telah diterima dan akan segera diproses.'}
          </p>
          <p className="mt-1 text-xs text-[#8b7166]">
            Nomor Pesanan: <span className="font-mono font-bold">{orderId?.slice(0, 8) || 'ORD-XXXX'}</span>
          </p>
          {formData.deliveryMethod !== 'pickup' && (
            <p className="mt-2 text-xs text-[#d85b30]">
              📦 Biaya pengiriman akan diinfokan melalui WhatsApp
            </p>
          )}
          {formData.paymentMethod === 'dp' && (
            <p className="mt-1 text-xs text-[#8b7166]">
              Sisa pembayaran Rp {formatRupiah(total - payableAmount)} akan dibayarkan saat pickup/delivery
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={ROUTES.ORDERS}
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] transition"
            >
              Lihat Pesanan Saya
            </Link>
            <Link
              to={ROUTES.HOME}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step: Form
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to={ROUTES.CART} className="mb-6 flex items-center gap-2 text-sm font-medium text-[#6f5448] hover:text-[#4b2417] transition">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Keranjang
      </Link>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#ead8ca]">
        <h1 className="text-2xl font-black text-[#4b2417]">Checkout</h1>
        <p className="mt-1 text-sm text-[#6f5448]">
          Lengkapi data pesanan Anda
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Metode Pengiriman */}
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Metode Pengiriman <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm transition ${
                  formData.deliveryMethod === 'pickup'
                    ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]'
                    : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Store className="h-5 w-5" />
                Pickup
                <span className="text-xs font-medium text-green-600">Gratis</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery_toko' })}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm transition ${
                  formData.deliveryMethod === 'delivery_toko'
                    ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]'
                    : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Truck className="h-5 w-5" />
                Delivery Toko
                <span className="text-xs font-medium text-[#8b7166]">(biaya via WA)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery_third_party' })}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm transition ${
                  formData.deliveryMethod === 'delivery_third_party'
                    ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]'
                    : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Send className="h-5 w-5" />
                Third Party
                <span className="text-xs font-medium text-[#8b7166]">(biaya via WA)</span>
              </button>
            </div>
            {formData.deliveryMethod !== 'pickup' && (
              <p className="mt-2 text-xs text-[#8b7166]">
                📦 Biaya pengiriman akan diinfokan melalui WhatsApp setelah pesanan dibuat
              </p>
            )}
          </div>

          {/* Data Penerima (jika bukan pickup) */}
          {formData.deliveryMethod !== 'pickup' && (
            <div className="space-y-4 rounded-xl bg-[#f8f4f0] p-4">
              <h3 className="text-sm font-bold text-[#4b2417]">Data Penerima</h3>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="Nama lengkap penerima"
                  className="mt-1 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-2 text-sm outline-none focus:border-[#c95b31]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="0812-3456-7890"
                  className="mt-1 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-2 text-sm outline-none focus:border-[#c95b31]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Kue Manis No. 25, Kelurahan, Kecamatan, Kota"
                  className="mt-1 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-2 text-sm outline-none focus:border-[#c95b31]"
                />
              </div>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Catatan untuk Seller</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instruksi khusus untuk pesanan Anda..."
              className="mt-1 w-full rounded-xl border border-[#d0bfaf] bg-white/70 px-4 py-2 text-sm outline-none focus:border-[#c95b31]"
            />
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Metode Pembayaran <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'lunas' })}
                className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm transition ${
                  formData.paymentMethod === 'lunas'
                    ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]'
                    : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <Banknote className="h-5 w-5" />
                Lunas
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'dp' })}
                className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm transition ${
                  formData.paymentMethod === 'dp'
                    ? 'border-[#d85b30] bg-[#d85b30]/5 text-[#d85b30]'
                    : 'border-gray-200 text-[#6f5448] hover:border-gray-300'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                DP (50%)
              </button>
            </div>
            {formData.paymentMethod === 'dp' && (
              <p className="mt-2 text-xs text-[#8b7166]">
                💳 Anda akan membayar 50% dari total pesanan, sisanya dibayar saat pickup/delivery
              </p>
            )}
          </div>

          {/* Ringkasan */}
          <div className="rounded-xl bg-[#f8f4f0] p-4 space-y-2 text-sm">
            <h3 className="font-bold text-[#4b2417]">Ringkasan Pesanan</h3>
            <div className="flex justify-between">
              <span className="text-[#6f5448]">Subtotal ({items.length} item)</span>
              <span className="font-semibold text-[#4b2417]">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6f5448]">Biaya Pengiriman</span>
              <span className="font-semibold text-[#8b7166]">
                {formData.deliveryMethod === 'pickup' ? 'Gratis' : 'Dihitung via WA'}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#d0bfaf] pt-2 font-bold">
              <span className="text-[#4b2417]">Total</span>
              <span className="text-[#d85b30]">{formatRupiah(total)}</span>
            </div>
            {formData.paymentMethod === 'dp' && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6f5448]">Yang harus dibayar (DP 50%)</span>
                <span className="font-bold text-[#d85b30]">{formatRupiah(payableAmount)}</span>
              </div>
            )}
            {formData.deliveryMethod !== 'pickup' && (
              <p className="mt-2 text-center text-xs text-[#8b7166]">
                * Biaya pengiriman akan ditambahkan kemudian (diinfokan via WhatsApp)
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Buat Pesanan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}