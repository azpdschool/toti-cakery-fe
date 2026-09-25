import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  CakeSlice,
  ChevronLeft,
  ChevronRight,
  Heart,
  Leaf,
  ShieldCheck,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useCart } from '@/context/CartContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import {
  getActiveProducts,
  getProductReviews,
  formatRupiah,
  type SimpleProduct,
} from '@/services/productService'

interface Benefit {
  title: string
  description: string
  icon: LucideIcon
}

interface Stat {
  value: string
  label: string
  icon: LucideIcon
}

export default function HomePage() {
  const [selectedTestimonialImage, setSelectedTestimonialImage] = useState<string | null>(null)
  const { addItem } = useCart()
  const { t } = useTranslation()

  const benefits: Benefit[] = [
    {
      title: t('home.benefit_1_title'),
      description: t('home.benefit_1_desc'),
      icon: Leaf,
    },
    {
      title: t('home.benefit_2_title'),
      description: t('home.benefit_2_desc'),
      icon: ShieldCheck,
    },
    {
      title: t('home.benefit_3_title'),
      description: t('home.benefit_3_desc'),
      icon: Truck,
    },
  ]

  const stats: Stat[] = [
    { value: t('home.stat_1_value'), label: t('home.stat_1_label'), icon: Smile },
    { value: t('home.stat_2_value'), label: t('home.stat_2_label'), icon: CakeSlice },
    { value: t('home.stat_3_value'), label: t('home.stat_3_label'), icon: Star },
    { value: t('home.stat_4_value'), label: t('home.stat_4_label'), icon: Heart },
  ]
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
    async function loadData() {
      setLoading(true)
      const [allProducts, allReviews] = await Promise.all([
        getActiveProducts(),
        getProductReviews(50),
      ])
      setProducts(allProducts)
      setReviews(allReviews)
      setLoading(false)
    }
    loadData()
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

  return (
    <div className="bg-[#F6EFE6] pb-6">
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-[#D0BFAF]/60">
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/mrje22up/image/upload/v1790318553/SaveClip.App_618505350_17958279306045799_2574558123171612005_n.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-16 max-w-2xl">
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-[#3A1F16] md:text-5xl lg:text-6xl">
              {t('home.hero_title_1')}
              <br />
              {t('home.hero_title_2')}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#6B4A3C]">
              {t('home.hero_desc')}
            </p>
            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div key={benefit.title} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6EFE6] text-[#9B4A2F]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black leading-4 text-[#3A1F16]">
                      {benefit.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT & MAP */}
      <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <div className="rounded-xl bg-white px-6 py-5 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.8fr] lg:items-center">
            <div className="overflow-hidden rounded-xl h-52 lg:h-auto">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.157534596183!2d103.95726197941448!3d1.0427912962325454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31d98da3b87ec2f7%3A0x280a84339839dd69!2sToti%20Cakery!5e0!3m2!1sen!2sid!4v1782278391706!5m2!1sen!2sid"
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
                <h2 className="text-2xl font-black text-[#3A1F16]">
                  {t('home.about_title')}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6B4A3C]">
                  {t('home.about_desc_1')}
                  {t('home.made_with_love')}
                  {t('home.about_desc_2')}
                </p>
              </div>
              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F6EFE6] text-[#9B4A2F]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#3A1F16]">
                          {stat.value}
                        </p>
                        <p className="text-xs font-semibold text-[#6B4A3C]">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
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