import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, AlertCircle, CheckCircle, Pencil, Trash2, FileText } from 'lucide-react'
import RecipeManagementModal from './RecipeManagementModal'
import { useAuth } from '@/hooks/useAuth'
import {
  getAllProducts,
  updateProduct,
  deleteProduct,
  formatRupiah,
  type SimpleProduct,
  createProductWithOptionalPrice,
  uploadProductImage
} from '@/services/productService'
import type { ProductCreate, ProductUpdate } from '@/api/product'

export default function SellerProductsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const role = user?.role

  const canManageProducts = role === 'admin' || role === 'owner' || user?.roleLevel === 1 || user?.roleLevel === 2

  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [isFetching, setIsFetching] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [editId, setEditId] = useState<number | null>(null)
  const [recipeModalProduct, setRecipeModalProduct] = useState<{id: number, name: string} | null>(null)


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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsFetching(true)
    try {
      const data = await getAllProducts()
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError(t('common.error'))
    } finally {
      setIsFetching(false)
    }
  }, [t])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleAddClick = () => {
    setEditId(null)
    
    setFormData(defaultFormState)
    setIsFormOpen(!isFormOpen)
    setError(null)
    setSuccess(null)
    setSelectedImage(null)
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const handleEditClick = (product: SimpleProduct) => {
    setEditId(product.backendId)
    
    setFormData({
      nama_produk: product.name,
      deskripsi: product.description || '',
      kategori: product.category,
      harga_jual: product.price,
      minimum_order: product.minimumOrder,
      is_active: product.isActive,
      is_available: product.isAvailable,
    })
    setSelectedImage(null)
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImagePreview(product.image || null)
    setIsFormOpen(true)
    setError(null)
    setSuccess(null)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = async (id: number) => {
    if (!canManageProducts) return

    if (window.confirm(t('products.confirm_delete'))) {
      try {
        await deleteProduct(id)
        setSuccess(t('products.success_delete'))
        fetchProducts()
      } catch (err) {
        console.error(err)
        setError(t('products.error_delete'))
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedImage(null)
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.')
      e.target.value = ''
      return
    }

    setError(null)
    setSelectedImage(file)
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!canManageProducts) {
      setError(t('products.unauthorized_add'))
      return
    }

    if (!formData.nama_produk.trim()) {
      setError(editId ? t('products.error_edit') : t('products.error_add'))
      return
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
        
        if (selectedImage) {
          try {
            await uploadProductImage(editId, selectedImage)
            setSuccess(t('products.success_edit'))
          } catch (imgErr) {
            console.error(imgErr)
            setError('Produk berhasil diperbarui, tetapi foto gagal di-upload. Silakan ulangi upload foto.')
          }
        } else {
          setSuccess(t('products.success_edit'))
        }
      } else {
        const createPayload: ProductCreate = {
          ...formData,
          // harga_jual is handled by createProductWithOptionalPrice if we pass it, but createPayload also accepts it.
          // Since createProductWithOptionalPrice calls createProductApi and then setPrice, passing harga_jual in payload is fine,
          // it will just be set on create and potentially updated.
          harga_jual,
          minimum_order,
        }
        
        // Use createProductWithOptionalPrice to ensure create + price set happens first,
        // so we can isolate image upload errors.
        const created = await createProductWithOptionalPrice(createPayload, harga_jual)
        isProductCreatedOrUpdated = true
        
        if (selectedImage) {
          try {
            await uploadProductImage(created.backendId, selectedImage)
            setSuccess(t('products.success_add'))
          } catch (imgErr) {
            console.error(imgErr)
            setError('Produk berhasil dibuat, tetapi foto gagal di-upload. Silakan tambahkan foto melalui Edit Product.')
          }
        } else {
          setSuccess(t('products.success_add'))
        }
      }
      
      if (!error && isProductCreatedOrUpdated) {
        setIsFormOpen(false)
        setFormData(defaultFormState)
        setEditId(null)
        
        setSelectedImage(null)
        if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
      }
      
      // Always refresh if product was created/updated, even if image upload failed
      if (isProductCreatedOrUpdated) {
        fetchProducts()
      }
      
    } catch (err) {
      console.error(err)
      // Only set error if product hasn't been created/updated yet.
      // If it was created but something else failed, the try-catch for image handles it.
      if (!isProductCreatedOrUpdated) {
        setError(editId ? t('products.error_edit') : t('products.error_add'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-[#4b2417]">{t('products.title')}</h1>
          <p className="mt-1 text-sm text-[#6f5448]">{t('products.subtitle')}</p>
        </div>
        {canManageProducts && (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
          >
            <Plus className="h-4 w-4" />
            {t('products.add_product')}
          </button>
        )}
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

      {isFormOpen && canManageProducts && (
        <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#4b2417]">
            {editId ? t('products.edit_product') : t('products.form_title')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  {t('products.name_label')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_produk"
                  required
                  disabled={!!editId} // BE says nama_produk is not updatable
                  value={formData.nama_produk}
                  onChange={handleInputChange}
                  placeholder={t('products.name_placeholder')}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  {t('products.desc_label')}
                </label>
                <textarea
                  name="deskripsi"
                  rows={3}
                  value={formData.deskripsi || ''}
                  onChange={handleInputChange}
                  placeholder={t('products.desc_placeholder')}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  {t('products.category_label')}
                </label>
                <select
                  name="kategori"
                  disabled={!!editId} // BE says kategori is not updatable
                  value={formData.kategori || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="Kue Basah">Kue Basah</option>
                  <option value="Kue Kering">Kue Kering</option>
                  <option value="Roti">Roti</option>
                  <option value="Minuman">Minuman</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  {t('products.price_label')}
                </label>
                <input
                  type="number"
                  name="harga_jual"
                  min="0"
                  value={formData.harga_jual || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-4 py-2.5 text-sm text-[#4b2417] outline-none transition focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  {t('products.min_order_label')}
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

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  {t('products.status_label')}
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
                    {formData.is_active ? t('products.status_active') : t('products.status_inactive')}
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Produk Tersedia
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
                    {formData.is_available ? 'Dapat Dipesan' : 'Tidak Tersedia'}
                  </label>
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#4b2417]">
                  Foto Produk
                </label>
                <div className="mt-2 flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#d0bfaf]">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#d0bfaf] bg-gray-50">
                      <span className="text-xs text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#f8eee5] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#d85b30] hover:file:bg-[#f0e0d0] focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Format JPG, PNG, WEBP. Maks 5MB. Opsional.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#ead8ca] pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditId(null)
                  
                  setFormData(defaultFormState)
                  setSelectedImage(null)
                  if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
                  setImagePreview(null)
                  setError(null)
                  setSuccess(null)
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6f5448] transition hover:bg-gray-100"
              >
                {t('products.cancel_button')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28] disabled:opacity-60"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? t('products.update_button') : t('products.save_button')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && (
        <div className="rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm overflow-hidden">
          <p className="text-sm text-[#6f5448] mb-4 font-semibold">{t('products.list_title')}</p>
          
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#d85b30]" />
              <p className="mt-4 text-sm text-[#8b7166]">{t('products.loading')}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d0bfaf] bg-gray-50 py-12">
              <p className="text-sm text-[#8b7166]">{t('products.empty_list')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#4b2417]">
                <thead className="bg-[#f8eee5] text-[#6f5448]">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-xl">{t('products.col_name')}</th>
                    <th className="px-4 py-3 font-semibold">{t('products.col_category')}</th>
                    <th className="px-4 py-3 font-semibold">{t('products.col_price')}</th>
                    <th className="px-4 py-3 font-semibold">{t('products.col_min_order')}</th>
                    <th className="px-4 py-3 font-semibold">{t('products.col_status')}</th>
                    <th className="px-4 py-3 font-semibold">Ketersediaan</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-xl text-center">{t('products.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ead8ca]">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-[#fcf8f5] transition-colors">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3">{product.category}</td>
                      <td className="px-4 py-3">{formatRupiah(product.price)}</td>
                      <td className="px-4 py-3">{product.minimumOrder}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? t('products.status_active') : t('products.status_inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {product.isAvailable ? (
                            <>
                              <span className="text-green-500 text-sm">🟢</span>
                              <span className="text-sm font-medium text-gray-700">Dapat Dipesan</span>
                            </>
                          ) : (
                            <>
                              <span className="text-red-500 text-sm">🔴</span>
                              <span className="text-sm font-medium text-gray-700">Tidak Tersedia</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canManageProducts && (
                            <>
                              <button
                                onClick={() => setRecipeModalProduct({id: product.backendId, name: product.name})}
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Kelola Resep"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditClick(product)}
                                className="rounded-lg p-2 text-[#d85b30] hover:bg-[#f8eee5] transition-colors"
                                title={t('products.edit_product')}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(product.backendId)}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
                                title={t('common.delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
    </div>
  )
}
