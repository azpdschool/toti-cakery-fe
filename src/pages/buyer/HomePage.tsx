import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CakeSlice,
  Heart,
  Leaf,
  ShieldCheck,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants'
import {
  getAllProducts,
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

const benefits: Benefit[] = [
  {
    title: 'Bahan Pilihan Berkualitas',
    description: 'Dibuat dari bahan terbaik untuk rasa yang istimewa.',
    icon: Leaf,
  },
  {
    title: 'Dibuat Segar Setiap Hari',
    description: 'Fresh dari dapur kami agar selalu nikmat.',
    icon: ShieldCheck,
  },
  {
    title: 'Pengiriman Cepat & Aman',
    description: 'Pesanan dikemas rapi sampai tujuan.',
    icon: Truck,
  },
]

const stats: Stat[] = [
  { value: '500+', label: 'Pelanggan Puas', icon: Smile },
  { value: '100+', label: 'Varian Kue', icon: CakeSlice },
  { value: '4.9/5', label: 'Rating Pelanggan', icon: Star },
  { value: '100%', label: 'Dibuat dengan Cinta', icon: Heart },
]

const PRODUCTS_PER_PAGE = 4
const REVIEWS_PER_PAGE = 3

export default function HomePage() {
  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [reviews, setReviews] = useState<
    {
      customerName: string
      rating: number
      comment: string
      purchasedProductName: string
      productId: string
      productName: string
    }[]
  >([])
  const [loading, setLoading] = useState(true)

  const [productIndex, setProductIndex] = useState(0)
  const [reviewIndex, setReviewIndex] = useState(0)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [allProducts, allReviews] = await Promise.all([
        getAllProducts(),
        getProductReviews(50),
      ])
      setProducts(allProducts)
      setReviews(allReviews)
      setLoading(false)
    }
    loadData()
  }, [])

  const productTotalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE)
  const currentProducts = products.slice(
    productIndex * PRODUCTS_PER_PAGE,
    (productIndex + 1) * PRODUCTS_PER_PAGE
  )

  const reviewTotalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)
  const currentReviews = reviews.slice(
    reviewIndex * REVIEWS_PER_PAGE,
    (reviewIndex + 1) * REVIEWS_PER_PAGE
  )

  const handleProductPrev = () => {
    setProductIndex((prev) => (prev === 0 ? productTotalPages - 1 : prev - 1))
  }
  const handleProductNext = () => {
    setProductIndex((prev) => (prev === productTotalPages - 1 ? 0 : prev + 1))
  }
  const handleReviewPrev = () => {
    setReviewIndex((prev) => (prev === 0 ? reviewTotalPages - 1 : prev - 1))
  }
  const handleReviewNext = () => {
    setReviewIndex((prev) => (prev === reviewTotalPages - 1 ? 0 : prev + 1))
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    )
  }

  return (
    <div className="bg-[#fffaf5] pb-6">
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-[#f8eee5] shadow-sm">
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage:
                "url('https://i.pinimg.com/1200x/a1/44/22/a144222b9399e459efd423fc0c7f82d4.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8eee5] via-[#f8eee5]/80 to-transparent" />
          <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-16 max-w-2xl">
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-[#4b2417] md:text-5xl lg:text-6xl">
              Kue Lezat,
              <br />
              Momen Berkesan
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#6f5448]">
              Toti Cakery hadir dengan kue berkualitas, dibuat dari bahan pilihan untuk setiap momen spesial Anda.
            </p>
            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div key={benefit.title} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffe2cc] text-[#d85b30]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black leading-4 text-[#4b2417]">
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
                title="Lokasi Toti Cakery"
              />
            </div>
            <div>
              <div className="max-w-3xl">
                <h2 className="text-2xl font-black text-[#4b2417]">
                  Tentang Toti Cakery
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6f5448]">
                  Toti Cakery adalah toko kue rumahan yang berdedikasi
                  menghadirkan kue lezat dengan cita rasa istimewa. Setiap kue
                  kami dibuat dengan penuh cinta dan perhatian pada detail,
                  menggunakan bahan berkualitas terbaik.
                </p>
              </div>
              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffe5d5] text-[#d85b30]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#4b2417]">
                          {stat.value}
                        </p>
                        <p className="text-xs font-semibold text-[#6f5448]">
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
        <div className="mb-5 flex items-center justify-between px-1">
          <h2 className="text-2xl font-black text-[#4b2417]">Produk Kami</h2>
          <div className="flex items-center gap-2">
            {productTotalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handleProductPrev}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e7] text-[#c95b31] transition hover:bg-[#f3d7c7]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleProductNext}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e7] text-[#c95b31] transition hover:bg-[#f3d7c7]"
                >
                  ›
                </button>
              </>
            )}
            <Link
              to={ROUTES.CATALOG}
              className="text-xs font-black text-[#d85b30] hover:text-[#b74725]"
            >
              Lihat Semua
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {currentProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <Link to={`/catalog/${product.slug}`}>
                <div className="h-36 overflow-hidden bg-[#fbefe8]">
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
                  className="line-clamp-1 text-sm font-black text-[#4b2417] hover:text-[#d85b30]"
                >
                  {product.name}
                </Link>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-[#ff8a00] text-[#ff8a00]" />
                  <span className="font-semibold text-[#d85b30]">
                    {product.rating.toFixed(1)} ({product.soldCount})
                  </span>
                </div>
                <p className="mt-3 text-sm font-black text-[#4b2417]">
                  {formatRupiah(product.price)}
                </p>
                <button
                  type="button"
                  className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-md border border-[#ef8b67] bg-white text-xs font-black text-[#d85b30] transition hover:bg-[#d85b30] hover:text-white"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Tambah ke Keranjang
                </button>
              </div>
            </article>
          ))}
        </div>

        {productTotalPages > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {Array.from({ length: productTotalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setProductIndex(idx)}
                className={`h-2 w-2 rounded-full transition ${
                  idx === productIndex ? 'bg-[#d85b30]' : 'bg-[#f3d7c7]'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-8">
        <div className="rounded-xl bg-white px-6 py-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#4b2417]">
              Testimoni Pelanggan
            </h2>
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={handleReviewPrev}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e7] text-[#c95b31] transition hover:bg-[#f3d7c7]"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleReviewNext}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e7] text-[#c95b31] transition hover:bg-[#f3d7c7]"
              >
                ›
              </button>
            </div>
          </div>

          {currentReviews.length === 0 ? (
            <p className="text-center text-sm text-[#6f5448]">Belum ada testimoni.</p>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-3">
                {currentReviews.map((review) => (
                  <article
                    key={review.productId + review.customerName}
                    className="rounded-xl border border-[#f3e2d7] bg-white p-5 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <Sparkles className="h-8 w-8 shrink-0 fill-[#ffd2aa] text-[#ffd2aa]" />
                      <p className="text-xs leading-6 text-[#6f5448]">
                        {review.comment}
                      </p>
                    </div>
                    <div className="mt-5">
                      <p className="text-sm font-black text-[#4b2417]">
                        {review.customerName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#6f5448]">
                        Membeli: {review.purchasedProductName}
                      </p>
                      <div className="mt-2 flex items-center gap-0.5 text-[#ff8a00]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={
                              index < review.rating
                                ? 'h-3.5 w-3.5 fill-current'
                                : 'h-3.5 w-3.5 text-[#f3d7c7]'
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {reviewTotalPages > 1 && (
                <div className="mt-5 flex justify-center gap-2">
                  {Array.from({ length: reviewTotalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReviewIndex(idx)}
                      className={`h-2 w-2 rounded-full transition ${
                        idx === reviewIndex ? 'bg-[#d85b30]' : 'bg-[#f3d7c7]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}