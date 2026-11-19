import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  MapPin,
  X,
  ExternalLink,
  Minus,
  Plus,
} from 'lucide-react'
import { BuyerBouncingLoader } from '@/components/common/TotiLoader'
import { ROUTES } from '@/constants'
import { useCart } from '@/context/CartContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import {
  getActiveProducts,
  formatRupiah,
  type SimpleProduct,
} from '@/services/productService'
import { getLatestReviews } from '@/services/reviewService'
import type { ReviewResponse } from '@/api/review'
import {
  getStoreCustomization,
  DEFAULT_STORE_CUSTOMIZATION,
  optimizeCloudinaryHeroUrl,
  type StoreCustomizationData,
} from '@/services/storeCustomizationService'
import { PhotoLightboxModal } from '@/components/common/PhotoLightboxModal'
import { ScrollReveal } from '@/components/common/ScrollMotion'

const DEFAULT_HERO_IMAGE = DEFAULT_STORE_CUSTOMIZATION.hero_image_url!
const DEFAULT_MAPS_URL = DEFAULT_STORE_CUSTOMIZATION.maps_embed_url!

interface HomeReview {
  id: number
  customerName: string
  rating: number
  comment: string
  purchasedProductName: string
  productId: string
  productName: string
  createdAt?: string
  images?: { id: number; image_url: string }[]
}

