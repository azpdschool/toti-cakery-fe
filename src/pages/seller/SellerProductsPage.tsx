// src/pages/seller/SellerProductsPage.tsx

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { getAllProducts, getCategories, formatRupiah, type SimpleProduct } from '@/services/productService';
import { getInventoryOptions } from '@/services/sellerInventoryService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';

// ============================================================
// TYPES
// ============================================================

interface ProductWithStatus extends SimpleProduct {
  stock: number;
  status: 'active' | 'inactive';
}

// ============================================================
// KOMPONEN STAT CARD
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
    <div className="rounded-xl bg-white p-5 shadow-sm relative">
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
// KOMPONEN MODAL TAMBAH PRODUK
// ============================================================

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSave: (product: any) => void;
}

function AddProductModal({ isOpen, onClose, categories, onSave }: AddProductModalProps) {
  const [inventoryOptions, setInventoryOptions] = useState<
    { id: string; name: string; brand: string; unit: string; stock: number }[]
  >([]);

  useEffect(() => {
    async function loadInventory() {
      const options = await getInventoryOptions();
      setInventoryOptions(options);
    }
    if (isOpen) {
      loadInventory();
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || '',
    description: '',
    price: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [ingredients, setIngredients] = useState<
    { inventoryId: string; name: string; quantity: number; unit: string; price: number }[]
  >([
    { inventoryId: '', name: 'Tepung terigu', quantity: 500, unit: 'gr', price: 12000 },
    { inventoryId: '', name: 'Gula pasir', quantity: 200, unit: 'gr', price: 14000 },
    { inventoryId: '', name: 'Telur', quantity: 1, unit: 'butir', price: 2500 },
  ]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const hpp = useMemo(() => {
    return ingredients.reduce((total, ing) => total + ing.quantity * ing.price, 0);
  }, [ingredients]);

  const stockPreview = [
    { name: 'Tepung terigu', stock: 12500, unit: 'gr' },
    { name: 'Gula pasir', stock: 4200, unit: 'gr' },
    { name: 'Telur', stock: 20, unit: 'butir' },
  ];

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { inventoryId: '', name: '', quantity: 0, unit: 'gr', price: 0 },
    ]);
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSelectIngredient = (index: number, inventoryId: string) => {
    const selected = inventoryOptions.find((opt) => opt.id === inventoryId);
    if (selected) {
      const updated = [...ingredients];
      updated[index] = {
        ...updated[index],
        inventoryId: selected.id,
        name: selected.name,
        unit: selected.unit,
      };
      setIngredients(updated);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price) {
      alert('Harap isi semua field wajib (Nama, Kategori, Harga)');
      return;
    }
    const newProduct = {
      ...formData,
      price: parseInt(formData.price.replace(/\D/g, '')),
      ingredients,
      hpp,
      image: imagePreview || '/placeholder.png',
    };
    onSave(newProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">Tambah Produk</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Red velvet cupcake dilapisi oleh cream red velvet..."
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
            <h3 className="mb-2 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Resep & Komposisi Bahan
            </h3>
            <p className="mb-3 text-xs text-[#6f5448]">
              Stok bahan akan otomatis terpotong saat pesanan berhasil dibayar (Confirmed).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                    <th className="pb-2 pr-4">Nama Bahan</th>
                    <th className="pb-2 pr-4">Jumlah</th>
                    <th className="pb-2 pr-4">Satuan</th>
                    <th className="pb-2 pr-4">Harga</th>
                    <th className="pb-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <select
                          value={ing.inventoryId}
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
                          step="0.01"
                          value={ing.quantity}
                          onChange={(e) =>
                            handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          value={ing.unit}
                          readOnly
                          className="w-16 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-600"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          value={ing.price ? `Rp ${ing.price.toLocaleString('id-ID')}` : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            handleIngredientChange(idx, 'price', parseInt(raw) || 0);
                          }}
                          className="w-24 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                        />
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
              <h4 className="text-sm font-bold text-[#4b2417]">HPP (Harga Pokok Produksi)</h4>
              <div className="mt-2 space-y-1 text-xs text-[#6f5448]">
                {ingredients.map((ing, idx) => (
                  <div key={idx}>
                    {ing.name} x {ing.quantity} {ing.unit} = Rp {ing.price.toLocaleString('id-ID')}
                  </div>
                ))}
                <div className="mt-2 font-bold text-[#4b2417]">
                  Total HPP: Rp {hpp.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Upload Gambar
            </h3>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-[#d0bfaf] bg-gray-50 overflow-hidden shrink-0">
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
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                <p className="mt-1 text-xs text-[#8b7166]">PNG, JPG (max 2MB)</p>
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
            <h3 className="mb-2 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Preview stok bahan dipilih
            </h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <ul className="space-y-1 text-sm text-[#4b2417]">
                {stockPreview.map((item) => (
                  <li key={item.name} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">
                      {item.stock.toLocaleString('id-ID')} {item.unit}
                    </span>
                  </li>
                ))}
                <li className="mt-2 text-xs text-[#d85b30] font-semibold">
                  <button type="button" className="underline">
                    Kelola stok bahan
                  </button>
                </li>
              </ul>
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
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              Simpan Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================

export default function SellerProductsPage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const canManageProducts = hasPermission(userRole, 'manage_products');
  const canDelete = hasPermission(userRole, 'delete_data');

  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [rawProducts, categoriesData] = await Promise.all([
          getAllProducts(),
          getCategories(),
        ]);
        const withStatus: ProductWithStatus[] = rawProducts.map((p) => ({
          ...p,
          stock: Math.floor(Math.random() * 50) + 1,
          status: Math.random() > 0.2 ? 'active' : 'inactive',
        }));
        setProducts(withStatus);
        setCategories(['Semua Kategori', ...categoriesData.map((c) => c.category)]);
      } catch (error) {
        console.error('Gagal memuat produk:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
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
    if (filterStatus !== 'Semua Status') {
      result = result.filter((p) => p.status === filterStatus);
    }
    return result;
  }, [products, searchQuery, filterCategory, filterStatus]);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const inactiveProducts = products.filter((p) => p.status === 'inactive').length;
  const lowStockProducts = products.filter((p) => p.stock < 10).length;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSaveProduct = (newProduct: any) => {
    const productWithStatus: ProductWithStatus = {
      id: `new-${Date.now()}`,
      slug: `new-${Date.now()}`,
      name: newProduct.name,
      category: newProduct.category,
      description: newProduct.description,
      image: newProduct.image,
      price: newProduct.price,
      rating: 0,
      soldCount: 0,
      featured: false,
      stock: 0,
      status: newProduct.status,
    };
    setProducts([productWithStatus, ...products]);
    alert('Produk berhasil ditambahkan (dummy)');
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
      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Produk"
          value={totalProducts}
          subtitle="Semua produk"
          icon={Package}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Produk Aktif"
          value={activeProducts}
          subtitle="Sedang aktif dijual"
          icon={CheckCircle}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Produk Nonaktif"
          value={inactiveProducts}
          subtitle="Tidak aktif"
          icon={XCircle}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="Stok Menipis"
          value={lowStockProducts}
          subtitle="Perlu restock"
          icon={AlertTriangle}
          color="bg-yellow-50 text-yellow-700"
        />
      </div>

      {/* Filter & Cari */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Cari nama produk, kategori atau SKU"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          {canManageProducts && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="pb-3 pr-4">NO</th>
                <th className="pb-3 pr-4">PRODUK</th>
                <th className="pb-3 pr-4">KATEGORI</th>
                <th className="pb-3 pr-4">HARGA</th>
                <th className="pb-3 pr-4">STATUS</th>
                <th className="pb-3">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#6f5448]">
                    Tidak ada produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, idx) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-[#6f5448]">{startIndex + idx + 1}</td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-[#4b2417]">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-[#8b7166] line-clamp-1">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[#6f5448]">{product.category}</td>
                    <td className="py-3 pr-4 font-medium text-[#4b2417]">{formatRupiah(product.price)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {canManageProducts && (
                          <>
                            <button className="rounded p-1 text-[#6f5448] hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1 text-[#6f5448] hover:bg-gray-100">
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button className="rounded p-1 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f5448]">
            <div>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProducts.length)}{' '}
              dari {filteredProducts.length} produk
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                    page === currentPage
                      ? 'bg-[#d85b30] text-white'
                      : 'bg-gray-200 text-[#6f5448] hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Produk */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories.filter((c) => c !== 'Semua Kategori')}
        onSave={handleSaveProduct}
      />
    </div>
  );
}