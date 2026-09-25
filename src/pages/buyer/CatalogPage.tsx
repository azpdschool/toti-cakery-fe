import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  getAllProductsDetailed,
  getCategories,
  type Product,
} from '@/services/productService'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/common/ProductCard'
import { toast } from 'react-hot-toast'

// ============================================================
// UTILITY
// ============================================================
function searchProducts(products: Product[], keyword: string): Product[] {
  if (!keyword.trim()) return products
  const lower = keyword.toLowerCase().trim()
  return products.filter((product) => {
    if (product.name.toLowerCase().includes(lower)) return true
    if (product.category.toLowerCase().includes(lower)) return true
    if (product.description.toLowerCase().includes(lower)) return true
    return product.variants.some((variant) => {
      if (variant.name.toLowerCase().includes(lower)) return true
      return Object.values(variant.options).some((value) =>
        value.toLowerCase().includes(lower)
      )
    })
  })
}

function formatShortRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`
  if (value >= 1_000) return `Rp${Math.round(value / 1000)}rb`
  return `Rp${value}`
}

// ============================================================
// CATEGORY SCROLLER (same interaction pattern as Home's carousels)
// ============================================================
interface CategoryOption {
  category: string
  count: number
}

function CategoryScroller({
  categories,
  totalCount,
  selected,
  onSelect,
}: {
  categories: CategoryOption[]
  totalCount: number
  selected: string | null
  onSelect: (category: string | null) => void
}) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateButtons = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }

  useEffect(() => {
    updateButtons()
    window.addEventListener('resize', updateButtons)
    return () => window.removeEventListener('resize', updateButtons)
  }, [categories])

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
    setTimeout(updateButtons, 300)
  }

  return (
    <div className="relative group">
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-220)}
          aria-label={t('common.prev')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-[#EAD8CA] bg-white text-[#6B4A3C] shadow-md z-10 opacity-0 transition-opacity hover:text-[#9B4A2F] group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollBy(220)}
          aria-label={t('common.next')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-[#EAD8CA] bg-white text-[#6B4A3C] shadow-md z-10 opacity-0 transition-opacity hover:text-[#9B4A2F] group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#9B4A2F]/30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateButtons}
        className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
            selected === null
              ? 'border-[#9B4A2F] bg-[#9B4A2F] text-white'
              : 'border-[#D0BFAF] bg-white text-[#3A1F16] hover:bg-[#F6EFE6]'
          }`}
        >
          {t('catalog.all_products')}
          <span className="ml-1.5 opacity-70">({totalCount})</span>
        </button>

        {categories.map(({ category, count }) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selected === category
                ? 'border-[#9B4A2F] bg-[#9B4A2F] text-white'
                : 'border-[#D0BFAF] bg-white text-[#3A1F16] hover:bg-[#F6EFE6]'
            }`}
          >
            {category}
            <span className="ml-1.5 opacity-70">({count})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// SEARCH BAR (compact, icon-first)
// ============================================================
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="relative flex h-11 flex-1 items-center rounded-xl border border-[#D0BFAF] bg-white px-3.5 focus-within:border-[#9B4A2F] focus-within:ring-2 focus-within:ring-[#9B4A2F]/20">
      <Search className="h-4 w-4 shrink-0 text-[#9C8478]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('catalog.search_placeholder')}
        className="w-full bg-transparent px-2.5 text-sm text-[#3A1F16] outline-none placeholder:text-[#9C8478]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="shrink-0 rounded-full p-1 text-[#9C8478] hover:bg-[#E8DCCB]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ============================================================
// PRICE FILTER POPOVER (separate from category)
// ============================================================
function PriceFilterButton({
  min,
  max,
  onApply,
  onClear,
}: {
  min: string
  max: string
  onApply: (min: string, max: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draftMin, setDraftMin] = useState(min)
  const [draftMax, setDraftMax] = useState(max)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraftMin(min)
    setDraftMax(max)
  }, [min, max])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const activeCount = (min ? 1 : 0) + (max ? 1 : 0)

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('catalog.filter')}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#D0BFAF] bg-white text-[#3A1F16] transition hover:bg-[#F6EFE6]"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9B4A2F] px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[52px] z-30 w-[min(280px,90vw)] rounded-2xl border border-[#D0BFAF] bg-white p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-black text-[#3A1F16]">{t('catalog.price_filter_title')}</h3>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6B4A3C]">
            {t('catalog.price_range')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('catalog.price_min')}
              value={draftMin}
              onChange={(e) => setDraftMin(e.target.value)}
              className="w-full rounded-lg border border-[#D0BFAF] px-3 py-2 text-sm outline-none focus:border-[#9B4A2F]"
            />
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('catalog.price_max')}
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              className="w-full rounded-lg border border-[#D0BFAF] px-3 py-2 text-sm outline-none focus:border-[#9B4A2F]"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setDraftMin('')
                setDraftMax('')
                onClear()
                setOpen(false)
              }}
              className="text-xs font-bold text-[#6B4A3C] hover:text-[#3A1F16]"
            >
              {t('catalog.clear_filter')}
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draftMin, draftMax)
                setOpen(false)
              }}
              className="rounded-lg bg-[#9B4A2F] px-4 py-2 text-xs font-bold text-white hover:bg-[#7E3A24]"
            >
              {t('catalog.apply_filter')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CatalogPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const { addItem } = useCart()

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allProducts, catData] = await Promise.all([
        getAllProductsDetailed(),
        getCategories(),
      ])
      setProducts(allProducts)
      setCategories(catData)
    } catch (err: unknown) {
      console.error('Gagal load catalog products:', err)
      const e = err as { response?: { data?: { detail?: unknown } }; message?: string }
      const detail = e?.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : e?.message || t('catalog.load_error')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const totalCount = useMemo(
    () => categories.reduce((acc, c) => acc + c.count, 0),
    [categories]
  )

  const filteredProducts = useMemo(() => {
    let result = products
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      result = searchProducts(result, searchQuery)
    }
    const min = priceMin ? Number(priceMin) : null
    const max = priceMax ? Number(priceMax) : null
    if (min !== null || max !== null) {
      result = result.filter((p) => {
        const price = p.variants[0]?.price ?? 0
        if (min !== null && price < min) return false
        if (max !== null && price > max) return false
        return true
      })
    }
    return result
  }, [products, selectedCategory, searchQuery, priceMin, priceMax])

  const hasActiveFilters = Boolean(selectedCategory || priceMin || priceMax)

  const clearAllFilters = () => {
    setSelectedCategory(null)
    setPriceMin('')
    setPriceMax('')
  }

  const handleAddToCart = (product: Product, quantity: number) => {
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
    toast.success(t('cart.add_to_cart_success', 'Ditambahkan ke keranjang'))
  }

  if (loading) {
    return (
      <div className="bg-white pb-10">
        <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200" />
        </section>
        <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-100 p-4" />
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-xl font-bold text-red-700">❌ {t('catalog.load_failed_title')}</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-5 inline-flex rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            {t('catalog.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F6EFE6] pb-10">
      {/* HERO — same layout & colors as Home's hero */}
      <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-[#D0BFAF]/60">
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/mrje22up/image/upload/v1790318610/SaveClip.App_625018501_18282534043303493_4772642156586750637_n_2.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="relative z-10 max-w-2xl px-8 py-10 lg:px-12 lg:py-16">
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-[#3A1F16] md:text-5xl lg:text-6xl">
              {t('catalog.title')}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#6B4A3C]">
              {t('catalog.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORY SCROLLER */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <CategoryScroller
          categories={categories}
          totalCount={totalCount}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </section>

      {/* TOOLBAR: search + price filter */}
      <section className="mx-auto max-w-7xl px-4 pt-4 lg:px-8">
        <div className="flex items-center gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <PriceFilterButton
            min={priceMin}
            max={priceMax}
            onApply={(min, max) => {
              setPriceMin(min)
              setPriceMax(max)
            }}
            onClear={() => {
              setPriceMin('')
              setPriceMax('')
            }}
          />
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedCategory && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#D0BFAF] bg-white px-3 py-1.5 text-xs font-bold text-[#9B4A2F]">
                {selectedCategory}
                <button type="button" onClick={() => setSelectedCategory(null)} className="text-[#6B4A3C] hover:text-[#3A1F16]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {(priceMin || priceMax) && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#D0BFAF] bg-white px-3 py-1.5 text-xs font-bold text-[#9B4A2F]">
                {priceMin ? formatShortRupiah(Number(priceMin)) : 'Rp0'}
                {' – '}
                {priceMax ? formatShortRupiah(Number(priceMax)) : '∞'}
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin('')
                    setPriceMax('')
                  }}
                  className="text-[#6B4A3C] hover:text-[#3A1F16]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#9B4A2F] hover:text-[#7E3A24]"
            >
              {t('catalog.clear_all')}
            </button>
          </div>
        )}

        <p className="mt-4 text-sm text-[#6B4A3C]">
          {t('catalog.results_found', { count: filteredProducts.length })}
        </p>

        {/* PRODUCT GRID */}
        {filteredProducts.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-4 text-lg font-black text-[#3A1F16]">{t('catalog.not_found_title')}</p>
            <p className="text-sm text-[#6B4A3C]">{t('catalog.not_found_desc')}</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}