type ModalRatingFilter = 'all' | 'with-photos' | '5' | '4' | '3' | '2' | '1'
type ModalReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function HomePage() {
  const { addItem } = useCart()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [customization, setCustomization] = useState<StoreCustomizationData | null>(null)
  const [isMapActive, setIsMapActive] = useState(false)

  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  const [reviews, setReviews] = useState<HomeReview[]>([])
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<number>>(new Set())

  // Modal State for Store-wide Reviews
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false)
  const [allStoreReviews, setAllStoreReviews] = useState<ReviewResponse[] | null>(null)
  const [loadingAllReviews, setLoadingAllReviews] = useState(false)
  const [modalRatingFilter, setModalRatingFilter] = useState<ModalRatingFilter>('all')
  const [modalReviewSort, setModalReviewSort] = useState<ModalReviewSort>('newest')

  // Lightbox State
  const [photoLightbox, setPhotoLightbox] = useState<{
    isOpen: boolean
    images: string[]
    currentIndex: number
    altPrefix?: string
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    altPrefix: 'Foto ulasan',
  })
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (location.hash === '#our-store') {
      const timer = setTimeout(() => {
        const el = document.getElementById('our-store')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  const getMatchedProduct = (productId: string | number) => {
    return products.find(
      (p) => p.backendId === Number(productId) || p.id === String(productId)
    )
  }

  const toggleExpandReview = (reviewId: number) => {
    setExpandedReviewIds((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) next.delete(reviewId)
      else next.add(reviewId)
      return next
    })
  }

  const openAllReviewsModal = async () => {
    setIsAllReviewsModalOpen(true)
    if (!allStoreReviews) {
      try {
        setLoadingAllReviews(true)
        const data = await getLatestReviews(50)
        setAllStoreReviews(data || [])
      } catch (err) {
        console.error('Failed to load all store reviews:', err)
        toast.error(t('common.error', 'Gagal memuat ulasan'))
      } finally {
        setLoadingAllReviews(false)
      }
    }
  }

  useEffect(() => {
    if (!isAllReviewsModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // If photo lightbox is open, let PhotoLightboxModal handle escape
      if (e.key === 'Escape' && !photoLightbox.isOpen) {
        setIsAllReviewsModalOpen(false)
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAllReviewsModalOpen, photoLightbox.isOpen])

  const modalReviewCounts = useMemo(() => {
    const list = allStoreReviews || []
    const counts = {
      all: list.length,
      withPhotos: 0,
      star5: 0,
      star4: 0,
      star3: 0,
      star2: 0,
      star1: 0,
    }
    for (const r of list) {
      if (r.images && r.images.length > 0) counts.withPhotos += 1
      const rounded = Math.round(r.rating)
      if (rounded === 5) counts.star5 += 1
      else if (rounded === 4) counts.star4 += 1
      else if (rounded === 3) counts.star3 += 1
      else if (rounded === 2) counts.star2 += 1
      else if (rounded === 1) counts.star1 += 1
    }
    return counts
  }, [allStoreReviews])

  const filteredAndSortedModalReviews = useMemo(() => {
    let result = [...(allStoreReviews || [])]

    if (modalRatingFilter === 'with-photos') {
      result = result.filter((r) => r.images && r.images.length > 0)
    } else if (modalRatingFilter !== 'all') {
      const targetRating = Number(modalRatingFilter)
      result = result.filter((r) => Math.round(r.rating) === targetRating)
    }

    result.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0

      if (modalReviewSort === 'oldest') {
        return aTime - bTime
      }
      if (modalReviewSort === 'highest') {
        return b.rating - a.rating || bTime - aTime
      }
      if (modalReviewSort === 'lowest') {
        return a.rating - b.rating || bTime - aTime
      }
      return bTime - aTime
    })

    return result
  }, [allStoreReviews, modalRatingFilter, modalReviewSort])

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        const [allProducts, allReviews, storeData] = await Promise.all([
          getActiveProducts().catch((err) => {
            console.error('Failed to load active products:', err)
            return []
          }),
          getLatestReviews(6).catch((err) => {
            console.error('Failed to load latest reviews:', err)
            return []
          }),
          getStoreCustomization().catch((err) => {
            console.error('Failed to load store customization:', err)
            return null
          }),
        ])
        if (!isMounted) return
        setProducts(allProducts)
        setProductQuantities((prev) => {
          const next = { ...prev }
          allProducts.forEach((p) => {
            if (next[p.id] === undefined) {
              next[p.id] = p.minimumOrder || 1
            }
          })
          return next
        })
        setReviews(
          (allReviews || []).map((item) => ({
            id: item.id,
            customerName: item.customer?.nama || item.customer_name || t('home.default_customer_name', 'Pelanggan'),
            rating: item.rating,
            comment: item.comment || '',
            purchasedProductName: item.product?.nama_produk || item.product_name || '',
            productId: String(item.product_id),
            productName: item.product?.nama_produk || item.product_name || '',
            createdAt: item.created_at,
            images: item.images || [],
          }))
        )
        if (storeData) {
          setCustomization(storeData)
        }
      } catch (err) {
        console.error('Error in HomePage loadData:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [t])

  const handleIncrementProductQty = (product: SimpleProduct, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const minOrder = product.minimumOrder || 1
    const maxQty = product.stockQuantity
    const current = productQuantities[product.id] ?? minOrder
    const next = Math.min(maxQty, current + 1)
    setProductQuantities((prev) => ({ ...prev, [product.id]: next }))
  }

  const handleDecrementProductQty = (product: SimpleProduct, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const minOrder = product.minimumOrder || 1
    const current = productQuantities[product.id] ?? minOrder
    const next = Math.max(minOrder, current - 1)
    setProductQuantities((prev) => ({ ...prev, [product.id]: next }))
  }

  const handleAddToCart = (product: SimpleProduct, quantity?: number) => {
    const isPurchasable = product.isAvailable && product.isInStock && product.stockQuantity > 0
    if (!isPurchasable) {
      toast.error(t('cart.add_to_cart_failure', 'Gagal menambahkan produk ke keranjang'))
      return
    }

    const minOrder = product.minimumOrder || 1
    const maxQty = product.stockQuantity
    const rawQty = quantity ?? (productQuantities[product.id] ?? minOrder)
    const qtyToAdd = Math.max(minOrder, Math.min(maxQty, rawQty))

    addItem({
      productId: product.id,
      variantId: `${product.id}-default`,
      name: product.name,
      variantName: 'Default',
      price: product.price,
      image: product.image,
      minOrder,
      step: 1,
      category: product.category,
      quantity: qtyToAdd,
    })
    toast.success(t('cart.add_to_cart_success', 'Ditambahkan ke keranjang'))
  }

  // Horizontal scroll carousel behavior (products)
  const productScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollProductLeft, setCanScrollProductLeft] = useState(false)
  const [canScrollProductRight, setCanScrollProductRight] = useState(true)

  const updateProductScrollButtons = () => {
    if (productScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productScrollRef.current
      setCanScrollProductLeft(scrollLeft > 0)
      setCanScrollProductRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    updateProductScrollButtons()
    window.addEventListener('resize', updateProductScrollButtons)
    return () => window.removeEventListener('resize', updateProductScrollButtons)
  }, [products])

  const scrollProductLeft = () => {
    productScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
    setTimeout(updateProductScrollButtons, 300)
  }
  const scrollProductRight = () => {
    productScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
    setTimeout(updateProductScrollButtons, 300)
  }

  // Horizontal scroll carousel behavior (testimonials) - fixed scroll direction
  const reviewScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollReviewLeft, setCanScrollReviewLeft] = useState(false)
  const [canScrollReviewRight, setCanScrollReviewRight] = useState(true)

  const updateReviewScrollButtons = () => {
    if (reviewScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = reviewScrollRef.current
      setCanScrollReviewLeft(scrollLeft > 0)
      setCanScrollReviewRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    updateReviewScrollButtons()
    window.addEventListener('resize', updateReviewScrollButtons)
    return () => window.removeEventListener('resize', updateReviewScrollButtons)
  }, [reviews])

  const scrollReviewLeft = () => {
    reviewScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
    setTimeout(updateReviewScrollButtons, 300)
  }
  const scrollReviewRight = () => {
    reviewScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
    setTimeout(updateReviewScrollButtons, 300)
  }

  const scrollToTestimonials = () => {
    const el = document.getElementById('testimonials-section')
    if (el) {
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'id'
  const localeContent = customization?.content?.[currentLang]

  const heroTitle = localeContent?.hero_title || `${t('home.hero_title_1')}\n${t('home.hero_title_2')}`
  const heroSubtitle = localeContent?.hero_subtitle || t('home.hero_desc')
  const cleanHeroTitle = heroTitle.replace(/\n/g, ' ').trim()

  const heroSlides = useMemo(() => {
    const urls = customization?.hero_image_urls
    if (urls && urls.length > 0) {
      return urls.map((url) => optimizeCloudinaryHeroUrl(url, 1600))
    }
    if (customization?.hero_image_url) {
      return [optimizeCloudinaryHeroUrl(customization.hero_image_url, 1600)]
    }
    return [optimizeCloudinaryHeroUrl(DEFAULT_HERO_IMAGE, 1600)]
  }, [customization])

  useEffect(() => {
    if (currentSlide >= heroSlides.length) {
      setCurrentSlide(0)
    }
  }, [heroSlides.length, currentSlide])

  useEffect(() => {
    if (heroSlides.length <= 1 || prefersReducedMotion || isHeroPaused) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [heroSlides.length, prefersReducedMotion, isHeroPaused])

  const aboutTitle = localeContent?.about_title || t('home.about_title')
  const aboutDescription =
    localeContent?.about_description ||
    `${t('home.about_desc_1')}${t('home.made_with_love')}${t('home.about_desc_2')}`
  const mapsEmbedUrl = customization?.maps_embed_url || DEFAULT_MAPS_URL
  const storeAddress = customization?.store_address

  // Embed language handling: if embed string contains pb with !1sen, switch to !1sid at component render
  const renderedMapsUrl = useMemo(() => {
    if (mapsEmbedUrl && mapsEmbedUrl.includes('!1sen')) {
      return mapsEmbedUrl.replace(/!1sen/g, '!1sid')
    }
    return mapsEmbedUrl
  }, [mapsEmbedUrl])

  if (loading) {
    return <BuyerBouncingLoader mode="section" size="lg" />
  }

  return (
    <div className="relative isolate min-h-screen">
      <div className="relative z-10 pb-12 space-y-8 sm:space-y-10 lg:space-y-12 bg-transparent">
        {/* 1. HERO SECTION (Seamless, edge-to-edge borderless split Hero) */}
        <section className="w-full overflow-hidden border-b border-toti-beige/70 bg-transparent">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid w-full grid-cols-1 md:grid-cols-12 md:items-center gap-6 md:gap-8 lg:gap-10 py-6 sm:py-8 md:py-10 lg:py-12">
              {/* Left Text Column */}
              <div className="md:col-span-5 order-2 md:order-1 relative overflow-hidden flex flex-col justify-center bg-transparent">
                <ScrollReveal direction="up" distance={20} className="relative z-10 max-w-lg">
                  <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-toti-ink whitespace-pre-line leading-tight">
                    {heroTitle}
                  </h1>
                  <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-toti-secondary max-w-[60ch] whitespace-pre-line font-sans">
                    {heroSubtitle}
                  </p>
                  <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                      to={ROUTES.CATALOG}
                      className="toti-btn-primary min-h-[44px] px-6 py-2.5 text-sm sm:text-base cursor-pointer w-full sm:w-auto text-center hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    >
                      {t('home.view_products', 'Lihat produk')}
                    </Link>
                    <button
                      type="button"
                      onClick={scrollToTestimonials}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-toti-honey px-6 py-2.5 text-sm sm:text-base font-semibold text-toti-ink transition-all duration-150 hover:bg-toti-honey-hover hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-honey focus-visible:ring-offset-2 cursor-pointer w-full sm:w-auto text-center"
                    >
                      {t('home.read_reviews', 'Baca ulasan')}
                    </button>
                  </div>
                </ScrollReveal>
              </div>

              {/* Right Photo Column */}
              <div className="md:col-span-7 order-1 md:order-2 relative w-full flex items-center justify-center bg-transparent">
                <div
                  className="relative w-full aspect-[3/2] max-h-[520px] rounded-2xl md:rounded-3xl overflow-hidden bg-toti-alt shadow-[0_20px_50px_-15px_rgba(58,31,22,0.18)] ring-1 ring-toti-divider/50 group"
                  onMouseEnter={() => setIsHeroPaused(true)}
                  onMouseLeave={() => setIsHeroPaused(false)}
                  onFocusCapture={() => setIsHeroPaused(true)}
                  onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setIsHeroPaused(false)
                    }
                  }}
                >
                  {heroSlides.map((url, idx) => {
                    const isActive = idx === currentSlide
                    const isSingle = heroSlides.length === 1
                    const slideAlt = isSingle
                      ? t('home.hero_image_alt', cleanHeroTitle || 'Aneka kue lezat dan cake spesial Toti Cakery')
                      : `${cleanHeroTitle || 'Toti Cakery'} — ${t('home.hero_slide_indicator', {
                          current: idx + 1,
                          total: heroSlides.length,
                          defaultValue: `Slide ${idx + 1} dari ${heroSlides.length}`,
                        })}`

                    return (
                      <div
                        key={url + idx}
                        className={`absolute inset-0 w-full h-full ${
                          prefersReducedMotion
                            ? isActive
                              ? 'opacity-100 z-10'
                              : 'opacity-0 z-0 pointer-events-none'
                            : `transition-opacity duration-700 ease-in-out ${
                                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                              }`
                        }`}
                        aria-hidden={!isActive}
                      >
                        {/* Slide Image (Crisp Full-Bleed Zero Blur) */}
                        <img
                          src={url}
                          alt={slideAlt}
                          fetchPriority={idx === 0 ? 'high' : 'auto'}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                        />

                        {/* Subtle Bottom Gradient Scrim for Indicators */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none z-10"
                        />
                      </div>
                    )
                  })}

                {/* Controls (Rendered ONLY when heroSlides.length > 1) */}
                {heroSlides.length > 1 && (
                  <>
                    {/* Previous Slide Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all duration-150 hover:bg-black/60 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={t('home.hero_prev_slide', 'Slide sebelumnya')}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Next Slide Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all duration-150 hover:bg-black/60 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={t('home.hero_next_slide', 'Slide berikutnya')}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
                      {heroSlides.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setCurrentSlide(dotIdx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            dotIdx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                          }`}
                          aria-label={t('home.hero_slide_nav', {
                            number: dotIdx + 1,
                            defaultValue: `Ke slide ${dotIdx + 1}`,
                          })}
                          aria-current={dotIdx === currentSlide ? 'true' : undefined}
                        />
                      ))}
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* 2. SEMUA PRODUK (Boxless, open layout matching Testimoni Pelanggan) */}
      <section id="our-products" className="mx-auto max-w-7xl px-4 pt-5 md:pt-8 lg:px-8 scroll-mt-24 bg-transparent">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl md:text-[32px] md:leading-[40px] font-semibold text-toti-ink">
            {t('home.our_products')}
          </h2>
          <Link
            to={ROUTES.CATALOG}
            className="inline-flex min-h-[44px] items-center px-2 py-1 text-sm font-semibold text-toti-brick hover:text-toti-brick-hover transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick"
          >
            {t('home.view_all')}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-toti-beige p-8 text-center shadow-sm">
            <p className="text-center text-sm sm:text-base text-toti-secondary font-sans">
              {t('catalog.not_found_desc', 'Belum ada produk aktif yang tersedia.')}
            </p>
          </div>
        ) : (
          <div className="relative">
            {canScrollProductLeft && (
              <button
                type="button"
                onClick={scrollProductLeft}
                aria-label={t('common.prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-toti-beige text-toti-secondary hover:text-toti-brick hover:border-toti-brick hover:scale-105 active:scale-95 z-10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {canScrollProductRight && (
              <button
                type="button"
                onClick={scrollProductRight}
                aria-label={t('common.next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-toti-beige text-toti-secondary hover:text-toti-brick hover:border-toti-brick hover:scale-105 active:scale-95 z-10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <div
              ref={productScrollRef}
              onScroll={updateProductScrollButtons}
              className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-1 -mx-1 py-2.5 -my-1.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {products.map((product) => {
                const maxQty = product.stockQuantity
                const isUnavailable = !product.isAvailable
                const isOutOfStock = !isUnavailable && (!product.isInStock || maxQty <= 0)
                const isPurchasable = !isUnavailable && !isOutOfStock

                const minOrder = product.minimumOrder || 1
                const currentQty = productQuantities[product.id] ?? minOrder

                return (
                  <article
                    key={product.id}
                    className="snap-start shrink-0 w-[220px] overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl border border-toti-beige shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(58,31,22,0.08)] flex flex-col justify-between"
                  >
                    <Link to={`/catalog/${product.slug}`} tabIndex={-1} aria-hidden="true">
                      <div className="aspect-square w-full overflow-hidden bg-toti-alt">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/fallback-logo.png';
                            e.currentTarget.classList.remove('object-cover');
                            e.currentTarget.classList.add('object-contain', 'p-6');
                          }}
                        />
                      </div>
                    </Link>
                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <Link
                          to={`/catalog/${product.slug}`}
                          className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-toti-ink hover:text-toti-brick transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick rounded"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-toti-secondary">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-toti-honey text-toti-honey" />
                            <span className="font-semibold text-toti-secondary">
                              {product.rating > 0 ? product.rating.toFixed(1) : '0.0'}
                            </span>
                            {product.reviewCount !== undefined && product.reviewCount > 0 && (
                              <span className="text-toti-secondary">({product.reviewCount})</span>
                            )}
                          </div>
                          <span className="text-toti-divider">·</span>
                          <span className="text-toti-secondary">
                            {product.soldCount ?? 0} {t('common.sold', 'terjual')}
                          </span>
                        </div>
                        <p className="mt-2.5 text-base font-semibold text-toti-ink">
                          {formatRupiah(product.price)}
                        </p>
                      </div>

                      {/* Bottom Area: Quantity selector (only when purchasable) + Action Button */}
                      <div className="mt-auto pt-3">
                        {isPurchasable && (
                          <div className="mb-2.5 flex items-center gap-1.5">
                            <div className="toti-stepper">
                              <button
                                type="button"
                                onClick={(e) => handleDecrementProductQty(product, e)}
                                disabled={currentQty <= minOrder}
                                className="toti-stepper-btn"
                                aria-label={t('product_detail.decrease_qty', 'Kurangi jumlah')}
                                title={t('product_detail.decrease_qty', 'Kurangi jumlah')}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs sm:text-sm font-semibold text-toti-ink select-none">
                                {currentQty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleIncrementProductQty(product, e)}
                                disabled={currentQty >= maxQty}
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
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddToCart(product, currentQty)
                          }}
                          disabled={!isPurchasable}
                          className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick focus-visible:ring-offset-1 active:scale-[0.98] ${
                            !isPurchasable
                              ? 'bg-toti-disabled border border-toti-disabled text-toti-secondary/80 cursor-not-allowed active:scale-100'
                              : 'bg-toti-brick text-white hover:bg-toti-brick-hover shadow-sm hover:shadow'
                          }`}
                        >
                          {isPurchasable && <ShoppingCart className="h-4 w-4 shrink-0" />}
                          <span>
                            {isUnavailable
                              ? t('product_detail.unavailable', 'Tidak tersedia')
                              : isOutOfStock
                              ? t('product_detail.out_of_stock', 'Stok habis')
                              : t('home.add_to_cart', 'Tambah ke Keranjang')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. TESTIMONI (Directly on Cream Background; cards are White with border toti-beige) */}
      <section id="testimonials-section" className="mx-auto max-w-7xl px-4 lg:px-8 scroll-mt-24 bg-transparent">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl md:text-[32px] md:leading-[40px] font-semibold text-toti-ink">
            {t('home.testimonials_title')}
          </h2>
          <button
            type="button"
            onClick={openAllReviewsModal}
            className="inline-flex min-h-[44px] items-center px-2 py-1 text-sm font-semibold text-toti-brick hover:text-toti-brick-hover transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
          >
            {t('home.view_all_reviews', 'Lihat Semua')}
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl bg-toti-card/95 backdrop-blur-sm border border-toti-beige p-8 text-center shadow-sm">
            <p className="text-sm sm:text-base text-toti-secondary font-sans">{t('home.no_testimonials')}</p>
          </div>
        ) : (
          <ScrollReveal direction="up" delay={80} className="relative">
            {canScrollReviewLeft && (
              <button
                type="button"
                onClick={scrollReviewLeft}
                aria-label={t('common.prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-toti-card shadow-md border border-toti-beige text-toti-secondary hover:text-toti-brick hover:border-toti-brick hover:scale-105 active:scale-95 z-10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {canScrollReviewRight && (
              <button
                type="button"
                onClick={scrollReviewRight}
                aria-label={t('common.next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-toti-card shadow-md border border-toti-beige text-toti-secondary hover:text-toti-brick hover:border-toti-brick hover:scale-105 active:scale-95 z-10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <div
              ref={reviewScrollRef}
              onScroll={updateReviewScrollButtons}
              className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-1 -mx-1 py-2.5 -my-1.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {reviews.map((review) => (
                <article
                  key={review.id ? `rev-${review.id}` : review.productId + review.customerName}
                  className="relative snap-start shrink-0 w-[280px] sm:w-[300px] rounded-2xl bg-toti-card/95 backdrop-blur-sm border border-toti-beige p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(58,31,22,0.04)] hover:shadow-[0_8px_20px_rgba(155,74,47,0.08)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute top-3 right-4 font-serif text-4xl leading-none text-toti-honey/50"
                  >
                    “
                  </span>
                  <div className="space-y-3">
                    <div>
                      <p
                        className={`text-sm leading-relaxed text-toti-secondary font-sans whitespace-pre-line ${
                          expandedReviewIds.has(review.id) ? '' : 'line-clamp-4'
                        }`}
                      >
                        "{review.comment}"
                      </p>
                      {review.comment && review.comment.length > 130 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandReview(review.id)}
                          className="mt-1 text-xs font-semibold text-toti-brick hover:underline cursor-pointer focus-visible:outline-none"
                        >
                          {expandedReviewIds.has(review.id)
                            ? t('home.show_less', 'Sembunyikan')
                            : t('home.read_more', 'Selengkapnya')}
                        </button>
                      )}
                    </div>

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x pt-1">
                        {review.images.map((img, imgIdx) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() =>
                              setPhotoLightbox({
                                isOpen: true,
                                images: (review.images || []).map((i) => i.image_url),
                                currentIndex: imgIdx,
                                altPrefix: `Foto ulasan ${review.customerName}`,
                              })
                            }
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-toti-beige bg-toti-card transition hover:opacity-90 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
                          >
                            <img
                              src={img.image_url}
                              alt={t('home.testimonial_image_alt', 'Foto ulasan pelanggan Toti Cakery')}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-toti-divider/60 pt-3">
                    <p className="text-sm font-semibold text-toti-ink">
                      {review.customerName}
                    </p>
                    <div className="mt-0.5 text-xs text-toti-secondary font-medium truncate">
                      <span>{t('home.bought')}</span>
                      {(() => {
                        const matched = getMatchedProduct(review.productId)
                        if (matched) {
                          return (
                            <Link
                              to={`/catalog/${matched.slug}`}
                              className="font-semibold text-toti-brick hover:underline ml-1 inline-flex items-center gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-toti-brick rounded"
                            >
                              {review.purchasedProductName}
                            </Link>
                          )
                        }
                        return <span className="font-semibold text-toti-ink ml-1">{review.purchasedProductName}</span>
                      })()}
                    </div>
                    <div
                      className="mt-2 flex items-center gap-1"
                      aria-label={`${review.rating} dari 5 bintang`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < review.rating
                              ? 'fill-toti-honey text-toti-honey stroke-toti-brick stroke-[0.75]'
                              : 'text-toti-cocoa fill-transparent stroke-[1]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </ScrollReveal>
        )}
      </section>

      {/* 4. TENTANG KAMI & PETA (Section wrapper = toti-alt; store address box = toti-card) */}
      <section id="our-store" className="mx-auto max-w-7xl px-4 lg:px-8 scroll-mt-24 bg-transparent">
        <ScrollReveal direction="up" distance={24}>
          <div className="relative overflow-hidden rounded-2xl bg-toti-alt/85 backdrop-blur-sm p-6 sm:p-8 lg:p-10 shadow-sm border border-toti-beige">
            {/* Subtle Corner Wave Motif */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute bottom-0 right-0 w-64 sm:w-80 opacity-35"
            >
              <svg
                viewBox="0 0 600 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                <path
                  d="M0 400C110 370 170 290 280 305C390 320 440 210 600 160V400H0Z"
                  fill="url(#home-about-wave-grad)"
                />
                <defs>
                  <linearGradient id="home-about-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C6A48F" />
                    <stop offset="100%" stopColor="#E0A04E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:items-center">
              {/* Map Embed (Prevent mobile scroll trap) */}
              <div
                className="relative overflow-hidden rounded-xl h-60 sm:h-72 lg:h-full lg:min-h-[280px] border border-toti-beige bg-toti-card shadow-md ring-1 ring-toti-beige/80"
                onClick={() => setIsMapActive(true)}
              >
                <iframe
                  src={renderedMapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  scrolling="yes"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className={`w-full h-full ${!isMapActive ? 'pointer-events-none md:pointer-events-auto' : 'pointer-events-auto'}`}
                  title={t('home.map_title')}
                />
                {!isMapActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] md:hidden cursor-pointer">
                    <span className="rounded-full bg-toti-card/95 px-4 py-2 text-xs font-semibold text-toti-ink shadow-sm border border-toti-beige">
                      {t('home.tap_to_interact_map', 'Ketuk peta untuk menggeser')}
                    </span>
                  </div>
                )}
              </div>

              {/* About & Store Information */}
              <div>
                <div className="max-w-2xl">
                  <h2 className="font-display text-2xl md:text-[32px] md:leading-[40px] font-semibold text-toti-ink whitespace-pre-line">
                    {aboutTitle}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-toti-secondary max-w-[60ch] whitespace-pre-line font-sans">
                    {aboutDescription}
                  </p>

                  {storeAddress && (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3 rounded-xl bg-toti-card p-4 text-sm text-toti-ink border border-toti-beige shadow-sm">
                        <MapPin className="h-5 w-5 shrink-0 text-toti-brick mt-0.5" />
                        <span className="whitespace-pre-line font-medium leading-relaxed text-toti-ink">
                          {storeAddress}
                        </span>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-toti-honey px-5 py-2.5 text-sm font-semibold text-toti-ink transition-colors duration-150 hover:bg-toti-honey-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-honey focus-visible:ring-offset-2 cursor-pointer w-full sm:w-auto"
                      >
                        <ExternalLink className="h-4 w-4 text-toti-ink" />
                        <span>{t('home.open_in_google_maps', 'Buka di Google Maps')}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
      </div>

      {/* 5. ALL REVIEWS MODAL */}
      {isAllReviewsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6"
          onClick={() => setIsAllReviewsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('home.all_reviews_title', 'Semua Ulasan Pelanggan')}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-toti-beige animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-toti-divider/60 bg-toti-alt/40 shrink-0">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-toti-ink">
                  {t('home.all_reviews_title', 'Semua Ulasan Pelanggan')}
                </h3>
                <p className="text-xs sm:text-sm text-toti-secondary mt-1">
                  {t('home.all_reviews_subtitle', 'Menampilkan hingga 50 ulasan terbaru')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllReviewsModalOpen(false)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-toti-secondary hover:text-toti-ink hover:bg-toti-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
                aria-label={t('common.close', 'Tutup')}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Filter & Sort Bar */}
            <div className="p-4 sm:px-6 sm:py-3.5 bg-white border-b border-toti-divider/40 shrink-0 space-y-3">
              {/* Chips */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setModalRatingFilter('all')}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    modalRatingFilter === 'all'
                      ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                      : 'bg-white text-toti-ink border-toti-divider hover:border-toti-brick'
                  }`}
                >
                  <span>{t('product_detail.filter_all', 'Semua')}</span>
                  <span className="opacity-80">({modalReviewCounts.all})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalRatingFilter('with-photos')}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    modalRatingFilter === 'with-photos'
                      ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                      : 'bg-white text-toti-ink border-toti-divider hover:border-toti-brick'
                  }`}
                >
                  <span>{t('product_detail.filter_with_photos', 'Dengan Foto')}</span>
                  <span className="opacity-80">({modalReviewCounts.withPhotos})</span>
                </button>
                {(['5', '4', '3', '2', '1'] as const).map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setModalRatingFilter(star)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      modalRatingFilter === star
                        ? 'bg-toti-brick text-white border-toti-brick shadow-sm'
                        : 'bg-white text-toti-ink border-toti-divider hover:border-toti-brick'
                    }`}
                  >
                    <span>{t('product_detail.filter_star', { star })}</span>
                    <span className="opacity-80">
                      ({star === '5' ? modalReviewCounts.star5 : star === '4' ? modalReviewCounts.star4 : star === '3' ? modalReviewCounts.star3 : star === '2' ? modalReviewCounts.star2 : modalReviewCounts.star1})
                    </span>
                  </button>
                ))}
              </div>

              {/* Sort Bar */}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                <span className="text-xs font-medium text-toti-secondary">
                  {t('product_detail.sort_label', 'Urutkan')}:
                </span>
                <select
                  value={modalReviewSort}
                  onChange={(e) => setModalReviewSort(e.target.value as ModalReviewSort)}
                  className="rounded-lg border border-toti-divider bg-white px-2.5 py-1 text-xs font-medium text-toti-ink focus:outline-none focus:ring-2 focus:ring-toti-brick cursor-pointer"
                >
                  <option value="newest">{t('product_detail.sort_newest', 'Terbaru')}</option>
                  <option value="oldest">{t('product_detail.sort_oldest', 'Terlama')}</option>
                  <option value="highest">{t('product_detail.sort_highest', 'Rating Tertinggi')}</option>
                  <option value="lowest">{t('product_detail.sort_lowest', 'Rating Terendah')}</option>
                </select>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-toti-divider/40">
              {loadingAllReviews ? (
                <BuyerBouncingLoader
                  size="md"
                  label={t('common.loading', 'Memuat ulasan...')}
                  className="py-10"
                />
              ) : filteredAndSortedModalReviews.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-toti-secondary">
                    {t('product_detail.no_filtered_reviews', 'Belum ada ulasan untuk filter ini.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalRatingFilter('all')}
                    className="inline-flex items-center rounded-lg border border-toti-brick px-4 py-2 text-xs font-semibold text-toti-brick hover:bg-toti-brick hover:text-white transition cursor-pointer"
                  >
                    {t('product_detail.reset_filter', 'Reset Filter')}
                  </button>
                </div>
              ) : (
                filteredAndSortedModalReviews.map((item, idx) => {
                  const customerName = item.customer?.nama || item.customer_name || t('home.default_customer_name', 'Pelanggan')
                  const prodName = item.product?.nama_produk || item.product_name || ''
                  const matched = getMatchedProduct(item.product_id)

                  return (
                    <div key={item.id || idx} className={idx > 0 ? 'pt-4' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-toti-ink">
                            {customerName}
                          </span>
                          <div className="flex text-toti-honey text-xs sm:text-sm">
                            {'★'.repeat(Math.round(item.rating))}
                            <span className="text-toti-disabled">{'★'.repeat(5 - Math.round(item.rating))}</span>
                          </div>
                        </div>
                        {item.created_at && (
                          <span className="text-xs text-toti-secondary">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {prodName && (
                        <div className="text-xs text-toti-secondary font-medium mb-1.5">
                          <span>{t('home.bought')}</span>
                          {matched ? (
                            <Link
                              to={`/catalog/${matched.slug}`}
                              className="font-semibold text-toti-brick hover:underline ml-1 inline-flex items-center gap-0.5"
                            >
                              {prodName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-toti-ink ml-1">{prodName}</span>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-toti-secondary whitespace-pre-line leading-relaxed">
                        {item.comment}
                      </p>

                      {item.images && item.images.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                          {item.images.map((img, imgIdx) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() =>
                                setPhotoLightbox({
                                  isOpen: true,
                                  images: (item.images || []).map((i) => i.image_url),
                                  currentIndex: imgIdx,
                                  altPrefix: `Foto ulasan ${customerName}`,
                                })
                              }
                              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-toti-beige bg-toti-card transition hover:opacity-90 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toti-brick cursor-pointer"
                            >
                              <img src={img.image_url} alt="Foto ulasan pelanggan" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Full-Screen Photo Lightbox */}
      <PhotoLightboxModal
        isOpen={photoLightbox.isOpen}
        images={photoLightbox.images}
        currentIndex={photoLightbox.currentIndex}
        altPrefix={photoLightbox.altPrefix}
        onClose={() => setPhotoLightbox((prev) => ({ ...prev, isOpen: false }))}
        onIndexChange={(newIdx) => setPhotoLightbox((prev) => ({ ...prev, currentIndex: newIdx }))}
      />
    </div>
  )
}