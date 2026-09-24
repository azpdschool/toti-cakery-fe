import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useTranslation } from 'react-i18next'
import { formatRupiah, getProductByBackendId } from '@/services/productService'
import { ROUTES } from '@/constants'
import { Trash2, Minus, Plus, ShoppingBag, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'

export default function CartPage() {
  const { t } = useTranslation()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, updateMultipleAvailability } = useCart()
  const [isValidating, setIsValidating] = useState(true)
  
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const mountedRef = useRef(true);
  
  // Memoize the context function so it doesn't trigger endless recreations
  const updateMultipleAvailabilityRef = useRef(updateMultipleAvailability);
  useEffect(() => {
    updateMultipleAvailabilityRef.current = updateMultipleAvailability;
  }, [updateMultipleAvailability]);

  const validateCart = useCallback(async () => {
    if (itemsRef.current.length === 0) {
      setIsValidating(false);
      return;
    }
    setIsValidating(true);
    const availabilities: Record<string, { isAvailable?: boolean; isInStock?: boolean; stockQuantity?: number } | undefined> = {};
    
    try {
      await Promise.all(
        itemsRef.current.map(async (item) => {
          try {
            const product = await getProductByBackendId(Number(item.productId));
            availabilities[item.productId] = {
              isAvailable: product.isAvailable && product.isActive,
              isInStock: product.isInStock,
              stockQuantity: product.stockQuantity,
            };
          } catch (error) {
            availabilities[item.productId] = undefined;
          }
        })
      );
    } finally {
      if (mountedRef.current) {
        updateMultipleAvailabilityRef.current(availabilities);
        setIsValidating(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    validateCart();

    const onFocus = () => {
      validateCart();
    };
    
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        validateCart();
      }
    });

    return () => {
      mountedRef.current = false;
      window.removeEventListener('focus', onFocus);
      // We don't easily remove the anonymous listener, but we can name it
    };
  }, [validateCart]);

  const hasUnavailableItems = items.some(item => item.isAvailable === false || item.isInStock === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0));
  const hasExceedingStock = items.some(item => item.stockQuantity !== undefined && item.quantity > item.stockQuantity);
  const hasUnknownAvailability = items.some(item => item.isAvailable === undefined);
  const allUnavailable = items.length > 0 && items.every(item => item.isAvailable === false || item.isInStock === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0));
  
  const isCheckoutDisabled = hasUnavailableItems || hasExceedingStock || hasUnknownAvailability || allUnavailable || isValidating;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">{t('cart.empty_title', 'Keranjang Kosong')}</h2>
        <p className="mt-2 text-gray-500">Yuk, mulai belanja kue favoritmu!</p>
        <Link
          to={ROUTES.CATALOG}
          className="mt-6 inline-block rounded-lg bg-amber-600 px-6 py-2 text-white hover:bg-amber-700"
        >
          Lihat Produk
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Keranjang Belanja</h1>
        {isValidating && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memvalidasi stok...
          </div>
        )}
      </div>

      {(hasUnavailableItems || hasExceedingStock) && !isValidating && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Beberapa produk di keranjang Anda sudah tidak tersedia atau melebihi stok yang ada. Silakan sesuaikan jumlah produk untuk melanjutkan ke pembayaran.
          </p>
        </div>
      )}

      {hasUnknownAvailability && !isValidating && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg bg-orange-50 p-4 text-orange-800 border border-orange-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              {t('cart.validation_error')}
            </p>
          </div>
          <button
            onClick={validateCart}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      <div className="mt-6 divide-y divide-gray-200">
        {items.map((item) => {
          const isUnavailable = item.isAvailable === false || item.isInStock === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0);
          const isUnknown = item.isAvailable === undefined;
          const isExceedingStock = item.stockQuantity !== undefined && item.quantity > item.stockQuantity && !isUnavailable;
          
          return (
            <div
              key={`${item.productId}-${item.variantId}`}
              className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${isUnavailable ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className={`h-16 w-16 rounded object-cover ${isUnavailable ? 'grayscale' : ''}`} />
                <div>
                  <h3 className={`font-semibold ${isUnavailable ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.variantName}</p>
                  <p className={`text-sm font-medium ${isUnavailable ? 'text-gray-400' : 'text-amber-700'}`}>
                    {formatRupiah(item.price)}
                  </p>
                  {isUnavailable && !isValidating && (
                    <p className="mt-1 text-xs font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Produk ini sudah tidak tersedia
                    </p>
                  )}
                  {isExceedingStock && !isValidating && (
                    <p className="mt-1 text-xs font-bold text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {t('cart.stock_remaining', { count: item.stockQuantity })}
                    </p>
                  )}
                  {isUnknown && !isValidating && (
                    <p className="mt-1 text-xs font-bold text-orange-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Memeriksa stok...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.variantId, item.quantity - item.step)
                    }
                    disabled={isUnavailable || isUnknown || isValidating}
                    className="rounded border px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.variantId, item.quantity + item.step)
                    }
                    disabled={isUnavailable || isUnknown || isValidating || (item.stockQuantity !== undefined && item.quantity >= item.stockQuantity)}
                    className="rounded border px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className={`text-sm font-semibold ${isUnavailable ? 'text-gray-400' : 'text-gray-800'}`}>
                  {formatRupiah(item.price * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title={t('cart.delete_item', 'Hapus item')}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-between text-lg font-bold">
          <span>{t('cart.total', 'Total')}</span>
          <span className="text-amber-700">{formatRupiah(totalPrice)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={clearCart}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t('cart.empty_cart')}
          </button>
          
          <Link
            to={isCheckoutDisabled ? '#' : ROUTES.CHECKOUT}
            onClick={(e) => {
              if (isCheckoutDisabled) {
                e.preventDefault();
              }
            }}
            className={`rounded px-6 py-2 text-sm font-semibold text-white transition ${
              isCheckoutDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            Lanjut ke Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
