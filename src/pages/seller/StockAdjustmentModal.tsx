import { useState } from 'react';
import { X } from 'lucide-react';
import { adjustStockService, type InventoryItem } from '@/services/sellerInventoryService';
import { toast } from 'react-hot-toast';
import { friendlyError } from '@/utils/inventoryLabels';

interface Props {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockAdjustmentModal({ isOpen, item, onClose, onSuccess }: Props) {
  const [quantityDiff, setQuantityDiff] = useState('');
  const [reason, setReason] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const diffNum = Number(quantityDiff.replace(',', '.'));
  const isValidDiff = !isNaN(diffNum) && diffNum !== 0 && quantityDiff !== '';
  const projectedStock = item.stock + (isValidDiff ? diffNum : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantityDiff || !reason.trim()) {
      toast.error('Quantity difference and reason are required.');
      return;
    }

    if (!isValidDiff) {
      toast.error('Quantity difference cannot be zero or invalid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustStockService(
        item.id,
        diffNum,
        reason,
        unitCost ? Number(unitCost.replace(',', '.')) : undefined
      );
      toast.success('Stock corrected.');
      onSuccess();
      onClose();
      // reset form
      setQuantityDiff('');
      setReason('');
      setUnitCost('');
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-xl font-bold text-[#4b2417]">Adjust Stock</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Item: <span className="font-normal">{item.name}</span></p>
            <p className="text-sm font-semibold text-gray-700">Current Stock: <span className="font-normal">{item.stock} {item.unit}</span></p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Stock Change (+/-) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="any"
              value={quantityDiff}
              onChange={(e) => setQuantityDiff(e.target.value)}
              placeholder="e.g. -2 or 3"
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter -2 if 2 are missing, +3 if you found 3 extra. This is the change, not the new total.
            </p>
            {isValidDiff && (
              <p className="text-sm font-bold text-green-700 mt-2">
                Stock after correction: {projectedStock} {item.unit}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Reason <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Spilled, Expired, Stock Opname"
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4b2417]">Average Cost (Optional)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              title="Average buying price. Updates when a purchase is received."
              placeholder="Leave empty if N/A"
              className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 p-6 shrink-0">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-60">
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
