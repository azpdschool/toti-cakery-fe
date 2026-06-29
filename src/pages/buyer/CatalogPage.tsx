import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  X,
  Minus,
  Plus,
} from 'lucide-react'
import {
  getAllProductsDetailed,
  getCategories,
  formatRupiah,
  getLowestPrice,
  type Product,
} from '@/services/productService'
import { useCart } from '@/context/CartContext'

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

// ============================================================
// KOMPONEN
// ============================================================

interface CategorySidebarProps {
  categories: { category: string; count: number }[]
  selected: string | null
  onSelect: (category: string | null) => void
  isOpen: boolean
  onClose: () => void
}

function CategorySidebar({
  categories,
  selected,
  onSelect,
  isOpen,
  onClose,
}: CategorySidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto
          bg-[#F6EFE6] p-5 shadow-lg transition-transform duration-300
          md:static md:z-auto md:w-auto md:min-w-[220px] md:translate-x-0 md:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between md:hidden">
          <h3 className="text-lg font-black text-[#3A1F16]">Jenis Produk</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B4A3C] hover:bg-[#E8DCCB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mb-4 hidden text-sm font-black uppercase tracking-wider text-[#6B4A3C] md:block">
          Jenis Produk
        </h3>

        <ul className="space-y-1.5">
          <li>
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                onClose()
              }}
              className={`
                w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition
                ${!selected
                  ? 'bg-[#9B4A2F] text-white'
                  : 'text-[#3A1F16] hover:bg-[#E8DCCB]'
                }
              `}
            >
              Semua Produk
              <span className="ml-2 text-xs opacity-70">
                ({categories.reduce((acc, c) => acc + c.count, 0)})
              </span>
            </button>
          </li>
          {categories.map(({ category, count }) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => {
                  onSelect(category)
                  onClose()
                }}
                className={`
                  w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition
                  ${selected === category
                    ? 'bg-[#9B4A2F] text-white'
                    : 'text-[#3A1F16] hover:bg-[#E8DCCB]'
                  }
                `}
              >
                {category}
                <span className="ml-2 text-xs opacity-70">({count})</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, quantity: number) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const lowestPrice = getLowestPrice(product.variants)
  const variantCount = product.variants.length
  const variant = product.variants[0]
  const minOrder = variant?.minOrder || 1
  const step = variant?.step || 1

  const [quantity, setQuantity] = useState(minOrder)

  const increment = () => setQuantity((prev) => prev + step)
  const decrement = () => setQuantity((prev) => Math.max(minOrder, prev - step))

  return (
    <article className="group overflow-hidden rounded-xl bg-[#F6EFE6] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/catalog/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#EFE4D6]">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#3A1F16] shadow-sm backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-[#E0A04E] text-[#E0A04E]" />
            {product.rating.toFixed(1)}
            <span className="text-[#9C8478]">·</span>
            {product.soldCount} terjual
          </div>
          {minOrder > 1 && (
            <div className="absolute right-2 top-2 rounded-full bg-[#9B4A2F] px-2 py-0.5 text-[10px] font-bold text-white">
              Min. {minOrder} pcs
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link
          to={`/catalog/${product.slug}`}
          className="line-clamp-1 text-sm font-black text-[#3A1F16] transition hover:text-[#9B4A2F]"
        >
          {product.name}
        </Link>

        <p className="mt-0.5 text-xs font-medium text-[#6B4A3C]">
          {product.category}
        </p>

        <p className="mt-1.5 text-xs text-[#9C8478]">
          {variantCount} Varian Tersedia
        </p>

        <p className="mt-2 text-base font-black text-[#3A1F16]">
          Mulai {formatRupiah(lowestPrice)}
        </p>

        {/* Quantity Selector */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={decrement}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#D0BFAF] text-[#3A1F16] hover:bg-[#E8DCCB]"
            aria-label="Kurangi jumlah"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-[#3A1F16]">
            {quantity}
          </span>
          <button
            onClick={increment}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#D0BFAF] text-[#3A1F16] hover:bg-[#E8DCCB]"
            aria-label="Tambah jumlah"
          >
            <Plus className="h-3 w-3" />
          </button>
          {minOrder > 1 && (
            <span className="ml-1 text-[10px] text-[#9C8478]">
              min {minOrder}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(product, quantity)}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#9B4A2F] text-xs font-black text-white transition hover:bg-[#7E3A24]"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Tambah ke Keranjang
        </button>
      </div>
    </article>
  )
}

// ============================================================
// SEARCH BAR
// ============================================================
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C8478]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari produk..."
        className="h-11 w-full rounded-xl border border-[#D0BFAF] bg-white pl-11 pr-4 text-sm text-[#3A1F16] outline-none placeholder:text-[#9C8478] focus:border-[#9B4A2F] focus:ring-2 focus:ring-[#9B4A2F]/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9C8478] hover:bg-[#E8DCCB]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function MobileFilterToggle({
  onClick,
  activeCount = 0,
}: {
  onClick: () => void
  activeCount?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center gap-2 rounded-xl border border-[#D0BFAF] bg-white px-4 text-sm font-semibold text-[#3A1F16] transition hover:bg-[#F6EFE6] md:hidden"
    >
      <ChevronDown className="h-4 w-4" />
      Filter
      {activeCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9B4A2F] px-1.5 text-xs text-white">
          {activeCount}
        </span>
      )}
    </button>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { addItem } = useCart()

  useEffect(() => {
    async function loadData() {
      const [allProducts, catData] = await Promise.all([
        getAllProductsDetailed(),
        getCategories(),
      ])
      setProducts(allProducts)
      setCategories(catData)
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    let result = products
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      result = searchProducts(result, searchQuery)
    }
    return result
  }, [products, selectedCategory, searchQuery])

  const activeFilterCount = (selectedCategory ? 1 : 0) + (searchQuery.trim() ? 1 : 0)

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
      quantity,
    })
    alert(`${quantity}x ${product.name} (${variant.name}) ditambahkan ke keranjang!`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    )
  }

  return (
    <div className="bg-white pb-10">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-[#F6EFE6] shadow-sm">
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage:
                "url('https://i.pinimg.com/1200x/a1/44/22/a144222b9399e459efd423fc0c7f82d4.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15,
            }}
          />
          <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-14">
            <div className="flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-[#E0A04E]" />
              <h1 className="text-3xl font-black text-[#3A1F16] md:text-4xl lg:text-5xl">
                Produk Kami
              </h1>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B4A3C] md:text-base">
              Temukan berbagai pilihan cake, cookies, cupcakes, dan dessert yang
              dibuat fresh dengan bahan berkualitas.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <div className="flex gap-6">
          <CategorySidebar
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <MobileFilterToggle
                onClick={() => setIsSidebarOpen(true)}
                activeCount={activeFilterCount}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#6B4A3C]">
                {filteredProducts.length} produk ditemukan
                {selectedCategory && (
                  <span className="ml-1 font-medium text-[#3A1F16]">
                    di {selectedCategory}
                  </span>
                )}
              </p>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-semibold text-[#9B4A2F] transition hover:text-[#7E3A24]"
                >
                  Hapus filter
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-[#F6EFE6] py-16 text-center">
                <p className="text-4xl">🔍</p>
                <p className="mt-4 text-lg font-black text-[#3A1F16]">
                  Produk tidak ditemukan
                </p>
                <p className="text-sm text-[#6B4A3C]">
                  Coba gunakan kata kunci lain atau hapus filter.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}