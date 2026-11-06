import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Loader2, AlertCircle, AlertTriangle, CheckCircle, Pencil, Trash2, FileText, Search, Filter, Archive, X, Eye, Image as ImageIcon, Box, Star, History, MoreVertical } from 'lucide-react'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { SellerSortDropdown } from '@/components/ui/SellerSortDropdown'
import { SellerFilterSelect } from '@/components/ui/SellerFilterSelect'
import { PaginationControls } from '@/components/ui/PaginationControls'
import RecipeManagementModal from './RecipeManagementModal'
import CategoryManagementModal from './CategoryManagementModal'
import QuickAddStockModal from './QuickAddStockModal'
import ImageCropper from '@/components/common/ImageCropper'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import {
  getAllProducts,
  updateProduct,
  getProductByBackendId,
  formatRupiah,
  type SimpleProduct,
  createProductWithOptionalPrice,
  uploadProductImages,
  setPrimaryProductImage,
  deleteProductImage,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  getProductPricing,
} from '@/services/productService'
import type { ProductCreate, ProductUpdate } from '@/api/product'
import { getBackendCategories, getProductPriceHistory, type CategoryResponse, type PriceHistoryOut } from '@/api/product'
import type { ProductImage } from '@/types/product'
import {
  getProductRecipes,
  addRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
  type RecipeCreate,
} from '@/api/recipe'
import { getInventoryOptions, type InventoryOption } from '@/services/sellerInventoryService'
import { toast } from 'react-hot-toast'

interface ProductFormIngredient {
  recipeId?: number
  originalInventoryId?: string
  inventoryId: string
  name: string
  quantity: number
  unit: string
}

function extractApiErrorMessage(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => {
        if (typeof item === 'string') return item
        if (item?.msg) {
          const loc = Array.isArray(item.loc) ? item.loc.filter((l: any) => l !== 'body').join('.') : ''
          return loc ? `${loc}: ${item.msg}` : item.msg
        }
        return JSON.stringify(item)
      })
      .join(' | ')
  }
  if (detail && typeof detail === 'object') {
    return detail.message || JSON.stringify(detail)
  }
  if (typeof err?.response?.data?.message === 'string') {
    return err.response.data.message
  }
  if (typeof err?.message === 'string') {
    return err.message
  }
  return fallback
}

interface ProductMoreActionsDropdownProps {
  product: SimpleProduct
  viewMode: 'active' | 'archived'
  openUpward?: boolean
  onOpenPriceHistory: () => void
  onOpenRecipeModal: () => void
  onArchive: () => void
  onDelete: () => void
  onRestore?: () => void
}

