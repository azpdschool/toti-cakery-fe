// src/pages/seller/SellerProductsPage.tsx

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  createProductWithOptionalPrice,
  getActiveProducts,
  getArchivedProducts,
  getCategories,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  updateProduct,
  updateProductPrice,
  uploadProductImage,
  formatRupiah,
  type SimpleProduct,
  type ArchivedProduct,
} from '@/services/productService';
import {
  getProductRecipes,
  addRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
  type RecipeCreate,
} from '@/api/recipe';
import { getInventoryOptions } from '@/services/sellerInventoryService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';

// ============================================================
// TYPES
// ============================================================

type ProductWithStatus = SimpleProduct;
type ProductsTab = 'active' | 'archived';

interface InventoryOption {
  id: string;
  name: string;
  brand: string;
  unit: string;
  stock: number;
}

interface AddProductIngredient {
  inventoryId: string;
  name: string;
  quantity: number;
  unit: string;
}

interface AddProductFormPayload {
  name: string;
  category: string;
  description: string;
  price: number;
  status: 'active' | 'inactive';
  ingredients: AddProductIngredient[];
  imageFile: File | null;
}

interface EditProductIngredient extends AddProductIngredient {
  recipeId?: number;
  originalInventoryId?: string;
}

interface EditProductPayload {
  name: string;
  description: string;
  price: number;
  ingredients: EditProductIngredient[];
  deletedRecipeIds: number[];
  imageFile: File | null;
}

// ============================================================
// HELPERS
// ============================================================

function parseAxiosError(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as any;
    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail.map((item: any) => item.msg || JSON.stringify(item)).join('\n');
    }

    if (typeof detail === 'string') {
      return detail;
    }

    if (err.response?.data?.message) {
      return err.response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return 'Format gambar harus JPG, PNG, atau WEBP.';
  }

  if (file.size > 5 * 1024 * 1024) {
    return 'Ukuran gambar maksimal 5MB.';
  }

  return null;
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="relative rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-[#6f5448]">{subtitle}</span>
      </div>
      <p className="mt-2 text-3xl font-black text-[#4b2417]">{value}</p>
      <p className="text-sm text-[#6f5448]">{title}</p>
    </div>
  );
}

// ============================================================
// ADD PRODUCT MODAL
// ============================================================

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSave: (product: AddProductFormPayload) => Promise<void>;
}

