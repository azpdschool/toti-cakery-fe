// src/pages/seller/SellerOrdersPage.tsx

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  Trash2,
  Search,
  Plus,
  X,
  ChevronDown,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Download, ShoppingBag,
  CreditCard, RotateCcw,
  MoreVertical, ExternalLink,
  XCircle,
  Loader2,
} from 'lucide-react';
import { MultiFilterPopover } from '@/components/ui/MultiFilterPopover';
import { SellerSortDropdown } from '@/components/ui/SellerSortDropdown';
import { HorizontalCardScroller } from '@/components/common/HorizontalCardScroller';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrdersDueTodaySection } from '@/components/seller/OrdersDueTodaySection';
import { useToast } from '@/components/ui/Toast';
import { toast } from 'react-hot-toast';
import { DecimalInput } from '@/components/ui/DecimalInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import {
  formatSellerOrderStatus,
  formatSellerDeliveryMethod,
  formatSellerPaymentPreference,
  formatSellerSource,
} from '@/utils/labelSanitizer';
import { formatDateToLocalYYYYMMDD, getJakartaDateParts } from '@/utils/date';

import { formatRupiah, getActiveProducts, type SimpleProduct } from '@/services/productService';
import { getStockItems, type StockOut } from '@/api/stock';
import { downloadInvoice } from '@/services/invoiceService';
import {
  getOrders,
  getOrderStats,
  addOrder,
  getOrderById,
  updateOrderStatus,
  createManualPayment,
  updateOrderFulfillmentDate,
  refundOrder,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type DeliveryMethod,
} from '@/services/sellerOrderService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';

// ============================================================
// KOMPONEN STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: number | string;
  change: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-3.5 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-[10px] sm:text-xs font-medium text-[#6f5448]">{change}</span>
      </div>
      <p className="mt-1.5 sm:mt-2 text-xl sm:text-3xl font-black text-[#4b2417] truncate" title={String(value)}>{value}</p>
      <p className="text-xs sm:text-sm text-[#6f5448] truncate">{title}</p>
    </div>
  );
}

// ============================================================
// KOMPONEN MODAL TAMBAH ORDER
// ============================================================

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: any) => Promise<void>;
}

