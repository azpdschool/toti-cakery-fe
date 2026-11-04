import React, { useState } from 'react';
import { X, Loader2, AlertCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DecimalInput } from '@/components/ui/DecimalInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import {
  createStockItem,
  type StockCreate,
  type StockOut,
  type StockUnitApi,
  type StockCategoryApi,
} from '@/api/stock';

interface QuickAddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStockItem: StockOut) => void;
}

const UNIT_OPTIONS: { value: StockUnitApi; label: string }[] = [
  { value: 'gram', label: 'gram (g)' },
  { value: 'kg', label: 'kilogram (kg)' },
  { value: 'ml', label: 'milliliter (ml)' },
  { value: 'liter', label: 'liter (l)' },
  { value: 'pcs', label: 'pieces (pcs - e.g. butir, box)' },
];

const CATEGORY_OPTIONS: { value: StockCategoryApi; label: string }[] = [
  { value: 'bahan_baku', label: 'Raw Material / Ingredient' },
  { value: 'kemasan', label: 'Packaging' },
];

export default function QuickAddStockModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickAddStockModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockCategoryApi>('bahan_baku');
  const [unit, setUnit] = useState<StockUnitApi>('gram');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setCategory('bahan_baku');
    setUnit('gram');
    setStock('');
    setMinStock('');
    setPricePerUnit('');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Item Name is required.');
      return;
    }

    const stockNum = parseFloat(stock.replace(',', '.')) || 0;
    const minStockNum = parseFloat(minStock.replace(',', '.')) || 0;
    const priceNum = parseFloat(pricePerUnit.replace(',', '.')) || 0;

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Available Stock must be a valid number >= 0.');
      return;
    }
    if (isNaN(minStockNum) || minStockNum < 0) {
      setError('Minimum Stock Threshold must be a valid number >= 0.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Unit Cost must be a valid number >= 0.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: StockCreate = {
      nama_item: trimmedName,
      kategori: category,
      satuan: unit,
      stok_tersedia: stockNum,
      alert_min_stok: minStockNum,
      harga_per_satuan: priceNum,
    };

    try {
      const created = await createStockItem(payload);
      toast.success(`Inventory item "${created.nama_item}" successfully registered!`);
      resetForm();
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create stock item on-the-fly:', err);
      const detail = err.response?.data?.detail;
      const errorMsg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d).join(', ')
          : 'Failed to create inventory item. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff4ed] text-[#d85b30]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4b2417]">
                Register New Inventory Item
              </h3>
              <p className="text-xs text-gray-500">
                Add missing raw material or packaging on-the-fly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tepung Terigu Protein Tinggi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2 text-sm text-[#4b2417] outline-none transition focus:border-[#d85b30] focus:ring-2 focus:ring-[#d85b30]/20"
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StockCategoryApi)}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2 text-sm text-[#4b2417] outline-none transition focus:border-[#d85b30] focus:ring-2 focus:ring-[#d85b30]/20"
                  disabled={submitting}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as StockUnitApi)}
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2 text-sm text-[#4b2417] outline-none transition focus:border-[#d85b30] focus:ring-2 focus:ring-[#d85b30]/20"
                  disabled={submitting}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                  Initial Stock
                </label>
                <DecimalInput
                  value={stock}
                  onChange={(_val, raw) => setStock(raw)}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2 text-sm text-[#4b2417] outline-none transition focus:border-[#d85b30] focus:ring-2 focus:ring-[#d85b30]/20"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                  Min. Threshold
                </label>
                <DecimalInput
                  value={minStock}
                  onChange={(_val, raw) => setMinStock(raw)}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2 text-sm text-[#4b2417] outline-none transition focus:border-[#d85b30] focus:ring-2 focus:ring-[#d85b30]/20"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4b2417] mb-1">
                  Unit Cost (Rp)
                </label>
                <CurrencyInput
                  value={pricePerUnit}
                  onChange={(val, raw) => setPricePerUnit(raw ? String(val) : '')}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2 text-sm text-[#4b2417] outline-none transition focus:border-[#d85b30] focus:ring-2 focus:ring-[#d85b30]/20"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d85b30] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#c04e28] transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Save & Select</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
