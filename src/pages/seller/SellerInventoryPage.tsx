// src/pages/seller/SellerInventoryPage.tsx

import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  X,
} from 'lucide-react';
import {
  getInventoryItems,
  getInventoryStats,
  addInventoryItem,
  type InventoryItem,
  type InventoryCategory,
  type InventoryUnit,
} from '@/services/sellerInventoryService';
import { formatRupiah } from '@/services/productService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';

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
// KOMPONEN MODAL TAMBAH STOK
// ============================================================

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const UNIT_OPTIONS: { value: InventoryUnit; label: string }[] = [
  { value: 'gr', label: 'gr (Gram)' },
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'ml', label: 'ml (Mililiter)' },
  { value: 'ltr', label: 'ltr (Liter)' },
  { value: 'sdm', label: 'sdm (Sendok Makan)' },
  { value: 'sdt', label: 'sdt (Sendok Teh)' },
  { value: 'cup', label: 'cup (Cangkir)' },
  { value: 'butir', label: 'butir' },
  { value: 'siung', label: 'siung' },
  { value: 'lbr', label: 'lbr (Lembar)' },
  { value: 'ikat', label: 'ikat' },
  { value: 'batang', label: 'batang' },
  { value: 'pinch', label: 'pinch (Sejumput)' },
  { value: 'dash', label: 'dash (Percikan)' },
  { value: 'pcs', label: 'pcs' },
];

function AddStockModal({ isOpen, onClose, onSave }: AddStockModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Bahan' as InventoryCategory,
    unit: 'kg' as InventoryUnit,
    stock: 0,
    minStock: 0,
    pricePerUnit: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand || formData.pricePerUnit <= 0) {
      alert('Harap isi semua field wajib (Nama, Supplier/Merek, Harga Beli)');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">Tambah Stok</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Tepung terigu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Supplier/Merek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Rose Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as InventoryCategory })
                  }
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                >
                  <option value="Bahan">Bahan</option>
                  <option value="Kemasan">Kemasan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Satuan
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value as InventoryUnit })
                  }
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Stok <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Stok minimum (alert menipis) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Harga Beli Per Satuan <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6f5448]">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={formData.pricePerUnit ? formData.pricePerUnit.toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, pricePerUnit: parseInt(raw) || 0 });
                  }}
                  className="w-full rounded-lg border border-[#d0bfaf] pl-10 pr-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                />
              </div>
            </div>

            <p className="text-xs text-[#6f5448]">
              Setelah disimpan, bahan ini langsung muncul di dropdown resep saat kamu buat produk baru.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 mt-6">
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
              Simpan
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

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const canManageInventory = hasPermission(userRole, 'manage_inventory');
  const canDelete = hasPermission(userRole, 'delete_data');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<any>(null);
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
        const [itemsData, statsData] = await Promise.all([
          getInventoryItems(),
          getInventoryStats(),
        ]);
        setItems(itemsData);
        setStats(statsData);
      } catch (error) {
        console.error('Gagal memuat data stok:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'Semua Kategori') {
      result = result.filter((i) => i.category === filterCategory);
    }
    if (filterStatus !== 'Semua Status') {
      if (filterStatus === 'Aman') result = result.filter((i) => i.stock > i.minStock);
      else if (filterStatus === 'Menipis') result = result.filter((i) => i.stock <= i.minStock && i.stock > 0);
      else if (filterStatus === 'Habis') result = result.filter((i) => i.stock === 0);
    }
    return result;
  }, [items, searchQuery, filterCategory, filterStatus]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const getStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { label: 'Habis', className: 'bg-red-100 text-red-700' };
    if (item.stock <= item.minStock) return { label: 'Menipis', className: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Aman', className: 'bg-green-100 text-green-700' };
  };

  const handleAddStock = async (data: any) => {
    try {
      const newItem = await addInventoryItem(data);
      setItems([newItem, ...items]);
      alert('Stok berhasil ditambahkan!');
    } catch (error) {
      alert('Gagal menambahkan stok.');
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Item"
          value={stats?.totalItems || 0}
          subtitle="Semua bahan & kemasan"
          icon={Package}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Stok Aman"
          value={stats?.safeStock || 0}
          subtitle="Stok mencukupi"
          icon={CheckCircle}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Stok Menipis"
          value={stats?.lowStock || 0}
          subtitle="Perlu restock"
          icon={AlertTriangle}
          color="bg-yellow-50 text-yellow-700"
        />
        <StatCard
          title="Stok Habis"
          value={stats?.emptyStock || 0}
          subtitle="Segera restock"
          icon={XCircle}
          color="bg-red-50 text-red-700"
        />
      </div>

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
            <option value="Semua Kategori">Semua Kategori</option>
            <option value="Bahan">Bahan</option>
            <option value="Kemasan">Kemasan</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis</option>
            <option value="Habis">Habis</option>
          </select>

          {canManageInventory && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Tambah Stok
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="pb-3 pr-4">NO</th>
                <th className="pb-3 pr-4">NAMA</th>
                <th className="pb-3 pr-4">KATEGORI</th>
                <th className="pb-3 pr-4">STOK TERSEDIA</th>
                <th className="pb-3 pr-4">HARGA/SATUAN</th>
                <th className="pb-3 pr-4">STATUS</th>
                <th className="pb-3">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[#6f5448]">
                    Tidak ada item stok ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const status = getStatus(item);
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 text-[#6f5448]">{startIndex + idx + 1}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#4b2417]">{item.name}</p>
                        <p className="text-xs text-[#8b7166]">{item.brand}</p>
                      </td>
                      <td className="py-3 pr-4 text-[#6f5448]">{item.category}</td>
                      <td className="py-3 pr-4 font-medium text-[#4b2417]">
                        {item.stock} {item.unit}
                      </td>
                      <td className="py-3 pr-4 text-[#6f5448]">
                        {formatRupiah(item.pricePerUnit)} / {item.unit}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {canManageInventory && (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#6f5448]">
            <div>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredItems.length)} dari{' '}
              {filteredItems.length} item
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

      {canManageInventory && (
        <AddStockModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddStock}
        />
      )}
    </div>
  );
}