function AddOrderModal({ isOpen, onClose, onSave }: AddOrderModalProps) {
  const [availableProducts, setAvailableProducts] = useState<SimpleProduct[]>([]);
  const [availableStock, setAvailableStock] = useState<StockOut[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { minDateStr, maxDateStr } = useMemo(() => {
    const parts = getJakartaDateParts();
    const minD = new Date(parts.year, parts.month - 1, parts.day + 1);
    const maxD = new Date(parts.year, parts.month - 1, parts.day + 30);
    return {
      minDateStr: formatDateToLocalYYYYMMDD(minD),
      maxDateStr: formatDateToLocalYYYYMMDD(maxD),
    };
  }, []);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    orderItems: [{ product_id: '' as string | number, qty: 1, custom_decoration_charge: 0 }],
    accessories: [] as { stock_item_id: string | number; quantity: number }[],
    deliveryMethod: 'Pickup' as DeliveryMethod,
    fulfillmentDate: '',
    notes: '',
    paymentMethod: 'DP' as PaymentMethod,
  });

  useEffect(() => {
    if (!isOpen) {
      setSubmitError(null);
      setIsSubmitting(false);
      return;
    }
    let isMounted = true;
    Promise.all([
      getActiveProducts().catch(() => []),
      getStockItems().catch(() => []),
    ]).then(([prods, stock]) => {
      if (isMounted) {
        setAvailableProducts(prods);
        setAvailableStock(stock);
      }
    });
    setFormData(prev => ({
      ...prev,
      fulfillmentDate: prev.fulfillmentDate || minDateStr,
    }));
    return () => { isMounted = false; };
  }, [isOpen, minDateStr]);

  const itemsSubtotal = useMemo(() => {
    return formData.orderItems.reduce((sum, item) => {
      const prod = availableProducts.find(p => String(p.backendId) === String(item.product_id));
      const basePrice = prod?.price || 0;
      return sum + basePrice * (item.qty || 1);
    }, 0);
  }, [formData.orderItems, availableProducts]);

  const decoSubtotal = useMemo(() => {
    return formData.orderItems.reduce((sum, item) => {
      return sum + (Number(item.custom_decoration_charge) || 0);
    }, 0);
  }, [formData.orderItems]);

  const accessoriesSubtotal = useMemo(() => {
    return formData.accessories.reduce((sum, acc) => {
      const stock = availableStock.find(s => String(s.id) === String(acc.stock_item_id));
      const unitCost = Number(stock?.harga_per_satuan) || 0;
      return sum + unitCost * (Number(acc.quantity) || 1);
    }, 0);
  }, [formData.accessories, availableStock]);

  const total = itemsSubtotal + decoSubtotal + accessoriesSubtotal;

  const handleAddItem = () => {
    setFormData({
      ...formData,
      orderItems: [...formData.orderItems, { product_id: '', qty: 1, custom_decoration_charge: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.orderItems.length <= 1) return;
    setFormData({
      ...formData,
      orderItems: formData.orderItems.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, orderItems: updated });
  };

  const handleAddAccessory = () => {
    setFormData({
      ...formData,
      accessories: [...formData.accessories, { stock_item_id: '', quantity: 1 }],
    });
  };

  const handleRemoveAccessory = (index: number) => {
    setFormData({
      ...formData,
      accessories: formData.accessories.filter((_, i) => i !== index),
    });
  };

  const handleAccessoryChange = (index: number, field: string, value: any) => {
    const updated = [...formData.accessories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, accessories: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast.error('Name and WhatsApp number are required');
      return;
    }
    if (formData.deliveryMethod !== 'Pickup' && !formData.address.trim()) {
      toast.error('Delivery address is required for delivery orders');
      return;
    }
    const validItems = formData.orderItems.filter(item => item.product_id !== '');
    if (validItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    for (const item of validItems) {
      if (!item.qty || item.qty < 1) {
        toast.error('Product quantity must be at least 1');
        return;
      }
    }
    if (!formData.fulfillmentDate) {
      toast.error('Fulfillment date is required');
      return;
    }
    if (formData.fulfillmentDate < minDateStr || formData.fulfillmentDate > maxDateStr) {
      toast.error(`Fulfillment date must be between ${minDateStr} (D+1) and ${maxDateStr} (D+30)`);
      return;
    }
    const validAccessories = formData.accessories
      .filter(a => a.stock_item_id !== '')
      .map(a => ({
        stock_item_id: Number(a.stock_item_id),
        quantity: Number(a.quantity) || 1,
      }));

    for (const acc of validAccessories) {
      if (!acc.quantity || acc.quantity < 1) {
        toast.error('Accessory quantity must be at least 1');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_address: formData.address,
        metode_pengiriman: formData.deliveryMethod === 'Pickup' ? 'pickup' : 'delivery',
        payment_method_preference: formData.paymentMethod === 'LUNAS' ? 'full' : 'dp',
        notes: formData.notes,
        fulfillment_date: `${formData.fulfillmentDate}T12:00:00+07:00`,
        items: validItems.map(item => ({
          product_id: Number(item.product_id),
          qty: Number(item.qty),
          custom_decoration_charge: Number(item.custom_decoration_charge || 0),
        })),
        accessories: validAccessories,
      });
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || (d.loc ? `${d.loc[d.loc.length - 1]}: ${d.msg}` : JSON.stringify(d))).join(', ')
          : (err?.message || 'Failed to add custom order.');
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <form onSubmit={handleSubmit} className="flex max-h-[90dvh] sm:max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-6 shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-[#4b2417]">Add Custom Order</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {submitError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Failed to add order</p>
                <p className="mt-0.5 text-xs sm:text-sm text-red-700 leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Customer Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  WhatsApp Number <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="mt-1 flex w-full overflow-hidden rounded-lg border border-[#d0bfaf] focus-within:border-[#d85b30] bg-white">
                  <select className="w-16 shrink-0 cursor-pointer border-r border-[#d0bfaf] bg-gray-50 px-2 text-sm outline-none">
                    <option>+62</option>
                  </select>
                  <input
                    type="text"
                    placeholder="82115835793"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">
                Delivery Address{' '}
                {formData.deliveryMethod !== 'Pickup' ? (
                  <span className="text-red-500 ml-0.5">*</span>
                ) : (
                  <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                )}
              </label>
              <input
                type="text"
                placeholder={formData.deliveryMethod !== 'Pickup' ? 'Enter full delivery destination address' : 'Leave blank if pickup'}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Order Type
            </h3>
            <p className="mb-3 text-xs text-[#6f5448]">
              Custom order: select active catalog products and set custom decoration charges if needed.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                    <th className="pb-2 pr-4">Product Name <span className="text-red-500 ml-0.5">*</span></th>
                    <th className="pb-2 pr-4">Unit Price</th>
                    <th className="pb-2 pr-4">Qty <span className="text-red-500 ml-0.5">*</span></th>
                    <th className="pb-2 pr-4">Deco Charge <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span></th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.orderItems.map((item, idx) => {
                    const prod = availableProducts.find(p => String(p.backendId) === String(item.product_id));
                    const basePrice = prod?.price || 0;
                    const itemTotal = basePrice * (item.qty || 1) + (Number(item.custom_decoration_charge) || 0);
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 pr-4">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                          >
                            <option value="">Select product...</option>
                            {availableProducts.map((p) => (
                              <option key={p.backendId} value={p.backendId}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-4 text-xs text-[#6f5448]">
                          {prod ? formatRupiah(basePrice) : '-'}
                        </td>
                        <td className="py-2 pr-4">
                          <DecimalInput
                            maxDecimals={0}
                            min={1}
                            value={item.qty}
                            onChange={(val) => handleItemChange(idx, 'qty', val || 1)}
                            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <CurrencyInput
                            value={item.custom_decoration_charge || ''}
                            onChange={(val) => {
                              handleItemChange(idx, 'custom_decoration_charge', val);
                            }}
                            placeholder="0"
                            className="w-24 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                          />
                        </td>
                        <td className="py-2 pr-4 font-medium text-[#4b2417]">
                          {formatRupiah(itemTotal)}
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 text-sm font-semibold text-[#d85b30] hover:text-[#c04e28]"
            >
              + Add product item
            </button>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Accessories <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
            </h3>
            <p className="mb-3 text-xs text-[#6f5448]">
              Additional stock items like candles, sprinkles, or toppers from inventory.
            </p>
            {formData.accessories.length > 0 && (
              <div className="overflow-x-auto mb-2">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                      <th className="pb-2 pr-4">Stock Item</th>
                      <th className="pb-2 pr-4">Qty</th>
                      <th className="pb-2 pr-4">Cost</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.accessories.map((acc, idx) => {
                      const stock = availableStock.find(s => String(s.id) === String(acc.stock_item_id));
                      const unitCost = Number(stock?.harga_per_satuan) || 0;
                      return (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 pr-4">
                            <select
                              value={acc.stock_item_id}
                              onChange={(e) => handleAccessoryChange(idx, 'stock_item_id', e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                            >
                              <option value="">Select stock item...</option>
                              {availableStock.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nama_item} ({s.satuan}) - {formatRupiah(s.harga_per_satuan)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-4">
                            <DecimalInput
                              maxDecimals={0}
                              min={1}
                              value={acc.quantity}
                              onChange={(val) => handleAccessoryChange(idx, 'quantity', val || 1)}
                              className="w-20 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                            />
                          </td>
                          <td className="py-2 pr-4 font-medium text-[#4b2417]">
                            {formatRupiah(unitCost * (acc.quantity || 1))}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveAccessory(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <button
              type="button"
              onClick={handleAddAccessory}
              className="text-sm font-semibold text-[#d85b30] hover:text-[#c04e28]"
            >
              + Add accessory
            </button>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6f5448]">Product Subtotal</span>
                <span className="font-semibold text-[#4b2417]">{formatRupiah(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f5448]">Decoration Charges</span>
                <span className="font-semibold text-[#4b2417]">{formatRupiah(decoSubtotal)}</span>
              </div>
              {formData.accessories.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6f5448]">Accessories Subtotal</span>
                  <span className="font-semibold text-[#4b2417]">{formatRupiah(accessoriesSubtotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-[#4b2417]">
                <span>Total Order</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Delivery & Notes
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Delivery Method <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative mt-1">
                  <select
                    value={formData.deliveryMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryMethod: e.target.value as DeliveryMethod,
                      })
                    }
                    className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 pr-8 text-sm outline-none focus:border-[#d85b30] appearance-none"
                  >
                    <option value="Pickup">Pickup (at store)</option>
                    <option value="Delivery Toko">Delivery (by store)</option>
                    <option value="Delivery Pihak Ketiga">Delivery (Gojek/Grab)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Fulfillment Date <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    min={minDateStr}
                    max={maxDateStr}
                    value={formData.fulfillmentDate}
                    onChange={(e) => setFormData({ ...formData, fulfillmentDate: e.target.value })}
                    className="w-full rounded-lg border border-[#d0bfaf] pl-4 pr-10 py-2 text-sm outline-none focus:border-[#d85b30]"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448] pointer-events-none" />
                </div>
                <p className="mt-1 text-xs text-[#6f5448]">Minimum D+1 and maximum D+30</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">Notes <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span></label>
              <textarea
                rows={2}
                placeholder="Special instructions for colors, cake, etc..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>
          </section>

          <section className="mb-4">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Payment
            </h3>
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Payment Method <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative mt-1 max-w-xs">
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 pr-8 text-sm outline-none focus:border-[#d85b30] appearance-none"
                >
                  <option value="DP">DP</option>
                  <option value="LUNAS">FULL PAYMENT</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448]" />
              </div>
              <p className="mt-2 text-xs text-[#6f5448]">
                Once saved, an invoice is automatically created and can be sent to customer's WA.
              </p>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Adding Order...' : 'Add Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// KOMPONEN MODAL DETAIL ORDER
// ============================================================

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedOrder: Order) => void;
  canManageOrders: boolean;
  loadData?: () => void | Promise<void>;
}

function isOrderOverdue(order?: Order | null): boolean {
  if (!order) return false;
  const terminal = ['completed', 'cancelled', 'refunded', 'delivered', 'picked_up', 'cancelled_settlement_expired'];
  if (terminal.includes(order.status)) return false;
  const fDate = order.rawFulfillmentDate || order.fulfillment_date;
  if (!fDate) return false;
  const isPast = new Date(fDate).getTime() < Date.now();
  const invStatus = order.invoiceStatus || order.invoice?.status || order.paymentStatus;
  return isPast && (invStatus === 'partial' || invStatus === 'paid');
}

function OrderDetailModal({ orderId, isOpen, onClose, onStatusUpdated, canManageOrders, loadData }: OrderDetailModalProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [countdownStr, setCountdownStr] = useState<string | null>(null);

  // Manual payment state
  const [showManualPaymentForm, setShowManualPaymentForm] = useState(false);
  const [manualPaymentAmount, setManualPaymentAmount] = useState<string | number>('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [manualPaymentNotes, setManualPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fulfillment date state
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newFulfillmentDate, setNewFulfillmentDate] = useState('');
  const [updatingDate, setUpdatingDate] = useState(false);

  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  const { minDateStr, maxDateStr } = useMemo(() => {
    const parts = getJakartaDateParts();
    const minD = new Date(parts.year, parts.month - 1, parts.day + 1);
    const maxD = new Date(parts.year, parts.month - 1, parts.day + 30);
    return {
      minDateStr: formatDateToLocalYYYYMMDD(minD),
      maxDateStr: formatDateToLocalYYYYMMDD(maxD),
    };
  }, []);

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    setIsDownloading(true);
    try {
      await downloadInvoice(orderId);
    } catch (err: any) {
      toast.error(err.message || t('orders.invoice_download_failed'));
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      setError('');
      setShowManualPaymentForm(false);
      setIsEditingDate(false);
      setShowRefundModal(false);
      getOrderById(orderId)
        .then(data => {
          setOrder(data);
          setSelectedStatus(data.status);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(t('seller_orders.failed_load_details'));
          setLoading(false);
        });
    }
  }, [isOpen, orderId, t]);

  useEffect(() => {
    const expiresAt = order?.payment_expires_at || (order as any)?.paymentExpiresAt;
    const invStatus = order?.invoiceStatus || order?.invoice?.status || order?.paymentStatus;
    const isAwaitingPayment = invStatus === 'unpaid' && order?.status === 'pending';

    if (!expiresAt || !isAwaitingPayment) {
      setCountdownStr(null);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      if (diff <= 0) {
        setCountdownStr('00:00');
        if (orderId) {
          getOrderById(orderId)
            .then((refreshed) => {
              setOrder(refreshed);
              onStatusUpdated(refreshed);
            })
            .catch(console.error);
        }
        return false;
      }
      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      if (hours > 0) {
        setCountdownStr(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      } else {
        setCountdownStr(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
      return true;
    };

    const hasTime = updateTimer();
    if (!hasTime) return;

    const interval = setInterval(() => {
      const continueTimer = updateTimer();
      if (!continueTimer) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.payment_expires_at, (order as any)?.paymentExpiresAt, order?.invoiceStatus, order?.invoice?.status, order?.paymentStatus, order?.status, orderId, onStatusUpdated]);

  const canEditFulfillmentDate = canManageOrders && !!order && !['completed', 'cancelled', 'refunded', 'picked_up', 'delivered'].includes(order.status);

  const isFullyPaid = order?.amountDue !== undefined ? order.amountDue === 0 : (order?.paymentStatus === 'paid' || order?.invoiceStatus === 'paid');
  const isOrderCancelledOrRefunded = order?.status === 'cancelled' || order?.status === 'refunded';
  const canRecordPayment = canManageOrders && !!order && !isOrderCancelledOrRefunded && !isFullyPaid;

  const isPaidOrDp = (order?.amountPaid !== undefined && order.amountPaid > 0) ||
    (order?.paymentStatus && ['paid', 'dp', 'settlement', 'capture'].includes(order.paymentStatus.toLowerCase())) ||
    (order?.invoiceStatus && ['paid', 'dp', 'partially_paid'].includes(order.invoiceStatus.toLowerCase()));
  const canRefundOrder = canManageOrders && !!order && isPaidOrDp && !['delivered', 'picked_up', 'completed', 'refunded', 'cancelled_settlement_expired'].includes(order.status);

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    const amt = Number(manualPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Payment amount must be greater than 0.');
      return;
    }
    setSubmittingPayment(true);
    try {
      await createManualPayment({
        order_id: orderId,
        amount: amt,
        payment_method: manualPaymentMethod,
        notes: manualPaymentNotes.trim() || undefined,
      });
      toast.success('Manual payment recorded successfully.');
      setShowManualPaymentForm(false);
      setManualPaymentNotes('');
      const updated = await getOrderById(orderId);
      setOrder(updated);
      setSelectedStatus(updated.status);
      onStatusUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to record manual payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUpdateFulfillmentDate = async () => {
    if (!orderId || !newFulfillmentDate) return;
    setUpdatingDate(true);
    try {
      const payload = {
        fulfillment_date: newFulfillmentDate.includes('T')
          ? newFulfillmentDate
          : `${newFulfillmentDate}T12:00:00+07:00`,
      };
      const updated = await updateOrderFulfillmentDate(orderId, payload);
      setOrder(updated);
      onStatusUpdated(updated);
      setIsEditingDate(false);
      toast.success('Fulfillment date updated successfully.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update fulfillment date.');
    } finally {
      setUpdatingDate(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!orderId || !refundReason.trim()) {
      toast.error('Please enter a reason for the refund.');
      return;
    }
    setProcessingRefund(true);
    try {
      const payload: { reason: string; amount?: number } = {
        reason: refundReason.trim(),
      };
      if (refundAmount && Number(refundAmount) > 0) {
        payload.amount = Number(refundAmount);
      }
      const res = await refundOrder(orderId, payload);
      toast.success(res.message || 'Order refund processed successfully.');
      setShowRefundModal(false);
      setRefundReason('');
      setRefundAmount('');
      const updated = await getOrderById(orderId);
      setOrder(updated);
      setSelectedStatus(updated.status);
      onStatusUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to process refund.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const isDownPaymentInsufficient = !!order && (order.amountPaid || 0) < (order.total * 0.5);

  const executeStatusUpdate = async () => {
    if (!orderId || !selectedStatus || selectedStatus === order?.status) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(orderId, selectedStatus as OrderStatus);
      setOrder(updated);
      onStatusUpdated(updated);
      toast.success(t('seller_orders.status_updated_success'));
    } catch (err: any) {
      console.error(err);
      const is409 = err?.response?.status === 409 || err?.status === 409;
      if (is409) {
        if (order?.status) {
          setSelectedStatus(order.status);
        }
        if (loadData) {
          loadData();
        }
        if (orderId) {
          getOrderById(orderId)
            .then((refreshed) => {
              setOrder(refreshed);
              setSelectedStatus(refreshed.status);
            })
            .catch(console.error);
        }
      }
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || err?.message || t('seller_orders.status_updated_error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = () => {
    if (selectedStatus === 'in_process' && isDownPaymentInsufficient) {
      toast.error('Cannot update status to In Process: minimum 50% down payment is required.');
      return;
    }
    if (selectedStatus === 'refunded' && order?.status !== 'refunded') {
      setRefundReason('');
      setRefundAmount(order?.amountPaid ? String(order.amountPaid) : '');
      setShowRefundModal(true);
    } else {
      executeStatusUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="max-h-[90dvh] sm:max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[#4b2417]">{t('seller_orders.order_details')}</h2>
            {order && (
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex items-center gap-1.5 rounded-lg border border-[#d85b30] bg-white px-3 py-1.5 text-xs font-semibold text-[#d85b30] transition hover:bg-[#fff9f6] disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d85b30] border-t-transparent" />
                    {t('seller_orders.downloading')}
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    {t('seller_orders.download_invoice')}
                  </>
                )}
              </button>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : order ? (
          <div className="space-y-6">
            {countdownStr && (
              <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 shadow-sm">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-amber-800">Awaiting Customer Payment: </span>
                  <span>Payment window expires in <strong className="font-mono text-sm text-amber-950 font-black">{countdownStr}</strong></span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t('seller_orders.order_id')}</p>
                <p className="font-bold text-[#4b2417]">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.date')}</p>
                <p className="font-semibold">{order.date} {order.time}</p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500">Fulfillment Date</p>
                  {canEditFulfillmentDate && !isEditingDate && (
                    <button
                      type="button"
                      onClick={() => {
                        const defaultVal = order.rawFulfillmentDate
                          ? order.rawFulfillmentDate.slice(0, 10)
                          : (order.fulfillment_date ? order.fulfillment_date.slice(0, 10) : minDateStr);
                        setNewFulfillmentDate(defaultVal);
                        setIsEditingDate(true);
                      }}
                      className="text-xs font-semibold text-[#d85b30] hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingDate ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      min={minDateStr}
                      max={maxDateStr}
                      value={newFulfillmentDate}
                      onChange={(e) => setNewFulfillmentDate(e.target.value)}
                      className="rounded border border-[#d0bfaf] px-2 py-1 text-xs outline-none focus:border-[#d85b30]"
                      disabled={updatingDate}
                    />
                    <button
                      type="button"
                      onClick={handleUpdateFulfillmentDate}
                      disabled={updatingDate || !newFulfillmentDate}
                      className="rounded bg-[#d85b30] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                    >
                      {updatingDate ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingDate(false)}
                      disabled={updatingDate}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-[#d85b30]">
                      {order.rawFulfillmentDate || order.fulfillment_date ? new Date((order.rawFulfillmentDate || order.fulfillment_date)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (order.fulfillmentDate || '-')}
                    </p>
                    {isOrderOverdue(order) && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                          Overdue
                        </span>
                        {order.fulfillment_overdue_notified_at && (
                          <span className="text-xs text-red-600 font-medium">Overdue alert sent</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.customer')}</p>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.source')}</p>
                <p className="font-semibold">{formatSellerSource(order.createdVia || (order as any).created_via)}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.delivery_method')}</p>
                <p className="font-semibold">{formatSellerDeliveryMethod(order.method)}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.payment_preference')}</p>
                <p className="font-semibold">{formatSellerPaymentPreference(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.payment_status')}</p>
                <p className="font-semibold">
                  {order.amountPaid !== undefined
                    ? order.amountDue === 0 
                      ? t('seller_orders.paid') 
                      : order.amountPaid > 0 
                        ? t('seller_orders.dp') 
                        : t('seller_orders.unpaid')
                    : t('seller_orders.unpaid')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.notes')}</p>
                <p className="font-semibold">{order.notes || '-'}</p>
              </div>
            </div>

            {/* Delivery Recipient & Destination Details */}
            {(order.deliveryAddress || order.recipientName || order.recipientPhone || order.address || order.method !== 'Pickup') && (
              <div className="rounded-xl border border-[#ead8ca] bg-[#fbf8f5] p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#4b2417] text-sm">
                  <Truck className="h-4 w-4 text-[#d85b30]" />
                  <span>Delivery Recipient & Destination</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-500">Recipient:</span>{' '}
                    <span className="font-semibold text-stone-800">{order.recipientName || order.customerName || '-'}</span>
                    {(order.recipientPhone || order.customerPhone) && (
                      <span className="text-gray-500 ml-1">({order.recipientPhone || order.customerPhone})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span>{' '}
                    <span className="font-semibold text-stone-800">{formatSellerDeliveryMethod(order.method)}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Address:</span>{' '}
                    <span className="font-medium text-stone-800">{order.deliveryAddress || order.address || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof Preview if uploaded */}
            {(order.payment_proof || (order as any).paymentProof || (order as any).bukti_pembayaran) && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Customer Payment Proof Uploaded</span>
                  </div>
                  <a
                    href={(order.payment_proof || (order as any).paymentProof || (order as any).bukti_pembayaran)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    View Full Image <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-emerald-300 bg-white shadow-xs">
                  <img
                    src={(order.payment_proof || (order as any).paymentProof || (order as any).bukti_pembayaran)!}
                    alt="Payment Proof"
                    className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open((order.payment_proof || (order as any).paymentProof || (order as any).bukti_pembayaran)!, '_blank')}
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold text-[#4b2417] border-b pb-2 mb-2">{t('seller_orders.order_items')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2">{t('seller_orders.product')}</th>
                      <th className="pb-2 text-right">{t('seller_orders.price')}</th>
                      <th className="pb-2 text-center">{t('seller_orders.qty')}</th>
                      <th className="pb-2 text-right">{t('seller_orders.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map(item => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">{item.productName}</td>
                        <td className="py-2 text-right">{formatRupiah(item.price)}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right font-medium">{formatRupiah(item.total)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-[#4b2417]">
                      <td colSpan={3} className="py-3 text-right">{t('seller_orders.total_due')}</td>
                      <td className="py-3 text-right">{formatRupiah(order.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Record Manual Payment Section */}
            {canRecordPayment && (
              <div className="rounded-xl border border-[#ead8ca] bg-[#fbf8f5] p-4">
                {!showManualPaymentForm ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#4b2417]">Manual Payment</p>
                      <p className="text-xs text-gray-500">Record cash or bank transfer payment received from customer.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const initialAmt = order.amountDue !== undefined && order.amountDue > 0
                          ? order.amountDue
                          : Math.max(0, order.total - (order.amountPaid || 0));
                        setManualPaymentAmount(initialAmt > 0 ? initialAmt : '');
                        setShowManualPaymentForm(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-[#d85b30] bg-white px-3 py-1.5 text-xs font-semibold text-[#d85b30] hover:bg-[#fff9f6] transition shadow-sm"
                    >
                      <CreditCard className="h-4 w-4" />
                      Record Manual Payment
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-center justify-between border-b border-[#ead8ca] pb-2">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-[#4b2417]">
                        <CreditCard className="h-4 w-4 text-[#d85b30]" />
                        Record Manual Payment
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowManualPaymentForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={submittingPayment}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <form onSubmit={handleRecordManualPayment} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Payment Amount (Rp) <span className="text-red-500">*</span>
                          </label>
                          <CurrencyInput
                            required
                            value={manualPaymentAmount}
                            onChange={(val, raw) => setManualPaymentAmount(raw ? String(val) : '')}
                            placeholder="e.g. 50.000"
                            className="w-full rounded-lg border border-[#d0bfaf] px-3 py-1.5 text-xs outline-none focus:border-[#d85b30]"
                            disabled={submittingPayment}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Payment Method <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={manualPaymentMethod}
                            onChange={(e) => setManualPaymentMethod(e.target.value as 'CASH' | 'TRANSFER')}
                            className="w-full rounded-lg border border-[#d0bfaf] px-3 py-1.5 text-xs outline-none focus:border-[#d85b30]"
                            disabled={submittingPayment}
                          >
                            <option value="CASH">Cash</option>
                            <option value="TRANSFER">Bank Transfer</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Notes <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={manualPaymentNotes}
                          onChange={(e) => setManualPaymentNotes(e.target.value)}
                          placeholder="e.g. Paid in cash at store / BCA Transfer ref #123"
                          className="w-full rounded-lg border border-[#d0bfaf] px-3 py-1.5 text-xs outline-none focus:border-[#d85b30]"
                          disabled={submittingPayment}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowManualPaymentForm(false)}
                          disabled={submittingPayment}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingPayment}
                          className="rounded-lg bg-[#d85b30] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                        >
                          {submittingPayment ? 'Recording...' : 'Submit Payment'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {canManageOrders && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
                {isDownPaymentInsufficient && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">50% Down Payment Required</p>
                      <p className="mt-0.5 text-amber-800">
                        At least 50% down payment ({formatRupiah(order.total * 0.5)}) must be paid before moving this order to In Process. (Current paid: {formatRupiah(order.amountPaid || 0)})
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                      {t('seller_orders.update_order_status')}
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        const val = e.target.value as OrderStatus;
                        if (val === 'in_process' && isDownPaymentInsufficient) {
                          toast.error('Cannot select In Process: at least 50% down payment is required.');
                          return;
                        }
                        setSelectedStatus(val);
                      }}
                      className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                      disabled={updating}
                    >
                      <option value="pending">{t('seller_orders.status.pending')}</option>
                      <option value="in_process" disabled={isDownPaymentInsufficient}>
                        {t('seller_orders.status.in_process')}{isDownPaymentInsufficient ? ' (Min. 50% DP Required)' : ''}
                      </option>
                      <option value="ready">{t('seller_orders.status.ready')}</option>
                      <option value="delivered">{t('seller_orders.status.delivered')}</option>
                      <option value="picked_up">{t('seller_orders.status.picked_up')}</option>
                      <option value="completed">{t('seller_orders.status.completed')}</option>
                      <option value="cancelled">{t('seller_orders.status.cancelled')}</option>
                      <option value="refunded">{t('seller_orders.status.refunded')}</option>
                    </select>
                  </div>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || selectedStatus === order.status || (selectedStatus === 'in_process' && isDownPaymentInsufficient)}
                    className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                  >
                    {updating ? t('seller_orders.saving') : t('seller_orders.update_status')}
                  </button>
                </div>

                {canRefundOrder && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Need to return funds for this paid order?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRefundReason('');
                        setRefundAmount(order.amountPaid ? String(order.amountPaid) : '');
                        setShowRefundModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Refund Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Refund Modal */}
        {showRefundModal && order && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-xl font-bold text-[#4b2417] flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                  Refund Order
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  disabled={processingRefund}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800">
                Refunding this order will cancel the order (if active), reverse reserved stock, and initiate refund processing.
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-gray-500">Order:</span>{' '}
                    <span className="font-semibold">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount Paid:</span>{' '}
                    <span className="font-semibold text-green-700">
                      {formatRupiah(order.amountPaid || order.total)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Refund Reason <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter reason for refund..."
                    className="w-full rounded-lg border border-[#d0bfaf] p-2.5 text-xs outline-none focus:border-[#d85b30]"
                    disabled={processingRefund}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Refund Amount (Rp) <span className="text-xs font-normal text-stone-400 ml-1">(Optional - Leave blank for full amount)</span>
                  </label>
                  <CurrencyInput
                    value={refundAmount}
                    onChange={(val, raw) => setRefundAmount(raw ? String(val) : '')}
                    placeholder={`Full amount: ${order.amountPaid || order.total}`}
                    className="w-full rounded-lg border border-[#d0bfaf] px-3 py-1.5 text-xs outline-none focus:border-[#d85b30]"
                    disabled={processingRefund}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={processingRefund}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessRefund}
                  disabled={processingRefund || !refundReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {processingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN ORDER MORE ACTIONS DROPDOWN (MOBILE & DESKTOP)
// ============================================================

interface OrderMoreActionsDropdownProps {
  order: Order;
  canManage: boolean;
  isDownloading: boolean;
  openUpward?: boolean;
  onDownloadInvoice: () => void;
  onCancelOrder?: () => void;
}

function OrderMoreActionsDropdown({
  order,
  canManage,
  isDownloading,
  openUpward = false,
  onDownloadInvoice,
  onCancelOrder,
}: OrderMoreActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`rounded-lg p-1.5 transition-colors ${
          isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`}
        title={`More actions for order ${order.orderNumber}`}
        aria-label={`More actions for order ${order.orderNumber}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } w-48 rounded-xl bg-white p-1.5 shadow-xl border border-gray-100 ring-1 ring-black/5 z-50 text-left focus:outline-none`}
        >
          {canManage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDownloadInvoice();
              }}
              disabled={isDownloading}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-[#d85b30] transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d85b30] border-t-transparent shrink-0" />
              ) : (
                <Download className="h-4 w-4 text-gray-500 shrink-0" />
              )}
              <span>Download Invoice</span>
            </button>
          )}

          {canManage && onCancelOrder && (
            <>
              {canManage && <div className="my-1 border-t border-gray-100" />}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onCancelOrder();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>Cancel Order</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// KOMPONEN QUICK STATUS UPDATE MODAL
// ============================================================

interface OrderQuickStatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedOrder: Order) => void;
  onOpenFullDetail: (orderId: string) => void;
  initialStatus?: OrderStatus;
}

function OrderQuickStatusModal({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
  onOpenFullDetail,
  initialStatus,
}: OrderQuickStatusModalProps) {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedStatus(initialStatus || order.status);
    }
  }, [order, initialStatus]);

  if (!isOpen || !order) return null;

  const isDownPaymentInsufficient = (order.amountPaid || 0) < (order.total * 0.5);
  const statusBadge = formatSellerOrderStatus(order);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === order.status) {
      onClose();
      return;
    }

    if (selectedStatus === 'in_process' && isDownPaymentInsufficient) {
      toast.error('Cannot update status to In Process: minimum 50% down payment is required.');
      return;
    }

    if (selectedStatus === 'refunded') {
      toast('Please process refund in Order Details to record amount and reason.', { icon: 'ℹ️' });
      onClose();
      onOpenFullDetail(order.id);
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, selectedStatus);
      onStatusUpdated(updated);
      toast.success(t('seller_orders.status_updated_success'));
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        t('seller_orders.status_updated_error')
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#4b2417]">Update Order Status</h3>
            <p className="text-xs text-gray-500">Order {order.orderNumber} • {order.customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs">
          <span className="text-gray-500 font-medium">Current Status:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Status Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select New Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                const val = e.target.value as OrderStatus;
                if (val === 'in_process' && isDownPaymentInsufficient) {
                  toast.error('Cannot select In Process: at least 50% down payment is required.');
                  return;
                }
                setSelectedStatus(val);
              }}
              disabled={updating}
              className="w-full rounded-xl border border-[#d0bfaf] bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
            >
              <option value="pending">{t('seller_orders.status.pending')}</option>
              <option value="in_process" disabled={isDownPaymentInsufficient}>
                {t('seller_orders.status.in_process')}{isDownPaymentInsufficient ? ' (Min. 50% DP Required)' : ''}
              </option>
              <option value="ready">{t('seller_orders.status.ready')}</option>
              <option value="delivered">{t('seller_orders.status.delivered')}</option>
              <option value="picked_up">{t('seller_orders.status.picked_up')}</option>
              <option value="completed">{t('seller_orders.status.completed')}</option>
              <option value="cancelled">{t('seller_orders.status.cancelled')}</option>
              <option value="refunded">{t('seller_orders.status.refunded')}</option>
            </select>
          </div>

          {selectedStatus === 'in_process' && isDownPaymentInsufficient && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Customer has not made the minimum 50% down payment required to set this order in process.</span>
            </div>
          )}

          {selectedStatus === 'refunded' && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800 border border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Refunding will open the Order Details modal to enter refund amount and reason.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || selectedStatus === order.status || (selectedStatus === 'in_process' && isDownPaymentInsufficient)}
              className="flex-1 rounded-xl bg-[#d85b30] py-2.5 text-xs font-semibold text-white hover:bg-[#c04e28] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {updating ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Status</span>
              )}
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



export default function SellerOrdersPage() {
  const { user } = useAuth();
  const canManageOrders = hasPermission(user?.role as UserRole, 'view_process_orders');
  const canAddOrder = hasPermission(user?.role as UserRole, 'add_manual_order');

  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const requestIdRef = useRef(0);
  
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [dueTodayRefreshKey, setDueTodayRefreshKey] = useState(0);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailOrderId, setSelectedDetailOrderId] = useState<string | null>(null);
  const [downloadingRowId, setDownloadingRowId] = useState<string | null>(null);
  const [quickStatusOrder, setQuickStatusOrder] = useState<Order | null>(null);
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [quickStatusInitialStatus, setQuickStatusInitialStatus] = useState<OrderStatus | undefined>(undefined);

  const isTerminalStatus = useCallback((status: OrderStatus) => {
    return ['completed', 'cancelled', 'refunded', 'delivered', 'picked_up', 'cancelled_settlement_expired'].includes(status);
  }, []);

  const handleOpenQuickStatus = useCallback((order: Order, initialStatus?: OrderStatus) => {
    setQuickStatusOrder(order);
    setQuickStatusInitialStatus(initialStatus || order.status);
    setShowQuickStatusModal(true);
  }, []);

  const handleOpenQuickCancel = useCallback((order: Order) => {
    const isPaid = (order.amountPaid !== undefined && order.amountPaid > 0) ||
      (order.paymentStatus && ['paid', 'settlement', 'capture'].includes(order.paymentStatus.toLowerCase())) ||
      (order.invoiceStatus && ['paid', 'partially_paid'].includes(order.invoiceStatus.toLowerCase()));
    if (isPaid) {
      toast('Paid orders must be refunded. Opening order details...', { icon: 'ℹ️' });
      setSelectedDetailOrderId(order.id);
      setShowDetailModal(true);
      return;
    }
    handleOpenQuickStatus(order, 'cancelled');
  }, [handleOpenQuickStatus]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-linking: auto-open order detail modal if orderId query param exists
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setSelectedDetailOrderId(orderIdParam);
      setShowDetailModal(true);
    }
  }, [searchParams]);

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(prev => {
        if (prev !== searchQuery) {
          setCurrentPage(1);
        }
        return searchQuery;
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setErrorState(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let apiStatus: string | undefined = undefined;
      
      if (filterValues.status && filterValues.status !== 'All') {
        const map: Record<string, string> = {
          'Unpaid': 'pending',
          'Pending': 'pending',
          'Confirmed': 'pending',
          'In Process': 'in_process',
          'in_process': 'in_process',
          'Ready': 'ready',
          'ready': 'ready',
          'Delivered': 'delivered',
          'delivered': 'delivered',
          'Picked Up': 'picked_up',
          'picked_up': 'picked_up',
          'Completed': 'completed',
          'completed': 'completed',
          'Cancelled': 'cancelled',
          'cancelled': 'cancelled',
          'Settlement Expired': 'cancelled_settlement_expired',
          'cancelled_settlement_expired': 'cancelled_settlement_expired',
          'Refunded': 'refunded',
          'refunded': 'refunded',
        };
        apiStatus = map[filterValues.status] || undefined;
      }

      const ordersData = await getOrders({
        limit: itemsPerPage + 1,
        offset,
        status: apiStatus,
        signal,
      });

      // Ignore stale responses or aborted requests
      if (signal?.aborted || currentRequestId !== requestIdRef.current) {
        return;
      }

      const hasNext = ordersData.length > itemsPerPage;
      const pageOrders = ordersData.slice(0, itemsPerPage);

      // Dedupe rows by order id before rendering
      const seenIds = new Set<string>();
      const dedupedOrders: Order[] = [];
      for (const order of pageOrders) {
        const idStr = String(order.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          dedupedOrders.push(order);
        }
      }

      setOrders(dedupedOrders);
      setHasNextPage(hasNext);

      if (!statsRef.current) {
        try {
          const statsData = await getOrderStats();
          if (!signal?.aborted && currentRequestId === requestIdRef.current) {
            statsRef.current = statsData;
            setStats(statsData);
          }
        } catch {
          if (!signal?.aborted && currentRequestId === requestIdRef.current) {
            setStats('error');
          }
        }
      }
    } catch (error: unknown) {
      if (signal?.aborted || currentRequestId !== requestIdRef.current) return;
      const err = error as { name?: string; code?: string } | undefined;
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('Failed to load orders:', error);
      setErrorState('Unable to load orders right now.');
    } finally {
      if (!signal?.aborted && currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, itemsPerPage, filterValues.status]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      // 1. Filter Source:
      // 'Web' hanya menampilkan order dengan created_via === "web"
      // 'Chatbot' hanya menampilkan order dengan created_via === "chatbot"
      if (filterValues.source && filterValues.source !== 'All') {
        const orderSource = (order.createdVia || (order as any).created_via || '').toLowerCase();
        const selectedSource = filterValues.source.toLowerCase();
        if (selectedSource === 'web' && orderSource !== 'web') {
          return false;
        }
        if (selectedSource === 'chatbot' && orderSource !== 'chatbot') {
          return false;
        }
        if (!['web', 'chatbot'].includes(selectedSource) && orderSource !== selectedSource) {
          return false;
        }
      }

      // 2. Filter Fulfillment Date:
      if (filterValues.fulfillment_date) {
        const orderFulfillmentDate = order.rawFulfillmentDate || order.fulfillment_date;
        if (!orderFulfillmentDate || String(orderFulfillmentDate).trim() === '' || String(orderFulfillmentDate).toLowerCase() === 'null') {
          return false;
        }
        const filterDate = filterValues.fulfillment_date.trim();
        const rawDateStr = String(orderFulfillmentDate).trim();
        
        let matches = false;
        if (rawDateStr.startsWith(filterDate)) {
          matches = true;
        } else {
          matches = formatDateToLocalYYYYMMDD(rawDateStr) === filterDate;
        }
        if (!matches) {
          return false;
        }
      }

      // Filter search query
      if (debouncedSearch && debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchOrderNum = order.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = order.customerName?.toLowerCase().includes(q);
        const matchPhone = order.customerPhone?.toLowerCase().includes(q);
        if (!matchOrderNum && !matchCustomer && !matchPhone) {
          return false;
        }
      }

      return true;
    });

    switch (sortBy) {
      case 'oldest':
        result = [...result].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        break;
      case 'total_desc':
        result = [...result].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
        break;
      case 'total_asc':
        result = [...result].sort((a, b) => (Number(a.total) || 0) - (Number(b.total) || 0));
        break;
      case 'customer_asc':
        result = [...result].sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''));
        break;
      case 'customer_desc':
        result = [...result].sort((a, b) => (b.customerName || '').localeCompare(a.customerName || ''));
        break;
      case 'newest':
      default:
        result = [...result].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        break;
    }

    // Dedupe rows by order id before rendering to reduce duplicates caused by non-deterministic backend ordering
    const seenResultIds = new Set<string>();
    const dedupedResult: Order[] = [];
    for (const order of result) {
      const idStr = String(order.id);
      if (!seenResultIds.has(idStr)) {
        seenResultIds.add(idStr);
        dedupedResult.push(order);
      }
    }

    return dedupedResult;
  }, [orders, filterValues.source, filterValues.fulfillment_date, debouncedSearch, sortBy]);

  const handleAddOrder = async (orderData: any) => {
    try {
      await addOrder(orderData);
      showToast({ message: 'Order successfully added!', type: 'success' });
      setCurrentPage(1);
      loadData();
      setDueTodayRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Failed to add order:', error);
      const detail = error?.response?.data?.detail;
      const errorMessage = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || (d.loc ? `${d.loc[d.loc.length - 1]}: ${d.msg}` : JSON.stringify(d))).join(', ')
          : (error?.message || 'Failed to add order.');
      showToast({ message: errorMessage, type: 'error' });
      throw error;
    }
  };

  const handleQuickDownload = async (orderId: string) => {
    setDownloadingRowId(orderId);
    try {
      await downloadInvoice(orderId);
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to download invoice.', type: 'error' });
    } finally {
      setDownloadingRowId(null);
    }
  };

  const getStatusBadge = (orderOrStatus: Order | string) => {
    return formatSellerOrderStatus(orderOrStatus);
  };


  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Orders"
        description="Manage and track customer orders, payments, and fulfilment progress."
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        actions={
          <div className="flex w-full sm:w-auto items-center gap-3">
            {canAddOrder && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
              >
                <Plus className="h-4 w-4" />
                Add Custom Order
              </button>
            )}
          </div>
        }
      />

      {/* Orders Due Today Section - Urgent Di Atas KPI Summary Cards */}
      <OrdersDueTodaySection
        refreshKey={dueTodayRefreshKey}
        onOrderClick={(orderId) => {
          setSelectedDetailOrderId(orderId);
          setShowDetailModal(true);
        }}
      />

      {/* KPI Summary Cards */}
      <div className="mb-6 sm:mb-8">
        <HorizontalCardScroller scrollContainerClassName="gap-3 sm:gap-4 pb-2 snap-mandatory">
          {/* Card 1 */}
          <div className="snap-start min-w-[160px] sm:min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="Total Orders (This Month)"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.totalOrdersThisMonth : 'Loading...'}
              change=""
              icon={ShoppingBag}
              color="bg-blue-100 text-blue-600"
            />
          </div>
          {/* Card 2 */}
          <div className="snap-start min-w-[160px] sm:min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="Completed"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.completed : 'Loading...'}
              change=""
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
          </div>
          {/* Card 3 */}
          <div className="snap-start min-w-[160px] sm:min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="In Process"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.processed : 'Loading...'}
              change=""
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
            />
          </div>
          {/* Card 4 */}
          <div className="snap-start min-w-[160px] sm:min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="Waiting Confirmation"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.waitingConfirmation : 'Loading...'}
              change=""
              icon={AlertCircle}
              color="bg-red-100 text-red-600"
            />
          </div>
        </HorizontalCardScroller>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center gap-2 sm:gap-3 rounded-xl bg-white p-2.5 sm:p-4 shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-3 text-xs sm:text-sm outline-none focus:border-[#d85b30]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled
            title="Backend currently does not support search for orders"
          />
        </div>

        {/* Sort By Dropdown */}
        <SellerSortDropdown
          id="order-sort"
          value={sortBy}
          onChange={(val) => {
            setSortBy(val);
            setCurrentPage(1);
          }}
          options={[
            { label: 'Newest', value: 'newest' },
            { label: 'Oldest', value: 'oldest' },
            { label: 'Total: High-Low', value: 'total_desc' },
            { label: 'Total: Low-High', value: 'total_asc' },
            { label: 'Customer: A-Z', value: 'customer_asc' },
            { label: 'Customer: Z-A', value: 'customer_desc' },
          ]}
          ariaLabel="Sort orders"
        />

        <div className="shrink-0 flex items-center gap-2">
          <MultiFilterPopover
            fields={[
              {
                id: 'status',
                label: 'Status',
                options: [
                  { label: 'Unpaid / Pending', value: 'Unpaid' },
                  { label: 'In Process', value: 'In Process' },
                  { label: 'Ready', value: 'Ready' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' },
                  { label: 'Settlement Expired', value: 'Settlement Expired' },
                  { label: 'Refunded', value: 'Refunded' }
                ]
              },
              {
                id: 'payment_method',
                label: 'Payment Method (Not Supported via API)',
                options: [
                  { label: 'QRIS', value: 'QRIS' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' }
                ]
              },
              {
                id: 'source',
                label: 'Source',
                options: [
                  { label: 'Web', value: 'Web' },
                  { label: 'Chatbot', value: 'Chatbot' }
                ]
              },
              {
                id: 'fulfillment_date',
                label: 'Fulfillment Date',
                type: 'date'
              }
            ]}
            values={filterValues}
            onChange={(vals) => {
              setFilterValues(vals);
              setCurrentPage(1);
            }}
            onClear={() => {
              setFilterValues({});
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-4">Order ID</th>
                <th className="p-4">Source</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Date</th>
                <th className="p-4">Method</th>
                <th className="p-4">Fulfillment Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {errorState ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center">
                    <p className="text-[#6f5448] mb-4">{errorState}</p>
                    <button 
                      onClick={() => {
                        loadData();
                        setDueTodayRefreshKey(prev => prev + 1);
                      }}
                      className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : loading ? (
                // Skeletons
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-12 bg-gray-200 rounded-full"></div></td>
                    <td className="p-4">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    </td>
                    <td className="p-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                    <td className="p-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="p-4"><div className="h-5 w-20 bg-gray-200 rounded-full"></div></td>
                    <td className="p-4"><div className="h-6 w-16 bg-gray-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <p className="text-gray-500 mb-2">
                      {Object.keys(filterValues).length > 0 || debouncedSearch
                        ? 'No orders match your current filters.'
                        : 'No orders found.'}
                    </p>
                    {(Object.keys(filterValues).length > 0 || debouncedSearch) && (
                      <button 
                        onClick={() => { setFilterValues({}); setSearchQuery(''); setCurrentPage(1); }}
                        className="text-[#d85b30] hover:underline font-medium text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const statusBadge = getStatusBadge(order);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 font-bold text-[#4b2417]">{order.orderNumber}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {formatSellerSource(order.createdVia || (order as any).created_via)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-[#4b2417] line-clamp-1">{order.customerName}</p>
                        <p className="text-xs text-[#8b7166]">{order.customerPhone}</p>
                      </td>
                      <td className="p-4 font-medium text-[#4b2417] whitespace-nowrap">
                        {formatRupiah(order.total)}
                      </td>
                      <td className="p-4 text-[#6f5448] whitespace-nowrap">{order.date}</td>
                      <td className="p-4 text-[#6f5448]">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <Truck className="h-3.5 w-3.5 text-gray-400" />
                          {formatSellerDeliveryMethod(order.method)}
                        </span>
                      </td>
                      <td className="p-4 text-[#6f5448] whitespace-nowrap">
                        {order.rawFulfillmentDate
                          ? new Date(order.rawFulfillmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : (order.fulfillmentDate || 'Not set')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                          {isOrderOverdue(order) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManageOrders && (
                            <>
                              {/* Direct Action 1: View Details */}
                              <button 
                                type="button"
                                onClick={() => { setSelectedDetailOrderId(order.id); setShowDetailModal(true); }} 
                                className="p-1.5 text-gray-500 hover:text-[#d85b30] hover:bg-orange-50 rounded-lg transition-colors"
                                aria-label={`View Details for order ${order.orderNumber}`}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Direct Action 2: Update Status */}
                              <button
                                type="button"
                                onClick={() => handleOpenQuickStatus(order)}
                                className="p-1.5 text-gray-500 hover:text-[#d85b30] hover:bg-orange-50 rounded-lg transition-colors"
                                aria-label={`Update Status for order ${order.orderNumber}`}
                                title="Update Status"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* Overflow Menu: More Actions (Download Invoice, Cancel Order) */}
                          <OrderMoreActionsDropdown
                            order={order}
                            canManage={canManageOrders}
                            isDownloading={downloadingRowId === order.id}
                            openUpward={index >= filteredOrders.length - 2 && filteredOrders.length > 2}
                            onDownloadInvoice={() => handleQuickDownload(order.id)}
                            onCancelOrder={!isTerminalStatus(order.status) ? () => handleOpenQuickCancel(order) : undefined}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Orders Card View */}
        <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
          {errorState ? (
            <div className="py-8 text-center bg-white rounded-xl p-4">
              <p className="text-[#6f5448] mb-4">{errorState}</p>
              <button 
                onClick={() => {
                  loadData();
                  setDueTodayRefreshKey(prev => prev + 1);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl p-4">
              <p className="text-gray-500 mb-2">
                {Object.keys(filterValues).length > 0 || debouncedSearch
                  ? 'No orders match your current filters.'
                  : 'No orders found.'}
              </p>
              {(Object.keys(filterValues).length > 0 || debouncedSearch) && (
                <button 
                  onClick={() => { setFilterValues({}); setSearchQuery(''); setCurrentPage(1); }}
                  className="text-[#d85b30] hover:underline font-medium text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusBadge = getStatusBadge(order);
              return (
                <div key={order.id} className="pt-3 first:pt-0">
                  <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm space-y-3">
                    {/* Top Row: Order ID + Source badge + Status badge & ⋮ Dropdown */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-sm">{order.orderNumber}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                            {formatSellerSource(order.createdVia || (order as any).created_via)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          {isOrderOverdue(order) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Top-right More Actions Dropdown */}
                      <div className="shrink-0">
                        <OrderMoreActionsDropdown
                          order={order}
                          canManage={canManageOrders}
                          isDownloading={downloadingRowId === order.id}
                          openUpward={index >= filteredOrders.length - 2 && filteredOrders.length > 2}
                          onDownloadInvoice={() => handleQuickDownload(order.id)}
                          onCancelOrder={!isTerminalStatus(order.status) ? () => handleOpenQuickCancel(order) : undefined}
                        />
                      </div>
                    </div>

                    {/* Middle Row: Customer Name, Phone Details, Delivery Method, Fulfillment Date, Total Price */}
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-50 pt-2.5 text-xs">
                      {/* Left Column: Customer Name, Phone Details, Delivery Method */}
                      <div className="min-w-0 space-y-1">
                        <div>
                          <span className="text-[11px] text-gray-500 block font-medium">Customer</span>
                          <p className="font-semibold text-gray-900 text-sm truncate" title={order.customerName}>
                            {order.customerName}
                          </p>
                          <p className="text-xs text-[#8b7166] truncate">
                            {order.customerPhone}
                          </p>
                        </div>
                        <div className="pt-1 flex items-center gap-1.5 text-gray-600">
                          <Truck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-xs truncate">
                            {formatSellerDeliveryMethod(order.method)}
                          </span>
                        </div>
                      </div>

                      {/* Right Column: Total Price and Fulfillment Date */}
                      <div className="min-w-0 text-right space-y-1">
                        <div>
                          <span className="text-[11px] text-gray-500 block font-medium">Total Amount</span>
                          <p className="font-bold text-base text-[#4b2417] tracking-tight">
                            {formatRupiah(order.total)}
                          </p>
                        </div>
                        <div className="pt-1">
                          <span className="text-[11px] text-gray-500 block">Fulfillment Date</span>
                          <p className="font-semibold text-xs text-gray-800">
                            {order.rawFulfillmentDate
                              ? new Date(order.rawFulfillmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : (order.fulfillmentDate || 'Not set')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: At most 2 primary action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDetailOrderId(order.id);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Detail</span>
                      </button>

                      {canManageOrders && (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStatus(order)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#f8eee5] py-2 text-xs font-semibold text-[#d85b30] hover:bg-[#f2dfce] transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Update Status</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="px-4">
          <PaginationControls
            currentPage={currentPage}
            limit={itemsPerPage}
            hasNextPage={hasNextPage}
            onPageChange={setCurrentPage}
            onLimitChange={(newLimit) => {
              setItemsPerPage(newLimit);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {canAddOrder && (
        <AddOrderModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddOrder}
        />
      )}

      {showDetailModal && selectedDetailOrderId && (
        <OrderDetailModal
          orderId={selectedDetailOrderId}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDetailOrderId(null);
            if (searchParams.has('orderId')) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('orderId');
              setSearchParams(newParams, { replace: true });
            }
          }}
          onStatusUpdated={(updatedOrder) => {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
            setDueTodayRefreshKey(prev => prev + 1);
          }}
          canManageOrders={canManageOrders}
          loadData={loadData}
        />
      )}

      {showQuickStatusModal && quickStatusOrder && (
        <OrderQuickStatusModal
          order={quickStatusOrder}
          isOpen={showQuickStatusModal}
          initialStatus={quickStatusInitialStatus}
          onClose={() => {
            setShowQuickStatusModal(false);
            setQuickStatusOrder(null);
            setQuickStatusInitialStatus(undefined);
          }}
          onStatusUpdated={(updatedOrder) => {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
            loadData();
            setDueTodayRefreshKey(prev => prev + 1);
          }}
          onOpenFullDetail={(orderId) => {
            setSelectedDetailOrderId(orderId);
            setShowDetailModal(true);
          }}
        />
      )}
    </div>
  );
}
