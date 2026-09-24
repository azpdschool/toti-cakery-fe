import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type React from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  X,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  TrendingDown
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
import { supplierService } from '@/services/supplierService';
import type { SupplierOut } from '@/api/supplier';
import SupplierManagementModal from './SupplierManagementModal';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { MultiFilterPopover, type FilterField } from '@/components/ui/MultiFilterPopover';

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

const FILTER_FIELDS: FilterField[] = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'Bahan', label: 'Bahan Baku' },
      { value: 'Kemasan', label: 'Kemasan' },
    ]
  },
  {
    id: 'unit',
    label: 'Unit',
    type: 'select',
    options: UNIT_OPTIONS
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Safe', label: 'Safe' },
      { value: 'Low', label: 'Low Stock' },
      { value: 'Out', label: 'Out of Stock' },
    ]
  }
];

// ============================================================
// HELPERS
// ============================================================

function parseAxiosError(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { detail?: unknown, message?: string } } };
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map((item: { msg?: string }) => item.msg || JSON.stringify(item)).join('\n');
    }
    if (typeof detail === 'string') return detail;
    if (err.response?.data?.message) return err.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallbackMessage;
}

function normalizeDecimalInput(value: string): number {
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ============================================================
// COMPONENTS
// ============================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="relative rounded-xl bg-white p-5 shadow-sm min-w-[240px] flex-shrink-0">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-[#6f5448]">{subtitle}</span>
      </div>
      <p className="mt-2 text-3xl font-black text-[#4b2417] truncate" title={String(value)}>{value}</p>
      <p className="text-sm text-[#6f5448]">{title}</p>
    </div>
  );
}

// ============================================================
// ADD / EDIT STOCK MODAL
// ============================================================

interface StockFormData {
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  stock: number;
  minStock: number;
  pricePerUnit: number;
  supplierId: number | null;
}

interface StockModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialData?: InventoryItem | null;
  onClose: () => void;
  onSave: (data: StockFormData) => Promise<void>;
  suppliers: SupplierOut[];
}

function StockModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
  suppliers
}: StockModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StockFormData>({
    name: '',
    category: 'Bahan',
    unit: 'kg',
    stock: 0,
    minStock: 1,
    pricePerUnit: 0,
    supplierId: null,
  });

  const [stockInput, setStockInput] = useState('0');
  const [priceInput, setPriceInput] = useState('0');
  const [minStockInput, setMinStockInput] = useState('1');
  const [supplierInput, setSupplierInput] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        unit: initialData.unit,
        stock: initialData.stock,
        minStock: initialData.minStock,
        pricePerUnit: initialData.pricePerUnit,
        supplierId: initialData.supplierId,
      });
      setStockInput(String(initialData.stock));
      setPriceInput(String(initialData.pricePerUnit));
      setMinStockInput(String(initialData.minStock));
      setSupplierInput(initialData.supplierId !== null ? String(initialData.supplierId) : '');
    } else {
      setFormData({
        name: '',
        category: 'Bahan',
        unit: 'kg',
        stock: 0,
        minStock: 1,
        pricePerUnit: 0,
        supplierId: null,
      });
      setStockInput('0');
      setPriceInput('0');
      setMinStockInput('1');
      setSupplierInput('');
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const title = mode === 'add' ? 'Add Inventory' : 'Edit Inventory';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    const stock = normalizeDecimalInput(stockInput);
    const pricePerUnit = normalizeDecimalInput(priceInput);
    const minStock = normalizeDecimalInput(minStockInput);

    if (!formData.name.trim()) errors.push('Item Name is required.');
    if (stock < 0) errors.push('Available Inventory cannot be negative.');
    if (pricePerUnit < 0) errors.push('Price per Unit cannot be negative.');
    if (minStock < 0) errors.push('Minimum Stock Alert cannot be negative.');

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        stock,
        minStock,
        pricePerUnit,
        supplierId: supplierInput ? parseInt(supplierInput, 10) : null,
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-2xl font-black text-[#4b2417]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flour"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Supplier <span className="text-red-500">(Optional)</span>
            </label>
            <select
              value={supplierInput}
              onChange={(e) => setSupplierInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#d0bfaf] bg-white py-2 px-4 text-sm focus:border-[#c95b31] outline-none"
            >
              <option value="">Not set</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.nama_supplier}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Category <span className="text-red-500">*</span>
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
                Unit <span className="text-red-500">*</span>
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
                Available Inventory <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 20"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Price per Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 20000"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Minimum Stock Alert <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={minStockInput}
              onChange={(e) => setMinStockInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              required
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
      </form>
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

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOut[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showStockModal, setShowStockModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadInventory = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      const inventoryItems = await getInventoryItems(signal);
      const inventoryStats = getInventoryStats(inventoryItems);

      setItems(inventoryItems);
      setStats(inventoryStats);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError' || error.name === 'CanceledError') return;
      console.error('Failed to load inventory:', err);
      setError(parseAxiosError(err, 'Unable to load inventory right now.'));
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await supplierService.fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function initialLoad() {
      setLoading(true);
      await Promise.all([
        loadInventory(controller.signal),
        supplierService.fetchSuppliers().then((data) => {
          if (!ignore) setSuppliers(data);
        }).catch((err) => {
          console.error('Failed to load suppliers:', err);
        }),
      ]);
      if (!ignore) setLoading(false);
    }

    void initialLoad();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [loadInventory]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, itemsPerPage]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      result = result.filter((item) => item.category === filters.category);
    }
    
    if (filters.unit) {
      result = result.filter((item) => item.unit === filters.unit);
    }

    if (filters.status) {
      if (filters.status === 'Safe') {
        result = result.filter((item) => item.stock > item.minStock);
      } else if (filters.status === 'Low') {
        result = result.filter(
          (item) => item.stock <= item.minStock && item.stock > 0
        );
      } else if (filters.status === 'Out') {
        result = result.filter((item) => item.stock <= 0);
      }
    }

    return result;
  }, [items, debouncedSearch, filters]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const getStatus = (item: InventoryItem) => {
    if (item.stock <= 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-700' };
    }
    if (item.stock > 0 && item.stock <= item.minStock) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: 'Safe', className: 'bg-green-100 text-green-700' };
  };

  const getSupplierName = (supplierId: number | null) => {
    if (!supplierId) return 'Not set';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.nama_supplier : 'Not set';
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

  const handleSaveStock = async (data: StockFormData) => {
    try {
      if (modalMode === 'add') {
        await addInventoryItem(data);
        toast.success('Inventory item added successfully.');
      } else if (modalMode === 'edit' && editingItem) {
        await updateInventoryItem(editingItem.id, data);
        toast.success('Inventory item updated successfully.');
      }
      await loadInventory();
    } catch (err) {
      const message = parseAxiosError(err, 'Failed to save inventory item.');
      toast.error(message);
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventoryItem(deleteConfirm.id);
      await loadInventory();
      toast.success('Inventory item removed successfully.');
    } catch (err) {
      const message = parseAxiosError(err, 'Failed to remove inventory item.');
      toast.error(message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const attentionItems = useMemo(() => {
    return items.filter(item => item.stock <= item.minStock);
  }, [items]);

  const kpiContainerRef = useRef<HTMLDivElement>(null);
  const attentionContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#4b2417]">Inventory</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            Manage ingredients, packaging, and other materials used by your products.
          </p>
        </div>
        {canManageInventory && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center justify-center gap-1 rounded-lg border border-[#d85b30] px-4 py-2 text-sm font-semibold text-[#d85b30] hover:bg-[#fff5f0] whitespace-nowrap"
            >
              Manage Supplier
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center justify-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Inventory
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadInventory()}
            className="rounded border border-red-300 px-3 py-1 text-xs font-bold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stock Attention Notice */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm p-4 relative">
          <h2 className="text-sm font-bold text-[#4b2417] mb-3">Inventory Needs Attention</h2>
          {attentionItems.length === 0 ? (
            <p className="text-sm text-gray-500">No inventory items need attention.</p>
          ) : (
            <div className="relative group">
              <button 
                onClick={() => scrollLeft(attentionContainerRef)}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div 
                ref={attentionContainerRef}
                className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {attentionItems.map(item => {
                  const status = getStatus(item);
                  return (
                    <div key={item.id} className={`flex-shrink-0 snap-start border rounded-lg px-4 py-3 min-w-[200px] ${item.stock === 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                      <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-medium text-gray-700">{item.stock} {item.unit}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => scrollRight(attentionContainerRef)}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="relative group">
        <button 
          onClick={() => scrollLeft(kpiContainerRef)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
          aria-label="Scroll KPI left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div 
          ref={kpiContainerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl min-w-[240px] h-32 flex-shrink-0" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Items"
                value={stats?.totalItems || 0}
                subtitle="All Inventory"
                icon={Package}
                color="bg-blue-50 text-blue-700"
              />
              <StatCard
                title="Inventory Safe"
                value={stats?.safeStock || 0}
                subtitle="Adequate Stock"
                icon={CheckCircle}
                color="bg-green-50 text-green-700"
              />
              <StatCard
                title="Inventory Low"
                value={stats?.lowStock || 0}
                subtitle="Below Threshold"
                icon={AlertTriangle}
                color="bg-yellow-50 text-yellow-700"
              />
              <StatCard
                title="Inventory Out of Stock"
                value={stats?.emptyStock || 0}
                subtitle="Needs Reorder"
                icon={XCircle}
                color="bg-red-50 text-red-700"
              />
              <StatCard
                title="Estimated Total Value"
                value={formatRupiah(stats?.totalValue || 0)}
                subtitle="Overall Worth"
                icon={DollarSign}
                color="bg-emerald-50 text-emerald-700"
              />
              <StatCard
                title="Inventory Value"
                value={formatRupiah(stats?.totalValue || 0)}
                subtitle="Capital Tied"
                icon={TrendingDown}
                color="bg-indigo-50 text-indigo-700"
              />
            </>
          )}
        </div>
        
        <button 
          onClick={() => scrollRight(kpiContainerRef)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
          aria-label="Scroll KPI right"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        <div className="flex w-full sm:w-auto flex-wrap gap-2">
          <MultiFilterPopover
            fields={FILTER_FIELDS}
            values={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-4">Item Name</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Available Inventory</th>
                <th className="p-4">Price per Unit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-500">
                    {searchQuery || Object.keys(filters).length > 0 
                      ? "No inventory items match your current filters." 
                      : "No inventory items found."}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const status = getStatus(item);

                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                      </td>
                      <td className="p-4 text-gray-600">
                        {getSupplierName(item.supplierId)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {item.category}
                      </td>
                      <td className="p-4 text-gray-600">
                        {item.unit}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {item.stock} {item.unit}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatRupiah(item.pricePerUnit)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Edit"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {canManageInventory && (
                            <button
                              title="Delete"
                              onClick={() => setDeleteConfirm(item)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              aria-label="Delete"
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
        {!loading && filteredItems.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            limit={itemsPerPage}
            totalItems={filteredItems.length}
            onPageChange={setCurrentPage}
            onLimitChange={setItemsPerPage}
          />
        )}
      </div>

      <StockModal
        isOpen={showStockModal}
        mode={modalMode}
        initialData={editingItem}
        onClose={() => setShowStockModal(false)}
        onSave={handleSaveStock}
        suppliers={suppliers}
      />

      <SupplierManagementModal
        isOpen={showSupplierModal}
        onClose={() => {
          setShowSupplierModal(false);
          loadSuppliers();
        }}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Remove Inventory Item"
        message={`Are you sure you want to remove "${deleteConfirm?.name}"?`}
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
