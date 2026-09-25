// src/pages/seller/SellerOrdersPage.tsx

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Download, ShoppingBag, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { MultiFilterPopover } from '@/components/ui/MultiFilterPopover';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { useToast } from '@/components/ui/Toast';
import { toast } from 'react-hot-toast';

import { formatRupiah } from '@/services/productService';
import { downloadInvoice } from '@/services/invoiceService';
import {
  getOrders,
  getOrderStats,
  addOrder,
  getOrderById,
  updateOrderStatus,
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
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-[#6f5448]">{change}</span>
      </div>
      <p className="mt-2 text-3xl font-black text-[#4b2417]">{value}</p>
      <p className="text-sm text-[#6f5448]">{title}</p>
    </div>
  );
}

// ============================================================
// KOMPONEN MODAL TAMBAH ORDER
// ============================================================

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: any) => void;
}

function AddOrderModal({ isOpen, onClose, onSave }: AddOrderModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    orderItems: [{ name: '', price: 35000, qty: 1 }],
    customDesignFee: 20000,
    deliveryMethod: 'Pickup' as DeliveryMethod,
    dueDate: '',
    notes: '',
    paymentMethod: 'DP' as PaymentMethod,
  });

  const subtotal = useMemo(() => {
    return formData.orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
  }, [formData.orderItems]);

  const total = subtotal + (formData.customDesignFee || 0);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      orderItems: [...formData.orderItems, { name: '', price: 35000, qty: 1 }],
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone) {
      toast.error('Name and WhatsApp number are required');
      return;
    }
    onSave({
      ...formData,
      total,
      items: formData.orderItems.filter((item) => item.name.trim()),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
          <h2 className="text-2xl font-black text-[#4b2417]">Add Custom Order</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Customer Name <span className="text-red-500">*</span>
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
                  WhatsApp Number <span className="text-red-500">*</span>
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
              <label className="block text-sm font-semibold text-[#4b2417]">Delivery Address <span className="text-red-500">(Optional)</span></label>
              <input
                type="text"
                placeholder="Leave blank if pickup"
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
              Custom mode: price determined by owner/admin directly. Suitable for cakes with custom design not on the standard menu.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                    <th className="pb-2 pr-4">Product Name <span className="text-red-500">*</span></th>
                    <th className="pb-2 pr-4">Unit Price <span className="text-red-500">*</span></th>
                    <th className="pb-2 pr-4">Qty <span className="text-red-500">*</span></th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.orderItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          placeholder="Custom product name"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          value={item.price ? `Rp ${item.price.toLocaleString('id-ID')}` : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            handleItemChange(idx, 'price', parseInt(raw) || 0);
                          }}
                          className="w-24 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                          className="w-16 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#d85b30]"
                        />
                      </td>
                      <td className="py-2 pr-4 font-medium text-[#4b2417]">
                        {formatRupiah((item.price || 0) * (item.qty || 1))}
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
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 text-sm font-semibold text-[#d85b30] hover:text-[#c04e28]"
            >
              + Add custom product
            </button>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6f5448]">Product Subtotal</span>
                <span className="font-semibold text-[#4b2417]">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f5448]">Design / Custom Fee <span className="text-red-500">(Optional)</span></span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={
                      formData.customDesignFee
                        ? `Rp ${formData.customDesignFee.toLocaleString('id-ID')}`
                        : '0'
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, customDesignFee: parseInt(raw) || 0 });
                    }}
                    className="w-28 rounded border border-gray-200 px-2 py-1 text-right text-sm outline-none focus:border-[#d85b30]"
                  />
                </div>
              </div>
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
                  Delivery Method <span className="text-red-500">*</span>
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
                  Date Needed <span className="text-red-500">(Optional)</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-[#d0bfaf] pl-4 pr-10 py-2 text-sm outline-none focus:border-[#d85b30]"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448] pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">Notes <span className="text-red-500">(Optional)</span></label>
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
                Payment Method <span className="text-red-500">*</span>
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
            className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
          >
            Add Order
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
}

