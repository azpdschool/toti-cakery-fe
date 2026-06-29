// src/pages/seller/SellerFinancePage.tsx

import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Eye,
  Search,
} from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import {
  getFinanceStats,
  getSalesChart,
  getPaymentSummary,
  getExpenseCategories,
  getFinanceInvoices,
  exportFinancePdf,
  exportSingleInvoicePdf,
  type FinanceStats,
  type SalesChartData,
  type PaymentSummary,
  type ExpenseCategory,
} from '@/services/sellerFinanceService';
import { type Invoice } from '@/services/sellerOrderService';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/sellerSettingsService';
import { ROUTES } from '@/constants';

// ============================================================
// KOMPONEN STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: string;
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
// KOMPONEN GRAFIK
// ============================================================

function SalesChart({ data }: { data: SalesChartData[] }) {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4b2417]">Grafik Penjualan 7 Hari Terakhir</h3>
      <div className="mt-4 flex h-48 items-end gap-2">
        {data.map(item => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-[#d85b30] transition-all"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className="text-xs font-medium text-[#6f5448]">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentSummary({ data }: { data: PaymentSummary }) {
  const items = [
    { label: 'Lunas', value: data.lunas, color: 'bg-green-500' },
    { label: 'Sebagian', value: data.sebagian, color: 'bg-yellow-500' },
    { label: 'Belum Lunas', value: data.belumLunas, color: 'bg-red-500' },
  ];
  const total = data.lunas + data.sebagian + data.belumLunas;
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4b2417]">Ringkasan Pembayaran Invoice</h3>
      <div className="mt-4 space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-[#6f5448]">{item.label}</span>
            <span className="text-sm font-bold text-[#4b2417]">{item.value} invoice</span>
          </div>
        ))}
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden flex">
          {items.map(item => (
            <div
              key={item.label}
              className={`${item.color} h-full`}
              style={{ width: `${(item.value / total) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpenseCategories({ data }: { data: ExpenseCategory[] }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#4b2417]">Pengeluaran per Kategori</h3>
      <div className="mt-4 space-y-3">
        {data.map(cat => (
          <div key={cat.category}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6f5448]">{cat.category}</span>
              <span className="font-semibold text-[#4b2417]">
                {formatRupiah(cat.amount)} ({cat.percentage}%)
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-full rounded-full"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color || '#d85b30' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN TABEL INVOICE
// ============================================================

interface InvoiceTableProps {
  invoices: Invoice[];
  onExportSingle: (id: string) => void;
  onExportBulk: (ids: string[]) => void;
  onViewDetail: (id: string) => void;
}

function InvoiceTable({ invoices, onExportSingle, onExportBulk, onViewDetail }: InvoiceTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = invoices.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(inv => inv.id)));
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0) {
      alert('Pilih minimal satu invoice');
      return;
    }
    onExportBulk(Array.from(selectedIds));
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      LUNAS: { label: 'LUNAS', className: 'bg-green-100 text-green-700' },
      DP: { label: 'DP', className: 'bg-blue-100 text-blue-700' },
      Belum: { label: 'Belum', className: 'bg-red-100 text-red-700' },
    };
    return map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#4b2417]">Daftar Invoice</h3>
        {selectedIds.size > 0 && (
          <button
            onClick={handleExportSelected}
            className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c04e28]"
          >
            <Download className="h-4 w-4" />
            Export Terpilih ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
              <th className="pb-2 pr-2">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selectedIds.size === paginated.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-[#d85b30] focus:ring-[#d85b30]"
                />
              </th>
              <th className="pb-2 pr-4">NO</th>
              <th className="pb-2 pr-4">PELANGGAN</th>
              <th className="pb-2 pr-4">INVOICE</th>
              <th className="pb-2 pr-4">TANGGAL</th>
              <th className="pb-2 pr-4">ORDER</th>
              <th className="pb-2 pr-4">TAGIHAN</th>
              <th className="pb-2 pr-4">TERBAYAR</th>
              <th className="pb-2 pr-4">STATUS</th>
              <th className="pb-2">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-sm text-[#6f5448]">
                  Tidak ada invoice ditemukan.
                </td>
              </tr>
            ) : (
              paginated.map((invoice, idx) => {
                const badge = getStatusBadge(invoice.status);
                const isSelected = selectedIds.has(invoice.id);
                return (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(invoice.id)}
                        className="rounded border-gray-300 text-[#d85b30] focus:ring-[#d85b30]"
                      />
                    </td>
                    <td className="py-3 pr-4 text-[#6f5448]">{startIndex + idx + 1}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#4b2417]">{invoice.customerName}</p>
                      <p className="text-xs text-[#8b7166]">{invoice.customerPhone}</p>
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#4b2417]">{invoice.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-[#6f5448]">
                      {invoice.date} <br />
                      <span className="text-xs">{invoice.time}</span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#4b2417]">{invoice.orderNumber}</td>
                    <td className="py-3 pr-4 font-medium text-[#4b2417]">{formatRupiah(invoice.total)}</td>
                    <td className="py-3 pr-4 text-[#6f5448]">{formatRupiah(invoice.paid)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetail(invoice.id)}
                          className="rounded p-1 text-[#6f5448] hover:bg-gray-100"
                          title="Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onExportSingle(invoice.id)}
                          className="rounded p-1 text-[#d85b30] hover:bg-orange-50"
                          title="Export PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
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
            Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, invoices.length)} dari {invoices.length} invoice
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
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
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SellerFinancePage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;
  const canViewFinance = hasPermission(userRole, 'view_financial_reports');

  // Redirect jika tidak punya akses
  if (!canViewFinance) {
    return <Navigate to={ROUTES.SELLER_DASHBOARD} replace />;
  }

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [chartData, setChartData] = useState<SalesChartData[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [
          statsData,
          chart,
          payment,
          expenses,
          invoiceData,
        ] = await Promise.all([
          getFinanceStats(),
          getSalesChart(),
          getPaymentSummary(),
          getExpenseCategories(),
          getFinanceInvoices(),
        ]);
        setStats(statsData);
        setChartData(chart);
        setPaymentSummary(payment);
        setExpenseCategories(expenses);
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Gagal memuat data keuangan:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(inv =>
        inv.customerName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.customerPhone.includes(q)
      );
    }
    if (filterStatus !== 'Semua Status') {
      result = result.filter(inv => inv.status === filterStatus);
    }
    return result;
  }, [invoices, searchQuery, filterStatus]);

  const handleExportSingle = (id: string) => {
    exportSingleInvoicePdf(id);
  };

  const handleExportBulk = (ids: string[]) => {
    exportFinancePdf(ids);
  };

  const handleViewDetail = (id: string) => {
    alert(`Detail invoice ${id} (simulasi)`);
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
          title="Total Pendapatan"
          value={formatRupiah(stats?.totalRevenue || 0)}
          change={stats?.revenueChange || ''}
          icon={DollarSign}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Total Pengeluaran"
          value={formatRupiah(stats?.totalExpenses || 0)}
          change={stats?.expensesChange || ''}
          icon={TrendingDown}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="Laba Bersih"
          value={formatRupiah(stats?.netProfit || 0)}
          change={stats?.profitChange || ''}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Invoice Belum Lunas"
          value={formatRupiah(stats?.unpaidInvoices || 0)}
          change={`${stats?.unpaidCount || 0} invoice`}
          icon={FileText}
          color="bg-orange-50 text-orange-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart data={chartData} />
        {paymentSummary && <PaymentSummary data={paymentSummary} />}
      </div>

      <ExpenseCategories data={expenseCategories} />

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7166]" />
          <input
            type="text"
            placeholder="Cari pelanggan, invoice, atau order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#d0bfaf] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#d85b30]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d0bfaf] px-3 py-2 text-sm outline-none focus:border-[#d85b30]"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="LUNAS">LUNAS</option>
            <option value="DP">DP</option>
            <option value="Belum">Belum</option>
          </select>
        </div>
      </div>

      <InvoiceTable
        invoices={filteredInvoices}
        onExportSingle={handleExportSingle}
        onExportBulk={handleExportBulk}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}