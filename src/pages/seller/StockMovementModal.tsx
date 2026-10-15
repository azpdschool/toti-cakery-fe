import { useEffect, useState } from 'react';
import { X, Loader2, SlidersHorizontal } from 'lucide-react';
import { getStockMovementsService, type InventoryItem } from '@/services/sellerInventoryService';
import type { StockMovementOut } from '@/api/stock';
import { formatRupiah } from '@/services/productService';
import { friendlyError, movementTypeLabel, movementNote } from '@/utils/inventoryLabels';
import StockAdjustmentModal from './StockAdjustmentModal';

interface Props {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockMovementModal({ isOpen, item, onClose, onSuccess }: Props) {
  const [movements, setMovements] = useState<StockMovementOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const loadMovements = () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    getStockMovementsService(item.id)
      .then(setMovements)
      .catch((err: unknown) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, item]);

  const handleCorrectionSuccess = () => {
    loadMovements();
    onSuccess();
  };

  if (!isOpen || !item) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
        <div className="flex w-full max-w-3xl max-h-[80vh] flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
            <h2 className="text-xl font-bold text-[#4b2417]">Stock Details: {item.name}</h2>
            <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Current Stock</p>
                <p className="text-lg font-bold text-gray-900">{item.stock} {item.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">Average Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatRupiah(item.pricePerUnit)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAdjustmentModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Correct Stock
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin w-6 h-6 text-gray-500" /></div>}
            {error && <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>}
            {!loading && !error && movements.length === 0 && (
              <p className="text-center text-gray-500 p-4">No movements found.</p>
            )}
            {!loading && !error && movements.length > 0 && (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Change</th>
                    <th className="px-4 py-2">Cost per Unit</th>
                    <th className="px-4 py-2">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.map(m => {
                    const qty = Number(m.quantity);
                    const isPositive = qty > 0;
                    const label = movementTypeLabel(m.movement_type);
                    const note = movementNote(m);
                    
                    return (
                      <tr key={m.id}>
                        <td className="px-4 py-2 whitespace-nowrap">{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                            isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-semibold whitespace-nowrap">
                          {isPositive ? '+' : ''}{qty.toString()} {item.unit}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatRupiah(Number(m.unit_cost))}</td>
                        <td className="px-4 py-2 text-gray-600 break-words" title={note}>
                          {note}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        item={item}
        onClose={() => setShowAdjustmentModal(false)}
        onSuccess={handleCorrectionSuccess}
      />
    </>
  );
}
