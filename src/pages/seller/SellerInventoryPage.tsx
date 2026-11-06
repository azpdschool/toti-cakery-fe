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
  Edit,
  Trash2,
  TrendingDown,
  History,
  SlidersHorizontal,
  MoreVertical,
} from 'lucide-react';
import { SellerSortDropdown } from '@/components/ui/SellerSortDropdown';
import { HorizontalCardScroller } from '@/components/common/HorizontalCardScroller';
import { PageHeader } from '@/components/ui/PageHeader';
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


import SupplierManagementModal from './SupplierManagementModal';
import PurchaseManagementModal from './PurchaseManagementModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import StockMovementModal from './StockMovementModal';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { MultiFilterPopover, type FilterField } from '@/components/ui/MultiFilterPopover';
import { DecimalInput } from '@/components/ui/DecimalInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

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

import { friendlyError, categoryLabel } from '@/utils/inventoryLabels';

const CATEGORY_OPTIONS: { value: InventoryCategory; label: string }[] = [
  { value: 'Bahan', label: categoryLabel('Bahan') },
  { value: 'Kemasan', label: categoryLabel('Kemasan') },
];

const FILTER_FIELDS: FilterField[] = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'Bahan', label: 'Raw Material' },
      { value: 'Kemasan', label: 'Packaging' },
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
  minWidthClassName?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color, minWidthClassName }: StatCardProps) {
  const valueStr = String(value);
  const isLongValue = valueStr.length > 10;
  return (
    <div
      className={`relative rounded-xl bg-white p-3.5 sm:p-5 shadow-sm ${
        minWidthClassName || (isLongValue ? 'min-w-[190px] sm:min-w-[270px]' : 'min-w-[160px] sm:min-w-[240px]')
      } flex-shrink-0`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-[10px] sm:text-xs font-medium text-[#6f5448] text-right truncate">{subtitle}</span>
      </div>
      <p
        className={`mt-1.5 sm:mt-2 font-black text-[#4b2417] truncate ${
          isLongValue ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'
        }`}
        title={valueStr}
      >
        {value}
      </p>
      <p className="text-xs sm:text-sm text-[#6f5448] truncate">{title}</p>
    </div>
  );
}

interface InventoryMoreActionsDropdownProps {
  item: InventoryItem;
  canManage: boolean;
  onMovementHistory: () => void;
  onDelete: () => void;
}

function InventoryMoreActionsDropdown({
  item,
  canManage,
  onMovementHistory,
  onDelete,
}: InventoryMoreActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label={`More actions for ${item.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 focus:outline-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onMovementHistory();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <History className="h-4 w-4 text-gray-500 shrink-0" />
            <span>Stock History</span>
          </button>

          {canManage && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-500 shrink-0" />
                <span>Delete Item</span>
              </button>
            </>
          )}
        </div>
      )}
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
  onSave
}: StockModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StockFormData>({
    name: '',
    category: 'Bahan',
    unit: 'kg',
    stock: 0,
    minStock: 1,
    pricePerUnit: 0,
  });

  const [stockInput, setStockInput] = useState('0');
  const [priceInput, setPriceInput] = useState('0');
  const [minStockInput, setMinStockInput] = useState('1');

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
      });
      setStockInput(String(initialData.stock));
      setPriceInput(String(initialData.pricePerUnit));
      setMinStockInput(String(initialData.minStock));
    } else {
      setFormData({
        name: '',
        category: 'Bahan',
        unit: 'kg',
        stock: 0,
        minStock: 1,
        pricePerUnit: 0,
      });
      setStockInput('0');
      setPriceInput('0');
      setMinStockInput('1');
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
    if (mode === 'add') {
      if (stock < 0) errors.push('Available Inventory cannot be negative.');
      if (pricePerUnit < 0) errors.push('Average Cost cannot be negative.');
    }
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
        stock: mode === 'add' ? stock : formData.stock,
        minStock,
        pricePerUnit: mode === 'add' ? pricePerUnit : formData.pricePerUnit,
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
          <div>
            <h2 className="text-2xl font-black text-[#4b2417]">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'add' 
                ? 'Stock and price here are starting values. To add stock later, use Purchases.' 
                : 'To change stock, use Purchases or the correct stock count icon.'}
            </p>
          </div>
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

          {mode === 'add' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Available Inventory <span className="text-red-500">*</span>
                </label>
                <DecimalInput
                  min={0}
                  placeholder="0"
                  value={stockInput}
                  onChange={(_val, raw) => setStockInput(raw)}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4b2417]" title="Average buying price. Updates when a purchase is received.">
                  Average Cost <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  min={0}
                  placeholder="0"
                  value={priceInput}
                  onChange={(val, raw) => setPriceInput(raw ? String(val) : '')}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Average Cost per Unit (IDR) <span className="text-xs font-normal text-stone-400 ml-1">(Read-only)</span>
              </label>
              <input
                type="text"
                value={formatRupiah(Number(priceInput) || 0)}
                disabled
                readOnly
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] bg-gray-100 px-4 py-2 text-sm text-gray-600 cursor-not-allowed outline-none font-medium"
              />
              <p className="mt-1 text-xs text-gray-500">
                Average cost is automatically calculated from purchases and stock movements. To change costs, use Purchases or Stock Adjustments.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">
              Minimum Stock Alert <span className="text-red-500">*</span>
            </label>
            <DecimalInput
              min={0}
              placeholder="0"
              value={minStockInput}
              onChange={(_val, raw) => setMinStockInput(raw)}
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('name_asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showStockModal, setShowStockModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
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


  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function initialLoad() {
      setLoading(true);
      await Promise.all([
        loadInventory(controller.signal)
      ]);
      if (!ignore) setLoading(false);
    }

    void initialLoad();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [loadInventory]);

  // Reset page when filters, search, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, itemsPerPage, sortBy]);

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

    switch (sortBy) {
      case 'name_desc':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'stock_desc':
        result = [...result].sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));
        break;
      case 'stock_asc':
        result = [...result].sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => (Number(b.pricePerUnit) || 0) - (Number(a.pricePerUnit) || 0));
        break;
      case 'price_asc':
        result = [...result].sort((a, b) => (Number(a.pricePerUnit) || 0) - (Number(b.pricePerUnit) || 0));
        break;
      case 'newest':
        result = [...result].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        break;
      case 'oldest':
        result = [...result].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        break;
      case 'name_asc':
      default:
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [items, debouncedSearch, filters, sortBy]);

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
        const newItem = await addInventoryItem(data);
        setItems((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)]);
        toast.success('Ingredient added.');
      } else if (modalMode === 'edit' && editingItem) {
        const updated = await updateInventoryItem(editingItem.id, data);
        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        toast.success('Ingredient updated.');
      }
      await loadInventory();
    } catch (err) {
      toast.error(friendlyError(err));
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventoryItem(deleteConfirm.id);
      await loadInventory();
      toast.success('Ingredient deleted.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setDeleteConfirm(null);
    }
  };

  const attentionItems = useMemo(() => {
    return items.filter(item => item.stock <= item.minStock);
  }, [items]);

  return (
    <div className="space-y-6 max-w-full">
      <PageHeader
        title="Inventory"
        description="Manage ingredients, packaging, and other materials used by your products."
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        actions={
          canManageInventory ? (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 shrink-0">
              {/* Primary CTA: First on mobile */}
              <button
                type="button"
                onClick={openAddModal}
                className="order-1 sm:order-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28] whitespace-nowrap shadow-sm w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Add Inventory
              </button>

              {/* Secondary actions: 2-column grid on mobile, inline on desktop */}
              <div className="order-2 sm:order-1 grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#f0e0d0] px-3 py-2 text-xs sm:text-sm font-semibold text-[#d85b30] transition hover:bg-[#e6d0bb] whitespace-nowrap"
                >
                  Manage Suppliers
                </button>

                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-100 px-3 py-2 text-xs sm:text-sm font-semibold text-blue-800 transition hover:bg-blue-200 whitespace-nowrap"
                >
                  Manage Purchases
                </button>
              </div>
            </div>
          ) : undefined
        }
      />

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
            <HorizontalCardScroller scrollContainerClassName="gap-3 pb-2">
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
            </HorizontalCardScroller>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <HorizontalCardScroller scrollContainerClassName="gap-3 sm:gap-4 pb-3 sm:pb-4 snap-mandatory">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl min-w-[160px] sm:min-w-[240px] h-24 sm:h-32 flex-shrink-0" />
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
      </HorizontalCardScroller>

      <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-white p-2.5 sm:p-4 shadow-sm">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        {/* Sort By Dropdown */}
        <SellerSortDropdown
          id="inventory-sort"
          value={sortBy}
          onChange={(val) => {
            setSortBy(val);
            setCurrentPage(1);
          }}
          options={[
            { label: 'Name: A-Z', value: 'name_asc' },
            { label: 'Name: Z-A', value: 'name_desc' },
            { label: 'Stock: High-Low', value: 'stock_desc' },
            { label: 'Stock: Low-High', value: 'stock_asc' },
            { label: 'Cost: High-Low', value: 'price_desc' },
            { label: 'Cost: Low-High', value: 'price_asc' },
            { label: 'Newest', value: 'newest' },
            { label: 'Oldest', value: 'oldest' },
          ]}
          ariaLabel="Sort inventory"
        />

        <div className="shrink-0 flex items-center gap-2">
          <MultiFilterPopover
            fields={FILTER_FIELDS}
            values={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Available Inventory</th>
                <th className="p-4" title="Average buying price. Updates when a purchase is received.">Average Cost</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
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
                        {categoryLabel(item.category)}
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
                            title="Stock history"
                            onClick={() => {
                              setEditingItem(item);
                              setShowMovementModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Stock history"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            title="Correct stock count"
                            onClick={() => {
                              setEditingItem(item);
                              setShowAdjustmentModal(true);
                            }}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            aria-label="Correct stock count"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
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

        {/* Mobile Inventory Card View (< md) */}
        <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {searchQuery || Object.keys(filters).length > 0 
                ? "No inventory items match your current filters." 
                : "No inventory items found."}
            </div>
          ) : (
            paginatedItems.map((item) => {
              const status = getStatus(item);
              return (
                <div key={item.id} className="pt-3 first:pt-0">
                  <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm space-y-3">
                    {/* Top Row: Title, Category Badge, Status Badge & ⋮ Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {categoryLabel(item.category)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {/* Top-right More Actions Dropdown */}
                      <div className="shrink-0">
                        <InventoryMoreActionsDropdown
                          item={item}
                          canManage={canManageInventory}
                          onMovementHistory={() => {
                            setEditingItem(item);
                            setShowMovementModal(true);
                          }}
                          onDelete={() => setDeleteConfirm(item)}
                        />
                      </div>
                    </div>

                    {/* Middle Row: Stock Count & Average Cost */}
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2 text-xs">
                      <div>
                        <p className="text-gray-500">Available Stock</p>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">
                          {item.stock} <span className="font-medium text-xs text-gray-600">{item.unit}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Average Cost</p>
                        <p className="font-semibold text-gray-800 text-sm mt-0.5">
                          {formatRupiah(item.pricePerUnit)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: At most 2 primary action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setShowAdjustmentModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#f8eee5] py-2 text-xs font-semibold text-[#d85b30] hover:bg-[#f2dfce] transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
      />

      <SupplierManagementModal
        isOpen={showSupplierModal}
        onClose={() => {
          setShowSupplierModal(false);
        }}
      />

      <PurchaseManagementModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => loadInventory()}
      />

      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        item={editingItem}
        onClose={() => {
          setShowAdjustmentModal(false);
          setEditingItem(null);
        }}
        onSuccess={() => loadInventory()}
      />

      <StockMovementModal
        isOpen={showMovementModal}
        item={editingItem}
        onClose={() => {
          setShowMovementModal(false);
          setEditingItem(null);
        }}
        onSuccess={() => loadInventory()}
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
