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
  const { t } = useTranslation()
  const lowestPrice = getLowestPrice(product.variants)
  const variant = product.variants[0]
  const minOrder = variant?.minOrder || 1
  const step = variant?.step || 1

  const isPurchasable = product.isAvailable && product.isInStock && product.stockQuantity > 0
  const maxQty = product.stockQuantity

  let badgeText = ''
  if (!product.isAvailable) {
    badgeText = t('product_detail.unavailable', 'Tidak tersedia')
  } else if (!product.isInStock || maxQty <= 0) {
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
    <article className="group overflow-hidden rounded-xl bg-[#F6EFE6] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/catalog/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#EFE4D6]">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#3A1F16] shadow-sm backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-[#E0A04E] text-[#E0A04E]" />
            {product.rating.toFixed(1)}
            <span className="text-[#9C8478]">·</span>
            {product.soldCount} {t('product_detail.sold', 'terjual')}
          </div>
          {badgeText && (
            <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              {badgeText}
            </div>
          )}
          {minOrder > 1 && (
            <div className="absolute right-2 top-2 rounded-full bg-[#9B4A2F] px-2 py-0.5 text-[10px] font-bold text-white">
              Min. {minOrder} {t('product_detail.pcs', 'pcs')}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link
          to={`/catalog/${product.slug}`}
          className="line-clamp-1 text-sm font-black text-[#3A1F16] transition hover:text-[#9B4A2F]"
        >
          {product.name}
        </Link>

        <p className="mt-0.5 text-xs font-medium text-[#6B4A3C]">
          {product.category}
        </p>

        {stockText && (
          <p className="mt-0.5 text-xs font-semibold text-green-700">
            {stockText}
          </p>
        )}

        <p className="mt-2 text-base font-black text-[#3A1F16]">
          {formatRupiah(lowestPrice)}
        </p>

        {/* Quantity Selector */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={decrement}
            disabled={!isPurchasable || quantity <= minOrder}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#D0BFAF] text-[#3A1F16] hover:bg-[#E8DCCB] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Kurangi jumlah"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-[#3A1F16]">
            {quantity}
          </span>
          <button
            onClick={increment}
            disabled={!isPurchasable || quantity >= maxQty}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#D0BFAF] text-[#3A1F16] hover:bg-[#E8DCCB] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Tambah jumlah"
          >
            <Plus className="h-3 w-3" />
          </button>
          {minOrder > 1 && (
            <span className="ml-1 text-[10px] text-[#9C8478]">
              min {minOrder}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!isPurchasable}
          onClick={() => onAddToCart(product, quantity)}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#9B4A2F] text-xs font-black text-white transition hover:bg-[#7E3A24] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {isPurchasable ? t('product_detail.add_to_cart', 'Tambah ke Keranjang') : badgeText}
        </button>
      </div>
    </article>
  )
}
