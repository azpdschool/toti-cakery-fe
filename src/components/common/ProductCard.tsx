import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Minus, Plus, ShoppingCart } from 'lucide-react'
import { formatRupiah, getLowestPrice } from '@/services/productService'
import type { Product } from '@/services/productService'
import { useTranslation } from 'react-i18next'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, quantity: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t, i18n } = useTranslation()
  const lowestPrice = getLowestPrice(product.variants)
  const variant = product.variants[0]
  const minOrder = variant?.minOrder || 1
  const step = variant?.step || 1

  const maxQty = product.stockQuantity
  const isUnavailable = !product.isAvailable
  const isOutOfStock = !isUnavailable && (!product.isInStock || maxQty <= 0)
  const isPurchasable = !isUnavailable && !isOutOfStock

  let badgeText = ''
  if (isUnavailable) {
    badgeText = t('product_detail.unavailable', 'Tidak tersedia')
  } else if (isOutOfStock) {
    badgeText = t('product_detail.out_of_stock', 'Stok habis')
  }

  let stockText = ''
  if (isPurchasable) {
    stockText = `${t('product_detail.stock_remaining', 'Stok tersisa')} ${maxQty} ${t('product_detail.pcs', 'pcs')}`
  }

  const [quantity, setQuantity] = useState(minOrder)

  const increment = () => setQuantity((prev) => Math.min(maxQty, prev + step))
  const decrement = () => setQuantity((prev) => Math.max(minOrder, prev - step))

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-toti-beige bg-toti-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(58,31,22,0.08)]">
      <Link to={`/catalog/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-toti-alt">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition duration-300 ${
              isPurchasable ? 'group-hover:scale-105' : 'grayscale opacity-60'
            }`}
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-toti-ink shadow-sm backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-toti-honey text-toti-honey" />
            {product.rating.toFixed(1)}
            <span className="text-toti-muted">·</span>
            {product.soldCount} {t('product_detail.sold', 'terjual')}
          </div>
          {badgeText && (
            <div
              className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow ${
                isUnavailable ? 'bg-toti-secondary' : 'bg-toti-error'
              }`}
            >
              {badgeText}
            </div>
          )}
          {minOrder > 1 && (
            <div className="absolute right-2 top-2 rounded-full bg-toti-brick px-2 py-0.5 text-[10px] font-bold text-white">
              Min. {minOrder} {t('product_detail.pcs', 'pcs')}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <Link
          to={`/catalog/${product.slug}`}
          className="line-clamp-1 text-sm font-black text-toti-ink transition hover:text-toti-brick"
        >
          {product.name}
        </Link>

        <p className="mt-0.5 text-xs font-medium text-toti-secondary">
          {product.category}
        </p>

        <div className="min-h-[1.25rem] mt-0.5">
          {stockText ? (
            <p className="text-xs font-semibold text-toti-success">
              {stockText}
            </p>
          ) : isUnavailable ? (
            <p className="text-xs font-semibold text-toti-muted">
              {t('product_detail.unavailable', 'Tidak tersedia')}
            </p>
          ) : isOutOfStock ? (
            <p className="text-xs font-semibold text-toti-error">
              {t('product_detail.out_of_stock', 'Stok habis')}
            </p>
          ) : null}
        </div>

        <p className="mt-2 text-base font-black text-toti-ink">
          {formatRupiah(lowestPrice)}
        </p>

        {/* Bottom Area: Quantity selector (only when purchasable) + Full-width Action Button */}
        <div className="mt-auto pt-3">
          {isPurchasable && (
            <div className="mb-3 flex items-center gap-1.5">
              <div className="toti-stepper">
                <button
                  type="button"
                  onClick={decrement}
                  disabled={quantity <= minOrder}
                  className="toti-stepper-btn"
                  aria-label={t('product_detail.decrease_qty', 'Kurangi jumlah')}
                  title={t('product_detail.decrease_qty', 'Kurangi jumlah')}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-xs sm:text-sm font-semibold text-toti-ink select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={increment}
                  disabled={quantity >= maxQty}
                  className="toti-stepper-btn"
                  aria-label={t('product_detail.increase_qty', 'Tambah jumlah')}
                  title={t('product_detail.increase_qty', 'Tambah jumlah')}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              {minOrder > 1 && (
                <span className="hidden sm:inline text-[10px] text-toti-muted">
                  min {minOrder}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!isPurchasable}
            onClick={() => onAddToCart(product, quantity)}
            className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick focus-visible:ring-offset-1 active:scale-[0.98] ${
              !isPurchasable
                ? 'bg-toti-disabled border border-toti-disabled text-toti-secondary/80 cursor-not-allowed active:scale-100'
                : 'bg-toti-brick text-white hover:bg-toti-brick-hover shadow-sm hover:shadow'
            }`}
          >
            {isPurchasable && <ShoppingCart className="h-4 w-4 shrink-0" />}
            <span>
              {isPurchasable
                ? t('product_detail.add_to_cart', 'Tambah ke Keranjang')
                : badgeText || (i18n.language === 'en' ? 'Unavailable' : 'Tidak tersedia')}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}