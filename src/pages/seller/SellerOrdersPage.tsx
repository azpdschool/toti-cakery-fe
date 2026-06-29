// src/pages/seller/SellerOrdersPage.tsx

import { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  X,
  ChevronDown,
  Calendar,
  MessageCircle,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import {
  getOrders,
  getOrderStats,
  addOrder,
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
      alert('Nama dan nomor WhatsApp wajib diisi');
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
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#4b2417]">Tambah Pesanan Custom</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Informasi Customer
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Nama Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama customer"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <select className="absolute left-0 top-0 h-full rounded-l-lg border border-r-0 border-[#d0bfaf] bg-gray-50 px-2 text-sm outline-none focus:border-[#d85b30]">
                    <option>+62</option>
                  </select>
                  <input
                    type="text"
                    placeholder="82115835793"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full rounded-lg border border-[#d0bfaf] pl-14 pr-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">Alamat Penerima</label>
              <input
                type="text"
                placeholder="Kosongkan jika diambil / pickup"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-2 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Tipe Order
            </h3>
            <p className="mb-3 text-xs text-[#6f5448]">
              Mode custom: harga ditentukan owner/admin langsung. Cocok untuk kue dengan desain
              khusus yang tidak ada di menu standar.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                    <th className="pb-2 pr-4">Nama Produk</th>
                    <th className="pb-2 pr-4">Harga Satuan</th>
                    <th className="pb-2 pr-4">Qty</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.orderItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          placeholder="Nama produk custom"
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
              + Tambah produk custom
            </button>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6f5448]">Subtotal produk</span>
                <span className="font-semibold text-[#4b2417]">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f5448]">Biaya desain / custom</span>
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
                <span>Total pesanan</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Pengiriman & catatan
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Metode pengiriman
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
                    <option value="Pickup">Pickup (diambil di toko)</option>
                    <option value="Delivery Toko">Delivery (diantar toko)</option>
                    <option value="Delivery Pihak Ketiga">Delivery (Gojek/Grab)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4b2417]">
                  Tanggal dibutuhkan
                </label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448]" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#4b2417]">Catatan</label>
              <textarea
                rows={2}
                placeholder="Instruksi khusus warna, kue, dsb..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#d0bfaf] px-4 py-2 text-sm outline-none focus:border-[#d85b30]"
              />
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-4 text-sm font-bold text-[#6f5448] uppercase tracking-wider">
              Pembayaran
            </h3>
            <div>
              <label className="block text-sm font-semibold text-[#4b2417]">
                Metode pembayaran
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
                  <option value="LUNAS">LUNAS</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f5448]" />
              </div>
              <p className="mt-2 text-xs text-[#6f5448]">
                Setelah disimpan, invoice otomatis dibuat dan bisa dikirim ke WA customer.
              </p>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#d85b30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              Tambah Order
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
  const userRole = user?.role as UserRole;

  const canAddOrder = hasPermission(userRole, 'add_manual_order');
  const canManageOrders = hasPermission(userRole, 'view_process_orders');
  const canDelete = hasPermission(userRole, 'delete_data');

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterMethod, setFilterMethod] = useState('Semua Metode');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ordersData, statsData] = await Promise.all([getOrders(), getOrderStats()]);
        setOrders(ordersData);
        setStats(statsData);
      } catch (error) {
        console.error('Gagal memuat data pesanan:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }
    if (filterStatus !== 'Semua Status') {
      const statusMap: Record<OrderStatus, string> = {
        belum_dibayar: 'Belum Dibayar',
        sudah_dikonfirmasi: 'Sudah Dikonfirmasi',
        sedang_dibuat: 'Sedang Dibuat',
        siap_dikirim: 'Siap Dikirim',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
      };
      result = result.filter((o) => statusMap[o.status] === filterStatus);
    }
    if (filterMethod !== 'Semua Metode') {
      result = result.filter((o) => o.method === filterMethod);
    }
    return result;
  }, [orders, searchQuery, filterStatus, filterMethod]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { label: string; className: string }> = {
      belum_dibayar: { label: 'Belum Dibayar', className: 'bg-gray-100 text-gray-700' },
      sudah_dikonfirmasi: { label: 'Sudah Dikonfirmasi', className: 'bg-blue-100 text-blue-700' },
      sedang_dibuat: { label: 'Sedang Dibuat', className: 'bg-yellow-100 text-yellow-700' },
      siap_dikirim: { label: 'Siap Dikirim', className: 'bg-purple-100 text-purple-700' },
      selesai: { label: 'Selesai', className: 'bg-green-100 text-green-700' },
      dibatalkan: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700' },
    };
    return map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  const handleAddOrder = async (orderData: any) => {
    try {
      const newOrder = await addOrder(orderData);
      setOrders([newOrder, ...orders]);
      alert('Pesanan berhasil ditambahkan! Invoice otomatis dibuat.');
    } catch (error) {
      alert('Gagal menambahkan pesanan.');
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Order (Bulan Ini)"
          value={stats?.totalOrdersThisMonth || 0}
          change={stats?.ordersChange || ''}
          icon={DollarSign}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Selesai"
          value={stats?.completed || 0}
          change={stats?.completedChange || ''}
          icon={CheckCircle}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Diproses"
          value={stats?.processed || 0}
          change={stats?.processedChange || ''}
          icon={Clock}
          color="bg-yellow-50 text-yellow-700"
        />
        <StatCard
          title="Menunggu Konfirmasi"
          value={stats?.waitingConfirmation || 0}
          change={stats?.waitingChange || ''}
          icon={AlertCircle}
          color="bg-orange-50 text-orange-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Cari ID order, nama pelanggan, atau nomor WA"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="Sudah Dikonfirmasi">Sudah Dikonfirmasi</option>
            <option value="Sedang Dibuat">Sedang Dibuat</option>
            <option value="Siap Dikirim">Siap Dikirim</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            <option value="Semua Metode">Semua Metode</option>
            <option value="Pickup">Pick Up</option>
            <option value="Delivery Toko">Delivery (Toko)</option>
            <option value="Delivery Pihak Ketiga">Delivery (Pihak Ketiga)</option>
          </select>

          {canAddOrder && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              Tambah Pesanan
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="pb-3 pr-4">ID ORDER</th>
                <th className="pb-3 pr-4">PELANGGAN</th>
                <th className="pb-3 pr-4">TOTAL</th>
                <th className="pb-3 pr-4">TANGGAL</th>
                <th className="pb-3 pr-4">METODE</th>
                <th className="pb-3 pr-4">JATUH TEMPO</th>
                <th className="pb-3 pr-4">STATUS</th>
                <th className="pb-3">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-[#6f5448]">
                    Tidak ada pesanan ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-bold text-[#4b2417]">{order.orderNumber}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#4b2417]">{order.customerName}</p>
                        <p className="text-xs text-[#8b7166]">{order.customerPhone}</p>
                      </td>
                      <td className="py-3 pr-4 font-medium text-[#4b2417]">
                        {formatRupiah(order.total)}
                      </td>
                      <td className="py-3 pr-4 text-[#6f5448]">{order.date}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6f5448]">
                          <Truck className="h-3 w-3" />
                          {order.method === 'Pickup' && 'Pick Up'}
                          {order.method === 'Delivery Toko' && 'Delivery (Toko)'}
                          {order.method === 'Delivery Pihak Ketiga' && 'Third Party'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[#6f5448]">{order.dueDate}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {canManageOrders && (
                            <>
                              <button className="rounded p-1 text-[#6f5448] hover:bg-gray-100">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="rounded p-1 text-[#6f5448] hover:bg-gray-100">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="rounded p-1 text-[#25D366] hover:bg-green-50">
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button className="rounded p-1 text-red-500 hover:bg-red-50">
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
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOrders.length)}{' '}
              dari {filteredOrders.length} pesanan
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
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

      {canAddOrder && (
        <AddOrderModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddOrder}
        />
      )}
    </div>
  );
}