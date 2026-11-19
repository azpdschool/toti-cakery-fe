import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCart, CartItem } from '@/context/CartContext'
import { useWishlist } from '@/hooks/useWishlist'
import { useTranslation } from 'react-i18next'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { formatRupiah, getProductByBackendId } from '@/services/productService'
import { ROUTES } from '@/constants'
import { Trash2, Minus, Plus, ShoppingBag, AlertTriangle, Loader2, RefreshCw, ChevronLeft, Heart } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

export default function CartPage() {
  const { t } = useTranslation()
  const { getWhatsAppUrl } = useWhatsApp()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems, updateMultipleAvailability } = useCart()
  const { wishlistIds, toggleWishlist, requestRemoveWishlist, loading: wishlistLoading } = useWishlist()
  
  const [isValidating, setIsValidating] = useState(true)
  const [showClearModal, setShowClearModal] = useState(false)
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null)
  const [itemToRemove, setItemToRemove] = useState<{ productId: string; variantId: string } | null>(null)

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const mountedRef = useRef(true);
  
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
    const availabilities: Record<string, { isAvailable?: boolean; isInStock?: boolean; stockQuantity?: number; category?: string } | undefined> = {};
    
    try {
      await Promise.all(
        itemsRef.current.map(async (item) => {
          try {
            const product = await getProductByBackendId(Number(item.productId));
            availabilities[item.productId] = {
              isAvailable: product.isAvailable && product.isActive,
              isInStock: product.isInStock,
              stockQuantity: product.stockQuantity,
              category: product.category,
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

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateCart();
      }
    };
    
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [validateCart]);

  const hasUnavailableItems = items.some(item => item.isAvailable === false || item.isInStock === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0));
  const hasExceedingStock = items.some(item => item.stockQuantity !== undefined && item.quantity > item.stockQuantity);
  const hasUnknownAvailability = items.some(item => item.isAvailable === undefined);
  const allUnavailable = items.length > 0 && items.every(item => item.isAvailable === false || item.isInStock === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0));
  
  const isCheckoutDisabled = hasUnavailableItems || hasExceedingStock || hasUnknownAvailability || allUnavailable || isValidating || items.length === 0;

  // Group items by category (fallback to "Lainnya" / "Other")
  const fallbackCategoryName = t('cart.category_other', 'Lainnya')
  
  const groupedItems = useMemo(() => {
    const groupMap: Record<string, { displayName: string; items: CartItem[] }> = {}
    items.forEach((item) => {
      const rawCat = item.category?.trim() || fallbackCategoryName
      const key = rawCat.toLowerCase()
      if (!groupMap[key]) {
        const displayName = rawCat.charAt(0).toUpperCase() + rawCat.slice(1)
        groupMap[key] = { displayName, items: [] }
      }
      groupMap[key].items.push(item)
    })
    const groups: Record<string, CartItem[]> = {}
    Object.values(groupMap).forEach(({ displayName, items }) => {
      groups[displayName] = items
    })
    return groups
  }, [items, fallbackCategoryName])

  const handleConfirmClearCart = () => {
    clearCart()
    setShowClearModal(false)
    toast.success(t('cart.cart_cleared', 'Keranjang berhasil dikosongkan'))
  }

  const handleConfirmRemoveCategory = () => {
    if (!categoryToRemove) return
    const categoryItems = groupedItems[categoryToRemove] || []
    categoryItems.forEach((item) => {
      removeItem(item.productId, item.variantId)
    })
    toast.success(t('cart.remove_from_cart_success', 'Dihapus dari keranjang'))
    setCategoryToRemove(null)
  }

  const handleConfirmRemoveItem = () => {
    if (!itemToRemove) return
    removeItem(itemToRemove.productId, itemToRemove.variantId)
    setItemToRemove(null)
    toast.success(t('cart.remove_from_cart_success', 'Dihapus dari keranjang'))
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pb-10">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 flex justify-center">
          <div className="mt-4 flex flex-col items-center justify-center w-full max-w-3xl rounded-xl bg-white py-20 text-center shadow-sm">
            <ShoppingBag className="mx-auto h-16 w-16 text-toti-divider" />
            <p className="mt-4 text-xl font-black text-toti-ink">{t('cart.empty_title', 'Keranjang Kosong')}</p>
            <p className="mt-2 text-sm text-toti-secondary">{t('cart.empty_desc', 'Yuk, mulai belanja kue favoritmu!')}</p>
            <Link
              to={ROUTES.CATALOG}
              className="mt-6 toti-btn-primary px-8 py-3 text-sm font-bold"
            >
              {t('cart.view_products', 'Lihat Produk')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <Link to={ROUTES.CATALOG} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-toti-secondary hover:text-toti-brick transition">
           <ChevronLeft className="h-4 w-4" />
           {t('common.back', 'Kembali')}
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-toti-ink tracking-tight">{t('cart.title', 'Keranjang Belanja')}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-toti-secondary">{t('cart.subtitle', 'Cek kembali pesanan Anda sebelum checkout')}</p>
            {isValidating && (
              <div className="flex items-center text-sm text-toti-brick font-bold">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('cart.checking_stock', 'Memeriksa stok...')}
              </div>
            )}
          </div>
        </div>

        {(hasUnavailableItems || hasExceedingStock) && !isValidating && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-toti-cream border border-toti-error/30 p-4 text-toti-ink shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-toti-error mt-0.5" />
            <p className="text-sm leading-relaxed">
              {t('cart.stock_warning', 'Beberapa produk di keranjang Anda sudah tidak tersedia atau melebihi stok yang ada. Silakan sesuaikan jumlah produk untuk melanjutkan ke pembayaran.')}
            </p>
          </div>
        )}

        {hasUnknownAvailability && !isValidating && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-toti-honey/15 p-4 text-toti-ink border border-toti-warning/30 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-toti-warning" />
              <p className="text-sm">
                {t('cart.validation_error', 'Gagal memvalidasi ketersediaan beberapa produk. Silakan coba lagi.')}
              </p>
            </div>
            <button
              type="button"
              onClick={validateCart}
              className="toti-btn-primary shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.retry', 'Coba Lagi')}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* CATEGORY GROUPED ITEMS */}
          <div className="flex-1 space-y-6">
            {Object.entries(groupedItems).map(([categoryName, groupItems]) => (
              <div key={categoryName} className="rounded-2xl bg-white p-3.5 sm:p-5 shadow-sm ring-1 ring-toti-beige">
                {/* Category Header */}
                <div className="mb-4 flex items-center justify-between border-b border-toti-beige pb-3">
                  <h2 className="text-base font-black uppercase tracking-wide text-toti-ink">
                    {categoryName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setCategoryToRemove(categoryName)}
                    className="text-xs font-bold text-toti-brick hover:text-toti-brick-hover transition"
                  >
                    {t('cart.remove_all', 'Hapus semua')}
                  </button>
                </div>

                {/* Items in Category */}
                <div className="space-y-4">
                  {groupItems.map((item) => {
                    const isUnavailable = item.isAvailable === false || item.isInStock === false || (item.stockQuantity !== undefined && item.stockQuantity <= 0);
                    const isUnknown = item.isAvailable === undefined;
                    const isExceedingStock = item.stockQuantity !== undefined && item.quantity > item.stockQuantity && !isUnavailable;
                    const isWishlisted = wishlistIds.has(String(item.productId));

                    return (
                      <div
                        key={`${item.productId}-${item.variantId}`}
                        className={`flex flex-col gap-4 rounded-xl bg-white p-3 sm:p-4 ring-1 ring-toti-beige/60 transition sm:flex-row sm:items-center sm:justify-between ${isUnavailable ? 'opacity-75 bg-toti-cream/40' : 'hover:shadow-sm'}`}
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="relative aspect-square w-20 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-toti-alt">
                            <img src={item.image} alt={item.name} className={`h-full w-full object-cover transition ${isUnavailable ? 'grayscale' : 'hover:scale-105'}`} />
                          </div>
                          <div>
                            <h3 className={`line-clamp-1 text-base sm:text-lg font-black ${isUnavailable ? 'text-toti-muted line-through' : 'text-toti-ink'}`}>
                              {item.name}
                            </h3>
                            <p className="mt-0.5 text-xs font-semibold text-toti-secondary">{item.variantName}</p>
                            <p className={`mt-1.5 text-sm font-black ${isUnavailable ? 'text-toti-disabled' : 'text-toti-brick'}`}>
                              {formatRupiah(item.price)}
                            </p>
                            
                            {isUnavailable && !isValidating && (
                              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-toti-error uppercase tracking-wide">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('cart.item_unavailable')}
                              </p>
                            )}
                            {isExceedingStock && !isValidating && (
                              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-toti-warning uppercase tracking-wide">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('cart.stock_remaining', { count: item.stockQuantity })}
                              </p>
                            )}
                            {isUnknown && !isValidating && (
                              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-toti-warning uppercase tracking-wide">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t('cart.checking_stock')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-4 border-t sm:border-none border-toti-beige pt-3 sm:pt-0">
                          <div className="toti-stepper">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - item.step)}
                              disabled={isUnavailable || isUnknown || isValidating || item.quantity <= (item.minOrder || 1)}
                              className="toti-stepper-btn"
                              aria-label={t('cart.decrease_qty', 'Kurangi jumlah')}
                              title={t('cart.decrease_qty', 'Kurangi jumlah')}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-toti-ink select-none">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + item.step)}
                              disabled={isUnavailable || isUnknown || isValidating || (item.stockQuantity !== undefined && item.quantity >= item.stockQuantity)}
                              className="toti-stepper-btn"
                              aria-label={t('cart.increase_qty', 'Tambah jumlah')}
                              title={t('cart.increase_qty', 'Tambah jumlah')}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-base font-black ${isUnavailable ? 'text-toti-disabled' : 'text-toti-ink'}`}>
                              {formatRupiah(item.price * item.quantity)}
                            </span>

                            {/* Wishlist Heart Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isWishlisted) {
                                  requestRemoveWishlist(item.productId)
                                } else {
                                  toggleWishlist(item.productId)
                                }
                              }}
                              disabled={wishlistLoading}
                              className="rounded-lg p-1.5 text-toti-muted hover:bg-toti-error/15 hover:text-toti-error transition disabled:opacity-50"
                              title={isWishlisted ? t('wishlist.remove_from_wishlist', 'Hapus dari wishlist') : t('wishlist.add_to_wishlist', 'Tambahkan ke wishlist')}
                              aria-label={isWishlisted ? t('wishlist.remove_from_wishlist', 'Hapus dari wishlist') : t('wishlist.add_to_wishlist', 'Tambahkan ke wishlist')}
                            >
                              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-toti-error text-toti-error' : ''}`} />
                            </button>

                            {/* Remove Item Button */}
                            <button
                              type="button"
                              onClick={() => setItemToRemove({ productId: item.productId, variantId: item.variantId })}
                              className="rounded-lg p-1.5 text-toti-muted hover:bg-toti-error/15 hover:text-toti-error transition"
                              title={t('cart.delete_item', 'Hapus item')}
                              aria-label={t('cart.delete_item', 'Hapus item')}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* SUMMARY SIDEBAR */}
          <div className="w-full lg:w-80 shrink-0">
             <div className="static lg:sticky lg:top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-toti-beige">
                <h2 className="text-lg font-black text-toti-ink mb-5">{t('cart.summary')}</h2>
                
                <div className="space-y-4 border-b border-toti-beige pb-5 text-sm">
                  <div className="flex justify-between text-toti-secondary">
                    <span>{t('cart.total_items')}</span>
                    <span className="font-bold text-toti-ink">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-toti-secondary">
                    <span>{t('cart.subtotal')}</span>
                    <span className="font-bold text-toti-ink">{formatRupiah(totalPrice)}</span>
                  </div>
                </div>
                
                <div className="mt-5 flex justify-between items-center">
                  <span className="text-base font-bold text-toti-ink">{t('cart.total')}</span>
                  <span className="text-xl font-black text-toti-brick">{formatRupiah(totalPrice)}</span>
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    to={isCheckoutDisabled ? '#' : ROUTES.CHECKOUT}
                    onClick={(e) => {
                      if (isCheckoutDisabled) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full h-12 ${
                      isCheckoutDisabled
                        ? 'toti-btn-disabled'
                        : 'toti-btn-primary'
                    }`}
                  >
                    {t('cart.checkout')}
                  </Link>

                  <a
                    href={getWhatsAppUrl(t('product_detail.wa_custom_message'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="toti-btn-whatsapp w-full h-11"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    {t('cart.custom_order_cta')}
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="toti-btn-secondary w-full h-11"
                  >
                    {t('cart.empty_cart')}
                  </button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal for Single Item Removal */}
      <ConfirmationModal
        isOpen={itemToRemove !== null}
        title={t('cart.remove_item_title', 'Hapus dari keranjang?')}
        message={t('cart.remove_item_desc', 'Apakah Anda yakin ingin menghapus produk ini dari keranjang?')}
        confirmText={t('common.yes', 'Ya')}
        cancelText={t('common.no', 'Tidak')}
        onConfirm={handleConfirmRemoveItem}
        onCancel={() => setItemToRemove(null)}
        isDestructive={true}
      />

      {/* Confirmation Modal for Clear Cart */}
      <ConfirmationModal
        isOpen={showClearModal}
        title={t('cart.clear_cart_title', 'Kosongkan keranjang?')}
        message={t('cart.clear_cart_desc', 'Apakah Anda yakin ingin menghapus semua produk dari keranjang?')}
        confirmText={t('common.yes', 'Ya')}
        cancelText={t('common.no', 'Tidak')}
        onConfirm={handleConfirmClearCart}
        onCancel={() => setShowClearModal(false)}
        isDestructive={true}
      />

      {/* Confirmation Modal for Remove Category */}
      <ConfirmationModal
        isOpen={categoryToRemove !== null}
        title={t('cart.remove_category_title', 'Hapus produk kategori ini?')}
        message={t('cart.remove_category_desc', 'Apakah Anda yakin ingin menghapus semua produk dalam kategori ini dari keranjang?')}
        confirmText={t('common.yes', 'Ya')}
        cancelText={t('common.no', 'Tidak')}
        onConfirm={handleConfirmRemoveCategory}
        onCancel={() => setCategoryToRemove(null)}
        isDestructive={true}
      />
    </div>
  )
}
