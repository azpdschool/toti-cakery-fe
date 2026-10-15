import { useState, useEffect } from 'react';
import { X, Plus, Check, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPurchases, createPurchase, updatePurchase, getPurchase, type PurchaseOut, type PurchaseDetailOut } from '@/api/purchase';
import { supplierService } from '@/services/supplierService';
import { getAllInventoryOptions } from '@/services/sellerInventoryService';
import type { SupplierOut } from '@/api/supplier';
import type { InventoryOption } from '@/services/sellerInventoryService';
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
  const [inventory, setInventory] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');

  const [receivingId, setReceivingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded purchase details
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<number, PurchaseDetailOut>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create form state
  const [supplierId, setSupplierId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ stock_item_id: '', jumlah: '', harga_satuan: '' }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, sData, iData] = await Promise.all([
        getPurchases(),
        supplierService.fetchSuppliers(),
        getAllInventoryOptions()
      ]);
      setPurchases(pData);
      setSuppliers(sData);
      setInventory(iData);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }
    const payloadItems = items.filter(i => i.stock_item_id && i.jumlah && i.harga_satuan).map(i => ({
      stock_item_id: Number(i.stock_item_id),
      jumlah: Number(i.jumlah.toString().replace(',', '.')),
      harga_satuan: Number(i.harga_satuan.toString().replace(',', '.'))
    }));
    
    if (payloadItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPurchase({
        supplier_id: Number(supplierId),
        nomor_po: poNumber || undefined,
        catatan: notes || undefined,
        items: payloadItems
      });
      toast.success('Purchase created.');
      setView('list');
      fetchData();
      // Reset form
      setSupplierId('');
      setPoNumber('');
      setNotes('');
      setItems([{ stock_item_id: '', jumlah: '', harga_satuan: '' }]);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSupplierName = (id: number) => {
    return suppliers.find(s => s.id === id)?.nama_supplier || 'Unknown Supplier';
  };

  const getInventoryName = (id: number) => {
    return inventory.find(i => String(i.id) === String(id))?.name || 'Unknown Item';
  };
  
  const getInventoryUnit = (id: number) => {
    return inventory.find(i => String(i.id) === String(id))?.unit || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-xl font-bold text-[#4b2417]">{view === 'list' ? 'Purchases / Restock' : 'New Purchase'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <>
              <div className="mb-4 flex justify-end">
                <button 
                  onClick={() => setView('create')} 
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
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${p.is_received ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {purchaseStatusLabel(p.is_received)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mt-1 font-medium">{getSupplierName(p.supplier_id)}</p>
                          <p className="text-sm text-gray-600">Date: {new Date(p.tanggal_pemesanan).toLocaleDateString()}</p>
                          <p className="text-sm font-semibold mt-1 text-[#d85b30]">{formatRupiah(Number(p.total_harga))}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {!p.is_received && (
                            <button 
                              onClick={(e) => handleReceive(p.id, e)}
                              disabled={receivingId === p.id}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" /> {receivingId === p.id ? 'Receiving...' : 'Mark as Received'}
                            </button>
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
                                    <th className="pb-2 font-semibold">Price per Unit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedDetails[p.id].items.map(item => (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                                      <td className="py-2">{getInventoryName(item.stock_item_id)}</td>
                                      <td className="py-2">{Number(item.jumlah)} {getInventoryUnit(item.stock_item_id)}</td>
                                      <td className="py-2">{formatRupiah(Number(item.harga_satuan))}</td>
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
            <form onSubmit={handleCreateSubmit} className="space-y-4">
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
                  <button type="button" onClick={() => setItems([...items, { stock_item_id: '', jumlah: '', harga_satuan: '' }])} className="text-sm text-[#d85b30] font-semibold flex items-center"><Plus className="w-4 h-4"/> Add Item</button>
                </div>
                
                <div className="flex gap-2 mb-1 px-1">
                  <div className="flex-1 text-xs font-semibold text-gray-500">Ingredient</div>
                  <div className="w-24 text-xs font-semibold text-gray-500">Quantity</div>
                  <div className="w-32 text-xs font-semibold text-gray-500">Price per Unit</div>
                  {items.length > 1 && <div className="w-9"></div>}
                </div>
                
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-start">
                    <div className="flex-1">
                      <select required value={item.stock_item_id} onChange={e => {
                        const newItems = [...items];
                        newItems[idx].stock_item_id = e.target.value;
                        setItems(newItems);
                      }} className="w-full p-2 border rounded-lg text-sm">
                        <option value="">Select Item</option>
                        {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input required type="number" step="any" placeholder="Qty" value={item.jumlah} onChange={e => {
                        const newItems = [...items];
                        newItems[idx].jumlah = e.target.value;
                        setItems(newItems);
                      }} className="w-full p-2 border rounded-lg text-sm"/>
                    </div>
                    <div className="w-32">
                      <input required type="number" step="any" placeholder="Price" value={item.harga_satuan} onChange={e => {
                        const newItems = [...items];
                        newItems[idx].harga_satuan = e.target.value;
                        setItems(newItems);
                      }} className="w-full p-2 border rounded-lg text-sm"/>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-5 h-5"/></button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button type="button" onClick={() => setView('list')} className="px-4 py-2 border rounded-lg font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#d85b30] text-white rounded-lg font-semibold text-sm hover:bg-[#c04e28] disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Create Purchase'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
