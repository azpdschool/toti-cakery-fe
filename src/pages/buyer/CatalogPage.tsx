import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  getMasterCategoriesWithCounts,
  getLowestPrice,
  type Product,
  type MasterCategoryOption,
} from '@/services/productService'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/common/ProductCard'
import { ScrollReveal } from '@/components/common/ScrollMotion'
import { toast } from 'react-hot-toast'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

// ============================================================
// UTILITY
// ============================================================
function searchProducts(products: Product[], keyword: string): Product[] {
  if (!keyword.trim()) return products
  const lower = keyword.toLowerCase().trim()
  return products.filter((product) => {
    if (product.name.toLowerCase().includes(lower)) return true
    if (product.category.toLowerCase().includes(lower)) return true
    if (product.description?.toLowerCase().includes(lower)) return true
    if (product.descriptionId?.toLowerCase().includes(lower)) return true
    if (product.descriptionEn?.toLowerCase().includes(lower)) return true
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
type CategoryOption = MasterCategoryOption

function CategoryScroller({
  categories,
  totalCount,
  selectedId,
  onSelect,
}: {
  categories: CategoryOption[]
  totalCount: number
  selectedId: number | null
  onSelect: (id: number | null) => void
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
    <div className="relative group min-w-0 flex-1">
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-220)}
          aria-label={t('common.prev')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-toti-beige bg-white text-toti-secondary shadow-md z-10 opacity-0 transition-opacity hover:text-toti-brick group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-toti-brick/30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollBy(220)}
          aria-label={t('common.next')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-toti-beige bg-white text-toti-secondary shadow-md z-10 opacity-0 transition-opacity hover:text-toti-brick group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-toti-brick/30"
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
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            selectedId === null
              ? 'bg-gradient-to-r from-toti-brick to-toti-brick-hover border border-toti-brick text-white shadow-md shadow-toti-brick/25 hover:brightness-105 hover:-translate-y-0.5 transition-all duration-150'
              : 'bg-white/95 border border-toti-divider/60 text-toti-ink shadow-sm transition-all duration-150 hover:border-toti-brick/60 hover:text-toti-brick hover:bg-white hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 hover:shadow'
          }`}
        >
          {t('catalog.all_products')}
          <span className="ml-1.5 opacity-70">({totalCount})</span>
        </button>

        {categories.map(({ id, name, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              selectedId === id
                ? 'bg-gradient-to-r from-toti-brick to-toti-brick-hover border border-toti-brick text-white shadow-md shadow-toti-brick/25 hover:brightness-105 hover:-translate-y-0.5 transition-all duration-150'
                : 'bg-white/95 border border-toti-divider/60 text-toti-ink shadow-sm transition-all duration-150 hover:border-toti-brick/60 hover:text-toti-brick hover:bg-white hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 hover:shadow'
            }`}
          >
            {name}
            <span className="ml-1.5 opacity-70">({count})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// FILTER & SORT POPOVER (separate from category)
// ============================================================
export type SortOption =
  | 'default'
  | 'price_asc'
  | 'price_desc'
  | 'best_selling'
  | 'highest_rated'

function PriceFilterButton({
  min,
  max,
  sortBy,
  onApply,
  onClear,
}: {
  min: string
  max: string
  sortBy: SortOption
  onApply: (min: string, max: string, sortBy: SortOption) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draftMin, setDraftMin] = useState(min)
  const [draftMax, setDraftMax] = useState(max)
  const [draftSort, setDraftSort] = useState<SortOption>(sortBy)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraftMin(min)
    setDraftMax(max)
    setDraftSort(sortBy)
  }, [min, max, sortBy])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const activeCount = (min ? 1 : 0) + (max ? 1 : 0) + (sortBy !== 'default' ? 1 : 0)

  const sortOptions: { value: SortOption; labelKey: string }[] = [
    { value: 'default', labelKey: 'catalog.sort_default' },
    { value: 'price_asc', labelKey: 'catalog.sort_price_asc' },
    { value: 'price_desc', labelKey: 'catalog.sort_price_desc' },
    { value: 'best_selling', labelKey: 'catalog.sort_best_selling' },
    { value: 'highest_rated', labelKey: 'catalog.sort_highest_rated' },
  ]

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('catalog.filter_and_sort', 'Filter & Urutkan')}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 border border-toti-divider/60 text-toti-ink shadow-sm hover:border-toti-brick/60 hover:text-toti-brick hover:bg-white transition-all duration-150 cursor-pointer"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-toti-brick px-1 text-[10px] font-bold text-white shadow-sm">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-[min(300px,calc(100vw-2rem))] rounded-2xl border border-toti-divider bg-white p-4 shadow-xl">
          <div className="mb-3.5 flex items-center justify-between border-b border-toti-divider/60 pb-2.5">
            <h3 className="text-sm font-black text-toti-ink">
              {t('catalog.filter_and_sort', 'Filter & Urutkan')}
            </h3>
            {activeCount > 0 && (
              <span className="rounded-full bg-toti-cream px-2 py-0.5 text-[11px] font-bold text-toti-brick">
                {activeCount} aktif
              </span>
            )}
          </div>

          {/* SORT OPTIONS */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-toti-secondary">
              {t('catalog.sort_by', 'Urutkan')}
            </p>
            <div className="flex flex-col gap-1.5">
              {sortOptions.map((opt) => {
                const isSelected = draftSort === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftSort(opt.value)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'border border-toti-brick/40 bg-toti-cream font-bold text-toti-brick shadow-sm'
                        : 'border border-transparent text-toti-ink hover:bg-toti-alt/60'
                    }`}
                  >
                    <span>{t(opt.labelKey)}</span>
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? 'border-toti-brick bg-toti-brick'
                          : 'border-toti-divider bg-white'
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* PRICE RANGE */}
          <div className="border-t border-toti-divider/60 pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-toti-secondary">
              {t('catalog.price_range', 'Rentang Harga')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <CurrencyInput
                placeholder={t('catalog.price_min')}
                value={draftMin}
                onChange={(val, raw) => setDraftMin(raw ? String(val) : '')}
                className="w-full rounded-lg border border-toti-divider px-3 py-2 text-xs outline-none focus:border-toti-brick"
              />
              <CurrencyInput
                placeholder={t('catalog.price_max')}
                value={draftMax}
                onChange={(val, raw) => setDraftMax(raw ? String(val) : '')}
                className="w-full rounded-lg border border-toti-divider px-3 py-2 text-xs outline-none focus:border-toti-brick"
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="mt-4 flex items-center justify-between border-t border-toti-divider/60 pt-3">
            <button
              type="button"
              onClick={() => {
                setDraftMin('')
                setDraftMax('')
                setDraftSort('default')
                onClear()
                setOpen(false)
              }}
              className="text-xs font-bold text-toti-secondary hover:text-toti-ink cursor-pointer"
            >
              {t('catalog.clear_filter', 'Hapus')}
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draftMin, draftMax, draftSort)
                setOpen(false)
              }}
              className="toti-btn-primary h-9 px-4 text-xs cursor-pointer"
            >
              {t('catalog.apply_filter', 'Terapkan')}
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
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('default')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const { addItem } = useCart()

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allProducts, masterCategories] = await Promise.all([
        getAllProductsDetailed(),
        getMasterCategoriesWithCounts(true),
      ])
      setProducts(allProducts)
      setCategories(masterCategories)
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
    () => products.filter((p) => p.isActive !== false).length,
    [products]
  )

  const filteredProducts = useMemo(() => {
    let result = products
    if (selectedCategoryId !== null) {
      result = result.filter((p) => p.categoryId === selectedCategoryId)
    }
    if (searchQuery.trim()) {
      result = searchProducts(result, searchQuery)
    }
    const min = priceMin ? Number(priceMin) : null
    const max = priceMax ? Number(priceMax) : null
    if (min !== null || max !== null) {
      result = result.filter((p) => {
        const price = getLowestPrice(p.variants)
        if (min !== null && price < min) return false
        if (max !== null && price > max) return false
        return true
      })
    }
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return getLowestPrice(a.variants) - getLowestPrice(b.variants)
          case 'price_desc':
            return getLowestPrice(b.variants) - getLowestPrice(a.variants)
          case 'best_selling':
            return (b.soldCount ?? 0) - (a.soldCount ?? 0)
          case 'highest_rated': {
            const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
            if (ratingDiff !== 0) return ratingDiff
            return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
          }
          default:
            return 0
        }
      })
    }
    return result
  }, [products, selectedCategoryId, searchQuery, priceMin, priceMax, sortBy])

  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  const hasActiveFilters = Boolean(
    selectedCategoryId !== null || priceMin || priceMax || searchQuery || sortBy !== 'default'
  )

  const clearAllFilters = () => {
    setSelectedCategoryId(null)
    setPriceMin('')
    setPriceMax('')
    setSearchQuery('')
    setSortBy('default')
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
      <div className="relative isolate min-h-screen">
        <div className="relative z-10 pb-10">
          <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
            <div className="mb-3 block md:hidden">
              <div className="h-10 w-full animate-pulse rounded-full bg-toti-alt" />
            </div>
            <div className="rounded-2xl border border-toti-divider/60 bg-gradient-to-r from-toti-alt/85 via-toti-cream/85 to-toti-beige/80 p-2 sm:p-2.5 shadow-[0_4px_16px_rgba(58,31,22,0.06)] backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div className="h-11 flex-1 animate-pulse rounded-full bg-white/70" />
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/70" />
              </div>
            </div>
          </section>
          <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-toti-alt/70 p-4" />
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative isolate min-h-screen">
        <div className="relative z-10 mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-2xl border border-toti-error/30 bg-toti-error/15 p-6 shadow-sm">
            <p className="text-xl font-bold text-toti-error">❌ {t('catalog.load_failed_title')}</p>
            <p className="mt-2 text-sm text-toti-ink">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-5 toti-btn-primary cursor-pointer"
            >
              {t('catalog.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-screen">
      <div className="relative z-10 pb-10">
        <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
          {/* MOBILE SEARCH BAR */}
          <div className="mb-3 block md:hidden">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-toti-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('catalog.search_placeholder', 'Cari produk...')}
                className="h-10 w-full rounded-full border border-toti-divider bg-white pl-10 pr-9 text-sm text-toti-ink shadow-sm outline-none transition placeholder:text-toti-muted focus:border-toti-brick focus:ring-1 focus:ring-toti-brick"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('catalog.clear_filter', 'Hapus')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-toti-muted hover:bg-toti-alt hover:text-toti-ink focus:outline-none"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CATEGORIES & FILTER ROW: Category chips (left) + Filter Button (right) */}
          <div className="relative z-30 rounded-2xl border border-toti-divider/60 bg-gradient-to-r from-toti-alt/85 via-toti-cream/85 to-toti-beige/80 p-2 sm:p-2.5 shadow-[0_4px_16px_rgba(58,31,22,0.06)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <CategoryScroller
                categories={categories}
                totalCount={totalCount}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
              <PriceFilterButton
                min={priceMin}
                max={priceMax}
                sortBy={sortBy}
                onApply={(min, max, sort) => {
                  setPriceMin(min)
                  setPriceMax(max)
                  setSortBy(sort)
                }}
                onClear={() => {
                  setPriceMin('')
                  setPriceMax('')
                  setSortBy('default')
                }}
              />
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {searchQuery && (
                <span className="flex items-center gap-1.5 rounded-full border border-toti-divider bg-white px-3 py-1.5 text-xs font-bold text-toti-brick">
                  "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('catalog.clear_filter', 'Hapus filter')}
                    className="text-toti-secondary hover:text-toti-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {selectedCategoryObj && (
                <span className="flex items-center gap-1.5 rounded-full border border-toti-divider bg-white px-3 py-1.5 text-xs font-bold text-toti-brick">
                  {selectedCategoryObj.name}
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    aria-label={t('catalog.clear_filter', 'Hapus filter')}
                    className="text-toti-secondary hover:text-toti-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {(priceMin || priceMax) && (
                <span className="flex items-center gap-1.5 rounded-full border border-toti-divider bg-white px-3 py-1.5 text-xs font-bold text-toti-brick">
                  {priceMin ? formatShortRupiah(Number(priceMin)) : 'Rp0'}
                  {' – '}
                  {priceMax ? formatShortRupiah(Number(priceMax)) : '∞'}
                  <button
                    type="button"
                    onClick={() => {
                      setPriceMin('')
                      setPriceMax('')
                    }}
                    aria-label={t('catalog.clear_filter', 'Hapus filter')}
                    className="text-toti-secondary hover:text-toti-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {sortBy !== 'default' && (
                <span className="flex items-center gap-1.5 rounded-full border border-toti-divider bg-white px-3 py-1.5 text-xs font-bold text-toti-brick">
                  {t(`catalog.sort_${sortBy}`)}
                  <button
                    type="button"
                    onClick={() => setSortBy('default')}
                    aria-label={t('catalog.clear_filter', 'Hapus filter')}
                    className="text-toti-secondary hover:text-toti-ink cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-toti-brick hover:text-toti-brick-hover cursor-pointer"
              >
                {t('catalog.clear_all')}
              </button>
            </div>
          )}

          <p className="mt-4 text-sm text-toti-secondary">
            {t('catalog.results_found', { count: filteredProducts.length })}
          </p>

          {/* PRODUCT GRID */}
          {filteredProducts.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-white/95 border border-toti-divider/60 py-16 text-center shadow-sm">
              <p className="text-4xl">🔍</p>
              <p className="mt-4 text-lg font-black text-toti-ink">{t('catalog.not_found_title')}</p>
              <p className="text-sm text-toti-secondary">{t('catalog.not_found_desc')}</p>
            </div>
          ) : (
            <ScrollReveal direction="up" distance={18} className="relative z-10 mt-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </ScrollReveal>
          )}
        </section>
      </div>
    </div>
  )
}