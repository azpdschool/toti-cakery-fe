import { useState, useEffect } from 'react';
import { X, Plus, Check, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getPurchases,
  createPurchase,
  updatePurchase,
  getPurchase,
  cancelPurchase,
  type PurchaseOut,
  type PurchaseDetailOut,
} from '@/api/purchase';
import { supplierService } from '@/services/supplierService';
import { getStockItems, type StockOut } from '@/api/stock';
import type { SupplierOut } from '@/api/supplier';
import { formatRupiah } from '@/services/productService';
import { friendlyError, purchaseStatusLabel } from '@/utils/inventoryLabels';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseManagementModal({ isOpen, onClose, onSuccess }: Props) {
  const [purchases, setPurchases] = useState<PurchaseOut[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOut[]>([]);
  const [stockItems, setStockItems] = useState<StockOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received' | 'cancelled'>('all');

  const [receivingId, setReceivingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded purchase details
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<number, PurchaseDetailOut>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ stock_item_id: '', jumlah: '', harga_total: '' }]);

  const fetchData = async (filter: 'all' | 'pending' | 'received' | 'cancelled' = statusFilter) => {
    setLoading(true);
    try {
      let onlyReceived: boolean | undefined = undefined;
      let onlyCancelled: boolean | undefined = undefined;

      if (filter === 'pending') {
        onlyReceived = false;
      } else if (filter === 'received') {
        onlyReceived = true;
      } else if (filter === 'cancelled') {
        onlyCancelled = true;
      }

      const [pData, sData, stData] = await Promise.all([
        getPurchases(onlyReceived, undefined, onlyCancelled),
        supplierService.fetchSuppliers(),
        getStockItems(),
      ]);
      setPurchases(pData);
      setSuppliers(sData);
      setStockItems(stData);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'pending' | 'received' | 'cancelled') => {
    setStatusFilter(newFilter);
    fetchData(newFilter);
  };

  useEffect(() => {
    if (isOpen) {
      fetchData(statusFilter);
      setView('list');
      setExpandedId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!expandedDetails[id]) {
      setLoadingDetails(true);
      try {
        const details = await getPurchase(id);
        setExpandedDetails(prev => ({ ...prev, [id]: details }));
      } catch (err: unknown) {
        toast.error(friendlyError(err));
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const handleReceive = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Stock will be added to your inventory. This can't be undone.")) return;
    
    setReceivingId(id);
    try {
      await updatePurchase(id, { is_received: true });
      toast.success('Purchase received. Stock updated.');
      fetchData();
      onSuccess();
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setReceivingId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }
    const validItems = items.filter(i => i.stock_item_id && i.jumlah && i.harga_total);
    
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    // 4. Peringatan Deviasi Harga (Cost Deviation Warning):
    // Hitung biaya per unit dari input (harga_total / jumlah).
    // Jika biaya per unit tersebut berbeda >= 10x dari average cost saat ini di master stock,
    // tampilkan popup konfirmasi/peringatan kepada seller.
    let hasConfirmedDeviations = false;
    const deviationNotices: string[] = [];

    for (const it of validItems) {
      const stock = stockItems.find(s => s.id === Number(it.stock_item_id));
      const currentAvg = Number(stock?.harga_per_satuan || 0);
      const qty = Number(it.jumlah.toString().replace(',', '.'));
      const total = Number(it.harga_total.toString().replace(',', '.'));

      if (qty > 0 && currentAvg > 0) {
        const unitCost = total / qty;
        const ratio = Math.max(unitCost, currentAvg) / Math.min(unitCost, currentAvg);
        if (ratio >= 10) {
          deviationNotices.push(
            `• ${stock?.nama_item || 'Item'}: Unit cost is ${formatRupiah(unitCost)}/${stock?.satuan || 'unit'}, ` +
            `differing by >= 10x from current average cost (${formatRupiah(currentAvg)}/${stock?.satuan || 'unit'}).`
          );
        }
      }
    }

    if (deviationNotices.length > 0) {
      const confirmMsg =
        `Cost Deviation Warning (>= 10x):\n\n` +
        deviationNotices.join('\n') +
        `\n\nAre you sure you want to proceed with this purchase?`;

      if (!window.confirm(confirmMsg)) {
        return;
      }
      hasConfirmedDeviations = true;
    }

    const payloadItems = validItems.map(i => {
      const stock = stockItems.find(s => s.id === Number(i.stock_item_id));
      const currentAvg = Number(stock?.harga_per_satuan || 0);
      const qty = Number(i.jumlah.toString().replace(',', '.'));
      const total = Number(i.harga_total.toString().replace(',', '.'));
      const unitCost = qty > 0 ? total / qty : 0;
      const isDeviated = currentAvg > 0 && (Math.max(unitCost, currentAvg) / Math.min(unitCost, currentAvg)) >= 10;

      const itemPayload: any = {
        stock_item_id: Number(i.stock_item_id),
        jumlah: qty,
        harga_total: total,
      };

      if (isDeviated && hasConfirmedDeviations) {
        itemPayload.confirm_cost_deviation = true;
      }

      return itemPayload;
    });

    setIsSubmitting(true);
    try {
      if (view === 'edit' && editingPurchaseId) {
        await updatePurchase(editingPurchaseId, {
          supplier_id: Number(supplierId),
          nomor_po: poNumber || undefined,
          catatan: notes || undefined,
          items: payloadItems,
        });
        toast.success('Purchase updated.');
      } else {
        await createPurchase({
          supplier_id: Number(supplierId),
          nomor_po: poNumber || undefined,
          catatan: notes || undefined,
          items: payloadItems,
        });
        toast.success('Purchase created.');
      }
      setView('list');
      setEditingPurchaseId(null);
      fetchData();
      onSuccess();
      // Reset form
      setSupplierId('');
      setPoNumber('');
      setNotes('');
      setItems([{ stock_item_id: '', jumlah: '', harga_total: '' }]);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartCreate = () => {
    setEditingPurchaseId(null);
    setSupplierId('');
    setPoNumber('');
    setNotes('');
    setItems([{ stock_item_id: '', jumlah: '', harga_total: '' }]);
    setView('create');
  };

  const handleStartEdit = async (p: PurchaseOut, e: React.MouseEvent) => {
    e.stopPropagation();
    let details = expandedDetails[p.id];
    if (!details) {
      try {
        details = await getPurchase(p.id);
        setExpandedDetails(prev => ({ ...prev, [p.id]: details }));
      } catch (err: unknown) {
        toast.error(friendlyError(err));
        return;
      }
    }

    setEditingPurchaseId(p.id);
    setSupplierId(String(p.supplier_id));
    setPoNumber(p.nomor_po || '');
    setNotes(p.catatan || '');
    if (details.items && details.items.length > 0) {
      setItems(details.items.map(it => ({
        stock_item_id: String(it.stock_item_id),
        jumlah: String(it.jumlah),
        harga_total: String(it.harga_total || '')
      })));
    } else {
      setItems([{ stock_item_id: '', jumlah: '', harga_total: '' }]);
    }
    setView('edit');
  };

  const handleCancelPurchase = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt('Enter cancellation reason (at least 3 characters):');
    if (reason === null) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast.error('Cancellation reason must be at least 3 characters.');
      return;
    }

    setCancellingId(id);
    try {
      await cancelPurchase(id, trimmed);
      toast.success('Purchase cancelled successfully.');
      fetchData();
      onSuccess();
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setCancellingId(null);
    }
  };

  const getSupplierName = (id: number) => {
    return suppliers.find(s => s.id === id)?.nama_supplier || 'Unknown Supplier';
  };

  const getStockItemName = (id: number) => {
    return stockItems.find(i => i.id === id)?.nama_item || 'Unknown Item';
  };
  
  const getStockItemUnit = (id: number) => {
    return stockItems.find(i => i.id === id)?.satuan || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-xl font-bold text-[#4b2417]">
            {view === 'list' ? 'Purchases / Restock' : view === 'edit' ? `Edit Purchase #${editingPurchaseId}` : 'New Purchase'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <>
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
                  {(['all', 'pending', 'received', 'cancelled'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleFilterChange(tab)}
                      className={`px-3 py-1.5 rounded-md capitalize transition ${
                        statusFilter === tab
                          ? 'bg-white text-[#4b2417] font-semibold shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : tab === 'received' ? 'Received' : 'Cancelled'}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleStartCreate} 
                  className="flex items-center gap-2 bg-[#d85b30] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#c04e28]"
                >
                  <Plus className="w-4 h-4" /> New Purchase
                </button>
              </div>
              {loading ? (
                <p className="text-center py-4 text-gray-500">Loading...</p>
              ) : purchases.length === 0 ? (
                <p className="text-center py-12 text-gray-500">No purchases yet.</p>
              ) : (
                <div className="space-y-4">
                  {purchases.map(p => (
                    <div key={p.id} className="border rounded-xl p-4 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer" onClick={() => toggleExpand(p.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="font-bold">{p.nomor_po ? `PO: ${p.nomor_po}` : `Purchase #${p.id}`}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              p.is_cancelled 
                                ? 'bg-red-100 text-red-700' 
                                : p.is_received 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {purchaseStatusLabel(p.is_received, p.is_cancelled)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mt-1 font-medium">{getSupplierName(p.supplier_id)}</p>
                          <p className="text-sm text-gray-600">Date: {new Date(p.tanggal_pemesanan).toLocaleDateString()}</p>
                          <p className="text-sm font-semibold mt-1 text-[#d85b30]">{formatRupiah(Number(p.total_harga))}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!p.is_received && !p.is_cancelled && (
                            <>
                              <button 
                                onClick={(e) => handleReceive(p.id, e)}
                                disabled={receivingId === p.id}
                                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                              >
                                <Check className="w-4 h-4" /> {receivingId === p.id ? 'Receiving...' : 'Mark as Received'}
                              </button>
                              <button 
                                onClick={(e) => handleStartEdit(p, e)}
                                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={(e) => handleCancelPurchase(p.id, e)}
                                disabled={cancellingId === p.id}
                                className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <div className="text-gray-400">
                            {expandedId === p.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                      
                      {expandedId === p.id && (
                        <div className="pt-4 border-t">
                          {loadingDetails && !expandedDetails[p.id] ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
                          ) : expandedDetails[p.id] ? (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-bold text-gray-800 mb-3">Items Purchased</h4>
                              <table className="w-full text-sm text-left">
                                <thead>
                                  <tr className="text-gray-500 border-b">
                                    <th className="pb-2 font-semibold">Ingredient</th>
                                    <th className="pb-2 font-semibold">Quantity</th>
                                    <th className="pb-2 font-semibold">Total Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedDetails[p.id].items.map(item => (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                                      <td className="py-2">{getStockItemName(item.stock_item_id)}</td>
                                      <td className="py-2">{Number(item.jumlah)} {getStockItemUnit(item.stock_item_id)}</td>
                                      <td className="py-2">{formatRupiah(Number(item.harga_total || (Number(item.jumlah) * Number(item.harga_satuan))))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {p.catatan && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                                  <p className="text-sm text-gray-800">{p.catatan}</p>
                                </div>
                              )}
                              {p.is_cancelled && p.cancellation_reason && (
                                <div className="mt-4 pt-3 border-t border-red-200">
                                  <p className="text-xs font-semibold text-red-500 uppercase">Cancellation Reason</p>
                                  <p className="text-sm text-red-700">{p.cancellation_reason}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-red-500">Failed to load details.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold">Supplier <span className="text-red-500">*</span></label>
                  <select required value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full mt-1 p-2 border rounded-lg text-sm">
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold">PO Number</label>
                  <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="w-full mt-1 p-2 border rounded-lg text-sm" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 p-2 border rounded-lg text-sm" placeholder="Optional" />
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Items</h3>
                  <button type="button" onClick={() => setItems([...items, { stock_item_id: '', jumlah: '', harga_total: '' }])} className="text-sm text-[#d85b30] font-semibold flex items-center"><Plus className="w-4 h-4"/> Add Item</button>
                </div>
                
                <div className="flex gap-2 mb-1 px-1">
                  <div className="flex-1 text-xs font-semibold text-gray-500">Ingredient / Stock Item</div>
                  <div className="w-28 text-xs font-semibold text-gray-500">Quantity</div>
                  <div className="w-36 text-xs font-semibold text-gray-500">Total Price (Rp)</div>
                  {items.length > 1 && <div className="w-9"></div>}
                </div>
                
                {items.map((item, idx) => {
                  const selectedStock = stockItems.find(s => String(s.id) === String(item.stock_item_id));
                  return (
                    <div key={idx} className="flex gap-2 mb-2 items-start">
                      <div className="flex-1">
                        <select required value={item.stock_item_id} onChange={e => {
                          const newItems = [...items];
                          newItems[idx].stock_item_id = e.target.value;
                          setItems(newItems);
                        }} className="w-full p-2 border rounded-lg text-sm">
                          <option value="">Select Item</option>
                          {stockItems.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.nama_item} ({inv.satuan}) - Avg Cost: {formatRupiah(Number(inv.harga_per_satuan))}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <div className="relative">
                          <input
                            required
                            type="number"
                            step="any"
                            min="0.0001"
                            placeholder="Qty"
                            value={item.jumlah}
                            onChange={e => {
                              const newItems = [...items];
                              newItems[idx].jumlah = e.target.value;
                              setItems(newItems);
                            }}
                            className="w-full p-2 border rounded-lg text-sm pr-10"
                          />
                          {selectedStock && (
                            <span className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-none">
                              {selectedStock.satuan}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-36">
                        <input
                          required
                          type="number"
                          step="any"
                          min="1"
                          placeholder="Total Price"
                          value={item.harga_total}
                          onChange={e => {
                            const newItems = [...items];
                            newItems[idx].harga_total = e.target.value;
                            setItems(newItems);
                          }}
                          className="w-full p-2 border rounded-lg text-sm"
                        />
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-5 h-5"/></button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button type="button" onClick={() => { setView('list'); setEditingPurchaseId(null); }} className="px-4 py-2 border rounded-lg font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#d85b30] text-white rounded-lg font-semibold text-sm hover:bg-[#c04e28] disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : view === 'edit' ? 'Update Purchase' : 'Create Purchase'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