function OrderDetailModal({ orderId, isOpen, onClose, onStatusUpdated, canManageOrders }: OrderDetailModalProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

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
      setShowRefundConfirm(false);
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

  const executeStatusUpdate = async () => {
    if (!orderId || !selectedStatus || selectedStatus === order?.status) return;
    setUpdating(true);
    setShowRefundConfirm(false);
    try {
      const updated = await updateOrderStatus(orderId, selectedStatus as OrderStatus);
      setOrder(updated);
      onStatusUpdated(updated);
      toast.success(t('seller_orders.status_updated_success'));
    } catch (err) {
      console.error(err);
      toast.error(t('seller_orders.status_updated_error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = () => {
    if (selectedStatus === 'refunded' && order?.status !== 'refunded') {
      setShowRefundConfirm(true);
    } else {
      executeStatusUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
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
                <p className="text-gray-500">{t('seller_orders.customer')}</p>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.source')}</p>
                <p className="font-semibold capitalize">{order.createdVia || 'web'}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.delivery_method')}</p>
                <p className="font-semibold">{order.method}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('seller_orders.payment_preference')}</p>
                <p className="font-semibold">{order.paymentMethod}</p>
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
              <div>
                <p className="text-gray-500">{t('seller_orders.due_date')}</p>
                <p className="font-semibold">{order.dueDate}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#4b2417] border-b pb-2 mb-2">{t('seller_orders.order_items')}</h3>
              <table className="w-full text-sm">
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

            {canManageOrders && (
              <div className="bg-gray-50 p-4 rounded-lg flex items-end gap-4 border border-gray-200">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                    {t('seller_orders.update_order_status')}
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                    disabled={updating}
                  >
                    <option value="pending">{t('seller_orders.status.pending')}</option>
                    <option value="in_process">{t('seller_orders.status.in_process')}</option>
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
                  disabled={updating || selectedStatus === order.status}
                  className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                >
                  {updating ? t('seller_orders.saving') : t('seller_orders.update_status')}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Refund Confirmation Modal */}
        {showRefundConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold text-[#4b2417]">{t('seller_orders.refund_confirm_title')}</h3>
              <p className="mb-6 text-sm text-gray-600 leading-relaxed">
                {t('seller_orders.refund_confirm_desc')}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRefundConfirm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={updating}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={executeStatusUpdate}
                  className="rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
                  disabled={updating}
                >
                  {updating ? t('seller_orders.processing') : t('seller_orders.refund_confirm_btn')}
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
// KOMPONEN UTAMA
// ============================================================



export default function SellerOrdersPage() {
  const { user } = useAuth();
  const canManageOrders = hasPermission(user?.role as UserRole, 'view_process_orders');
  const canAddOrder = hasPermission(user?.role as UserRole, 'add_manual_order');
  const canDelete = hasPermission(user?.role as UserRole, 'view_process_orders');

  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailOrderId, setSelectedDetailOrderId] = useState<string | null>(null);
  const [downloadingRowId, setDownloadingRowId] = useState<string | null>(null);

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
    setLoading(true);
    setErrorState(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let apiStatus: any = undefined;
      
      if (filterValues.status && filterValues.status !== 'All') {
        const map: Record<string, string> = {
          'Unpaid': 'belum_dibayar',
          'Confirmed': 'sudah_dikonfirmasi',
          'In Process': 'sedang_dibuat',
          'Ready': 'siap_dikirim',
          'Completed': 'selesai',
          'Cancelled': 'dibatalkan'
        };
        apiStatus = map[filterValues.status] || undefined;
      }

      const ordersData = await getOrders({ limit: itemsPerPage, offset, status: apiStatus, signal });
      setOrders(ordersData);
      setHasNextPage(ordersData.length === itemsPerPage);

      if (!stats) {
        try {
          const statsData = await getOrderStats();
          setStats(statsData);
        } catch (statsErr) {
          setStats('error');
        }
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      console.error('Failed to load orders:', error);
      setErrorState('Unable to load orders right now.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filterValues, debouncedSearch]); // Include debouncedSearch when backend supports search

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleAddOrder = async (orderData: any) => {
    try {
      await addOrder(orderData);
      showToast({ message: 'Order successfully added!', type: 'success' });
      setCurrentPage(1);
      loadData();
    } catch (error) {
      console.error('Failed to add order:', error);
      showToast({ message: 'Failed to add order.', type: 'error' });
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      belum_dibayar: { label: 'Unpaid', className: 'bg-red-100 text-red-700' },
      sudah_dikonfirmasi: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
      sedang_dibuat: { label: 'In Process', className: 'bg-yellow-100 text-yellow-700' },
      siap_dikirim: { label: 'Ready', className: 'bg-purple-100 text-purple-700' },
      selesai: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      dibatalkan: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700' },
    };
    // fallback for other strings
    const fallbacks: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-red-100 text-red-700' },
      in_process: { label: 'In Process', className: 'bg-yellow-100 text-yellow-700' },
      ready: { label: 'Ready', className: 'bg-purple-100 text-purple-700' },
      delivered: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      picked_up: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
    };
    return map[status] || fallbacks[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  // Carousel behavior
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true); // assuming true initially if multiple cards

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [stats]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -250, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 250, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-[#4b2417]">Orders</h1>
          <p className="mt-1 text-sm text-[#6f5448]">
            Manage and track customer orders, payments, and fulfilment progress.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canAddOrder && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Add Custom Order
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="relative mb-8 group">
        <div 
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Card 1 */}
          <div className="snap-start min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="Total Orders (This Month)"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.totalOrdersThisMonth : 'Loading...'}
              change=""
              icon={ShoppingBag}
              color="bg-blue-100 text-blue-600"
            />
          </div>
          {/* Card 2 */}
          <div className="snap-start min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="Completed"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.completed : 'Loading...'}
              change=""
              icon={CheckCircle}
              color="bg-green-100 text-green-600"
            />
          </div>
          {/* Card 3 */}
          <div className="snap-start min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="In Process"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.processed : 'Loading...'}
              change=""
              icon={Clock}
              color="bg-yellow-100 text-yellow-600"
            />
          </div>
          {/* Card 4 */}
          <div className="snap-start min-w-[200px] flex-1 shrink-0">
            <StatCard
              title="Waiting Confirmation"
              value={stats === 'error' ? 'Error loading stats' : stats ? stats.waitingConfirmation : 'Loading...'}
              change=""
              icon={AlertCircle}
              color="bg-red-100 text-red-600"
            />
          </div>
        </div>

        {/* Carousel Controls */}
        {canScrollLeft && (
          <button 
            onClick={scrollLeft}
            aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:text-[#d85b30] z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button 
            onClick={scrollRight}
            aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:text-[#d85b30] z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled
            title="Backend currently does not support search for orders"
          />
        </div>

        <div className="flex w-full sm:w-auto flex-wrap gap-2">
          <MultiFilterPopover
            fields={[
              {
                id: 'status',
                label: 'Status',
                options: [
                  { label: 'Unpaid', value: 'Unpaid' },
                  { label: 'Confirmed', value: 'Confirmed' },
                  { label: 'In Process', value: 'In Process' },
                  { label: 'Ready', value: 'Ready' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' }
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
                label: 'Source (Not Supported via API)',
                options: [
                  { label: 'Web', value: 'Web' },
                  { label: 'Seller', value: 'Seller' },
                  { label: 'Chatbot', value: 'Chatbot' }
                ]
              },
              {
                id: 'due_date',
                label: 'Due Date (Not Supported via API)',
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-4">Order ID</th>
                <th className="p-4">Source</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Date</th>
                <th className="p-4">Method</th>
                <th className="p-4">Due Date</th>
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
                      onClick={() => loadData()}
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <p className="text-gray-500 mb-2">
                      {Object.keys(filterValues).length > 0 
                        ? 'No orders match your current filters.'
                        : 'No orders found.'}
                    </p>
                    {Object.keys(filterValues).length > 0 && (
                      <button 
                        onClick={() => { setFilterValues({}); setCurrentPage(1); }}
                        className="text-[#d85b30] hover:underline font-medium text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 font-bold text-[#4b2417]">{order.orderNumber}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                          {order.createdVia || "Web"}
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
                          {order.method === 'Pickup' && 'Pick Up'}
                          {order.method === 'Delivery Toko' && 'Store Delivery'}
                          {order.method === 'Delivery Pihak Ketiga' && 'Third Party'}
                        </span>
                      </td>
                      <td className="p-4 text-[#6f5448] whitespace-nowrap">
                        {order.rawDueDate ? new Date(order.rawDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          {canManageOrders && (
                            <>
                              <button 
                                onClick={() => { setSelectedDetailOrderId(order.id); setShowDetailModal(true); }} 
                                className="p-1.5 text-gray-500 hover:text-[#d85b30] hover:bg-orange-50 rounded-md transition-colors"
                                aria-label="View Order"
                                title="View Order"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleQuickDownload(order.id)}
                                disabled={downloadingRowId === order.id}
                                title="Download Invoice"
                                aria-label="Download Invoice"
                                className="p-1.5 text-gray-500 hover:text-[#d85b30] hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                              >
                                {downloadingRowId === order.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              aria-label="Delete Order"
                              title="Delete Order"
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

        {/* Pagination */}
        <div className="px-4">
          <PaginationControls
            currentPage={currentPage}
            limit={itemsPerPage}
            hasNextPage={hasNextPage}
            onPageChange={setCurrentPage}
            onLimitChange={setItemsPerPage}
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
          onClose={() => { setShowDetailModal(false); setSelectedDetailOrderId(null); }}
          onStatusUpdated={(updatedOrder) => {
            setOrders(orders.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
          }}
          canManageOrders={canManageOrders}
        />
      )}
    </div>
  );
}
