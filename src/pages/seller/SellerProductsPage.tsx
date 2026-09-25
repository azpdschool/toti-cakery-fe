import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2, AlertCircle, CheckCircle, Pencil, Trash2, FileText, Search, Filter, Archive, X, Eye, Image as ImageIcon, Box, Star } from 'lucide-react'
import RecipeManagementModal from './RecipeManagementModal'
import CategoryManagementModal from './CategoryManagementModal'
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
  archiveProduct
} from '@/services/productService'
import type { ProductCreate, ProductUpdate } from '@/api/product'
import { getBackendCategories, type CategoryResponse } from '@/api/product'
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

export default function SellerProductsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const role = user?.role

  const canManageProducts = role === 'admin' || role === 'owner' || user?.roleLevel === 1 || user?.roleLevel === 2

  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([])
  const [isFetching, setIsFetching] = useState(true)

  // View modes & filters
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active')
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
  const [archiveConfirmId, setArchiveConfirmId] = useState<number | null>(null)
  const [recipeModalProduct, setRecipeModalProduct] = useState<{id: number, name: string} | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

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

  const defaultFormState: ProductCreate = {
    nama_produk: '',
    deskripsi: '',
    kategori: 'Kue Basah',
    harga_jual: '',
    minimum_order: 1,
    is_active: true,
    is_available: true,
  }

  const [formData, setFormData] = useState<ProductCreate>(defaultFormState)


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

  // Reset page on filter/viewMode change
  useEffect(() => {
    setPage(1)
  }, [filters, viewMode, pageSize])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
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
        if (filters.availability === 'available' && !p.isAvailable) return false;
        if (filters.availability === 'unavailable' && p.isAvailable) return false;
      }
      if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.price > Number(filters.priceMax)) return false;
      if (filters.minOrderMin && (p.minimumOrder ?? 1) < Number(filters.minOrderMin)) return false;
      if (filters.minOrderMax && (p.minimumOrder ?? 1) > Number(filters.minOrderMax)) return false;

      return true;
    })
  }, [products, viewMode, debouncedSearch, filters])

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1

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
    setFormData({ ...defaultFormState, kategori: categories.length > 0 ? categories[0].name : 'Kue Basah' })
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
    setEditId(product.backendId)
    setFormData({
      nama_produk: product.name,
      deskripsi: product.description || '',
      kategori: product.category,
      harga_jual: product.price.toString(),
      minimum_order: product.minimumOrder,
      is_active: product.isActive,
      is_available: product.isAvailable,
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
      const [options, recipeSummary, freshProduct] = await Promise.all([
        getInventoryOptions().catch(() => []),
        getProductRecipes(product.backendId).catch((err) => {
          console.error('Failed to get product recipes:', err)
          return { bahan: [] }
        }),
        getProductByBackendId(product.backendId).catch(() => null),
      ])
      setInventoryOptions(options)
      if (freshProduct && freshProduct.images) {
        setExistingImages(freshProduct.images)
      }

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
      console.error('Gagal load detail recipe/product:', err)
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
    } catch (err) {
      console.error(err)
      toast.error('Failed to archive product.')
    } finally {
      setArchiveConfirmId(null)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file tidak boleh melebihi 5MB.')
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
      toast.success(t('products.image_primary_success', 'Foto utama berhasil diperbarui.'))
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error('Gagal memperbarui foto utama.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!editId) return
    if (existingImages.length + draftImages.length <= 1) {
      toast.error(t('products.cannot_delete_last_image', 'Tidak dapat menghapus foto terakhir. Tambahkan foto pengganti terlebih dahulu.'))
      return
    }
    try {
      setIsUploadingImage(true)
      await deleteProductImage(editId, imageId)
      const fresh = await getProductByBackendId(editId)
      setExistingImages(fresh.images)
      toast.success(t('products.image_removed_success', 'Foto berhasil dihapus.'))
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menghapus foto.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveDraftImage = (index: number) => {
    if (existingImages.length + draftImages.length <= 1) {
      toast.error(t('products.cannot_delete_last_image', 'Tidak dapat menghapus foto terakhir. Tambahkan foto pengganti terlebih dahulu.'))
      return
    }
    URL.revokeObjectURL(draftImages[index].previewUrl)
    setDraftImages((prev) => prev.filter((_, i) => i !== index))
    if (primaryDraftIndex >= draftImages.length - 1) {
      setPrimaryDraftIndex(0)
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
    if (!formData.nama_produk.trim()) {
      setError('Product name is required.')
      return
    }

    // Require at least 1 image (existing or newly uploaded)
    const totalImages = existingImages.length + draftImages.length
    if (totalImages === 0) {
      setError(t('products.at_least_one_image_required', 'Minimal 1 foto produk wajib ada.'))
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

    setIsLoading(true)
    let isProductCreatedOrUpdated = false
    try {
      const harga_jual = formData.harga_jual ? Number(formData.harga_jual) : null
      const minimum_order = formData.minimum_order ? Number(formData.minimum_order) : 1

      if (editId) {
        const updatePayload: ProductUpdate = {
          deskripsi: formData.deskripsi,
          harga_jual,
          minimum_order,
          is_active: formData.is_active,
          is_available: formData.is_available,
        }
        await updateProduct(editId, updatePayload)
        isProductCreatedOrUpdated = true

        // Delete removed recipes
        if (deletedRecipeIds.length > 0) {
          await Promise.all(
            deletedRecipeIds.map((recipeId) => deleteRecipeIngredient(editId, recipeId))
          )
        }

        // Update/Add recipe entries sequentially
        const validIngredients = ingredients.filter(
          (ingredient) => ingredient.inventoryId && ingredient.quantity > 0
        )
        for (const ingredient of validIngredients) {
          const recipePayload: RecipeCreate = {
            stock_item_id: Number(ingredient.inventoryId),
            jumlah_dibutuhkan: ingredient.quantity,
          }
          if (!ingredient.recipeId) {
            await addRecipeIngredient(editId, recipePayload)
          } else if (
            ingredient.originalInventoryId &&
            ingredient.originalInventoryId !== ingredient.inventoryId
          ) {
            await deleteRecipeIngredient(editId, ingredient.recipeId)
            await addRecipeIngredient(editId, recipePayload)
          } else {
            await updateRecipeIngredient(editId, ingredient.recipeId, {
              jumlah_dibutuhkan: ingredient.quantity,
            })
          }
        }

        if (draftImages.length > 0) {
          try {
            await uploadProductImages(
              editId,
              draftImages.map((d) => d.file),
              primaryDraftIndex
            )
            setSuccess('Product updated successfully.')
          } catch (imgErr) {
            console.error(imgErr)
            setError('Product updated, but image upload failed.')
          }
        } else {
          setSuccess('Product updated successfully.')
        }
      } else {
        const createPayload: ProductCreate = {
          ...formData,
          harga_jual,
          minimum_order,
        }

        const created = await createProductWithOptionalPrice(createPayload, harga_jual)
        isProductCreatedOrUpdated = true

        // Create recipe entries sequentially
        const recipePayloads: RecipeCreate[] = ingredients
          .filter((ingredient) => ingredient.inventoryId && ingredient.quantity > 0)
          .map((ingredient) => ({
            stock_item_id: Number(ingredient.inventoryId),
            jumlah_dibutuhkan: ingredient.quantity,
          }))
          .filter((ingredient) => Number.isFinite(ingredient.stock_item_id))

        if (recipePayloads.length > 0) {
          for (const payload of recipePayloads) {
            await addRecipeIngredient(created.backendId, payload)
          }
        }

        if (draftImages.length > 0) {
          try {
            await uploadProductImages(
              created.backendId,
              draftImages.map((d) => d.file),
              primaryDraftIndex
            )
            setSuccess('Product added successfully.')
          } catch (imgErr) {
            console.error(imgErr)
            setError('Product created, but image upload failed.')
          }
        } else {
          setSuccess('Product added successfully.')
        }
      }

      if (!error && isProductCreatedOrUpdated) {
        setIsFormOpen(false)
        setFormData(defaultFormState)
        setEditId(null)
        setIngredients([])
        setDeletedRecipeIds([])
        setExistingImages([])
        draftImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
        setDraftImages([])
      }

      if (isProductCreatedOrUpdated) {
        fetchProducts()
      }
    } catch (err) {
      console.error(err)
      if (!isProductCreatedOrUpdated) {
        setError('Failed to save product.')
      } else {
        setError('Failed saving product recipes/ingredients.')
      }
    } finally {
      setIsLoading(false)
    }
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-[#4b2417]">Products</h1>
          <p className="mt-1 text-sm text-[#6f5448]">Manage your products, pricing, availability, and recipes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canManageProducts && (
            <>
              <button
                onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  viewMode === 'archived' 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Archive className="h-4 w-4" />
                {viewMode === 'active' ? 'Manage Archive' : 'Back to Active'}
              </button>
              
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#f0e0d0] px-4 py-2 text-sm font-semibold text-[#d85b30] transition hover:bg-[#e6d0bb]"
              >
                <Box className="h-4 w-4" />
                Manage Categories
              </button>
              
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Add / Edit Form */}
      {isFormOpen && canManageProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
              <h2 className="text-2xl font-black text-[#4b2417]">
                {editId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditId(null)
                  setFormData(defaultFormState)
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
            <div className="overflow-y-auto p-6 space-y-4">
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

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Description <span className="text-red-500">(Optional)</span>
                </label>
                <textarea
                  name="deskripsi"
                  rows={3}
                  value={formData.deskripsi || ''}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Category <span className="text-red-500">(Optional)</span>
                </label>
                <select
                  name="kategori"
                  disabled={!!editId}
                  value={formData.kategori || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {categories.length === 0 && <option value="Kue Basah">Kue Basah</option>}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Price <span className="text-red-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="harga_jual"
                  min="0"
                  value={formData.harga_jual || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Minimum Order <span className="text-red-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="minimum_order"
                  min="1"
                  value={formData.minimum_order || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              {/* Status and Availability side-by-side */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#ead8ca] pt-4 mt-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-[#d0bfaf] text-[#d85b30] focus:ring-[#c95b31]"
                    />
                    <label htmlFor="is_active" className="text-sm text-[#4b2417]">
                      {formData.is_active ? 'Active' : 'Archived'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                    Availability <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_available"
                      id="is_available"
                      checked={formData.is_available ?? true}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-[#d0bfaf] text-[#d85b30] focus:ring-[#c95b31]"
                    />
                    <label htmlFor="is_available" className="text-sm text-[#4b2417]">
                      {formData.is_available ? 'Available' : 'Unavailable'}
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Recipe / Ingredients Section */}
              <div className="sm:col-span-2 border-t border-[#ead8ca] pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#4b2417]">
                    Recipe & Ingredients
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
                  <table className="w-full text-sm">
                    <thead className="bg-[#f8eee5] text-[#6f5448]">
                      <tr className="text-left text-xs font-semibold uppercase">
                        <th className="py-2.5 px-3">Ingredient Name</th>
                        <th className="py-2.5 px-3 w-32">Quantity Used</th>
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
                                {inventoryOptions.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.name} - Stock: {opt.stock} {opt.unit}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ingredient.quantity || ""}
                                onChange={(e) =>
                                  handleIngredientQuantityChange(
                                    idx,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full rounded-lg border border-[#d0bfaf] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#d85b30]"
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

                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#d85b30] hover:text-[#c04e28] transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Ingredient
                </button>
              </div>

              <div className="sm:col-span-2 border-t border-[#ead8ca] pt-4 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-[#4b2417]">
                    {t('products.product_images', 'Foto Produk')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-[#8b7166]">
                    {t('products.at_least_one_image_required', 'Minimal 1 foto produk wajib ada.')}
                  </span>
                </div>

                <p className="mb-3 text-xs text-[#6f5448]">
                  Format JPG, PNG, WEBP. Maks 5MB per file. Foto dengan tanda Foto Utama akan dijadikan tampilan utama produk.
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
                          {t('products.primary_image', 'Foto Utama')}
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
                            title={t('products.remove_image', 'Hapus Foto')}
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
                            {t('products.set_primary', 'Jadikan Utama')}
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
                          {t('products.primary_image', 'Foto Utama')}
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
                            title={t('products.remove_image', 'Hapus Foto')}
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
                            {t('products.set_primary', 'Jadikan Utama')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  <label className="flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d0bfaf] bg-[#f8eee5] text-[#d85b30] hover:bg-[#f0e0d0] transition">
                    <Plus className="h-6 w-6" />
                    <span className="mt-1 text-xs font-semibold">{t('products.add_image', 'Tambah Foto')}</span>
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
            <div className="flex justify-end gap-3 border-t border-gray-200 p-6 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditId(null)
                  setFormData(defaultFormState)
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
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-60"
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
          <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>
            <div className="relative w-full sm:w-auto flex justify-end">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#d0bfaf] bg-white px-4 py-2 text-sm font-semibold text-[#4b2417] hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#ead8ca] bg-white p-4 shadow-xl z-10">
                  <h3 className="mb-3 text-sm font-bold text-[#4b2417]">Filter Products</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Category</label>
                      <select 
                        value={filters.category}
                        onChange={e => setFilters({...filters, category: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                      >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Min Price</label>
                        <input 
                          type="number"
                          placeholder="Min"
                          value={filters.priceMin}
                          onChange={e => setFilters({...filters, priceMin: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Max Price</label>
                        <input 
                          type="number"
                          placeholder="Max"
                          value={filters.priceMax}
                          onChange={e => setFilters({...filters, priceMax: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Min Order (Min)</label>
                        <input 
                          type="number"
                          placeholder="Min"
                          value={filters.minOrderMin}
                          onChange={e => setFilters({...filters, minOrderMin: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Min Order (Max)</label>
                        <input 
                          type="number"
                          placeholder="Max"
                          value={filters.minOrderMax}
                          onChange={e => setFilters({...filters, minOrderMax: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                        />
                      </div>
                    </div>

                    {viewMode === 'active' && (
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
                        <select 
                          value={filters.status}
                          onChange={e => setFilters({...filters, status: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                        >
                          <option value="">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="inactive">Archived</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">Availability</label>
                      <select 
                        value={filters.availability}
                        onChange={e => setFilters({...filters, availability: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#c95b31]"
                      >
                        <option value="">All</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button 
                        onClick={clearFilters}
                        className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                      >
                        Clear All
                      </button>
                      <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-[#d85b30] hover:bg-[#c04e28] transition"
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
              <div className="overflow-x-auto w-full max-w-full">
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
                    {paginatedProducts.map((product) => (
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
                            product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Archived'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm ${product.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                              {product.isAvailable ? '🟢' : '🔴'}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {product.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canManageProducts && (
                              <>
                                <button
                                  onClick={() => setRecipeModalProduct({id: product.backendId, name: product.name})}
                                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Recipe"
                                  aria-label="Manage Recipe"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(product)}
                                  className="rounded-lg p-2 text-[#d85b30] hover:bg-[#f8eee5] transition-colors"
                                  title="Edit Product"
                                  aria-label="Edit Product"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                {viewMode === 'active' && product.isActive && (
                                  <button
                                    onClick={() => handleArchiveClick(product.backendId)}
                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
                                    title="Archive Product"
                                    aria-label="Archive Product"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isFetching && filteredProducts.length > 0 && (
              <div className="border-t border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-b-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="rounded border border-gray-300 p-1 outline-none focus:border-[#d85b30]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    &larr; Previous
                  </button>
                  <span className="px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
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
                onClick={() => setArchiveConfirmId(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Archive
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
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              aria-label="Close Image"
            >
              <X className="h-8 w-8" />
            </button>
            <img src={viewImageSource} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

    </div>
  )
}
