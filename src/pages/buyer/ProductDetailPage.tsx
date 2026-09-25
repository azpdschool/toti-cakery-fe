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
import { Heart, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { toast } from 'react-hot-toast'

export default function ProductDetailPage() {
  const { whatsappNumber } = useWhatsApp()
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [selectedReviewLightBoxUrl, setSelectedReviewLightBoxUrl] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  
  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const thumbnailStripRef = useRef<HTMLDivElement>(null)

  const [activeSection, setActiveSection] = useState('detail-produk')
  const { addItem } = useCart()
  const { t } = useTranslation()
  const { wishlistIds, toggleWishlist, requestRemoveWishlist, loading: wishlistLoading } = useWishlist()

  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setRecommendations([])
    
    getProductBySlug(slug)
      .then((data) => {
        if (!data) {
          setError(t('product_detail.failed_to_load'))
        } else {
          setProduct(data)
          setQuantity(data.variants[0]?.minOrder || 1)

          // Initial selected image: find isPrimary === true image or default to 0
          if (data.images && data.images.length > 0) {
            const primaryIdx = data.images.findIndex((img) => img.isPrimary)
            setSelectedImageIndex(primaryIdx !== -1 ? primaryIdx : 0)
          } else {
            setSelectedImageIndex(0)
          }
          
          // Fetch Reviews
          getProductReviewsAPI(data.backendId)
            .then(res => setReviews(res))
            .catch(err => console.error("Failed to fetch reviews", err))
            
          // Fetch Recommendations (same category)
          getProductsByCategory(data.category)
            .then(catProducts => {
              const recs = catProducts.filter(p => p.id !== data.id && p.backendId !== data.backendId && p.slug !== data.slug && p.isActive !== false && p.isAvailable !== false)
              setRecommendations(recs)
            })
            .catch(err => console.error("Failed to fetch recommendations", err))
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, t])

  useEffect(() => {
    if (!thumbnailStripRef.current) return
    const activeThumb = thumbnailStripRef.current.children[selectedImageIndex] as HTMLElement
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedImageIndex])

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
        toast.success(t('product_detail.share_success'))
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
      category: product.category,
      quantity,
    })
    toast.success(t('cart.add_to_cart_success'))
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
        <p className="text-red-500">{error || t('product_detail.failed_to_load')}</p>
        <Link to="/catalog" className="mt-4 inline-block text-[#9B4A2F] underline">
          {t('product_detail.back_to_catalog')}
        </Link>
      </div>
    )
  }

  const variant = product.variants[0]
  const isPurchasable = product.isAvailable && product.isInStock && product.stockQuantity > 0;
  const maxQty = product.stockQuantity;

  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : [{ id: -1, imageUrl: product.image, isPrimary: true }];

  const currentGalleryImage = galleryImages[selectedImageIndex] || galleryImages[0];

  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
  };
  const subtotal = quantity * variant.price;

  let badgeText = '';
  if (!product.isAvailable) {
    badgeText = `⚠️ ${t('product_detail.unavailable')}`;
  } else if (!product.isInStock || maxQty <= 0) {
    badgeText = `⚠️ ${t('product_detail.out_of_stock')}`;
  }

  const renderPurchasePanel = () => (
    <div className="flex flex-col gap-4">
      {/* Action Box */}
      <div className="rounded-xl border border-[#D0BFAF] bg-white p-5 shadow-sm">
        <h3 className="font-bold text-[#3A1F16] mb-4">{t('product_detail.quantity')}</h3>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-[#D0BFAF] bg-white p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(variant.minOrder, q - variant.step))}
              disabled={!isPurchasable || quantity <= variant.minOrder}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#3A1F16] hover:bg-[#F6EFE6] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t('product_detail.decrease_qty')}
              title={t('product_detail.decrease_qty')}
            >
              -
            </button>
            <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + variant.step))}
              disabled={!isPurchasable || quantity >= maxQty}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#3A1F16] hover:bg-[#F6EFE6] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t('product_detail.increase_qty')}
              title={t('product_detail.increase_qty')}
            >
              +
            </button>
          </div>
          {isPurchasable && (
            <span className="text-sm font-semibold text-green-700">
              {t('product_detail.stock_remaining')}: {maxQty}
            </span>
          )}
        </div>
        
        {badgeText && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
            {badgeText}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-[#F6EFE6] pt-4">
          <span className="text-sm text-[#6B4A3C]">{t('product_detail.subtotal')}</span>
          <span className="font-black text-[#3A1F16] text-lg">{formatRupiah(subtotal)}</span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!isPurchasable}
            className="w-full rounded-lg bg-[#9B4A2F] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#7E3A24] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t('product_detail.add_to_cart')}
          </button>
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                if (wishlistIds.has(product.id)) {
                  requestRemoveWishlist(product.id)
                } else {
                  toggleWishlist(product.id)
                }
              }}
              disabled={wishlistLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#D0BFAF] bg-white px-4 py-2 text-sm font-bold text-[#3A1F16] transition hover:bg-[#F6EFE6] disabled:opacity-50"
              aria-label={wishlistIds.has(product.id) ? t('product_detail.remove_wishlist') : t('product_detail.add_wishlist')}
            >
              <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              {t('product_detail.wishlist')}
            </button>
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#D0BFAF] bg-white px-4 py-2 text-sm font-bold text-[#3A1F16] transition hover:bg-[#F6EFE6]"
              aria-label={t('product_detail.share_product')}
            >
              <Share2 className="h-4 w-4" />
              {t('product_detail.share')}
            </button>
          </div>
        </div>
      </div>
      
      {/* WA Box */}
      <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex flex-col items-center text-center">
        <p className="font-bold text-[#3A1F16]">{t('product_detail.custom_order_title')}</p>
        <p className="mt-1 text-xs text-[#6B4A3C]">
          {t('product_detail.custom_order_desc')}
        </p>
        <a 
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t('product_detail.wa_custom_message'))}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-[#25D366] px-4 py-2 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/10 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {t('product_detail.chat_with_us')}
        </a>
      </div>
    </div>
  )

  return (
    <div className="bg-[#F6EFE6] pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        
        {/* TOP HEADER (STICKY): Title + Section Navigation */}
        {/* top-[76px] ensures it sticks precisely below the BuyerNavbar which is 76px high */}
        <div className="sticky top-[76px] z-20 mb-8 border-b border-[#E8DCCB] bg-[#F6EFE6] pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
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
              {t('product_detail.product_details')}
            </button>
            <button
              role="tab"
              aria-selected={activeSection === 'ulasan'}
              onClick={() => scrollToSection('ulasan')}
              className={`pb-4 text-base font-bold transition ${activeSection === 'ulasan' ? 'border-b-4 border-[#9B4A2F] text-[#9B4A2F]' : 'border-b-4 border-transparent text-[#9C8478] hover:text-[#6B4A3C]'}`}
            >
              {t('product_detail.reviews')}
            </button>
            <button
              role="tab"
              aria-selected={activeSection === 'rekomendasi'}
              onClick={() => scrollToSection('rekomendasi')}
              className={`pb-4 text-base font-bold transition ${activeSection === 'rekomendasi' ? 'border-b-4 border-[#9B4A2F] text-[#9B4A2F]' : 'border-b-4 border-transparent text-[#9C8478] hover:text-[#6B4A3C]'}`}
            >
              {t('product_detail.recommended_nav')}
            </button>
          </nav>
        </div>

        {/* LAYOUT: Main Content (Left) + Purchase Panel (Right) */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT: MAIN CONTENT AREA */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* DETAIL PRODUK = PRODUCT HERO (Image + Info + Description) */}
            {/* Increased scroll-mt to account for new taller sticky header */}
            <section id="detail-produk" className="scroll-mt-[180px] rounded-2xl border border-[#EAD8CA] bg-white p-6 md:p-8 shadow-sm">
              <div className="md:flex gap-8 items-start">
                {/* Product Image Gallery */}
                <div className="w-full md:w-[45%] shrink-0 flex flex-col gap-3">
                  {/* Main Image Container */}
                  <div className="relative group overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E8DCCB] aspect-square">
                    <img
                      src={currentGalleryImage?.imageUrl || product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-all duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = product.image
                      }}
                    />

                    {/* Navigation Arrows */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#3A1F16] shadow-md backdrop-blur transition hover:bg-white hover:scale-110 active:scale-95 z-10"
                          aria-label={t('products.prev_image', 'Foto Sebelumnya')}
                          title={t('products.prev_image', 'Foto Sebelumnya')}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#3A1F16] shadow-md backdrop-blur transition hover:bg-white hover:scale-110 active:scale-95 z-10"
                          aria-label={t('products.next_image', 'Foto Selanjutnya')}
                          title={t('products.next_image', 'Foto Selanjutnya')}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {galleryImages.length > 0 && (
                    <div
                      ref={thumbnailStripRef}
                      className="flex gap-2.5 overflow-x-auto p-2 scrollbar-none snap-x snap-mandatory focus:outline-none max-w-full w-full"
                    >
                      {galleryImages.map((img, idx) => (
                        <button
                          key={img.id !== -1 ? img.id : `thumb-${idx}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border-2 transition-all snap-start ${
                            selectedImageIndex === idx
                              ? 'border-[#9B4A2F] ring-2 ring-[#9B4A2F]/30 scale-105 shadow-sm'
                              : 'border-[#E8DCCB] opacity-70 hover:opacity-100 hover:border-[#9B4A2F]/60'
                          }`}
                        >
                          <img
                            src={img.imageUrl}
                            alt={`${product.name} thumbnail ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
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
                      <span>({product.reviewCount} {t('product_detail.reviews')})</span>
                    )}
                    {product.soldCount > 0 && (
                      <>
                        <span className="text-[#D0BFAF]">•</span>
                        <span>{product.soldCount} {t('product_detail.sold')}</span>
                      </>
                    )}
                  </div>

                  <p className="text-3xl font-black text-[#3A1F16]">
                    {formatRupiah(variant.price)}
                  </p>

                  <div className="mt-2 rounded-lg bg-[#F6EFE6] p-4 text-sm text-[#6B4A3C] border border-[#E8DCCB]">
                    <p>
                      <span className="font-semibold text-[#3A1F16]">{t('product_detail.category')}:</span> {product.category}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-[#3A1F16]">{t('product_detail.minimum_order')}:</span> {variant.minOrder} {t('product_detail.pcs')}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-[#3A1F16]">{t('product_detail.stock')}:</span> {isPurchasable ? product.stockQuantity : 0} {t('product_detail.pcs')}
                    </p>
                  </div>

                  {/* MOBILE ONLY: Render Purchase Panel inside Hero */}
                  <div className="mt-4 lg:hidden">
                    {renderPurchasePanel()}
                  </div>

                  {/* Full Description Integrated into Product Info */}
                  <div className="mt-6">
                    <h3 className="font-bold text-[#3A1F16] mb-2">{t('product_detail.description')}</h3>
                    <div className="text-[#6B4A3C] leading-relaxed whitespace-pre-wrap text-sm">
                      {product.description || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ULASAN */}
            <section id="ulasan" className="scroll-mt-[180px] rounded-2xl border border-[#EAD8CA] bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#3A1F16] mb-4">{t('product_detail.reviews')}</h2>
              
              <div className="mb-6 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-[#F6EFE6] p-4 text-[#3A1F16] border border-[#EAD8CA]/60">
                  <div className="text-3xl font-black">
                    <span className="text-[#E0A04E] mr-1">★</span>
                    {product.rating.toFixed(1)}
                  </div>
                  <span className="text-xs text-[#6B4A3C] mt-1">{t('product_detail.based_on_reviews', { count: product.reviewCount })}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-[#9C8478]">{t('product_detail.no_reviews')}</p>
              ) : (
                <div className="flex flex-col gap-4 border-t border-[#EAD8CA]/60 pt-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-[#F6EFE6] pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#3A1F16]">
                            {review.customer_name || 'Pelanggan Toti'}
                          </span>
                          <div className="flex text-[#E0A04E] text-sm">
                            {'★'.repeat(Math.round(review.rating))}
                            <span className="text-gray-300">{'★'.repeat(5 - Math.round(review.rating))}</span>
                          </div>
                        </div>
                        <span className="text-xs text-[#9C8478]">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B4A3C] mt-2">{review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                          {review.images.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setSelectedReviewLightBoxUrl(img.image_url)}
                              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E8DCCB] bg-white transition hover:opacity-90 snap-start focus:outline-none"
                            >
                              <img src={img.image_url} alt="Ulasan pelanggan" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* REKOMENDASI */}
            <section id="rekomendasi" className="scroll-mt-[180px] rounded-2xl border border-[#EAD8CA] bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#3A1F16] mb-4">{t('product_detail.recommended')}</h2>
              
              {recommendations.length === 0 ? (
                <p className="text-sm text-[#9C8478]">{t('product_detail.no_recommendations')}</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory focus:outline-none scrollbar-thin">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="w-[240px] sm:w-[260px] md:w-[280px] shrink-0 snap-start">
                      <ProductCard
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
                            category: p.category,
                            quantity: q,
                          })
                          toast.success(t('cart.add_to_cart_success'))
                        }}
                      />
                    </div>
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

      {/* Lightbox Modal */}
      {selectedReviewLightBoxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedReviewLightBoxUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={selectedReviewLightBoxUrl} alt="Enlarged review photo" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <button
              onClick={() => setSelectedReviewLightBoxUrl(null)}
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