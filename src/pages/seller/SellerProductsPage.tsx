import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, AlertCircle, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  formatRupiah,
  type SimpleProduct
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

  const defaultFormState: ProductCreate = {
    nama_produk: '',
    deskripsi: '',
    kategori: 'Kue Basah',
    harga_jual: '',
    minimum_order: 1,
    is_active: true,
  }

  const [formData, setFormData] = useState<ProductCreate>(defaultFormState)

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
    })
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
    try {
      const harga_jual = formData.harga_jual ? Number(formData.harga_jual) : null
      const minimum_order = formData.minimum_order ? Number(formData.minimum_order) : 1

      if (editId) {
        const updatePayload: ProductUpdate = {
          deskripsi: formData.deskripsi,
          harga_jual,
          minimum_order,
          is_active: formData.is_active,
        }
        await updateProduct(editId, updatePayload)
        setSuccess(t('products.success_edit'))
      } else {
        const createPayload: ProductCreate = {
          ...formData,
          harga_jual,
          minimum_order,
        }
        await createProduct(createPayload)
        setSuccess(t('products.success_add'))
      }
      
      setIsFormOpen(false)
      setFormData(defaultFormState)
      setEditId(null)
      fetchProducts()
    } catch (err) {
      console.error(err)
      setError(editId ? t('products.error_edit') : t('products.error_add'))
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
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#ead8ca] pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
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
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canManageProducts && (
                            <>
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
    </div>
  )
}
