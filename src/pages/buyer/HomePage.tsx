import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  Star,
  MapPin,
  X,
} from 'lucide-react'
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
import {
  getStoreCustomization,
  DEFAULT_STORE_CUSTOMIZATION,
  type StoreCustomizationData,
} from '@/services/storeCustomizationService'

const DEFAULT_HERO_IMAGE = DEFAULT_STORE_CUSTOMIZATION.hero_image_url!
const DEFAULT_MAPS_URL = DEFAULT_STORE_CUSTOMIZATION.maps_embed_url!

export default function HomePage() {
  const [selectedTestimonialImage, setSelectedTestimonialImage] = useState<string | null>(null)
  const { addItem } = useCart()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [customization, setCustomization] = useState<StoreCustomizationData | null>(null)

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

  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [reviews, setReviews] = useState<
    {
      customerName: string
      rating: number
      comment: string
      purchasedProductName: string
      productId: string
      productName: string
      images?: { id: number; image_url: string }[]
    }[]
  >([])
  const [loading, setLoading] = useState(true)

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
        setReviews(
          (allReviews || []).map((item) => ({
            customerName: item.customer?.nama || item.customer_name || 'Customer',
            rating: item.rating,
            comment: item.comment || '',
            purchasedProductName: item.product?.nama_produk || item.product_name || '',
            productId: String(item.product_id),
            productName: item.product?.nama_produk || item.product_name || '',
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
  }, [])


  const handleAddToCart = (product: SimpleProduct) => {
    const isPurchasable = product.isAvailable && product.isInStock && product.stockQuantity > 0;
    if (!isPurchasable) {
      toast.error(t('cart.add_to_cart_failure', 'Gagal menambahkan produk ke keranjang'));
      return;
    }
    
    addItem({
      productId: product.id,
      variantId: `${product.id}-default`,
      name: product.name,
      variantName: 'Default',
      price: product.price,
      image: product.image,
      minOrder: product.minimumOrder || 1,
      step: 1,
      category: product.category,
      quantity: product.minimumOrder || 1,
    });
    toast.success(t('cart.add_to_cart_success', 'Ditambahkan ke keranjang'));
  };

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

  // Horizontal scroll carousel behavior (testimonials)
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
    reviewScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
    setTimeout(updateReviewScrollButtons, 300)
  }
  const scrollReviewRight = () => {
    reviewScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
    setTimeout(updateReviewScrollButtons, 300)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    )
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'id'
  const localeContent = customization?.content?.[currentLang]

  const heroTitle = localeContent?.hero_title || `${t('home.hero_title_1')}\n${t('home.hero_title_2')}`
  const heroSubtitle = localeContent?.hero_subtitle || t('home.hero_desc')
  const heroImageUrl = customization?.hero_image_url || DEFAULT_HERO_IMAGE

  const aboutTitle = localeContent?.about_title || t('home.about_title')
  const aboutDescription =
    localeContent?.about_description ||
    `${t('home.about_desc_1')}${t('home.made_with_love')}${t('home.about_desc_2')}`
  const mapsEmbedUrl = customization?.maps_embed_url || DEFAULT_MAPS_URL
  const storeAddress = customization?.store_address

  return (
    <div className="bg-[#F6EFE6] pb-6">
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-[#D0BFAF]/60">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${heroImageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/65 md:bg-gradient-to-r md:from-white md:via-white/85 md:to-transparent" />
          <div className="relative z-10 px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-16 max-w-2xl">
            <h1 className="max-w-xl text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[#3A1F16] whitespace-pre-line">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#6B4A3C] whitespace-pre-line">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT & MAP */}
      <section id="our-store" className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <div className="rounded-xl bg-white px-6 py-5 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.8fr] lg:items-center">
            <div className="overflow-hidden rounded-xl h-52 sm:h-64 lg:h-full lg:min-h-[240px]">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                scrolling="yes"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full"
                title={t('home.map_title')}
              />
            </div>
            <div>
              <div className="max-w-3xl">
                <h2 className="text-2xl font-black text-[#3A1F16] whitespace-pre-line">
                  {aboutTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6B4A3C] whitespace-pre-line">
                  {aboutDescription}
                </p>
                {storeAddress && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#F6EFE6]/70 p-3 text-xs sm:text-sm text-[#4b2417] border border-[#EAD8CA]">
                    <MapPin className="h-5 w-5 shrink-0 text-[#9B4A2F] mt-0.5" />
                    <span className="whitespace-pre-line font-medium leading-relaxed">
                      {storeAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEMUA PRODUK */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:px-8">
        <div className="rounded-xl bg-white px-6 py-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#3A1F16]">{t('home.our_products')}</h2>
            <Link
              to={ROUTES.CATALOG}
              className="text-xs font-black text-[#9B4A2F] hover:text-[#7E3A24]"
            >
              {t('home.view_all')}
            </Link>
          </div>

          <div className="relative group">
            {canScrollProductLeft && (
              <button
                type="button"
                onClick={scrollProductLeft}
                aria-label={t('common.prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-[#EAD8CA] text-[#6B4A3C] hover:text-[#9B4A2F] z-10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canScrollProductRight && (
              <button
                type="button"
                onClick={scrollProductRight}
                aria-label={t('common.next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-[#EAD8CA] text-[#6B4A3C] hover:text-[#9B4A2F] z-10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            <div
              ref={productScrollRef}
              onScroll={updateProductScrollButtons}
              className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-1 -mx-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {products.map((product) => (
                <article
                  key={product.id}
                  className="snap-start shrink-0 w-[220px] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#EAD8CA] transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Link to={`/catalog/${product.slug}`}>
                    <div className="aspect-square w-full overflow-hidden bg-[#EFE4D6]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link
                      to={`/catalog/${product.slug}`}
                      className="line-clamp-1 text-sm font-black text-[#3A1F16] hover:text-[#9B4A2F]"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-[#E0A04E] text-[#E0A04E]" />
                      <span className="font-semibold text-[#9B4A2F]">
                        {product.rating.toFixed(1)} ({product.soldCount})
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black text-[#3A1F16]">
                      {formatRupiah(product.price)}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      disabled={!product.isAvailable || !product.isInStock || product.stockQuantity <= 0}
                      className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-md border border-[#9B4A2F] bg-white text-xs font-black text-[#9B4A2F] transition hover:bg-[#9B4A2F] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#9B4A2F]"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {t('home.add_to_cart')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <div className="rounded-xl bg-white px-6 py-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#3A1F16]">
              {t('home.testimonials_title')}
            </h2>
          </div>

          {reviews.length === 0 ? (
            <p className="text-center text-sm text-[#6B4A3C]">{t('home.no_testimonials')}</p>
          ) : (
            <div className="relative group">
              {canScrollReviewLeft && (
                <button
                  type="button"
                  onClick={scrollReviewLeft}
                  aria-label={t('common.prev')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-[#EAD8CA] text-[#6B4A3C] hover:text-[#9B4A2F] z-10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {canScrollReviewRight && (
                <button
                  type="button"
                  onClick={scrollReviewRight}
                  aria-label={t('common.next')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-[#EAD8CA] text-[#6B4A3C] hover:text-[#9B4A2F] z-10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              <div
                ref={reviewScrollRef}
                onScroll={updateReviewScrollButtons}
                className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-1 -mx-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {reviews.map((review) => (
                  <article
                    key={review.productId + review.customerName + (review.images?.[0]?.id || '')}
                    className="snap-start shrink-0 w-[280px] rounded-xl bg-[#F6EFE6] p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex gap-3">
                        <Sparkles className="h-8 w-8 shrink-0 fill-[#E0A04E] text-[#E0A04E]" />
                        <p className="text-xs leading-6 text-[#6B4A3C] line-clamp-4">
                          {review.comment}
                        </p>
                      </div>

                      {review.images && review.images.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                          {review.images.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setSelectedTestimonialImage(img.image_url)}
                              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#EAD8CA] bg-white transition hover:opacity-90 snap-start focus:outline-none"
                            >
                              <img src={img.image_url} alt="Testimoni" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-t border-[#EAD8CA]/60 pt-3">
                      <p className="text-sm font-black text-[#3A1F16]">
                        {review.customerName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#6B4A3C]">
                        {t('home.bought')}{review.purchasedProductName}
                      </p>
                      <div className="mt-2 flex items-center gap-0.5 text-[#E0A04E]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={
                              index < review.rating
                                ? 'h-3.5 w-3.5 fill-current'
                                : 'h-3.5 w-3.5 text-[#D0BFAF]'
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedTestimonialImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedTestimonialImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={selectedTestimonialImage} alt="Enlarged testimonial photo" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <button
              onClick={() => setSelectedTestimonialImage(null)}
              className="absolute top-4 right-4 sm:-top-10 sm:right-0 text-white hover:text-gray-300 focus:outline-none"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}