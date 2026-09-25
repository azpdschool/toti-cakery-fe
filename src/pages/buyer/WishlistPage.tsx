import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { ProductCard } from '@/components/common/ProductCard'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/context/CartContext'
import { ROUTES } from '@/constants'
import { type ProductOut } from '@/api/product'
import { getBuyerWishlist } from '@/services/wishlistService'

export default function WishlistPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { wishlistIds } = useWishlist()
  const { addItem } = useCart()
  const [products, setProducts] = useState<ProductOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate(ROUTES.AUTH_BUYER)
      return
    }
    loadWishlistProducts()
  }, [user, navigate])

  const loadWishlistProducts = async () => {
    try {
      setLoading(true)
      const data = await getBuyerWishlist()
      setProducts(data as any)
    } catch (error) {
      console.error('Failed to load wishlist products', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter out products that might have been removed locally via wishlist toggle
  const displayProducts = products.filter(p => wishlistIds.has(String(p.id)))

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#EAD8CA] pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#3A1F16] transition hover:text-[#9B4A2F]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('wishlist.back')}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.CATALOG)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FAF0E6] px-4 py-2 text-xs font-bold text-[#9B4A2F] transition hover:bg-[#F5E6D8]"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{t('wishlist.explore_products')}</span>
        </button>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-gray-900">{t('wishlist.title')}</h1>

      {displayProducts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm border border-[#EAD8CA]">
          <div className="mb-4 rounded-full bg-red-50 p-4">
            <Heart className="h-12 w-12 text-red-300" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t('wishlist.empty_title')}
          </h2>
          <p className="mb-6 whitespace-pre-line text-[#6f5448]">
            {t('wishlist.empty_desc')}
          </p>
          <button
            onClick={() => navigate(ROUTES.CATALOG)}
            className="rounded-xl bg-[#d85b30] px-6 py-3 font-medium text-white transition-colors hover:bg-[#c04e28]"
          >
            {t('wishlist.start_shopping')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {displayProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product as any} 
              onAddToCart={(p, q) => {
                const v = p.variants[0]
                addItem({
                  productId: String(p.id),
                  variantId: v.id,
                  name: p.name,
                  variantName: v.name,
                  price: v.price,
                  image: p.image,
                  minOrder: v.minOrder,
                  step: v.step,
                  category: (p as any).category,
                  quantity: q,
                })
                toast.success(t('cart.add_to_cart_success'))
              }} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