function ProductMoreActionsDropdown({
  product,
  viewMode,
  openUpward = false,
  onOpenPriceHistory,
  onOpenRecipeModal,
  onArchive,
  onDelete,
  onRestore,
}: ProductMoreActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className={`rounded-lg p-2 transition-colors ${
          isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`}
        title={`More actions for ${product.name}`}
        aria-label={`More actions for ${product.name}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } w-48 rounded-xl bg-white p-1.5 shadow-xl border border-gray-100 ring-1 ring-black/5 z-50 text-left focus:outline-none`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              onOpenPriceHistory()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
          >
            <History className="h-4 w-4 text-purple-600 shrink-0" />
            <span>Price History</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              onOpenRecipeModal()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Quick Edit Recipe</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {viewMode === 'active' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onArchive()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Archive className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Archive Product</span>
            </button>
          ) : (
            <>
              {onRestore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                    onRestore()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Restore Product</span>
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  onDelete()
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-600 shrink-0" />
                <span>Delete Product</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export type ProductSortOption =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'

export default function SellerProductsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const role = user?.role

  const canManageProducts = role === 'admin' || role === 'owner' || user?.roleLevel === 1 || user?.roleLevel === 2

  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([])
  const [isFetching, setIsFetching] = useState(true)

  // View modes, sorting & filters
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active')
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    priceMin: '',
    priceMax: '',
    minOrderMin: '',
    minOrderMax: '',
    status: '',
    availability: ''
  })
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Form & Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [editId, setEditId] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<SimpleProduct | null>(null)
  const [viewProductModal, setViewProductModal] = useState<SimpleProduct | null>(null)
  const [archiveConfirmId, setArchiveConfirmId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [recipeModalProduct, setRecipeModalProduct] = useState<{id: number, name: string} | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)

  // Price History Modal state
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<{ id: number; name: string } | null>(null)
  const [priceHistoryList, setPriceHistoryList] = useState<PriceHistoryOut[]>([])
  const [isFetchingPriceHistory, setIsFetchingPriceHistory] = useState(false)
  const [priceHistoryError, setPriceHistoryError] = useState<string | null>(null)

  const handleOpenPriceHistory = async (productId: number, productName: string) => {
    setPriceHistoryProduct({ id: productId, name: productName })
    setPriceHistoryList([])
    setPriceHistoryError(null)
    setIsFetchingPriceHistory(true)
    try {
      const history = await getProductPriceHistory(productId)
      setPriceHistoryList(history)
    } catch (err: any) {
      console.error('Failed to load price history:', err)
      const msg = err?.response?.data?.detail
      setPriceHistoryError(typeof msg === 'string' ? msg : 'Unable to load price history.')
    } finally {
      setIsFetchingPriceHistory(false)
    }
  }


  // Recipe / BOM form state
  const [ingredients, setIngredients] = useState<ProductFormIngredient[]>([])
  const [deletedRecipeIds, setDeletedRecipeIds] = useState<number[]>([])

  // Multiple Image state
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [draftImages, setDraftImages] = useState<{ file: File; previewUrl: string }[]>([])
  const [primaryDraftIndex, setPrimaryDraftIndex] = useState<number>(0)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Image Cropping & View modal
  const [cropperSource, setCropperSource] = useState<string | null>(null)
  const [viewImageSource, setViewImageSource] = useState<string | null>(null)

  interface ProductFormData extends ProductCreate {
    category_id?: number | null
    hpp_total?: number
    deskripsi_id?: string
    deskripsi_en?: string
  }

  const defaultFormState: ProductFormData = {
    nama_produk: '',
    deskripsi: '',
    deskripsi_id: '',
    deskripsi_en: '',
    category_id: null,
    kategori: '',
    harga_jual: '',
    minimum_order: 1,
    is_active: true,
    is_available: true,
    hpp_total: 0,
  }

  const [formData, setFormData] = useState<ProductFormData>(defaultFormState)
  const [formHpp, setFormHpp] = useState<number>(0)
  const [showHppConfirmModal, setShowHppConfirmModal] = useState<boolean>(false)

  const validateDescriptionText = (text: string | undefined | null): string | null => {
    if (!text) return null
    if (text.length > 5000) return 'Description cannot exceed 5000 characters.'
    if (text.includes('<') || text.includes('>')) return 'HTML tags (< or >) are not allowed.'
    return null
  }

  const computedFormAvailability = useMemo(() => {
    const validIngredients = ingredients.filter(
      (item) => item.inventoryId && item.quantity > 0
    )
    if (validIngredients.length === 0) {
      return false
    }
    for (const item of validIngredients) {
      const inv = inventoryOptions.find((opt) => String(opt.id) === String(item.inventoryId))
      if (!inv || (inv.stock ?? 0) <= 0 || (inv.stock ?? 0) < item.quantity) {
        return false
      }
    }
    return true
  }, [ingredients, inventoryOptions])

  const isFormValid = useMemo(() => {
    const isNameValid = (formData.nama_produk || '').trim().length > 0
    const isDescIdFormatValid = !validateDescriptionText(formData.deskripsi_id)
    const isDescEnFormatValid = !validateDescriptionText(formData.deskripsi_en)
    const isDescriptionIdValid = (formData.deskripsi_id || '').trim().length > 0 && isDescIdFormatValid
    const isCategoryValid = Boolean(formData.category_id || (formData.kategori || '').trim().length > 0)
    const isPriceValid = Number(formData.harga_jual) > 0
    const isMinOrderValid = Number(formData.minimum_order) >= 1
    const isRecipesValid =
      ingredients.length > 0 &&
      ingredients.every(
        (item) =>
          Boolean(item.inventoryId && String(item.inventoryId).trim().length > 0 && Number(item.inventoryId) > 0) &&
          Number(item.quantity) > 0
      )
    const isImagesValid = existingImages.length + draftImages.length > 0

    return Boolean(
      isNameValid &&
      isDescriptionIdValid &&
      isDescEnFormatValid &&
      isCategoryValid &&
      isPriceValid &&
      isMinOrderValid &&
      isRecipesValid &&
      isImagesValid
    )
  }, [formData, ingredients, existingImages.length, draftImages.length])

  const missingValidationReasons = useMemo(() => {
    const reasons: string[] = []
    if (!(formData.nama_produk || '').trim()) reasons.push('Product name is required')
    if (!(formData.deskripsi_id || '').trim()) reasons.push('Indonesian description is required')
    if (validateDescriptionText(formData.deskripsi_id)) reasons.push('Indonesian description contains invalid formatting')
    if (validateDescriptionText(formData.deskripsi_en)) reasons.push('English description contains invalid formatting')
    if (!formData.category_id && !(formData.kategori || '').trim()) reasons.push('Category is required')
    if (!(Number(formData.harga_jual) > 0)) reasons.push('Valid selling price (> 0) is required')
    if (!(Number(formData.minimum_order) >= 1)) reasons.push('Minimum order quantity must be at least 1')
    if (ingredients.length === 0) {
      reasons.push('At least one recipe ingredient is required')
    } else if (ingredients.some((item) => !item.inventoryId || Number(item.inventoryId) <= 0 || !(Number(item.quantity) > 0))) {
      reasons.push('All recipe rows must have an ingredient selected and quantity > 0')
    }
    if (existingImages.length + draftImages.length === 0) {
      reasons.push('At least one product image is required')
    }
    return reasons
  }, [formData, ingredients, existingImages.length, draftImages.length, editId])

  const handleQuickAddSuccess = async (newItem: { id: number; nama_item: string; satuan: string }) => {
    try {
      const refreshed = await getInventoryOptions()
      setInventoryOptions(refreshed)
      const emptyRowIndex = ingredients.findIndex((item) => !item.inventoryId)
      if (emptyRowIndex !== -1) {
        handleSelectIngredient(emptyRowIndex, String(newItem.id))
      } else {
        setIngredients((prev) => [
          ...prev,
          {
            inventoryId: String(newItem.id),
            name: newItem.nama_item,
            quantity: 0,
            unit: newItem.satuan,
          },
        ])
      }
    } catch (err) {
      console.error('Failed to reload inventory after quick add:', err)
    }
  }


  const fetchProducts = async () => {
    try {
      const data = await getAllProducts(false);
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load products right now.');
    }
  };

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setIsFetching(true);
      try {
        const [data, cats, invOptions] = await Promise.all([
          getAllProducts(false),
          getBackendCategories(),
          getInventoryOptions().catch(err => {
            console.error('Failed to load inventory options:', err)
            return [] as InventoryOption[]
          }),
        ]);
        if (ignore) return;
        setProducts(data);
        setCategories(cats);
        setInventoryOptions(invOptions);
        setFormData((prev) => (!prev.category_id && !prev.kategori && cats.length > 0 ? { ...prev, category_id: cats[0].id, kategori: cats[0].name } : prev));
      } catch (err) {
        if (ignore) return;
        console.error(err);
        toast.error('Unable to load products right now.');
      } finally {
        if (!ignore) setIsFetching(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await getBackendCategories();
      setCategories(cats);
      setFormData((prev) => (!prev.category_id && !prev.kategori && cats.length > 0 ? { ...prev, category_id: cats[0].id, kategori: cats[0].name } : prev));
    } catch (err) {
      console.error(err);
    }
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // reset page on search change
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Reset page on filter/viewMode/sort change
  useEffect(() => {
    setPage(1)
  }, [filters, viewMode, pageSize, sortBy])

  const isProductAvailable = (p: SimpleProduct): boolean => {
    return Boolean(p.isInStock && (p.stockQuantity ?? 0) > 0)
  }

  const filteredProducts = useMemo(() => {
    const list = products.filter(p => {
      // Archive View vs Active View (Soft delete)
      if (viewMode === 'active' && p.status === 'archived') return false;
      if (viewMode === 'archived' && p.status !== 'archived') return false;

      // Search
      if (debouncedSearch && !p.name.toLowerCase().includes(debouncedSearch.toLowerCase())) {
        return false;
      }

      // Multi-filters
      if (filters.category && p.category !== filters.category) return false;
      if (filters.status) {
        if (filters.status === 'active' && !p.isActive) return false;
        if (filters.status === 'inactive' && p.isActive) return false;
      }
      if (filters.availability) {
        const isAvail = isProductAvailable(p);
        if (filters.availability === 'available' && !isAvail) return false;
        if (filters.availability === 'unavailable' && isAvail) return false;
      }
      if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.price > Number(filters.priceMax)) return false;
      if (filters.minOrderMin && (p.minimumOrder ?? 1) < Number(filters.minOrderMin)) return false;
      if (filters.minOrderMax && (p.minimumOrder ?? 1) > Number(filters.minOrderMax)) return false;

      return true;
    })

    return list.slice().sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          if (tB !== tA) return tB - tA
          return (b.backendId ?? 0) - (a.backendId ?? 0)
        }
        case 'oldest': {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          if (tA !== tB) return tA - tB
          return (a.backendId ?? 0) - (b.backendId ?? 0)
        }
        case 'name_asc':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        case 'name_desc':
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })
        case 'price_asc':
          return (a.price ?? 0) - (b.price ?? 0)
        case 'price_desc':
          return (b.price ?? 0) - (a.price ?? 0)
        default:
          return 0
      }
    })
  }, [products, viewMode, debouncedSearch, filters, sortBy])

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Recipe helpers
  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        inventoryId: '',
        name: '',
        quantity: 0,
        unit: '',
      },
    ])
  }

  const handleSelectIngredient = (index: number, inventoryId: string) => {
    const selected = inventoryOptions.find((opt) => opt.id === inventoryId)

    setIngredients((prev) => {
      const updated = [...prev]

      if (!selected) {
        updated[index] = {
          ...updated[index],
          inventoryId: '',
          name: '',
          unit: '',
        }
        return updated
      }

      updated[index] = {
        ...updated[index],
        inventoryId: selected.id,
        name: selected.name,
        unit: selected.unit,
      }

      return updated
    })
  }

  const handleIngredientQuantityChange = (index: number, quantity: number) => {
    setIngredients((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        quantity,
      }
      return updated
    })
  }

  const handleRemoveIngredient = (index: number) => {
    const target = ingredients[index]
    if (target?.recipeId) {
      setDeletedRecipeIds((prev) => [...prev, target.recipeId as number])
    }
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddClick = () => {
    setEditId(null)
    setEditingProduct(null)
    const initialCategory = categories.length > 0 ? categories[0].name : ''
    const initialCategoryId = categories.length > 0 ? categories[0].id : null
    setFormData({ ...defaultFormState, category_id: initialCategoryId, kategori: initialCategory, hpp_total: 0 })
    setFormHpp(0)
    setIngredients([])
    setDeletedRecipeIds([])
    setExistingImages([])
    draftImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setDraftImages([])
    setPrimaryDraftIndex(0)
    setIsFormOpen(true)
    setError(null)
    setSuccess(null)

    // Ensure latest inventory options are loaded
    getInventoryOptions()
      .then((opts) => setInventoryOptions(opts))
      .catch((err) => console.error('Failed loading inventory options:', err))
  }

  const handleEditClick = async (product: SimpleProduct) => {
    const initialHpp = Number(product.hppTotal) || 0
    setEditId(product.backendId)
    setEditingProduct(product)
    setFormHpp(initialHpp)
    const matchingCat = categories.find((c) => (product.categoryId ? c.id === product.categoryId : c.name.toLowerCase() === (product.category || '').toLowerCase()))
    const resolvedCategoryId = product.categoryId ?? matchingCat?.id ?? null
    const resolvedCategoryName = matchingCat?.name || product.category || ''
    setFormData({
      nama_produk: product.name,
      deskripsi: product.description || '',
      deskripsi_id: product.descriptionId ?? product.description ?? '',
      deskripsi_en: product.descriptionEn ?? '',
      category_id: resolvedCategoryId,
      kategori: resolvedCategoryName,
      harga_jual: product.price.toString(),
      minimum_order: product.minimumOrder,
      is_active: product.isActive,
      is_available: true,
      hpp_total: initialHpp,
    })
    setExistingImages(product.images || [])
    draftImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setDraftImages([])
    setPrimaryDraftIndex(0)
    setIngredients([])
    setDeletedRecipeIds([])
    setIsFormOpen(true)
    setError(null)
    setSuccess(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setIsLoadingRecipe(true)
    try {
      const [options, recipeSummary, freshProduct, pricingData] = await Promise.all([
        getInventoryOptions().catch(() => []),
        getProductRecipes(product.backendId).catch((err) => {
          console.error('Failed to get product recipes:', err)
          return { bahan: [] }
        }),
        getProductByBackendId(product.backendId).catch(() => null),
        getProductPricing(product.backendId).catch(() => null),
      ])
      setInventoryOptions(options)
      if (freshProduct) {
        if (freshProduct.images) {
          setExistingImages(freshProduct.images)
        }
        if (freshProduct.descriptionId !== undefined || freshProduct.descriptionEn !== undefined) {
          setFormData((prev) => ({
            ...prev,
            deskripsi_id: freshProduct.descriptionId ?? freshProduct.description ?? prev.deskripsi_id ?? '',
            deskripsi_en: freshProduct.descriptionEn ?? prev.deskripsi_en ?? '',
          }))
        }
      }

      const loadedHpp = pricingData?.hpp !== undefined && pricingData.hpp !== null
        ? Number(pricingData.hpp)
        : (freshProduct?.hppTotal !== undefined && freshProduct.hppTotal !== null
            ? Number(freshProduct.hppTotal)
            : initialHpp)
      setFormHpp(loadedHpp || 0)
      setFormData((prev) => ({ ...prev, hpp_total: loadedHpp || 0 }))

      const mappedIngredients: ProductFormIngredient[] = recipeSummary.bahan.map((recipe) => ({
        recipeId: recipe.id,
        originalInventoryId: String(recipe.stock_item_id),
        inventoryId: String(recipe.stock_item_id),
        name: recipe.nama_bahan || '',
        quantity: Number(recipe.jumlah_dibutuhkan) || 0,
        unit: recipe.satuan || '',
      }))
      setIngredients(mappedIngredients)
    } catch (err) {
      console.error('Failed to load detail recipe/product:', err)
    } finally {
      setIsLoadingRecipe(false)
    }
  }

  const handleArchiveClick = (id: number) => {
    if (!canManageProducts) return
    setArchiveConfirmId(id)
  }

  const confirmArchive = async () => {
    if (!archiveConfirmId) return
    try {
      await archiveProduct(archiveConfirmId)
      toast.success('Product archived successfully.')
      fetchProducts()
    } catch (err: any) {
      console.error('Failed to archive product:', err)
      const msg = extractApiErrorMessage(err, 'Failed to archive product.')
      toast.error(msg)
    } finally {
      setArchiveConfirmId(null)
    }
  }

  const handleDeleteClick = (id: number) => {
    if (!canManageProducts) return
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteProduct(deleteConfirmId)
      toast.success('Product deleted permanently.')
      fetchProducts()
    } catch (err: any) {
      console.error('Failed to delete product:', err)
      const msg = extractApiErrorMessage(err, 'Failed to delete product.')
      toast.error(msg)
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleRestoreClick = async (id: number) => {
    if (!canManageProducts) return
    try {
      await restoreProduct(id)
      toast.success('Product restored successfully.')
      fetchProducts()
    } catch (err: any) {
      console.error('Failed to restore product:', err)
      const msg = extractApiErrorMessage(err, 'Failed to restore product.')
      toast.error(msg)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file format. Please use JPG, PNG, or WEBP.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB.')
      e.target.value = ''
      return
    }

    setError(null)
    const url = URL.createObjectURL(file)
    setCropperSource(url) // Open cropper
    e.target.value = ''
  }

  const handleCropConfirm = (croppedFile: File) => {
    const previewUrl = URL.createObjectURL(croppedFile)
    setDraftImages((prev) => [...prev, { file: croppedFile, previewUrl }])
    if (cropperSource) URL.revokeObjectURL(cropperSource)
    setCropperSource(null)
  }

  const handleSetExistingPrimary = async (imageId: number) => {
    if (!editId) return
    try {
      setIsUploadingImage(true)
      await setPrimaryProductImage(editId, imageId)
      const fresh = await getProductByBackendId(editId)
      setExistingImages(fresh.images)
      toast.success(t('products.image_primary_success', 'Primary photo updated successfully.'))
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update primary image.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!editId) return
    if (existingImages.length + draftImages.length <= 1) {
      toast.error(t('products.cannot_delete_last_image', 'Cannot delete the last photo. Please add a replacement photo first.'))
      return
    }
    try {
      setIsUploadingImage(true)
      await deleteProductImage(editId, imageId)
      const fresh = await getProductByBackendId(editId)
      setExistingImages(fresh.images)
      toast.success(t('products.image_removed_success', 'Photo deleted successfully.'))
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete image.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveDraftImage = (index: number) => {
    if (existingImages.length + draftImages.length <= 1) {
      toast.error(t('products.cannot_delete_last_image', 'Cannot delete the last photo. Please add a replacement photo first.'))
      return
    }
    URL.revokeObjectURL(draftImages[index].previewUrl)
    setDraftImages((prev) => prev.filter((_, i) => i !== index))
    if (primaryDraftIndex >= draftImages.length - 1) {
      setPrimaryDraftIndex(0)
    }
  }

  const executeSaveProduct = async () => {
    const harga_jual = formData.harga_jual ? Number(formData.harga_jual) : null
    const minimum_order = formData.minimum_order ? Number(formData.minimum_order) : 1

    const isCreating = !editId
    setIsLoading(true)
    let isProductCreatedOrUpdated = false
    try {
      if (editId) {
        const updatePayload: ProductUpdate = {}

        const cleanedDeskripsiId = (formData.deskripsi_id || '').trim() || null
        const originalDeskripsiId = (editingProduct?.descriptionId ?? editingProduct?.description ?? '').trim() || null
        if (cleanedDeskripsiId !== originalDeskripsiId) {
          updatePayload.deskripsi_id = cleanedDeskripsiId
        }

        const cleanedDeskripsiEn = (formData.deskripsi_en || '').trim() || null
        const originalDeskripsiEn = (editingProduct?.descriptionEn ?? '').trim() || null
        if (cleanedDeskripsiEn !== originalDeskripsiEn) {
          updatePayload.deskripsi_en = cleanedDeskripsiEn
        }

        if (harga_jual !== editingProduct?.price) {
          updatePayload.harga_jual = harga_jual
        }
        if (minimum_order !== (editingProduct?.minimumOrder ?? 1)) {
          updatePayload.minimum_order = minimum_order
        }
        if (formData.is_active !== editingProduct?.isActive) {
          updatePayload.is_active = formData.is_active
        }
        const effectiveCategoryId = formData.category_id ?? (categories.find(c => c.name.toLowerCase() === (formData.kategori || '').toLowerCase())?.id ?? null)
        if (effectiveCategoryId !== (editingProduct?.categoryId ?? null)) {
          updatePayload.category_id = effectiveCategoryId
        }
        if (formData.kategori && formData.kategori !== editingProduct?.category) {
          updatePayload.kategori = formData.kategori
        }

        let updatedProduct: SimpleProduct | undefined
        if (Object.keys(updatePayload).length > 0) {
          updatedProduct = await updateProduct(editId, updatePayload)
        }
        isProductCreatedOrUpdated = true

        if (updatedProduct?.warningBelowHpp) {
          toast(
            `Warning: Saved selling price ${formatRupiah(updatedProduct.price)} is below COGS (${formatRupiah(updatedProduct.hppTotal)}).`,
            { icon: '⚠️' }
          )
        }

        // Recipe mutation flow promise
        const recipeFlowPromise = (async () => {
          // Delete removed recipes
          if (deletedRecipeIds.length > 0) {
            await Promise.all(
              deletedRecipeIds.map((recipeId) => deleteRecipeIngredient(editId, recipeId))
            )
          }

          // Add/Update recipes
          const validIngredients = ingredients.filter(
            (ingredient) => ingredient.inventoryId && ingredient.quantity > 0
          )
          if (validIngredients.length > 0) {
            await Promise.all(
              validIngredients.map((ingredient) => {
                const recipePayload: RecipeCreate = {
                  stock_item_id: Number(ingredient.inventoryId),
                  jumlah_dibutuhkan: ingredient.quantity,
                }
                if (!ingredient.recipeId) {
                  return addRecipeIngredient(editId, recipePayload)
                } else if (
                  ingredient.originalInventoryId &&
                  ingredient.originalInventoryId !== ingredient.inventoryId
                ) {
                  return deleteRecipeIngredient(editId, ingredient.recipeId).then(() =>
                    addRecipeIngredient(editId, recipePayload)
                  )
                } else {
                  return updateRecipeIngredient(editId, ingredient.recipeId, {
                    jumlah_dibutuhkan: ingredient.quantity,
                  })
                }
              })
            )
          }

          // Price lock immediately after recipes finish so harga_jual is never mutated by backend HPP recalculations
          if (harga_jual !== null && harga_jual > 0) {
            await updateProduct(editId, { harga_jual })
          }
        })()

        // Image upload promise in parallel
        const imageUploadPromise = draftImages.length > 0
          ? uploadProductImages(
              editId,
              draftImages.map((d) => d.file),
              primaryDraftIndex
            ).catch((imgErr: any) => {
              console.error('Image upload failed during product update:', imgErr)
              const imgMsg = extractApiErrorMessage(imgErr, 'Product updated, but image upload failed.')
              setError(imgMsg)
              toast.error(imgMsg)
            })
          : Promise.resolve(null)

        await Promise.all([recipeFlowPromise, imageUploadPromise])
        setSuccess('Product updated successfully.')
      } else {
        const effectiveCategoryId = formData.category_id ?? (categories.find(c => c.name.toLowerCase() === (formData.kategori || '').toLowerCase())?.id ?? null)
        const createPayload: ProductCreate = {
          nama_produk: formData.nama_produk.trim(),
          deskripsi_id: (formData.deskripsi_id || '').trim() || null,
          deskripsi_en: (formData.deskripsi_en || '').trim() || null,
          category_id: effectiveCategoryId,
          kategori: formData.kategori || (categories.find(c => c.id === effectiveCategoryId)?.name || ''),
          harga_jual,
          minimum_order,
          is_active: formData.is_active,
          is_available: true,
        }

        const createdProduct = await createProductWithOptionalPrice(createPayload, harga_jual)
        isProductCreatedOrUpdated = true
        setEditId(createdProduct.backendId)
        setEditingProduct(createdProduct)

        if (createdProduct.warningBelowHpp) {
          toast(
            `Warning: Saved selling price ${formatRupiah(createdProduct.price)} is below COGS (${formatRupiah(createdProduct.hppTotal)}).`,
            { icon: '⚠️' }
          )
        }

        // Recipe mutation flow promise
        const recipePayloads: RecipeCreate[] = ingredients
          .filter((ingredient) => ingredient.inventoryId && ingredient.quantity > 0)
          .map((ingredient) => ({
            stock_item_id: Number(ingredient.inventoryId),
            jumlah_dibutuhkan: ingredient.quantity,
          }))
          .filter((ingredient) => Number.isFinite(ingredient.stock_item_id))

        const recipeFlowPromise = (async () => {
          if (recipePayloads.length > 0) {
            await Promise.all(
              recipePayloads.map((payload) => addRecipeIngredient(createdProduct.backendId, payload))
            )
          }

          // Price lock immediately after recipes finish so harga_jual is locked to exact user input
          if (harga_jual !== null && harga_jual > 0) {
            await updateProduct(createdProduct.backendId, { harga_jual })
          }
        })()

        // Image upload promise in parallel
        const imageUploadPromise = draftImages.length > 0
          ? uploadProductImages(
              createdProduct.backendId,
              draftImages.map((d) => d.file),
              primaryDraftIndex
            ).catch((imgErr: any) => {
              console.error('Image upload failed during product creation:', imgErr)
              const imgMsg = extractApiErrorMessage(imgErr, 'Product created, but image upload failed.')
              setError(imgMsg)
              toast.error(imgMsg)
            })
          : Promise.resolve(null)

        await Promise.all([recipeFlowPromise, imageUploadPromise])
        setSuccess('Product added successfully.')
      }

      if (!error && isProductCreatedOrUpdated) {
        setIsFormOpen(false)
        setFormData(defaultFormState)
        setFormHpp(0)
        setEditId(null)
        setEditingProduct(null)
        setIngredients([])
        setDeletedRecipeIds([])
        setExistingImages([])
        draftImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
        setDraftImages([])

        if (isCreating) {
          setSortBy('newest')
          setSearchQuery('')
          setDebouncedSearch('')
          setPage(1)
        }
      }

      if (isProductCreatedOrUpdated) {
        fetchProducts()
      }
    } catch (err: any) {
      console.error('Failed to save product:', err)
      const fallback = !isProductCreatedOrUpdated
        ? 'Failed to save product.'
        : 'Failed saving product recipes/ingredients.'
      const errorMsg = extractApiErrorMessage(err, fallback)
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!canManageProducts) {
      setError('Unauthorized to manage products.')
      return
    }
    if (!isFormValid) {
      toast.error(t('products.form_incomplete', 'Mohon lengkapi seluruh data formulir produk terlebih dahulu.'))
      return
    }
    if (!formData.nama_produk.trim()) {
      setError('Product name is required.')
      return
    }

    // Require at least 1 image (existing or newly uploaded)
    const totalImages = existingImages.length + draftImages.length
    if (totalImages === 0) {
      setError(t('products.at_least_one_image_required', 'At least 1 product photo is required.'))
      return
    }

    // Validate recipe ingredients
    const usedIngredients = ingredients.filter(
      (ingredient) => ingredient.inventoryId || ingredient.name || ingredient.quantity > 0
    )
    const invalidIngredients = usedIngredients.filter(
      (ingredient) => !ingredient.inventoryId || ingredient.quantity <= 0
    )
    if (invalidIngredients.length > 0) {
      setError('Each recipe ingredient must have a selected ingredient and quantity greater than 0.')
      return
    }
    const duplicateSet = new Set<string>()
    for (const ingredient of usedIngredients) {
      if (!ingredient.inventoryId) continue
      if (duplicateSet.has(ingredient.inventoryId)) {
        setError(`Ingredient "${ingredient.name || 'selected'}" is duplicated in the recipe.`)
        return
      }
      duplicateSet.add(ingredient.inventoryId)
    }

    const harga_jual = formData.harga_jual ? Number(formData.harga_jual) : null

    if (formHpp > 0 && harga_jual !== null && harga_jual < formHpp) {
      setShowHppConfirmModal(true)
      return
    }

    await executeSaveProduct()
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      priceMin: '',
      priceMax: '',
      minOrderMin: '',
      minOrderMax: '',
      status: '',
      availability: ''
    })
    setSearchQuery('')
    setIsFilterOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        title="Products"
        description="Manage your products, pricing, availability, and recipes."
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        actions={
          canManageProducts ? (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 shrink-0">
              {/* Primary CTA: First on mobile */}
              <button
                type="button"
                onClick={handleAddClick}
                className="order-1 sm:order-3 flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28] whitespace-nowrap shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>

              {/* Secondary actions: 2-column grid on mobile, inline on desktop */}
              <div className="order-2 sm:order-1 grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#f0e0d0] px-3 py-2 text-xs sm:text-sm font-semibold text-[#d85b30] transition hover:bg-[#e6d0bb] whitespace-nowrap"
                >
                  <Box className="h-4 w-4 shrink-0" />
                  <span>Manage Categories</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                    viewMode === 'archived'
                      ? 'bg-stone-800 text-white hover:bg-stone-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Archive className="h-4 w-4 shrink-0" />
                  <span>{viewMode === 'active' ? 'Archived Products' : 'Active Products'}</span>
                </button>
              </div>
            </div>
          ) : undefined
        }
      />

      {!isFormOpen && error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!isFormOpen && success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Add / Edit Form */}
      {isFormOpen && canManageProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="flex max-h-[90dvh] sm:max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-6 shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-[#4b2417]">
                {editId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditId(null)
                  setEditingProduct(null)
                  setFormData(defaultFormState)
                  setFormHpp(0)
                  setExistingImages([])
                  draftImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
                  setDraftImages([])
                  setError(null)
                  setSuccess(null)
                }}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_produk"
                  required
                  disabled={!!editId}
                  value={formData.nama_produk}
                  onChange={handleInputChange}
                  placeholder="e.g. Chocolate Cake"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {/* Indonesian Description (ID) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    Indonesian Description (ID) <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {(formData.deskripsi_id || '').length}/5000
                  </span>
                </div>
                <textarea
                  name="deskripsi_id"
                  rows={3}
                  maxLength={5000}
                  value={formData.deskripsi_id || ''}
                  onChange={handleInputChange}
                  placeholder="Enter product description in Indonesian..."
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40 ${
                    validateDescriptionText(formData.deskripsi_id) ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#d0bfaf]'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Primary description displayed on the Indonesian storefront and used as fallback if English is empty.
                  </p>
                  {validateDescriptionText(formData.deskripsi_id) && (
                    <p className="text-xs text-red-600 font-medium">
                      {validateDescriptionText(formData.deskripsi_id)}
                    </p>
                  )}
                </div>
              </div>

              {/* English Description (EN) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    English Description (EN) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {(formData.deskripsi_en || '').length}/5000
                  </span>
                </div>
                <textarea
                  name="deskripsi_en"
                  rows={3}
                  maxLength={5000}
                  value={formData.deskripsi_en || ''}
                  onChange={handleInputChange}
                  placeholder="Enter product description in English (optional)..."
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40 ${
                    validateDescriptionText(formData.deskripsi_en) ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#d0bfaf]'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Displayed when the buyer switches the storefront to English. Leave empty to fall back to the Indonesian description.
                  </p>
                  {validateDescriptionText(formData.deskripsi_en) && (
                    <p className="text-xs text-red-600 font-medium">
                      {validateDescriptionText(formData.deskripsi_en)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id ?? (categories.find(c => c.name.toLowerCase() === (formData.kategori || '').toLowerCase())?.id ?? '')}
                  onChange={(e) => {
                    const selectedId = e.target.value ? Number(e.target.value) : null
                    const selectedCat = categories.find((c) => c.id === selectedId)
                    setFormData((prev) => ({
                      ...prev,
                      category_id: selectedId,
                      kategori: selectedCat?.name || '',
                    }))
                  }}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                >
                  {categories.length === 0 && <option value="">Loading categories...</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    Price <span className="text-red-500">*</span>
                  </label>
                  {editId && (
                    <button
                      type="button"
                      onClick={() => handleOpenPriceHistory(editId, formData.nama_produk)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 transition-colors"
                      title="View Price History"
                    >
                      <History className="h-3.5 w-3.5" />
                      Price History
                    </button>
                  )}
                </div>
                <CurrencyInput
                  name="harga_jual"
                  value={formData.harga_jual || ''}
                  onChange={(val, raw) =>
                    setFormData((prev) => ({
                      ...prev,
                      harga_jual: raw ? String(val) : '',
                    }))
                  }
                  placeholder="0"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:ring-2 ${
                    formHpp > 0 && Number(formData.harga_jual) > 0 && Number(formData.harga_jual) < formHpp
                      ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200'
                      : 'border-[#d0bfaf] focus:border-[#c95b31] focus:ring-[#e9b49d]/40'
                  }`}
                />

                {/* Live COGS Warning / Info */}
                {formHpp <= 0 ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>COGS unavailable — complete recipe</span>
                  </p>
                ) : Number(formData.harga_jual) > 0 && Number(formData.harga_jual) < formHpp ? (
                  <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/90 p-3 text-xs text-amber-900 shadow-xs transition-all">
                    <div className="rounded-lg bg-amber-100 p-1 text-amber-700 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-amber-900">
                        Selling Price Below COGS
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        Selling price <span className="font-bold text-amber-950">{formatRupiah(Number(formData.harga_jual))}</span> is{' '}
                        <span className="font-semibold text-red-700 underline decoration-red-300">
                          {formatRupiah(formHpp - Number(formData.harga_jual))}
                        </span>{' '}
                        below estimated COGS ({formatRupiah(formHpp)}/pcs).
                      </p>
                    </div>
                  </div>
                ) : Number(formData.harga_jual) >= formHpp ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>
                      COGS: {formatRupiah(formHpp)} &bull; Margin: {(((Number(formData.harga_jual) - formHpp) / formHpp) * 100).toFixed(1)}% (+{formatRupiah(Number(formData.harga_jual) - formHpp)})
                    </span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-[#6f5448]">
                    COGS per product: <span className="font-semibold text-[#4b2417]">{formatRupiah(formHpp)}</span>
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Minimum Order <span className="text-red-500">*</span>
                </label>
                <DecimalInput
                  name="minimum_order"
                  maxDecimals={0}
                  min={1}
                  value={formData.minimum_order || ''}
                  onChange={(val, raw) =>
                    setFormData((prev) => ({
                      ...prev,
                      minimum_order: raw ? (val ?? 1) : 1,
                    }))
                  }
                  placeholder="1"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              {/* Status and Availability side-by-side */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#ead8ca] pt-4 mt-2">
                {/* Status Toggle Switch */}
                <div className="flex flex-col justify-between rounded-xl border border-[#ead8ca] bg-[#fcf8f5] p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-[#4b2417]">
                        {formData.is_active
                          ? t('products.status_active_badge', 'Status: Active')
                          : t('products.status_inactive_badge', 'Status: Inactive')}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.is_active
                          ? t('products.status_active_help', 'Active product: visible to buyers.')
                          : t('products.status_inactive_help', 'Inactive product: hidden from buyers.')}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.is_active}
                      onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#d85b30] focus:ring-offset-2 ml-3 ${
                        formData.is_active ? 'bg-[#d85b30]' : 'bg-gray-300'
                      }`}
                      aria-label="Toggle product status"
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          formData.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Read-only Automatic Availability Card */}
                <div className="flex flex-col justify-between rounded-xl border border-dashed border-[#ead8ca] bg-[#fcf8f5] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t('products.availability_label', 'Availability')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        computedFormAvailability
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          computedFormAvailability ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {computedFormAvailability
                        ? t('products.available', 'Available')
                        : t('products.unavailable', 'Unavailable')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    {t(
                      'products.availability_auto_help',
                      'Auto-calculated based on recipe ingredients & inventory stock.'
                    )}
                  </p>
                </div>
              </div>
              
              {/* Recipe / Ingredients Section */}
              <div className="sm:col-span-2 border-t border-[#ead8ca] pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#4b2417]">
                    Recipe & Ingredients <span className="text-red-500 ml-0.5">*</span>
                  </h3>
                  {isLoadingRecipe && (
                    <span className="flex items-center gap-1 text-xs text-[#8b7166]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading recipe...
                    </span>
                  )}
                </div>

                <p className="mb-3 text-xs text-[#6f5448]">
                  Select ingredients from inventory and specify the quantity used to make 1 unit of this product. Cost of Goods Sold (COGS) is calculated automatically.
                </p>

                <div className="overflow-x-auto rounded-xl border border-[#ead8ca]">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead className="bg-[#f8eee5] text-[#6f5448]">
                      <tr className="text-left text-xs font-semibold uppercase">
                        <th className="py-2.5 px-3">
                          Ingredient Name <span className="text-red-500 ml-0.5">*</span>
                        </th>
                        <th className="py-2.5 px-3 w-32">
                          Quantity Used <span className="text-red-500 ml-0.5">*</span>
                        </th>
                        <th className="py-2.5 px-3 w-24">Unit</th>
                        <th className="py-2.5 px-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#ead8ca]">
                      {ingredients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-xs text-[#6f5448]"
                          >
                            No recipe ingredients yet. Click the "+ Add Ingredient" button below to add one.
                          </td>
                        </tr>
                      ) : (
                        ingredients.map((ingredient, idx) => (
                          <tr
                            key={ingredient.recipeId ?? `new-${idx}`}
                            className="hover:bg-[#fcf8f5]"
                          >
                            <td className="py-2 px-3">
                              <select
                                value={ingredient.inventoryId}
                                onChange={(e) =>
                                  handleSelectIngredient(idx, e.target.value)
                                }
                                className="w-full rounded-lg border border-[#d0bfaf] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#d85b30]"
                              >
                                <option value="">Select ingredient...</option>
                                {inventoryOptions.map((opt) => {
                                  const isSelectedInOtherRow = ingredients.some(
                                    (item, i) => i !== idx && String(item.inventoryId) === String(opt.id)
                                  )
                                  return (
                                    <option
                                      key={opt.id}
                                      value={opt.id}
                                      disabled={isSelectedInOtherRow}
                                    >
                                      {opt.name} - Stock: {opt.stock} {opt.unit}
                                      {isSelectedInOtherRow ? ' — Already selected' : ''}
                                    </option>
                                  )
                                })}
                              </select>
                            </td>

                            <td className="py-2 px-3">
                              <DecimalInput
                                value={ingredient.quantity || ''}
                                onChange={(val) =>
                                  handleIngredientQuantityChange(
                                    idx,
                                    val || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full min-w-[96px] rounded-lg border border-[#d0bfaf] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#d85b30]"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={ingredient.unit}
                                readOnly
                                placeholder="-"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-600"
                              />
                            </td>

                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(idx)}
                                className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove ingredient"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#d85b30] hover:text-[#c04e28] transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Ingredient
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Register New Inventory Item
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 border-t border-[#ead8ca] pt-4 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-[#4b2417]">
                    {t('products.product_images', 'Product Photos')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-[#8b7166]">
                    {t('products.at_least_one_image_required', 'At least 1 product photo is required.')}
                  </span>
                </div>

                <p className="mb-3 text-xs text-[#6f5448]">
                  Supported formats: JPG, PNG, WEBP (max. 5 MB per file). The image marked as Primary will be used as the main catalog cover.
                </p>

                <div className="flex flex-wrap gap-3 items-center">
                  {/* Existing Images */}
                  {existingImages.map((img) => (
                    <div
                      key={`existing-${img.id}`}
                      className={`relative group h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all bg-white shadow-sm ${
                        img.isPrimary ? 'border-[#d85b30]' : 'border-[#d0bfaf]'
                      }`}
                    >
                      <img src={img.imageUrl} alt="Product Image" className="h-full w-full object-cover" />
                      
                      {img.isPrimary && (
                        <div className="absolute top-1 left-1 z-10 rounded-md bg-[#d85b30] px-1.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow">
                          <Star className="h-3 w-3 fill-white" />
                          {t('products.primary_image', 'Primary Photo')}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 gap-1 z-20">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewImageSource(img.imageUrl)}
                            className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/40 transition"
                            title="View Image"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isUploadingImage || existingImages.length + draftImages.length <= 1}
                            onClick={() => handleDeleteExistingImage(img.id)}
                            className="rounded-lg bg-red-600/80 p-1.5 text-white hover:bg-red-600 disabled:opacity-40 transition"
                            title={t('products.remove_image', 'Delete Photo')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {!img.isPrimary && (
                          <button
                            type="button"
                            disabled={isUploadingImage}
                            onClick={() => handleSetExistingPrimary(img.id)}
                            className="mt-1 w-full rounded bg-[#d85b30] py-1 text-[10px] font-semibold text-white hover:bg-[#c04e28] transition"
                          >
                            {t('products.set_primary', 'Set as Primary')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Draft Upload Images */}
                  {draftImages.map((draft, idx) => (
                    <div
                      key={`draft-${idx}`}
                      className={`relative group h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all bg-white shadow-sm border-dashed ${
                        existingImages.length === 0 && primaryDraftIndex === idx ? 'border-[#d85b30]' : 'border-[#d0bfaf]'
                      }`}
                    >
                      <img src={draft.previewUrl} alt="Draft Preview" className="h-full w-full object-cover" />

                      {existingImages.length === 0 && primaryDraftIndex === idx && (
                        <div className="absolute top-1 left-1 z-10 rounded-md bg-[#d85b30] px-1.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow">
                          <Star className="h-3 w-3 fill-white" />
                          {t('products.primary_image', 'Primary Photo')}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 gap-1 z-20">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewImageSource(draft.previewUrl)}
                            className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/40 transition"
                            title="View Image"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftImage(idx)}
                            className="rounded-lg bg-red-600/80 p-1.5 text-white hover:bg-red-600 transition"
                            title={t('products.remove_image', 'Delete Photo')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {existingImages.length === 0 && primaryDraftIndex !== idx && (
                          <button
                            type="button"
                            onClick={() => setPrimaryDraftIndex(idx)}
                            className="mt-1 w-full rounded bg-[#d85b30] py-1 text-[10px] font-semibold text-white hover:bg-[#c04e28] transition"
                          >
                            {t('products.set_primary', 'Set as Primary')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  <label className="flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d0bfaf] bg-[#f8eee5] text-[#d85b30] hover:bg-[#f0e0d0] transition">
                    <Plus className="h-6 w-6" />
                    <span className="mt-1 text-xs font-semibold">{t('products.add_image', 'Add Photos')}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {!isFormValid && missingValidationReasons.length > 0 && (
              <div className="border-t border-amber-200 bg-amber-50/80 px-6 py-3 shrink-0">
                <div className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Please complete the following required fields before submitting:</span>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-700">
                      {missingValidationReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="border-t border-red-200 bg-red-50 px-6 py-3 shrink-0">
                <div className="flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-red-900">Submission Error</span>
                    <p className="mt-0.5 text-red-700 leading-relaxed font-medium">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditId(null)
                  setFormData(defaultFormState)
                  setFormHpp(0)
                  setExistingImages([])
                  draftImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
                  setDraftImages([])
                  setError(null)
                  setSuccess(null)
                }}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="flex items-center gap-2 rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List and Filters */}
      {!isFormOpen && (
        <>
          <div className="mb-6 flex items-center gap-2 sm:gap-3 rounded-xl bg-white p-2.5 sm:p-4 shadow-sm border border-gray-100">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            {/* Sort By Dropdown */}
            <SellerSortDropdown
              id="product-sort"
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as ProductSortOption)
                setPage(1)
              }}
              options={[
                { label: 'Newest', value: 'newest' },
                { label: 'Oldest', value: 'oldest' },
                { label: 'Name: A-Z', value: 'name_asc' },
                { label: 'Name: Z-A', value: 'name_desc' },
                { label: 'Price: Low-High', value: 'price_asc' },
                { label: 'Price: High-Low', value: 'price_desc' },
              ]}
              ariaLabel="Sort products"
            />

            <div className="relative shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#d0bfaf] bg-white px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#4b2417] hover:bg-gray-50 cursor-pointer shrink-0"
                aria-label="Filter products"
              >
                <Filter className="h-4 w-4 shrink-0 text-[#8b7166]" />
                <span className="hidden sm:inline">Filter</span>
                {Object.values(filters).some(Boolean) && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#d85b30] px-1 text-[10px] font-bold text-white">
                    1
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(300px,calc(100vw-2rem))] sm:w-80 rounded-2xl border border-[#e6d5c5] bg-white p-3.5 sm:p-5 shadow-xl max-h-[75dvh] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-[#4b2417]">Filter Products</h3>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                      aria-label="Close filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <SellerFilterSelect
                      label="Category"
                      value={filters.category}
                      onChange={val => setFilters({...filters, category: val})}
                      options={categories.map(c => ({ label: c.name, value: c.name }))}
                      placeholder="All Categories"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#4b2417]">Min Price</label>
                        <CurrencyInput 
                          placeholder="Min"
                          value={filters.priceMin}
                          onChange={(val, raw) => setFilters({...filters, priceMin: raw ? String(val) : ''})}
                          className="w-full rounded-lg border border-gray-200 p-1.5 sm:p-2 text-xs sm:text-sm text-[#4b2417] outline-none focus:border-[#d85b30]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#4b2417]">Max Price</label>
                        <CurrencyInput 
                          placeholder="Max"
                          value={filters.priceMax}
                          onChange={(val, raw) => setFilters({...filters, priceMax: raw ? String(val) : ''})}
                          className="w-full rounded-lg border border-gray-200 p-1.5 sm:p-2 text-xs sm:text-sm text-[#4b2417] outline-none focus:border-[#d85b30]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#4b2417]">Min Order (Min)</label>
                        <DecimalInput 
                          maxDecimals={0}
                          placeholder="Min"
                          value={filters.minOrderMin}
                          onChange={(_val, raw) => setFilters({...filters, minOrderMin: raw})}
                          className="w-full rounded-lg border border-gray-200 p-1.5 sm:p-2 text-xs sm:text-sm text-[#4b2417] outline-none focus:border-[#d85b30]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#4b2417]">Min Order (Max)</label>
                        <DecimalInput 
                          maxDecimals={0}
                          placeholder="Max"
                          value={filters.minOrderMax}
                          onChange={(_val, raw) => setFilters({...filters, minOrderMax: raw})}
                          className="w-full rounded-lg border border-gray-200 p-1.5 sm:p-2 text-xs sm:text-sm text-[#4b2417] outline-none focus:border-[#d85b30]"
                        />
                      </div>
                    </div>

                    {viewMode === 'active' && (
                      <SellerFilterSelect
                        label="Status"
                        value={filters.status}
                        onChange={val => setFilters({...filters, status: val})}
                        options={[
                          { label: 'Active', value: 'active' },
                          { label: 'Archived', value: 'inactive' }
                        ]}
                        placeholder="All Statuses"
                      />
                    )}

                    <SellerFilterSelect
                      label="Availability"
                      value={filters.availability}
                      onChange={val => setFilters({...filters, availability: val})}
                      options={[
                        { label: 'Available', value: 'available' },
                        { label: 'Unavailable', value: 'unavailable' }
                      ]}
                      placeholder="All"
                    />

                    <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
                      <button 
                        type="button"
                        onClick={clearFilters}
                        className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Clear All
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-[#d85b30] hover:bg-[#c04e28] transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-gray-100">
            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#d85b30]" />
                <p className="mt-4 text-sm text-[#8b7166]">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <Archive className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {searchQuery || Object.values(filters).some(Boolean) 
                    ? 'No products match your current filters.' 
                    : 'No products found.'}
                </p>
                {(searchQuery || Object.values(filters).some(Boolean)) && (
                  <button 
                    onClick={clearFilters}
                    className="mt-4 text-sm font-semibold text-[#d85b30] hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full max-w-full min-h-[320px]">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <th className="p-4 w-64">Product Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Min. Order</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Availability</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-[#fcf8f5] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100 cursor-pointer" onClick={() => product.image && setViewImageSource(product.image)}>
                                {product.image ? (
                                  <img src={product.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-5 w-5 m-2.5 text-gray-400" />
                                )}
                              </div>
                              <span className="font-medium truncate max-w-[200px]" title={product.name}>{product.name}</span>
                            </div>
                          </td>
                          <td className="p-4">{product.category}</td>
                          <td className="p-4">{formatRupiah(product.price)}</td>
                          <td className="p-4">{product.minimumOrder}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {product.isActive
                                ? t('products.status_active_badge', 'Status: Active')
                                : t('products.status_inactive_badge', 'Status: Inactive')}
                            </span>
                          </td>
                          <td className="p-4">
                            {(() => {
                              const isAvail = isProductAvailable(product);
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-sm ${isAvail ? 'text-green-500' : 'text-red-500'}`}>
                                    {isAvail ? '🟢' : '🔴'}
                                  </span>
                                  <span className={`text-sm font-medium ${isAvail ? 'text-green-700' : 'text-red-700'}`}>
                                    {isAvail ? t('products.available', 'Available') : t('products.unavailable', 'Unavailable')}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Direct Action 1: View Detail */}
                              <button
                                type="button"
                                onClick={() => setViewProductModal(product)}
                                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                                title={t('products.view_details', 'View Details')}
                                aria-label={t('products.view_details', 'View Product Details')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Direct Action 2: Edit Product */}
                              {canManageProducts && (
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(product)}
                                  className="rounded-lg p-2 text-[#d85b30] hover:bg-[#f8eee5] transition-colors"
                                  title={t('products.edit_product', 'Edit Product')}
                                  aria-label={t('products.edit_product', 'Edit Product')}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}

                              {/* Dropdown Menu: More Actions */}
                              {canManageProducts && (
                                <ProductMoreActionsDropdown
                                  product={product}
                                  viewMode={viewMode}
                                  openUpward={index >= paginatedProducts.length - 2 && paginatedProducts.length > 2}
                                  onOpenPriceHistory={() => handleOpenPriceHistory(product.backendId, product.name)}
                                  onOpenRecipeModal={() => setRecipeModalProduct({ id: product.backendId, name: product.name })}
                                  onArchive={() => handleArchiveClick(product.backendId)}
                                  onDelete={() => handleDeleteClick(product.backendId)}
                                  onRestore={() => handleRestoreClick(product.backendId)}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Product Card View */}
                <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
                  {paginatedProducts.map((product, index) => {
                    const isAvail = isProductAvailable(product);
                    return (
                      <div key={product.id} className="pt-3 first:pt-0">
                        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm space-y-3">
                          {/* Top Row: Thumbnail + Product Name + Badges */}
                          <div className="flex items-start gap-3">
                            <div 
                              className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 cursor-pointer border border-gray-200 flex items-center justify-center" 
                              onClick={() => product.image && setViewImageSource(product.image)}
                            >
                              {product.image ? (
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-gray-900 text-sm truncate" title={product.name}>
                                  {product.name}
                                </h4>
                                <div className="shrink-0 flex items-center">
                                  {canManageProducts && (
                                    <ProductMoreActionsDropdown
                                      product={product}
                                      viewMode={viewMode}
                                      openUpward={index >= paginatedProducts.length - 2 && paginatedProducts.length > 2}
                                      onOpenPriceHistory={() => handleOpenPriceHistory(product.backendId, product.name)}
                                      onOpenRecipeModal={() => setRecipeModalProduct({ id: product.backendId, name: product.name })}
                                      onArchive={() => handleArchiveClick(product.backendId)}
                                      onDelete={() => handleDeleteClick(product.backendId)}
                                      onRestore={() => handleRestoreClick(product.backendId)}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                  {product.category}
                                </span>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                  product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {product.isActive
                                    ? t('products.status_active_badge', 'Active')
                                    : t('products.status_inactive_badge', 'Inactive')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Middle Row: Price, Min Order & Availability */}
                          <div className="flex items-center justify-between border-t border-gray-50 pt-2 text-xs">
                            <div>
                              <span className="text-gray-500">Price: </span>
                              <span className="font-bold text-gray-900 text-sm">{formatRupiah(product.price)}</span>
                              <span className="text-gray-400 ml-1.5">(Min: {product.minimumOrder})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`text-xs ${isAvail ? 'text-green-500' : 'text-red-500'}`}>
                                {isAvail ? '🟢' : '🔴'}
                              </span>
                              <span className={`text-xs font-semibold ${isAvail ? 'text-green-700' : 'text-red-700'}`}>
                                {isAvail ? t('products.available', 'Available') : t('products.unavailable', 'Unavailable')}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setViewProductModal(product)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t('products.view_details', 'Details')}</span>
                            </button>
                            {canManageProducts && (
                              <button
                                type="button"
                                onClick={() => handleEditClick(product)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#f8eee5] py-1.5 text-xs font-semibold text-[#d85b30] hover:bg-[#f2dfce]"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>{t('products.edit_product', 'Edit')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {!isFetching && filteredProducts.length > 0 && (
              <PaginationControls
                currentPage={page}
                limit={pageSize}
                totalItems={filteredProducts.length}
                onPageChange={setPage}
                onLimitChange={setPageSize}
              />
            )}
          </div>
        </>
      )}

      {/* Modals & Overlays */}
      {archiveConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-[#4b2417]">Confirm Archive</h3>
            <p className="mb-6 text-sm text-gray-600">Are you sure you want to archive this product?</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchiveConfirmId(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmArchive}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-red-700">Permanent Delete</h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {recipeModalProduct && (
        <RecipeManagementModal
          productId={recipeModalProduct.id}
          productName={recipeModalProduct.name}
          onClose={() => {
            setRecipeModalProduct(null)
            fetchProducts()
          }}
        />
      )}

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChanged={fetchCategories}
      />

      {cropperSource && (
        <ImageCropper
          imageSrc={cropperSource}
          title={t('products.upload_image_title', 'Upload Product Photo')}
          cropShape="rect"
          aspectRatio={1}
          onCrop={handleCropConfirm}
          onCancel={() => {
            if (cropperSource) URL.revokeObjectURL(cropperSource)
            setCropperSource(null)
          }}
        />
      )}

      {viewImageSource && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setViewImageSource(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewImageSource(null)}
              className="absolute top-4 right-4 sm:-top-10 sm:right-0 text-white hover:text-gray-300"
              aria-label="Close Image"
            >
              <X className="h-8 w-8" />
            </button>
            <img src={viewImageSource} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL / VIEW MODAL */}
      {viewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900">
                  {viewProductModal.name}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f8eee5] text-[#d85b30] font-semibold">
                  {viewProductModal.category}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  viewProductModal.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {viewProductModal.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewProductModal(null)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto space-y-5">
              {/* Image & Key Specs */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden border border-[#ead8ca] bg-[#efe4d6]">
                  {viewProductModal.image ? (
                    <img
                      src={viewProductModal.image}
                      alt={viewProductModal.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 m-8 text-gray-400" />
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 text-xs">
                  <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                    <p className="text-gray-500 font-medium">Selling Price</p>
                    <p className="text-sm font-bold text-[#4b2417] mt-0.5">{formatRupiah(viewProductModal.price)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                    <p className="text-gray-500 font-medium">Estimated COGS</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{formatRupiah(viewProductModal.hppTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                    <p className="text-gray-500 font-medium">Stock Status</p>
                    <p className={`font-bold mt-0.5 ${viewProductModal.isInStock ? 'text-green-600' : 'text-red-500'}`}>
                      {viewProductModal.isInStock ? `In Stock (${viewProductModal.stockQuantity} pcs)` : 'Out of Stock'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                    <p className="text-gray-500 font-medium">Min. Order</p>
                    <p className="font-bold text-gray-800 mt-0.5">{viewProductModal.minimumOrder ?? 1} pcs</p>
                  </div>
                </div>
              </div>

              {/* Bilingual Descriptions */}
              <div className="space-y-3.5">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <span>Indonesian Description (ID)</span>
                    <span className="text-[10px] font-semibold text-[#d85b30] bg-[#f8eee5] px-1.5 py-0.5 rounded">Primary</span>
                  </h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {viewProductModal.descriptionId || viewProductModal.description || '-'}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <span>English Description (EN)</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Storefront EN</span>
                  </h4>
                  {viewProductModal.descriptionEn?.trim() ? (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {viewProductModal.descriptionEn}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Not provided (falls back to Indonesian description)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setViewProductModal(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewProductModal
                  setViewProductModal(null)
                  handleEditClick(target)
                }}
                className="rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] transition-colors"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICE HISTORY MODAL */}
      {priceHistoryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    Price History
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                    {priceHistoryProduct.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Historical selling price adjustments, COGS snapshots, and margins.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPriceHistoryProduct(null)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
              {isFetchingPriceHistory ? (
                <div className="space-y-3 animate-pulse py-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : priceHistoryError ? (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{priceHistoryError}</span>
                </div>
              ) : priceHistoryList.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">No price history available</p>
                  <p className="text-xs text-gray-500 mt-1">No historical price changes have been recorded for this product yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3 text-right">Previous Price</th>
                        <th className="p-3 text-right">New Price</th>
                        <th className="p-3 text-right">COGS Snapshot</th>
                        <th className="p-3 text-right">Margin</th>
                        <th className="p-3 text-center">Changed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {priceHistoryList.map((item) => {
                        const oldPrice = item.harga_jual_lama !== null && item.harga_jual_lama !== undefined ? Number(item.harga_jual_lama) : null;
                        const newPrice = Number(item.harga_jual_baru);
                        const hpp = Number(item.hpp_saat_itu);
                        const marginPercent = newPrice > 0 ? (((newPrice - hpp) / newPrice) * 100).toFixed(1) : '0';
                        const isBelowHpp = newPrice < hpp;

                        const dateFormatted = item.created_at
                          ? new Date(item.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-';

                        return (
                          <tr key={item.id} className="hover:bg-gray-50/60">
                            <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                              {dateFormatted}
                            </td>
                            <td className="p-3 text-right text-gray-500">
                              {oldPrice !== null ? formatRupiah(oldPrice) : <span className="text-gray-400 italic">Initial</span>}
                            </td>
                            <td className="p-3 text-right font-semibold text-gray-900">
                              {formatRupiah(newPrice)}
                            </td>
                            <td className="p-3 text-right text-gray-600">
                              {formatRupiah(hpp)}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isBelowHpp
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {marginPercent}%
                              </span>
                            </td>
                            <td className="p-3 text-center text-gray-500">
                              {item.changed_by || 'System'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setPriceHistoryProduct(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickAddStockModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSuccess={handleQuickAddSuccess}
      />

      <ConfirmationModal
        isOpen={showHppConfirmModal}
        title="Selling Price Below COGS"
        message={
          formData.harga_jual && formHpp > 0
            ? `Selling price ${formatRupiah(Number(formData.harga_jual))} is ${formatRupiah(formHpp - Number(formData.harga_jual))} below estimated COGS (${formatRupiah(formHpp)}) per product. Are you sure you want to proceed and save?`
            : 'The selling price is below the estimated COGS. Are you sure you want to proceed and save?'
        }
        confirmText="Save Anyway"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={async () => {
          setShowHppConfirmModal(false)
          await executeSaveProduct()
        }}
        onCancel={() => setShowHppConfirmModal(false)}
      />

    </div>
  )
}
