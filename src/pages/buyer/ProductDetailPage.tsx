import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProductBySlug, formatRupiah, getProductsByCategory } from '@/services/productService'
import { getProductReviewsAPI } from '@/api/review'
import type { ReviewResponse } from '@/api/review'

import { useCart } from '@/context/CartContext'
import type { Product } from '@/services/productService'
import { useTranslation } from 'react-i18next'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { ProductCard } from '@/components/common/ProductCard'
import { Heart, Share2 } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { toast } from 'react-hot-toast'

export default function ProductDetailPage() {
  const { whatsappNumber } = useWhatsApp()
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  
  const [activeSection, setActiveSection] = useState('detail-produk')
  const { addItem } = useCart()
  const { t } = useTranslation()
  const { wishlistIds, toggleWishlist, loading: wishlistLoading } = useWishlist()

  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    
    getProductBySlug(slug)
      .then((data) => {
        if (!data) {
          setError(t('product_detail.failed_to_load', 'Produk tidak ditemukan atau gagal dimuat.'))
        } else {
          setProduct(data)
          setQuantity(data.variants[0]?.minOrder || 1)
          
          // Fetch Reviews
          getProductReviewsAPI(data.backendId)
            .then(res => setReviews(res))
            .catch(err => console.error("Failed to fetch reviews", err))
            
          // Fetch Recommendations (same category)
          // Uses getProductsByCategory to avoid downloading the entire catalog.
          // Still lacks a `limit` filter on backend, so we slice on frontend.
          getProductsByCategory(data.category)
            .then(catProducts => {
              const recs = catProducts.filter(p => p.id !== data.id).slice(0, 4)
              setRecommendations(recs)
            })
            .catch(err => console.error("Failed to fetch recommendations", err))
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, t])

  useEffect(() => {
    if (loading || !product) return
    
    // Navbar height is 76px, sticky header is ~100px.
    // Margin is adjusted so scroll spy accurately tracks which section is currently main in view.
    const options = {
      root: null,
      rootMargin: '-220px 0px -50% 0px',
      threshold: 0
    }

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    observerRef.current = new IntersectionObserver(handleIntersect, options)
    
    const sections = ['detail-produk', 'ulasan', 'rekomendasi']
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, product])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      // Offset for sticky navbar (76px) + sticky top header height (~104px) = 180px
      const headerOffset = 180 
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      // Intentionally not setting activeSection directly here to let intersection observer handle it naturally
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Toti Cakery',
      url: window.location.href,
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success(t('product_detail.share_success', 'Tautan produk berhasil disalin.'))
      } catch (err) {
        console.error('Error copying text: ', err)
      }
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    const variant = product.variants[0]
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantName: variant.name,
      price: variant.price,
      image: product.image,
      minOrder: variant.minOrder,
      step: variant.step,
      quantity,
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D0BFAF] border-t-[#9B4A2F]" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500">{error || t('product_detail.failed_to_load', 'Produk tidak ditemukan atau gagal dimuat.')}</p>
        <Link to="/catalog" className="mt-4 inline-block text-[#9B4A2F] underline">
          {t('product_detail.back_to_catalog', 'Kembali ke katalog')}
        </Link>
      </div>
    )
  }

  const variant = product.variants[0]
  const isPurchasable = product.isAvailable && product.isInStock && product.stockQuantity > 0;
  const maxQty = product.stockQuantity;
  const subtotal = quantity * variant.price;

  let badgeText = '';
  if (!product.isAvailable) {
    badgeText = `⚠️ ${t('product_detail.unavailable', 'Tidak tersedia')}`;
  } else if (!product.isInStock || maxQty <= 0) {
    badgeText = `⚠️ ${t('product_detail.out_of_stock', 'Stok habis')}`;
  }

  const renderPurchasePanel = () => (
    <div className="flex flex-col gap-4">
      {/* Action Box */}
      <div className="rounded-xl border border-[#D0BFAF] bg-white p-5 shadow-sm">
        <h3 className="font-bold text-[#3A1F16] mb-4">Atur jumlah</h3>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-[#D0BFAF] bg-white p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(variant.minOrder, q - variant.step))}
              disabled={!isPurchasable || quantity <= variant.minOrder}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#3A1F16] hover:bg-[#F6EFE6] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Kurang"
            >
              -
            </button>
            <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + variant.step))}
              disabled={!isPurchasable || quantity >= maxQty}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#3A1F16] hover:bg-[#F6EFE6] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Tambah"
            >
              +
            </button>
          </div>
          {isPurchasable && (
            <span className="text-sm font-semibold text-green-700">
              {t('product_detail.stock_remaining', 'Stok tersisa')}: {maxQty}
            </span>
          )}
        </div>
        
        {badgeText && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
            {badgeText}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-[#F6EFE6] pt-4">
          <span className="text-sm text-[#6B4A3C]">Subtotal</span>
          <span className="font-black text-[#3A1F16] text-lg">{formatRupiah(subtotal)}</span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!isPurchasable}
            className="w-full rounded-lg bg-[#9B4A2F] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#7E3A24] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t('product_detail.add_to_cart', 'Tambah ke Keranjang')}
          </button>
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              disabled={wishlistLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#D0BFAF] bg-white px-4 py-2 text-sm font-bold text-[#3A1F16] transition hover:bg-[#F6EFE6] disabled:opacity-50"
              aria-label={wishlistIds.has(product.id) ? t('product_detail.remove_wishlist', 'Hapus dari wishlist') : t('product_detail.add_wishlist', 'Tambahkan ke wishlist')}
            >
              <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              {t('product_detail.wishlist', 'Wishlist')}
            </button>
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#D0BFAF] bg-white px-4 py-2 text-sm font-bold text-[#3A1F16] transition hover:bg-[#F6EFE6]"
              aria-label={t('product_detail.share_product', 'Bagikan produk')}
            >
              <Share2 className="h-4 w-4" />
              {t('product_detail.share', 'Bagikan')}
            </button>
          </div>
        </div>
      </div>
      
      {/* WA Box */}
      <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex flex-col items-center text-center">
        <p className="font-bold text-[#3A1F16]">{t('product_detail.custom_order_title', 'Pesanan Custom?')}</p>
        <p className="mt-1 text-xs text-[#6B4A3C]">
          {t('product_detail.custom_order_desc', 'Punya request khusus? Chat kami lewat WhatsApp.')}
        </p>
        <a 
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t('product_detail.wa_custom_message', 'Halo Toti Cakery, saya ingin bertanya tentang pesanan custom.'))}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-[#25D366] px-4 py-2 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/10 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {t('product_detail.chat_with_us', 'Chat dengan kami')}
        </a>
      </div>
    </div>
  )

  return (
    <div className="bg-[#fffaf5] pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        
        {/* TOP HEADER (STICKY): Title + Section Navigation */}
        {/* top-[76px] ensures it sticks precisely below the BuyerNavbar which is 76px high */}
        <div className="sticky top-[76px] z-20 mb-8 border-b border-[#E8DCCB] bg-[#fffaf5] pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-black text-[#3A1F16] pb-4 line-clamp-2 md:line-clamp-1">
            {product.name}
          </h1>
          
          <nav className="flex items-center gap-8 overflow-x-auto whitespace-nowrap px-1 pb-[-1px]" role="tablist">
            <button
              role="tab"
              aria-selected={activeSection === 'detail-produk'}
              onClick={() => scrollToSection('detail-produk')}
              className={`pb-4 text-base font-bold transition ${activeSection === 'detail-produk' ? 'border-b-4 border-[#9B4A2F] text-[#9B4A2F]' : 'border-b-4 border-transparent text-[#9C8478] hover:text-[#6B4A3C]'}`}
            >
              {t('product_detail.product_details', 'Detail Produk')}
            </button>
            <button
              role="tab"
              aria-selected={activeSection === 'ulasan'}
              onClick={() => scrollToSection('ulasan')}
              className={`pb-4 text-base font-bold transition ${activeSection === 'ulasan' ? 'border-b-4 border-[#9B4A2F] text-[#9B4A2F]' : 'border-b-4 border-transparent text-[#9C8478] hover:text-[#6B4A3C]'}`}
            >
              {t('product_detail.reviews', 'Ulasan')}
            </button>
            <button
              role="tab"
              aria-selected={activeSection === 'rekomendasi'}
              onClick={() => scrollToSection('rekomendasi')}
              className={`pb-4 text-base font-bold transition ${activeSection === 'rekomendasi' ? 'border-b-4 border-[#9B4A2F] text-[#9B4A2F]' : 'border-b-4 border-transparent text-[#9C8478] hover:text-[#6B4A3C]'}`}
            >
              {t('product_detail.recommended_nav', 'Rekomendasi')}
            </button>
          </nav>
        </div>

        {/* LAYOUT: Main Content (Left) + Purchase Panel (Right) */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT: MAIN CONTENT AREA */}
          <div className="lg:col-span-8 flex flex-col">
            
            {/* DETAIL PRODUK = PRODUCT HERO (Image + Info + Description) */}
            {/* Increased scroll-mt to account for new taller sticky header */}
            <section id="detail-produk" className="scroll-mt-[180px]">
              <div className="md:flex gap-8">
                {/* Product Image */}
                <div className="w-full md:w-[45%] shrink-0">
                  <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-[#F6EFE6]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-auto w-full object-cover aspect-square"
                    />
                  </div>
                </div>

                {/* Product Info & Description */}
                <div className="w-full md:w-[55%] mt-6 md:mt-0 flex flex-col gap-4">
                  {/* Product title was moved to Top Header */}
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B4A3C]">
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 font-semibold">
                        <span className="text-[#E0A04E]">★</span>
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {product.reviewCount > 0 && (
                      <span>({product.reviewCount} {t('product_detail.reviews', 'ulasan')})</span>
                    )}
                    {product.soldCount > 0 && (
                      <>
                        <span className="text-[#D0BFAF]">•</span>
                        <span>{product.soldCount} {t('product_detail.sold', 'terjual')}</span>
                      </>
                    )}
                  </div>

                  <p className="text-3xl font-black text-[#3A1F16]">
                    {formatRupiah(variant.price)}
                  </p>

                  <div className="mt-2 rounded-lg bg-[#F6EFE6] p-4 text-sm text-[#6B4A3C] border border-[#E8DCCB]">
                    <p>
                      <span className="font-semibold text-[#3A1F16]">Kategori:</span> {product.category}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-[#3A1F16]">{t('product_detail.minimum_order', 'Minimal Pembelian')}:</span> {variant.minOrder} {t('product_detail.pcs', 'pcs')}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-[#3A1F16]">{t('product_detail.stock', 'Stok')}:</span> {isPurchasable ? product.stockQuantity : 0} {t('product_detail.pcs', 'pcs')}
                    </p>
                  </div>

                  {/* MOBILE ONLY: Render Purchase Panel inside Hero */}
                  <div className="mt-4 lg:hidden">
                    {renderPurchasePanel()}
                  </div>

                  {/* Full Description Integrated into Product Info */}
                  <div className="mt-6">
                    <h3 className="font-bold text-[#3A1F16] mb-2">{t('product_detail.description', 'Deskripsi')}</h3>
                    <div className="text-[#6B4A3C] leading-relaxed whitespace-pre-wrap text-sm">
                      {product.description || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ULASAN */}
            <section id="ulasan" className="mt-12 scroll-mt-[180px]">
              <h2 className="text-xl font-black text-[#3A1F16] mb-4">{t('product_detail.reviews', 'Ulasan')}</h2>
              
              <div className="mb-6 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-[#F6EFE6] p-4 text-[#3A1F16]">
                  <div className="text-3xl font-black">
                    <span className="text-[#E0A04E] mr-1">★</span>
                    {product.rating.toFixed(1)}
                  </div>
                  <span className="text-xs text-[#6B4A3C] mt-1">{t('product_detail.based_on', 'Berdasarkan')} {product.reviewCount} {t('product_detail.reviews', 'ulasan')}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-[#9C8478]">{t('product_detail.no_reviews', 'Belum ada ulasan')}</p>
              ) : (
                <div className="flex flex-col gap-4 border-t border-[#E8DCCB] pt-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-[#F6EFE6] pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex text-[#E0A04E] text-sm">
                          {'★'.repeat(Math.round(review.rating))}
                          <span className="text-gray-300">{'★'.repeat(5 - Math.round(review.rating))}</span>
                        </div>
                        <span className="text-xs text-[#9C8478]">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#3A1F16] mt-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* REKOMENDASI */}
            <section id="rekomendasi" className="mt-12 scroll-mt-[180px]">
              <h2 className="text-xl font-black text-[#3A1F16] mb-4">{t('product_detail.recommended', 'Rekomendasi Untukmu')}</h2>
              
              {recommendations.length === 0 ? (
                <p className="text-sm text-[#9C8478]">Belum ada rekomendasi untuk kategori ini.</p>
              ) : (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recommendations.map(rec => (
                    <ProductCard
                      key={rec.id}
                      product={rec}
                      onAddToCart={(p, q) => {
                        const v = p.variants[0]
                        addItem({
                          productId: p.id,
                          variantId: v.id,
                          name: p.name,
                          variantName: v.name,
                          price: v.price,
                          image: p.image,
                          minOrder: v.minOrder,
                          step: v.step,
                          quantity: q,
                        })
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
            
          </div>
          
          {/* RIGHT: PURCHASE PANEL (STICKY ON DESKTOP) */}
          <div className="hidden lg:flex lg:col-span-4 sticky top-[180px] z-10 flex-col gap-4">
            {renderPurchasePanel()}
          </div>
          
        </div>
      </div>
    </div>
  )
}