function AddProductModal({ isOpen, onClose, categories, onSave }: AddProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || '',
    description: '',
    price: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [ingredients, setIngredients] = useState<AddProductIngredient[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        const options = await getInventoryOptions();
        setInventoryOptions(options);
      } catch (err) {
        console.error('Gagal load inventory options:', err);
      }
    }

    if (isOpen) {
      void loadInventory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !formData.category && categories[0]) {
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories, formData.category, isOpen]);

  if (!isOpen) return null;

  const stockPreview = ingredients
    .map((ingredient) => {
      const option = inventoryOptions.find((opt) => opt.id === ingredient.inventoryId);

      if (!option) return null;

      return {
        name: option.name,
        stock: option.stock,
        unit: option.unit,
      };
    })
    .filter((item): item is { name: string; stock: number; unit: string } => Boolean(item));

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        inventoryId: '',
        name: '',
        quantity: 0,
        unit: '',
      },
    ]);
  };

  const handleSelectIngredient = (index: number, inventoryId: string) => {
    const selected = inventoryOptions.find((opt) => opt.id === inventoryId);

    setIngredients((prev) => {
      const updated = [...prev];

      if (!selected) {
        updated[index] = {
          ...updated[index],
          inventoryId: '',
          name: '',
          unit: '',
        };

        return updated;
      }

      updated[index] = {
        ...updated[index],
        inventoryId: selected.id,
        name: selected.name,
        unit: selected.unit,
      };

      return updated;
    });
  };

  const handleIngredientQuantityChange = (index: number, quantity: number) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity,
      };
      return updated;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);

    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || '',
      description: '',
      price: '',
      status: 'active',
    });
    setIngredients([]);
    setImagePreview(null);
    setImageFile(null);

    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Nama produk wajib diisi');
    if (!formData.category) errors.push('Kategori wajib dipilih');
    if (!formData.description.trim()) errors.push('Deskripsi wajib diisi');

    const rawPrice = formData.price.replace(/\D/g, '');
    const priceNum = parseInt(rawPrice, 10);

    if (!rawPrice || !Number.isFinite(priceNum) || priceNum <= 0) {
      errors.push('Harga jual harus lebih dari 0');
    }

    const usedIngredients = ingredients.filter(
      (ingredient) => ingredient.inventoryId || ingredient.name || ingredient.quantity > 0
    );

    const invalidIngredients = usedIngredients.filter(
      (ingredient) => !ingredient.inventoryId || ingredient.quantity <= 0
    );

    if (invalidIngredients.length > 0) {
      errors.push('Setiap bahan resep harus punya nama bahan dan jumlah dipakai lebih dari 0');
    }

    const duplicateSet = new Set<string>();
    for (const ingredient of usedIngredients) {
      if (!ingredient.inventoryId) continue;

      if (duplicateSet.has(ingredient.inventoryId)) {
        errors.push(`Bahan "${ingredient.name}" duplikat di resep.`);
        break;
      }

      duplicateSet.add(ingredient.inventoryId);
    }

    if (errors.length > 0) {
      alert('❌ ' + errors.join('\n'));
      return;
    }

    setSubmitting(true);

    try {
      await onSave({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: priceNum,
        status: formData.status,
        ingredients: ingredients.filter(
          (ingredient) => ingredient.inventoryId && ingredient.quantity > 0
        ),
        imageFile,
      });

      resetForm();
      onClose();
    } catch (err) {
      console.error('Submit tambah produk error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">Tambah Produk</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
              Informasi Produk
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Red velvet cupcake"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                >
                  {categories.length === 0 ? (
                    <option value="">Belum ada kategori</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Deskripsi produk..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Rp 40.000"
                  value={formData.price}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const formatted = raw ? `Rp ${Number(raw).toLocaleString('id-ID')}` : '';
                    setFormData({ ...formData, price: formatted });
                  }}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Status & Visibilitas
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                    />
                    Aktif
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={formData.status === 'inactive'}
                      onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    />
                    Nonaktif
                  </label>
                </div>
                <p className="mt-1 text-xs text-[#6f5448]">Tampilkan di web dan chatbot</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
              Resep & Komposisi Bahan
            </h3>
            <p className="mb-3 text-xs text-[#6f5448]">
              FE hanya mengirim bahan dan jumlah dipakai. Harga bahan dan HPP dihitung otomatis oleh backend.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                    <th className="pb-2 pr-4">Nama Bahan</th>
                    <th className="pb-2 pr-4">Jumlah Dipakai</th>
                    <th className="pb-2 pr-4">Satuan</th>
                    <th className="pb-2">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-[#6f5448]">
                        Belum ada bahan. Tambahkan bahan dari inventory jika diperlukan.
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((ingredient, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 pr-4">
                          <select
                            value={ingredient.inventoryId}
                            onChange={(e) => handleSelectIngredient(idx, e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                          >
                            <option value="">Pilih bahan...</option>
                            {inventoryOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({opt.brand}) - Stok: {opt.stock} {opt.unit}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingredient.quantity}
                            onChange={(e) =>
                              handleIngredientQuantityChange(
                                idx,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                          />
                        </td>

                        <td className="py-2 pr-4">
                          <input
                            type="text"
                            value={ingredient.unit}
                            readOnly
                            className="w-20 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-600"
                          />
                        </td>

                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-red-500 hover:text-red-700"
                            title="Hapus bahan"
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
              className="mt-2 text-sm font-semibold text-[#d85b30] hover:text-[#c04e28]"
            >
              + Tambah bahan
            </button>

            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-bold text-[#4b2417]">
                HPP otomatis dari backend
              </h4>
              <div className="mt-2 space-y-1 text-xs text-[#6f5448]">
                {ingredients.length === 0 ? (
                  <div>HPP akan dihitung backend setelah resep disimpan.</div>
                ) : (
                  ingredients.map((ingredient, idx) => (
                    <div key={idx}>
                      {ingredient.name || 'Bahan'} dipakai {ingredient.quantity} {ingredient.unit}
                    </div>
                  ))
                )}
                <div className="mt-2 font-semibold text-[#4b2417]">
                  HPP dihitung dari harga bahan di inventory × jumlah dipakai.
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
              Upload Gambar
            </h3>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#d0bfaf] bg-gray-50">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="h-8 w-8 text-[#8b7166]" />
                )}
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#d85b30] px-4 py-2 text-sm font-semibold text-[#d85b30] hover:bg-[#d85b30]/5">
                  <Upload className="h-4 w-4" />
                  Pilih Gambar
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>

                <p className="mt-1 text-xs text-[#8b7166]">
                  JPG, PNG, WEBP maksimal 5MB. Gambar di-upload ke backend setelah produk dibuat.
                </p>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-1 text-xs text-red-500 hover:text-red-700"
                  >
                    Hapus gambar
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
              Preview stok bahan dipilih
            </h3>

            <div className="rounded-lg bg-gray-50 p-4">
              {stockPreview.length === 0 ? (
                <p className="text-sm text-[#6f5448]">
                  Belum ada bahan inventory yang dipilih.
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-[#4b2417]">
                  {stockPreview.map((item) => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-medium">
                        {item.stock.toLocaleString('id-ID')} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// EDIT PRODUCT MODAL
// ============================================================

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithStatus | null;
  onSave: (backendId: number, payload: EditProductPayload) => Promise<void>;
}

function EditProductModal({ isOpen, onClose, product, onSave }: EditProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');

  const [ingredients, setIngredients] = useState<EditProductIngredient[]>([]);
  const [deletedRecipeIds, setDeletedRecipeIds] = useState<number[]>([]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadEditData() {
      if (!isOpen || !product) return;

      setLoadingDetail(true);

      try {
        setName(product.name);
        setDescription(product.description || '');
        setPriceInput(product.price ? `Rp ${product.price.toLocaleString('id-ID')}` : '');

        setImagePreview(product.image || null);
        setImageFile(null);
        setDeletedRecipeIds([]);

        const [options, recipeSummary] = await Promise.all([
          getInventoryOptions(),
          getProductRecipes(product.backendId),
        ]);

        setInventoryOptions(options);

        const mappedIngredients: EditProductIngredient[] = recipeSummary.bahan.map((recipe) => ({
          recipeId: recipe.id,
          originalInventoryId: String(recipe.stock_item_id),
          inventoryId: String(recipe.stock_item_id),
          name: recipe.nama_bahan || '',
          quantity: Number(recipe.jumlah_dibutuhkan) || 0,
          unit: recipe.satuan || '',
        }));

        setIngredients(mappedIngredients);
      } catch (err) {
        console.error('Gagal load detail edit produk:', err);
        alert('Gagal memuat detail produk/resep.');
      } finally {
        setLoadingDetail(false);
      }
    }

    void loadEditData();
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const hpp = product.hppTotal ?? 0;
  const rawPrice = parseInt(priceInput.replace(/\D/g, ''), 10) || 0;
  const currentMarginPercent = hpp > 0 ? ((rawPrice - hpp) / hpp) * 100 : null;
  const isBelowHpp = hpp > 0 && rawPrice > 0 && rawPrice < hpp;

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        inventoryId: '',
        name: '',
        quantity: 0,
        unit: '',
      },
    ]);
  };

  const handleSelectIngredient = (index: number, inventoryId: string) => {
    const selected = inventoryOptions.find((opt) => opt.id === inventoryId);

    setIngredients((prev) => {
      const updated = [...prev];

      if (!selected) {
        updated[index] = {
          ...updated[index],
          inventoryId: '',
          name: '',
          unit: '',
        };

        return updated;
      }

      updated[index] = {
        ...updated[index],
        inventoryId: selected.id,
        name: selected.name,
        unit: selected.unit,
      };

      return updated;
    });
  };

  const handleIngredientQuantityChange = (index: number, quantity: number) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity,
      };
      return updated;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const target = ingredients[index];

    if (target?.recipeId) {
      setDeletedRecipeIds((prev) => [...prev, target.recipeId as number]);
    }

    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelNewImage = () => {
    setImageFile(null);
    setImagePreview(product.image || null);

    const input = document.getElementById('edit-image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];

    if (!name.trim()) errors.push('Nama produk wajib diisi');
    if (!rawPrice || rawPrice <= 0) errors.push('Harga jual harus lebih dari 0');

    const usedIngredients = ingredients.filter(
      (ingredient) => ingredient.inventoryId || ingredient.name || ingredient.quantity > 0
    );

    const invalidIngredients = usedIngredients.filter(
      (ingredient) => !ingredient.inventoryId || ingredient.quantity <= 0
    );

    if (invalidIngredients.length > 0) {
      errors.push('Setiap bahan resep harus punya nama bahan dan jumlah dipakai lebih dari 0');
    }

    const duplicateSet = new Set<string>();
    for (const ingredient of usedIngredients) {
      if (!ingredient.inventoryId) continue;

      if (duplicateSet.has(ingredient.inventoryId)) {
        errors.push(`Bahan "${ingredient.name}" duplikat di resep.`);
        break;
      }

      duplicateSet.add(ingredient.inventoryId);
    }

    if (errors.length > 0) {
      alert('❌ ' + errors.join('\n'));
      return;
    }

    setSubmitting(true);

    try {
      await onSave(product.backendId, {
        name: name.trim(),
        description: description.trim(),
        price: rawPrice,
        ingredients: ingredients.filter(
          (ingredient) => ingredient.inventoryId && ingredient.quantity > 0
        ),
        deletedRecipeIds,
        imageFile,
      });

      onClose();
    } catch (err) {
      console.error('Gagal update produk:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">Edit Produk</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {loadingDetail ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                Informasi Produk
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#4b2417]">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4b2417]">Kategori</label>
                  <input
                    type="text"
                    value={product.category || '-'}
                    disabled
                    readOnly
                    className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-500"
                  />
                  <p className="mt-1 text-xs text-[#8b7166]">
                    Kategori tidak bisa diubah.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-[#4b2417]">Deskripsi</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                />
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                Harga & HPP
              </h3>

              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#6f5448]">HPP otomatis dari backend</span>
                  <span className="font-semibold text-[#4b2417]">{formatRupiah(hpp)}</span>
                </div>
                <p className="mt-2 text-xs text-[#8b7166]">
                  HPP dihitung otomatis dari recipe dan harga bahan di stock. FE tidak mengirim atau mengubah HPP.
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Rp 40.000"
                  value={priceInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const formatted = raw ? `Rp ${Number(raw).toLocaleString('id-ID')}` : '';
                    setPriceInput(formatted);
                  }}
                  className={`mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none ${
                    isBelowHpp
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#d0bfaf] focus:border-[#d85b30]'
                  }`}
                />

                {isBelowHpp && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Harga di bawah HPP ({formatRupiah(hpp)}) — produk ini rugi kalau terjual.
                  </p>
                )}

                {!isBelowHpp && currentMarginPercent !== null && (
                  <p className="mt-1 text-xs text-green-700">
                    Margin saat ini {currentMarginPercent.toFixed(1)}%.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                Resep & Komposisi Bahan
              </h3>
              <p className="mb-3 text-xs text-[#6f5448]">
                Ubah bahan atau jumlah dipakai. Harga bahan dan HPP tetap dihitung otomatis oleh backend.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                      <th className="pb-2 pr-4">Nama Bahan</th>
                      <th className="pb-2 pr-4">Jumlah Dipakai</th>
                      <th className="pb-2 pr-4">Satuan</th>
                      <th className="pb-2">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ingredients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-xs text-[#6f5448]">
                          Belum ada bahan.
                        </td>
                      </tr>
                    ) : (
                      ingredients.map((ingredient, idx) => (
                        <tr key={ingredient.recipeId ?? `new-${idx}`} className="border-b border-gray-100">
                          <td className="py-2 pr-4">
                            <select
                              value={ingredient.inventoryId}
                              onChange={(e) => handleSelectIngredient(idx, e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                            >
                              <option value="">Pilih bahan...</option>
                              {inventoryOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name} ({opt.brand}) - Stok: {opt.stock} {opt.unit}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ingredient.quantity}
                              onChange={(e) =>
                                handleIngredientQuantityChange(
                                  idx,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                            />
                          </td>

                          <td className="py-2 pr-4">
                            <input
                              type="text"
                              value={ingredient.unit}
                              readOnly
                              className="w-20 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-600"
                            />
                          </td>

                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-red-500 hover:text-red-700"
                              title="Hapus bahan dari resep"
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
                className="mt-2 text-sm font-semibold text-[#d85b30] hover:text-[#c04e28]"
              >
                + Tambah bahan
              </button>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#6f5448]">
                Gambar Produk
              </h3>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#d0bfaf] bg-gray-50">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview produk" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-[#8b7166]" />
                  )}
                </div>

                <div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#d85b30] px-4 py-2 text-sm font-semibold text-[#d85b30] hover:bg-[#d85b30]/5">
                    <Upload className="h-4 w-4" />
                    Pilih Gambar Baru
                    <input
                      id="edit-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>

                  <p className="mt-1 text-xs text-[#8b7166]">
                    JPG, PNG, WEBP maksimal 5MB. Gambar baru akan menggantikan gambar lama.
                  </p>

                  {imageFile && (
                    <button
                      type="button"
                      onClick={handleCancelNewImage}
                      className="mt-1 text-xs text-red-500 hover:text-red-700"
                    >
                      Batalkan gambar baru
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SellerProductsPage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const canManageProducts = hasPermission(userRole, 'manage_products');
  const canDelete = hasPermission(userRole, 'delete_products');

  const [activeTab, setActiveTab] = useState<ProductsTab>('active');

  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStatus | null>(null);

  const loadData = async () => {
    setError(null);

    try {
      const [activeData, archivedData, categoriesData] = await Promise.all([
        getActiveProducts(),
        getArchivedProducts(),
        getCategories(),
      ]);

      setProducts(activeData);
      setArchivedProducts(archivedData);
      setCategories(['Semua Kategori', ...categoriesData.map((c) => c.category)]);
    } catch (err) {
      console.error('Gagal memuat produk:', err);
      setError(parseAxiosError(err, 'Gagal memuat produk'));
    }
  };

  const refreshProducts = async () => {
    try {
      const [refreshedActive, refreshedArchived, refreshedCategories] = await Promise.all([
        getActiveProducts(),
        getArchivedProducts(),
        getCategories(),
      ]);

      setProducts(refreshedActive);
      setArchivedProducts(refreshedArchived);
      setCategories(['Semua Kategori', ...refreshedCategories.map((c) => c.category)]);
    } catch (err) {
      console.error('Gagal me-refresh produk:', err);
      setError(parseAxiosError(err, 'Gagal memuat ulang produk'));
    }
  };

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      await loadData();
      setLoading(false);
    }

    void initialLoad();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterCategory]);

  const sourceList = activeTab === 'active' ? products : archivedProducts;

  const filteredProducts = useMemo(() => {
    let result = sourceList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== 'Semua Kategori') {
      result = result.filter((p) => p.category === filterCategory);
    }

    return result;
  }, [sourceList, searchQuery, filterCategory]);

  const totalActiveProducts = products.length;
  const totalArchivedProducts = archivedProducts.length;
  const lowStockProducts = products.filter((p) => p.stock < 10).length;
  const totalCategories = Math.max(categories.length - 1, 0);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSaveProduct = async (newProduct: AddProductFormPayload): Promise<void> => {
    try {
      setError(null);

      const created = await createProductWithOptionalPrice(
        {
          nama_produk: newProduct.name,
          deskripsi: newProduct.description || null,
          kategori: newProduct.category || null,
          is_active: newProduct.status === 'active',
        },
        newProduct.price
      );

      const recipePayloads: RecipeCreate[] = newProduct.ingredients
        .filter((ingredient) => ingredient.inventoryId && ingredient.quantity > 0)
        .map((ingredient) => ({
          stock_item_id: Number(ingredient.inventoryId),
          jumlah_dibutuhkan: ingredient.quantity,
        }))
        .filter((ingredient) => Number.isFinite(ingredient.stock_item_id));

      if (recipePayloads.length > 0) {
        await Promise.all(
          recipePayloads.map((payload) => addRecipeIngredient(created.backendId, payload))
        );
      }

      if (newProduct.imageFile) {
        await uploadProductImage(created.backendId, newProduct.imageFile);
      }

      await refreshProducts();

      setSearchQuery('');
      setFilterCategory('Semua Kategori');
      setActiveTab('active');
      setCurrentPage(1);

      alert('✅ Produk berhasil ditambahkan!');
    } catch (err) {
      const message = parseAxiosError(err, 'Gagal menambahkan produk');

      console.error('Gagal tambah produk:', err);
      setError(message);
      alert(`❌ ${message}`);

      throw err;
    }
  };

  const handleViewProduct = (product: ProductWithStatus | ArchivedProduct) => {
    const isArchived = 'daysUntilPermanentDelete' in product;

    alert(
      [
        `Nama: ${product.name}`,
        `Kategori: ${product.category || '-'}`,
        `Harga Jual: ${formatRupiah(product.price)}`,
        `HPP: ${formatRupiah(product.hppTotal)}`,
        `Status: ${product.status === 'active' ? 'Aktif' : 'Diarsipkan'}`,
        `Available: ${product.isAvailable ? 'Ya' : 'Tidak'}`,
        ...(isArchived
          ? [
              `Sisa waktu sebelum dihapus permanen: ${
                (product as ArchivedProduct).daysUntilPermanentDelete
              } hari`,
            ]
          : []),
        '',
        product.description || 'Tidak ada deskripsi.',
      ].join('\n')
    );
  };

  const handleEditProduct = (product: ProductWithStatus) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (
    backendId: number,
    payload: EditProductPayload
  ) => {
    try {
      setError(null);

      /**
       * Kategori sengaja tidak dikirim.
       * HPP juga tidak dikirim karena dihitung otomatis oleh backend.
       */
      await updateProduct(backendId, {
        nama_produk: payload.name,
        deskripsi: payload.description || null,
      });

      await updateProductPrice(backendId, payload.price);

      /**
       * Hapus recipe yang user hapus dari modal.
       */
      if (payload.deletedRecipeIds.length > 0) {
        await Promise.all(
          payload.deletedRecipeIds.map((recipeId) =>
            deleteRecipeIngredient(backendId, recipeId)
          )
        );
      }

      /**
       * Update recipe:
       * - Recipe baru: POST
       * - Recipe lama quantity berubah: PUT
       * - Recipe lama bahan berubah: DELETE lama lalu POST baru
       *
       * Karena BE RecipeUpdate hanya support jumlah_dibutuhkan,
       * bukan update stock_item_id.
       */
      const validIngredients = payload.ingredients.filter(
        (ingredient) => ingredient.inventoryId && ingredient.quantity > 0
      );

      await Promise.all(
        validIngredients.map(async (ingredient) => {
          const recipePayload: RecipeCreate = {
            stock_item_id: Number(ingredient.inventoryId),
            jumlah_dibutuhkan: ingredient.quantity,
          };

          if (!ingredient.recipeId) {
            return addRecipeIngredient(backendId, recipePayload);
          }

          if (
            ingredient.originalInventoryId &&
            ingredient.originalInventoryId !== ingredient.inventoryId
          ) {
            await deleteRecipeIngredient(backendId, ingredient.recipeId);
            return addRecipeIngredient(backendId, recipePayload);
          }

          return updateRecipeIngredient(backendId, ingredient.recipeId, {
            jumlah_dibutuhkan: ingredient.quantity,
          });
        })
      );

      if (payload.imageFile) {
        await uploadProductImage(backendId, payload.imageFile);
      }

      await refreshProducts();

      alert('✅ Produk berhasil diperbarui.');
    } catch (err) {
      const message = parseAxiosError(err, 'Gagal memperbarui produk.');

      console.error('Gagal update produk:', err);
      setError(message);
      alert(`❌ ${message}`);

      throw err;
    }
  };

  const handleArchiveProduct = async (product: ProductWithStatus) => {
    const confirmed = window.confirm(
      `Arsipkan produk "${product.name}"?\n\nProduk tidak akan tampil di katalog, tapi masih bisa dipulihkan dari tab "Produk Diarsipkan" selama 30 hari.`
    );

    if (!confirmed) return;

    try {
      await archiveProduct(product.backendId);
      await refreshProducts();
      alert('Produk berhasil diarsipkan.');
    } catch (err) {
      const message = parseAxiosError(err, 'Gagal mengarsipkan produk.');
      console.error(err);
      alert(`❌ ${message}`);
    }
  };

  const handleRestoreProduct = async (product: ArchivedProduct) => {
    const confirmed = window.confirm(`Pulihkan produk "${product.name}" ke katalog aktif?`);

    if (!confirmed) return;

    try {
      await restoreProduct(product.backendId);
      await refreshProducts();
      alert('Produk berhasil dipulihkan.');
    } catch (err) {
      const message = parseAxiosError(err, 'Gagal memulihkan produk.');
      console.error(err);
      alert(`❌ ${message}`);
    }
  };

  const handleDeleteProduct = async (product: ArchivedProduct) => {
    const confirmed = window.confirm(
      `Hapus permanen produk "${product.name}"?\n\nTindakan ini TIDAK BISA dibatalkan. Semua data produk ini akan hilang.`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product.backendId);
      await refreshProducts();
      alert('Produk berhasil dihapus permanen.');
    } catch (err) {
      const message = parseAxiosError(err, 'Gagal menghapus produk secara permanen.');
      console.error(err);
      alert(`❌ ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#4b2417]">Produk</h1>
        <p className="mt-1 text-sm text-[#6f5448]">
          Kelola produk, resep, gambar, harga jual, dan status katalog.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Produk Aktif"
          value={totalActiveProducts}
          subtitle="Aktif"
          icon={Package}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Diarsipkan"
          value={totalArchivedProducts}
          subtitle="Archived"
          icon={Clock}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Kategori"
          value={totalCategories}
          subtitle="Kategori"
          icon={CheckCircle}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Stok Menipis"
          value={lowStockProducts}
          subtitle="Perlu restock"
          icon={AlertTriangle}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === 'active'
                  ? 'bg-[#d85b30] text-white'
                  : 'bg-gray-100 text-[#6f5448] hover:bg-gray-200'
              }`}
            >
              Produk Aktif
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === 'archived'
                  ? 'bg-[#d85b30] text-white'
                  : 'bg-gray-100 text-[#6f5448] hover:bg-gray-200'
              }`}
            >
              Produk Diarsipkan
            </button>
          </div>

          {activeTab === 'active' && canManageProducts && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          )}
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
            <input
              type="text"
              placeholder="Cari nama produk, kategori, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-10 pr-4 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-bold uppercase text-[#6f5448]">
                <th className="py-3 pr-4">No</th>
                <th className="py-3 pr-4">Produk</th>
                <th className="py-3 pr-4">Kategori</th>
                <th className="py-3 pr-4">Harga</th>
                <th className="py-3 pr-4">HPP</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#6f5448]">
                    {activeTab === 'active'
                      ? 'Belum ada produk aktif.'
                      : 'Belum ada produk diarsipkan.'}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  const isArchivedTab = activeTab === 'archived';
                  const archivedProduct = product as ArchivedProduct;

                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 text-[#6f5448]">{rowNumber}</td>

                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-[#4b2417]">{product.name}</p>
                            <p className="line-clamp-1 max-w-xs text-xs text-[#6f5448]">
                              {product.description || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-4 text-[#4b2417]">
                        {product.category || '-'}
                      </td>

                      <td className="py-3 pr-4 font-semibold text-[#4b2417]">
                        {formatRupiah(product.price)}
                      </td>

                      <td className="py-3 pr-4 text-[#6f5448]">
                        {formatRupiah(product.hppTotal)}
                      </td>

                      <td className="py-3 pr-4">
                        {isArchivedTab ? (
                          <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                            Diarsipkan
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewProduct(product)}
                            className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                            title="Lihat produk"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {!isArchivedTab ? (
                            canManageProducts && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product as ProductWithStatus)}
                                  className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                                  title="Edit produk"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleArchiveProduct(product as ProductWithStatus)}
                                  className="rounded p-1 text-orange-500 hover:bg-orange-50"
                                  title="Arsipkan produk"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              </>
                            )
                          ) : (
                            <>
                              {canManageProducts && (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreProduct(archivedProduct)}
                                  className="rounded p-1 text-green-600 hover:bg-green-50"
                                  title="Pulihkan produk"
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(archivedProduct)}
                                  className="rounded p-1 text-red-500 hover:bg-red-50"
                                  title="Hapus permanen"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {isArchivedTab && (
                          <p className="mt-1 text-right text-[10px] text-[#8b7166]">
                            Hapus otomatis dalam {archivedProduct.daysUntilPermanentDelete} hari
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#6f5448]">
              Menampilkan {startIndex + 1} -{' '}
              {Math.min(startIndex + itemsPerPage, filteredProducts.length)} dari{' '}
              {filteredProducts.length} produk
            </p>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`rounded px-3 py-1 text-sm font-semibold ${
                      page === currentPage
                        ? 'bg-[#d85b30] text-white'
                        : 'bg-gray-200 text-[#6f5448] hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories.filter((c) => c !== 'Semua Kategori')}
        onSave={handleSaveProduct}
      />

      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
