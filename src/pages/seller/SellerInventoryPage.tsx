// src/pages/seller/SellerInventoryPage.tsx

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
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
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
  type InventoryCategory,
  type InventoryUnit,
  type InventoryStats,
} from '@/services/sellerInventoryService';
import { formatRupiah } from '@/services/productService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';

// ============================================================
// CONSTANTS
// ============================================================

const UNIT_OPTIONS: { value: InventoryUnit; label: string }[] = [
  { value: 'gram', label: 'gram' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'liter', label: 'liter' },
  { value: 'pcs', label: 'pcs' },
];

const CATEGORY_OPTIONS: { value: InventoryCategory; label: string }[] = [
  { value: 'Bahan', label: 'Bahan Baku' },
  { value: 'Kemasan', label: 'Kemasan' },
];

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

function normalizeDecimalInput(value: string): number {
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
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
// ADD / EDIT STOCK MODAL
// ============================================================

interface StockFormData {
  name: string;
  brand: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  stock: number;
  minStock: number;
  pricePerUnit: number;
}

interface StockModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialData?: InventoryItem | null;
  onClose: () => void;
  onSave: (data: StockFormData) => Promise<void>;
}

function StockModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
}: StockModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StockFormData>({
    name: '',
    brand: '-',
    category: 'Bahan',
    unit: 'kg',
    stock: 0,
    minStock: 1,
    pricePerUnit: 0,
  });

  const [stockInput, setStockInput] = useState('0');
  const [priceInput, setPriceInput] = useState('0');

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        brand: initialData.brand || '-',
        category: initialData.category,
        unit: initialData.unit,
        stock: initialData.stock,
        minStock: initialData.minStock,
        pricePerUnit: initialData.pricePerUnit,
      });
      setStockInput(String(initialData.stock));
      setPriceInput(String(initialData.pricePerUnit));
    } else {
      setFormData({
        name: '',
        brand: '-',
        category: 'Bahan',
        unit: 'kg',
        stock: 0,
        minStock: 1,
        pricePerUnit: 0,
      });
      setStockInput('0');
      setPriceInput('0');
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const title = mode === 'add' ? 'Tambah Stok' : 'Edit Stok';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];

    const stock = normalizeDecimalInput(stockInput);
    const pricePerUnit = normalizeDecimalInput(priceInput);

    if (!formData.name.trim()) errors.push('Nama item wajib diisi.');
    if (stock < 0) errors.push('Stok tidak boleh negatif.');
    if (pricePerUnit < 0) errors.push('Harga per satuan tidak boleh negatif.');

    if (errors.length > 0) {
      alert('❌ ' + errors.join('\n'));
      return;
    }

    setSubmitting(true);

    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        brand: formData.brand.trim() || '-',
        stock,
        pricePerUnit,
      });

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Nama Item <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Tepung Terigu"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Brand / Supplier
            </label>
            <input
              type="text"
              placeholder="Opsional. Backend belum menyimpan brand."
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
            <p className="mt-1 text-xs text-[#8b7166]">
              Catatan: backend stock_items saat ini belum punya kolom brand, jadi brand tidak tersimpan ke database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as InventoryCategory,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Satuan
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit: e.target.value as InventoryUnit,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Stok Tersedia
              </label>
              <input
                type="text"
                placeholder="Contoh: 20 atau 0,5"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
              <p className="mt-1 text-xs text-[#8b7166]">
                Boleh pakai koma atau titik. Contoh: 0,5 kg.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Harga per Satuan
              </label>
              <input
                type="text"
                placeholder="Contoh: 20000"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
              <p className="mt-1 text-xs text-[#8b7166]">
                Ini dipakai backend untuk HPP: jumlah recipe × harga/satuan.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Minimum Stock Alert
            </label>
            <input
              type="text"
              value={formData.minStock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minStock: normalizeDecimalInput(e.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
            <p className="mt-1 text-xs text-[#8b7166]">
              Catatan: backend belum punya kolom minimum stock, jadi nilai ini hanya untuk UI sementara.
            </p>
          </div>

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
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const canManageInventory = hasPermission(userRole, 'manage_inventory');
  const canDelete = hasPermission(userRole, 'delete_inventory');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showStockModal, setShowStockModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const loadInventory = async () => {
    setError(null);

    try {
      const [inventoryItems, inventoryStats] = await Promise.all([
        getInventoryItems(),
        getInventoryStats(),
      ]);

      setItems(inventoryItems);
      setStats(inventoryStats);
    } catch (err) {
      console.error('Gagal memuat inventory:', err);
      setError(parseAxiosError(err, 'Gagal memuat inventory.'));
    }
  };

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      await loadInventory();
      setLoading(false);
    }

    void initialLoad();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== 'Semua Kategori') {
      result = result.filter((item) => item.category === filterCategory);
    }

    if (filterStatus !== 'Semua Status') {
      if (filterStatus === 'Aman') {
        result = result.filter((item) => item.stock > item.minStock);
      } else if (filterStatus === 'Menipis') {
        result = result.filter(
          (item) => item.stock <= item.minStock && item.stock > 0
        );
      } else if (filterStatus === 'Habis') {
        result = result.filter((item) => item.stock === 0);
      }
    }

    return result;
  }, [items, searchQuery, filterCategory, filterStatus]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const getStatus = (item: InventoryItem) => {
    if (item.stock === 0) {
      return {
        label: 'Habis',
        className: 'bg-red-100 text-red-700',
      };
    }

    if (item.stock <= item.minStock) {
      return {
        label: 'Menipis',
        className: 'bg-yellow-100 text-yellow-700',
      };
    }

    return {
      label: 'Aman',
      className: 'bg-green-100 text-green-700',
    };
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setShowStockModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setShowStockModal(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    alert(
      [
        `Nama: ${item.name}`,
        `Brand/Supplier: ${item.brand || '-'}`,
        `Kategori: ${item.category}`,
        `Satuan: ${item.unit}`,
        `Stok: ${item.stock} ${item.unit}`,
        `Harga/Satuan: ${formatRupiah(item.pricePerUnit)} / ${item.unit}`,
        `Minimum UI Alert: ${item.minStock} ${item.unit}`,
        '',
        `ID backend stock_items: ${item.id}`,
      ].join('\n')
    );
  };

  const handleSaveStock = async (data: {
    name: string;
    brand: string;
    category: InventoryCategory;
    unit: InventoryUnit;
    stock: number;
    minStock: number;
    pricePerUnit: number;
  }) => {
    try {
      setError(null);

      if (modalMode === 'add') {
        await addInventoryItem(data);
        alert('✅ Stok berhasil ditambahkan!');
      } else if (modalMode === 'edit' && editingItem) {
        await updateInventoryItem(editingItem.id, data);
        alert('✅ Stok berhasil diperbarui!');
      }

      await loadInventory();
    } catch (err) {
      const message = parseAxiosError(
        err,
        modalMode === 'add'
          ? 'Gagal menambahkan stok.'
          : 'Gagal memperbarui stok.'
      );

      setError(message);
      alert(`❌ ${message}`);

      throw err;
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const confirmed = window.confirm(
      `Hapus item "${item.name}"?\n\nJika item masih dipakai di recipe, backend akan menolak penghapusan.`
    );

    if (!confirmed) return;

    try {
      setError(null);

      await deleteInventoryItem(item.id);
      await loadInventory();

      alert('✅ Stok berhasil dihapus.');
    } catch (err) {
      const message = parseAxiosError(err, 'Gagal menghapus stok.');

      setError(message);
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
        <h1 className="text-3xl font-black text-[#4b2417]">Stok / Inventory</h1>
        <p className="mt-1 text-sm text-[#6f5448]">
          Data ini langsung tersambung ke backend <code>/stock/</code>. Recipe produk memakai ID stok dari sini.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Cari nama item, kategori..."
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
              type="button"
              onClick={openAddModal}
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
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="pb-3 pr-4">No</th>
                <th className="pb-3 pr-4">Nama</th>
                <th className="pb-3 pr-4">Kategori</th>
                <th className="pb-3 pr-4">Stok Tersedia</th>
                <th className="pb-3 pr-4">Harga/Satuan</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Aksi</th>
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
                      <td className="py-3 pr-4 text-[#6f5448]">
                        {startIndex + idx + 1}
                      </td>

                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#4b2417]">{item.name}</p>
                        <p className="text-xs text-[#8b7166]">
                          ID stock: {item.id}
                        </p>
                      </td>

                      <td className="py-3 pr-4 text-[#6f5448]">
                        {item.category}
                      </td>

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

                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewItem(item)}
                            className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {canManageInventory && (
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                              title="Edit stok"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="rounded p-1 text-red-500 hover:bg-red-50"
                              title="Hapus stok"
                            >
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
              Menampilkan {startIndex + 1} -{' '}
              {Math.min(startIndex + itemsPerPage, filteredItems.length)} dari{' '}
              {filteredItems.length} item
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
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
        <StockModal
          isOpen={showStockModal}
          mode={modalMode}
          initialData={editingItem}
          onClose={() => {
            setShowStockModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveStock}
        />
      )}
    </div>
  );
}
