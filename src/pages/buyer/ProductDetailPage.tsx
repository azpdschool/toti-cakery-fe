import { useEffect, useState, useRef, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProductBySlug, formatRupiah, getProductsByCategoryId, getAllProductsDetailed } from '@/services/productService'
import { getProductReviewsAPI } from '@/api/review'
import type { ReviewResponse } from '@/api/review'

import { useCart } from '@/context/CartContext'
import type { Product } from '@/services/productService'
import { useTranslation } from 'react-i18next'
import { useWhatsApp } from '@/context/WhatsAppContext'
import { ProductCard } from '@/components/common/ProductCard'
import { Heart, Share2, ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { toast } from 'react-hot-toast'
import { PhotoLightboxModal } from '@/components/common/PhotoLightboxModal'
import { BuyerBouncingLoader } from '@/components/common/TotiLoader'

type RatingFilter = 'all' | 'with-photos' | '5' | '4' | '3' | '2' | '1'
type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function ProductDetailPage() {
  const { getWhatsAppUrl } = useWhatsApp()
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [reviewSort, setReviewSort] = useState<ReviewSort>('newest')
  const [galleryLightbox, setGalleryLightbox] = useState<{
    isOpen: boolean
    images: string[]
    currentIndex: number
    altPrefix?: string
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    altPrefix: 'Foto',
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  
  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const thumbnailStripRef = useRef<HTMLDivElement>(null)
  const stickyHeaderRef = useRef<HTMLDivElement>(null)

  const [activeSection, setActiveSection] = useState('detail-produk')
  const { addItem } = useCart()
  const { t, i18n } = useTranslation()
  const { wishlistIds, toggleWishlist, requestRemoveWishlist, loading: wishlistLoading } = useWishlist()

  const isManualScrollRef = useRef(false)
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const reviewCounts = useMemo(() => {
    const counts = {
      all: reviews.length,
      withPhotos: 0,
      star5: 0,
      star4: 0,
      star3: 0,
      star2: 0,
      star1: 0,
    }
    for (const r of reviews) {
      if (r.images && r.images.length > 0) {
        counts.withPhotos += 1
      }
      const rounded = Math.round(r.rating)
      if (rounded === 5) counts.star5 += 1
      else if (rounded === 4) counts.star4 += 1
      else if (rounded === 3) counts.star3 += 1
      else if (rounded === 2) counts.star2 += 1
      else if (rounded === 1) counts.star1 += 1
    }
    return counts
  }, [reviews])

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews]

    if (ratingFilter === 'with-photos') {
      result = result.filter((r) => r.images && r.images.length > 0)
    } else if (ratingFilter !== 'all') {
      const targetRating = Number(ratingFilter)
      result = result.filter((r) => Math.round(r.rating) === targetRating)
    }

    result.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0

      if (reviewSort === 'oldest') {
        return aTime - bTime
      }
      if (reviewSort === 'highest') {
        return b.rating - a.rating || bTime - aTime
      }
      if (reviewSort === 'lowest') {
        return a.rating - b.rating || bTime - aTime
      }
      // 'newest' default
      return bTime - aTime
    })

    return result
  }, [reviews, ratingFilter, reviewSort])

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
          const minOrd = data.variants[0]?.minOrder || 1
          const initQty = data.stockQuantity > 0 ? Math.min(data.stockQuantity, Math.max(minOrd, 1)) : 1
          setQuantity(initQty)

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
            
          // Fetch Recommendations (same category with client-side fallback)
          const filterOtherProducts = (list: Product[]) =>
            list.filter(
              (p) =>
                p.id !== data.id &&
                p.backendId !== data.backendId &&
                p.slug !== data.slug &&
                p.isActive !== false &&
                p.isAvailable !== false
            )

          const fetchRecommendations = async () => {
            try {
              if (data.categoryId) {
                const catProducts = await getProductsByCategoryId(data.categoryId)
                const recs = filterOtherProducts(catProducts)
                if (recs.length > 0) {
                  setRecommendations(recs)
                  return
                }
              }
              const allProducts = await getAllProductsDetailed()
              setRecommendations(filterOtherProducts(allProducts))
            } catch (err) {
              console.error('Failed to fetch recommendations', err)
            }
          }

          void fetchRecommendations()
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      isManualScrollRef.current = true
      if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current)
      setActiveSection(id)

      // Calculate total sticky offset: Navbar (77px) + sticky header height + breathing room
      const headerOffset = stickyHeaderRef.current
        ? 77 + stickyHeaderRef.current.offsetHeight + 16
        : 180
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      manualScrollTimeoutRef.current = setTimeout(() => {
        isManualScrollRef.current = false
      }, 800)
    }
  }

  useEffect(() => {
    if (loading || !product) return

    const sections = ['detail-produk', 'ulasan', 'rekomendasi']

    const handleScroll = () => {
      if (isManualScrollRef.current) return

      // Bottom-of-page edge case: if user scrolls to bottom, force highlight rekomendasi
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60
      if (isAtBottom) {
        setActiveSection('rekomendasi')
        return
      }

      // Detection line: Navbar (77px) + sticky header height + buffer
      const headerOffset = stickyHeaderRef.current
        ? 77 + stickyHeaderRef.current.offsetHeight + 24
        : 190

      let currentSection = sections[0]
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el) {
          const top = el.getBoundingClientRect().top
          if (top <= headerOffset) {
            currentSection = sectionId
          }
        }
      }
      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current)
      }
    }
  }, [loading, product])

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
    return <BuyerBouncingLoader mode="section" size="lg" />
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <p className="text-toti-error">{error || t('product_detail.failed_to_load')}</p>
        <Link to="/catalog" className="mt-4 inline-block text-toti-brick underline">
          {t('product_detail.back_to_catalog')}
        </Link>
      </div>
    )
  }

  const variant = product.variants[0]
  const minOrder = variant.minOrder || 1
  const step = variant.step || 1
  const isStockInsufficientForMin = product.stockQuantity > 0 && product.stockQuantity < minOrder
  const isPurchasable = product.isAvailable && product.isInStock && product.stockQuantity > 0 && !isStockInsufficientForMin
  const maxQty = product.stockQuantity

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
  } else if (isStockInsufficientForMin) {
    badgeText = `⚠️ ${i18n.language === 'en' ? `Stock is below minimum order (${minOrder})` : `Stok kurang dari minimum pemesanan (${minOrder})`}`;
  }

  const renderPurchasePanel = () => (
    <div className="flex flex-col gap-4">
      {/* Action Box */}
      <div className="rounded-2xl border border-toti-beige/80 bg-white/95 backdrop-blur-sm shadow-[0_2px_10px_rgba(58,31,22,0.04)] p-5">
        <div className="mb-4 pb-3 border-b border-toti-cream">
          <span className="text-xs font-semibold text-toti-secondary">{t('product_detail.price', 'Harga')}</span>
          <p className="text-2xl font-black text-toti-ink">{formatRupiah(variant.price)}</p>
        </div>
        <h3 className="font-bold text-toti-ink mb-4">{t('product_detail.quantity')}</h3>
        
        <div className="flex items-center gap-3">
          <div className="toti-stepper">
            <button
              onClick={() => setQuantity((q) => Math.max(minOrder, q - step))}
              disabled={!isPurchasable || quantity <= minOrder}
              className="toti-stepper-btn"
              aria-label={t('product_detail.decrease_qty')}
              title={t('product_detail.decrease_qty')}
            >
              -
            </button>
            <span className="w-12 text-center text-sm font-semibold select-none">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + step))}
              disabled={!isPurchasable || quantity >= maxQty}
              className="toti-stepper-btn"
              aria-label={t('product_detail.increase_qty')}
              title={t('product_detail.increase_qty')}
            >
              +
            </button>
          </div>
          {isPurchasable && (
            <span className="text-sm font-semibold text-toti-ink">
              {t('product_detail.stock_remaining')}: {maxQty}
            </span>
          )}
        </div>
        
        {badgeText && (
          <div className="mt-3 rounded-lg border border-toti-error/30 bg-toti-error/15 p-2 text-xs font-semibold text-toti-brick-hover">
            {badgeText}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-toti-cream pt-4">
          <span className="text-sm text-toti-secondary">{t('product_detail.subtotal')}</span>
          <span className="font-black text-toti-ink text-lg">{formatRupiah(subtotal)}</span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!isPurchasable}
            className="toti-btn-primary w-full h-11"
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
              className="toti-btn-secondary flex-1 h-10 px-4"
              aria-label={wishlistIds.has(product.id) ? t('product_detail.remove_wishlist') : t('product_detail.add_wishlist')}
            >
              <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-toti-error text-toti-error' : ''}`} />
              {t('product_detail.wishlist')}
            </button>
            <button
              onClick={handleShare}
              className="toti-btn-secondary flex-1 h-10 px-4"
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
        <p className="font-bold text-toti-ink">{t('product_detail.custom_order_title')}</p>
        <p className="mt-1 text-xs text-toti-secondary">
          {t('product_detail.custom_order_desc')}
        </p>
        <a 
          href={getWhatsAppUrl(t('product_detail.wa_custom_message'))} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-3 toti-btn-whatsapp w-full h-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {t('product_detail.chat_with_us')}
        </a>
      </div>
    </div>
  )

  const renderMobileInlineActions = () => (
    <div className="flex flex-col gap-3">
      {/* Secondary Actions: Wishlist & Share */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (wishlistIds.has(product.id)) {
              requestRemoveWishlist(product.id)
            } else {
              toggleWishlist(product.id)
            }
          }}
          disabled={wishlistLoading}
          className="toti-btn-secondary flex-1 h-10 px-4"
          aria-label={wishlistIds.has(product.id) ? t('product_detail.remove_wishlist') : t('product_detail.add_wishlist')}
        >
          <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-toti-error text-toti-error' : ''}`} />
          {t('product_detail.wishlist')}
        </button>
        <button
          onClick={handleShare}
          className="toti-btn-secondary flex-1 h-10 px-4"
          aria-label={t('product_detail.share_product')}
        >
          <Share2 className="h-4 w-4" />
          {t('product_detail.share')}
        </button>
      </div>

      {/* WA Custom Order Box */}
      <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex flex-col items-center text-center">
        <p className="font-bold text-toti-ink">{t('product_detail.custom_order_title')}</p>
        <p className="mt-1 text-xs text-toti-secondary">
          {t('product_detail.custom_order_desc')}
        </p>
        <a 
          href={getWhatsAppUrl(t('product_detail.wa_custom_message'))} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-3 toti-btn-whatsapp w-full h-10"
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
    <div className="pb-32 sm:pb-16 w-full max-w-full min-w-0 overflow-x-clip">
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 lg:px-8 w-full max-w-full min-w-0">
        
        {/* UNIFIED STICKY HEADER: PRODUCT TITLE + SECTION NAVIGATION TABS */}
        <div 
          ref={stickyHeaderRef}
          className="sticky top-[77px] z-20 mb-4 md:mb-8 rounded-2xl border border-toti-divider/60 bg-gradient-to-r from-toti-alt/85 via-toti-cream/85 to-toti-beige/80 p-4 sm:p-5 shadow-[0_4px_16px_rgba(58,31,22,0.06)] backdrop-blur-md min-w-0"
        >
          <div className="mb-2 md:mb-3 w-full max-w-full min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-toti-ink leading-tight">
              {product.name}
            </h1>
          </div>

          <nav className="flex items-center gap-6 sm:gap-8 overflow-x-auto whitespace-nowrap w-full max-w-full pb-px scrollbar-none" role="tablist">
            <button
              role="tab"
              aria-selected={activeSection === 'detail-produk'}
              onClick={() => scrollToSection('detail-produk')}
              className={`pb-2 md:pb-2.5 text-sm sm:text-base font-bold transition border-b-2 ${activeSection === 'detail-produk' ? 'border-toti-brick text-toti-brick' : 'border-transparent text-toti-muted hover:text-toti-secondary'}`}
            >
              {t('product_detail.product_details')}
            </button>
            <button
              role="tab"
              aria-selected={activeSection === 'ulasan'}
              onClick={() => scrollToSection('ulasan')}
              className={`pb-2 md:pb-2.5 text-sm sm:text-base font-bold transition border-b-2 ${activeSection === 'ulasan' ? 'border-toti-brick text-toti-brick' : 'border-transparent text-toti-muted hover:text-toti-secondary'}`}
            >
              {t('product_detail.reviews')}
            </button>
            <button
              role="tab"
              aria-selected={activeSection === 'rekomendasi'}
              onClick={() => scrollToSection('rekomendasi')}
              className={`pb-2 md:pb-2.5 text-sm sm:text-base font-bold transition border-b-2 ${activeSection === 'rekomendasi' ? 'border-toti-brick text-toti-brick' : 'border-transparent text-toti-muted hover:text-toti-secondary'}`}
            >
              {t('product_detail.recommended_nav')}
            </button>
          </nav>
        </div>

        {/* LAYOUT: Main Content (Left) + Purchase Panel (Right) */}
        <div className="grid gap-6 md:gap-8 sm:grid-cols-12 items-start w-full max-w-full min-w-0">
          
          {/* LEFT: MAIN CONTENT AREA */}
          <div className="sm:col-span-7 md:col-span-7 lg:col-span-8 flex flex-col gap-6 md:gap-8 w-full max-w-full min-w-0">
            
            {/* DETAIL PRODUK = PRODUCT HERO (Image + Info + Description) */}
            <section id="detail-produk" className="scroll-mt-[190px] rounded-2xl border border-toti-beige/80 bg-white/95 backdrop-blur-sm shadow-[0_2px_10px_rgba(58,31,22,0.04)] p-4 sm:p-6 md:p-8 w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start w-full max-w-full min-w-0">
                {/* Product Image Gallery */}
                <div className="w-full lg:w-[45%] shrink-0 flex flex-col gap-2.5 max-w-full min-w-0">
                  {/* Main Image Container */}
                  <div
                    onClick={() =>
                      setGalleryLightbox({
                        isOpen: true,
                        images: galleryImages.map((img) => img.imageUrl),
                        currentIndex: selectedImageIndex,
                        altPrefix: product.name,
                      })
                    }
                    className="relative group overflow-hidden rounded-2xl bg-toti-alt shadow-sm border border-toti-beige/80 w-full aspect-square shrink-0 flex items-center justify-center max-w-full min-w-0 cursor-zoom-in"
                  >
                    <img
                      src={currentGalleryImage?.imageUrl || product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center block transition-all duration-200 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = product.image
                      }}
                    />

                    {/* Navigation Arrows */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrevImage()
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/85 text-toti-ink shadow-md backdrop-blur transition hover:bg-white hover:scale-110 active:scale-95 z-10"
                          aria-label={t('products.prev_image', 'Foto Sebelumnya')}
                          title={t('products.prev_image', 'Foto Sebelumnya')}
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNextImage()
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/85 text-toti-ink shadow-md backdrop-blur transition hover:bg-white hover:scale-110 active:scale-95 z-10"
                          aria-label={t('products.next_image', 'Foto Selanjutnya')}
                          title={t('products.next_image', 'Foto Selanjutnya')}
                        >
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {galleryImages.length > 0 && (
                    <div
                      ref={thumbnailStripRef}
                      className="flex gap-2 sm:gap-2.5 overflow-x-auto p-1 sm:p-2 scrollbar-none snap-x snap-mandatory focus:outline-none max-w-full w-full min-w-0"
                    >
                      {galleryImages.map((img, idx) => (
                        <button
                          key={img.id !== -1 ? img.id : `thumb-${idx}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-white border-2 transition-all snap-start ${
                            selectedImageIndex === idx
                              ? 'border-toti-brick ring-2 ring-toti-brick/30 scale-105 shadow-sm'
                              : 'border-toti-beige opacity-70 hover:opacity-100 hover:border-toti-brick/60'
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
                <div className="w-full lg:w-[55%] mt-4 lg:mt-0 flex flex-col gap-3 md:gap-4 min-w-0 max-w-full">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-toti-secondary">
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 font-semibold">
                        <span className="text-toti-honey">★</span>
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {product.reviewCount > 0 && (
                      <span>({product.reviewCount} {t('product_detail.reviews')})</span>
                    )}
                    {product.soldCount > 0 && (
                      <>
                        <span className="text-toti-divider">•</span>
                        <span>{product.soldCount} {t('product_detail.sold')}</span>
                      </>
                    )}
                  </div>

                  <p className="text-3xl font-black text-toti-ink">
                    {formatRupiah(variant.price)}
                  </p>

                  <div className="mt-2 rounded-lg bg-toti-cream p-4 text-sm text-toti-secondary border border-toti-beige">
                    <p>
                      <span className="font-semibold text-toti-ink">{t('product_detail.category')}:</span> {product.category}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-toti-ink">{t('product_detail.minimum_order')}:</span> {variant.minOrder} {t('product_detail.pcs')}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-toti-ink">{t('product_detail.stock')}:</span> {isPurchasable ? product.stockQuantity : 0} {t('product_detail.pcs')}
                    </p>
                  </div>

                  {/* MOBILE ONLY: Render Secondary Actions & WA Box (Sticky bottom handles Add to Cart) */}
                  <div className="mt-4 sm:hidden">
                    {renderMobileInlineActions()}
                  </div>

                  {/* Full Description Integrated into Product Info */}
                  <div className="mt-6">
                    <h3 className="font-bold text-toti-ink mb-2">{t('product_detail.description')}</h3>
                    <div className="text-toti-secondary leading-relaxed whitespace-pre-wrap text-sm">
                      {(() => {
                        const isEnglish = i18n.language?.toLowerCase().startsWith('en')
                        return isEnglish
                          ? (product.descriptionEn?.trim() || product.descriptionId?.trim() || product.description?.trim() || '-')
                          : (product.descriptionId?.trim() || product.description?.trim() || '-')
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ULASAN */}
            <section id="ulasan" className="scroll-mt-[190px] rounded-2xl border border-toti-beige/80 bg-white/95 backdrop-blur-sm shadow-[0_2px_10px_rgba(58,31,22,0.04)] p-4 sm:p-6 md:p-8">
              <h2 className="text-xl font-black text-toti-ink mb-4">{t('product_detail.reviews')}</h2>
              
              {reviews.length === 0 ? (
                <p className="text-sm text-toti-muted">{t('product_detail.no_reviews')}</p>
              ) : (
                <>
                  {/* Shopee-Style Summary & Filter Card */}
                  <div className="mb-6 rounded-xl border border-toti-beige bg-toti-cream p-4 sm:p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-5 sm:gap-6">
                      {/* Left: Overall Rating */}
                      <div className="flex flex-col items-center justify-center shrink-0 min-w-[140px] text-center border-b md:border-b-0 md:border-r border-toti-beige pb-4 md:pb-0 md:pr-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-toti-brick">
                            {product.rating > 0
                              ? product.rating.toFixed(1)
                              : (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                          </span>
                          <span className="text-sm font-semibold text-toti-secondary">
                            {t('product_detail.out_of_five', 'dari 5')}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(product.rating || (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length))
                                  ? 'fill-toti-honey text-toti-honey'
                                  : 'text-toti-disabled fill-transparent'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="mt-1.5 text-xs text-toti-secondary">
                          {t('product_detail.based_on_reviews', { count: reviews.length })}
                        </span>
                      </div>

                      {/* Right: Filter Chips */}
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        {/* Semua */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('all')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === 'all'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_all', 'Semua')}</span>
                          <span className="opacity-80">({reviewCounts.all})</span>
                        </button>

                        {/* 5 Stars */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('5')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === '5'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_star', { star: 5 })}</span>
                          <span className="opacity-80">({reviewCounts.star5})</span>
                        </button>

                        {/* 4 Stars */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('4')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === '4'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_star', { star: 4 })}</span>
                          <span className="opacity-80">({reviewCounts.star4})</span>
                        </button>

                        {/* 3 Stars */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('3')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === '3'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_star', { star: 3 })}</span>
                          <span className="opacity-80">({reviewCounts.star3})</span>
                        </button>

                        {/* 2 Stars */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('2')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === '2'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_star', { star: 2 })}</span>
                          <span className="opacity-80">({reviewCounts.star2})</span>
                        </button>

                        {/* 1 Star */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('1')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === '1'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_star', { star: 1 })}</span>
                          <span className="opacity-80">({reviewCounts.star1})</span>
                        </button>

                        {/* Dengan Foto */}
                        <button
                          type="button"
                          onClick={() => setRatingFilter('with-photos')}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                            ratingFilter === 'with-photos'
                              ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                              : 'bg-white text-toti-ink border-toti-beige hover:border-toti-brick hover:text-toti-brick'
                          }`}
                        >
                          <span>{t('product_detail.filter_with_photos', 'Dengan Foto')}</span>
                          <span className="opacity-80">({reviewCounts.withPhotos})</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sort Bar */}
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-toti-beige/60 pb-3">
                    <span className="text-xs sm:text-sm font-semibold text-toti-secondary">
                      {t('product_detail.sort_label', 'Urutkan')}:
                    </span>
                    <select
                      value={reviewSort}
                      onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                      className="rounded-lg border border-toti-divider bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-toti-ink focus:outline-none focus:ring-2 focus:ring-toti-brick cursor-pointer"
                    >
                      <option value="newest">{t('product_detail.sort_newest', 'Terbaru')}</option>
                      <option value="oldest">{t('product_detail.sort_oldest', 'Terlama')}</option>
                      <option value="highest">{t('product_detail.sort_highest', 'Rating Tertinggi')}</option>
                      <option value="lowest">{t('product_detail.sort_lowest', 'Rating Terendah')}</option>
                    </select>
                  </div>

                  {/* Review List */}
                  {filteredAndSortedReviews.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-sm text-toti-muted">
                        {t('product_detail.no_filtered_reviews', 'Belum ada ulasan untuk filter ini.')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setRatingFilter('all')}
                        className="inline-flex items-center rounded-lg border border-toti-brick px-4 py-2 text-xs sm:text-sm font-semibold text-toti-brick hover:bg-toti-brick hover:text-white transition cursor-pointer"
                      >
                        {t('product_detail.reset_filter', 'Reset Filter')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {filteredAndSortedReviews.map((review) => (
                        <div key={review.id} className="border-b border-toti-cream pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-toti-ink">
                                {review.customer?.nama || review.customer_name || 'Pelanggan Toti'}
                              </span>
                              <div className="flex text-toti-honey text-sm">
                                {'★'.repeat(Math.round(review.rating))}
                                <span className="text-toti-disabled">{'★'.repeat(5 - Math.round(review.rating))}</span>
                              </div>
                            </div>
                            <span className="text-xs text-toti-muted">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-toti-secondary mt-2 whitespace-pre-line leading-relaxed">
                            {review.comment}
                          </p>
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                              {review.images.map((img, imgIdx) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() =>
                                    setGalleryLightbox({
                                      isOpen: true,
                                      images: (review.images || []).map((i) => i.image_url),
                                      currentIndex: imgIdx,
                                      altPrefix: `Foto ulasan ${review.customer?.nama || review.customer_name || ''}`,
                                    })
                                  }
                                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-toti-beige bg-white transition hover:opacity-90 snap-start focus:outline-none cursor-zoom-in"
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
                </>
              )}
            </section>

            {/* REKOMENDASI */}
            <section id="rekomendasi" className="scroll-mt-[190px] rounded-2xl border border-toti-beige/80 bg-white/95 backdrop-blur-sm shadow-[0_2px_10px_rgba(58,31,22,0.04)] p-4 sm:p-6 md:p-8">
              <h2 className="text-xl font-black text-toti-ink mb-4">{t('product_detail.recommended')}</h2>
              
              {recommendations.length === 0 ? (
                <p className="text-sm text-toti-muted">{t('product_detail.no_recommendations')}</p>
              ) : (
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-2.5 -my-1.5 snap-x snap-mandatory focus:outline-none scrollbar-thin w-full max-w-full min-w-0">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="w-[200px] sm:w-[240px] md:w-[260px] shrink-0 snap-start">
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
          
          {/* RIGHT: PURCHASE PANEL (STICKY ON TABLET & DESKTOP) */}
          <div className="hidden sm:flex sm:col-span-5 md:col-span-5 lg:col-span-4 sticky top-[190px] z-10 flex-col gap-4">
            {renderPurchasePanel()}
          </div>
          
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-toti-beige px-3 py-2 sm:px-4 sm:py-2.5 max-sm:flex hidden sm:hidden items-center justify-between gap-2 sm:gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col min-w-0 shrink-0">
          <span className="text-[10px] font-medium text-toti-secondary uppercase tracking-wide">
            {t('product_detail.subtotal', 'Total')}
          </span>
          <span className="text-sm font-black text-toti-ink truncate max-w-[90px] sm:max-w-none">
            {formatRupiah(subtotal)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Stepper */}
          <div className="toti-stepper shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(minOrder, q - step))}
              disabled={!isPurchasable || quantity <= minOrder}
              className="toti-stepper-btn"
              aria-label={t('product_detail.decrease_qty')}
            >
              -
            </button>
            <span className="w-5 sm:w-6 text-center text-xs font-bold text-toti-ink select-none">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + step))}
              disabled={!isPurchasable || quantity >= maxQty}
              className="toti-stepper-btn"
              aria-label={t('product_detail.increase_qty')}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isPurchasable}
            className="toti-btn-primary h-9 px-3.5 text-xs whitespace-nowrap min-w-0"
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-none">
              {isPurchasable ? t('product_detail.add_to_cart', 'Tambah Keranjang') : (badgeText || t('product_detail.unavailable', 'Stok Habis'))}
            </span>
          </button>
        </div>
      </div>

      {/* Full-Screen Photo Lightbox Modal */}
      <PhotoLightboxModal
        isOpen={galleryLightbox.isOpen}
        images={galleryLightbox.images}
        currentIndex={galleryLightbox.currentIndex}
        altPrefix={galleryLightbox.altPrefix}
        onClose={() => setGalleryLightbox((prev) => ({ ...prev, isOpen: false }))}
        onIndexChange={(newIdx) => setGalleryLightbox((prev) => ({ ...prev, currentIndex: newIdx }))}
      />
    </div>
  )
}