// src/pages/seller/SellerFinancePage.tsx

import { useState, useEffect, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Calendar,
  X,
  Download
} from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import {
  getFinanceStats,
  getExpenseCategories,
  getExpenseList,
  addExpense,
  type FinanceStats,
  type ExpenseCategory,
} from '@/services/sellerFinanceService';
import type { ExpenseDetailResponse } from '@/types/expense';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/services/sellerSettingsService';
import { ROUTES } from '@/constants';

// ============================================================
// KOMPONEN STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {subtitle && <span className="text-xs font-medium text-[#6f5448]">{subtitle}</span>}
      </div>
      <p className="mt-2 text-3xl font-black text-[#4b2417]">{value}</p>
      <p className="text-sm text-[#6f5448]">{title}</p>
    </div>
  );
}

// ============================================================
// KOMPONEN EMPTY STATE
// ============================================================

function NotAvailableCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
      <AlertCircle className="h-8 w-8 text-gray-400 mb-3" />
      <h3 className="text-sm font-bold text-gray-600 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
}

// ============================================================
// KOMPONEN EXPENSE CATEGORY
// ============================================================

function ExpenseCategoriesCard({ data, t }: { data: ExpenseCategory[]; t: (key: string) => string }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#4b2417] mb-4">{t('finance.expense_by_category')}</h3>
        <p className="text-sm text-gray-500">{t('finance.empty')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm h-full">
      <h3 className="text-sm font-bold text-[#4b2417]">{t('finance.expense_by_category')}</h3>
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
// MAIN COMPONENT
// ============================================================

export default function SellerFinancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userRole = user?.role as UserRole;
  const canViewFinance = hasPermission(userRole, 'view_financial_reports');
  const canManageExpenses = userRole === 'owner' || userRole === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDetailResponse[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  // Modal Add Expense
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    kategori: '',
    jumlah: ''
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    if (canViewFinance) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewFinance]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const sd = startDate || undefined;
      const ed = endDate || undefined;

      const [statsRes, categoriesRes, expensesRes] = await Promise.allSettled([
        getFinanceStats(sd, ed),
        getExpenseCategories(sd, ed),
        getExpenseList({ start_date: sd, end_date: ed })
      ]);

      let anySuccess = false;

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
        anySuccess = true;
      } else {
        console.error('Failed to load finance stats:', statsRes.reason);
        setStats(null); // Explicitly set to null if failed
      }

      if (categoriesRes.status === 'fulfilled') {
        setExpenseCategories(categoriesRes.value);
        anySuccess = true;
      } else {
        console.error('Failed to load expense categories:', categoriesRes.reason);
        setExpenseCategories([]);
      }

      if (expensesRes.status === 'fulfilled') {
        setExpenses(expensesRes.value);
        anySuccess = true;
      } else {
        console.error('Failed to load expenses list:', expensesRes.reason);
        setExpenses([]);
      }

      if (!anySuccess) {
        setError(t('finance.error'));
      }
    } catch (err) {
      console.error('Unexpected error in loadData:', err);
      setError(t('finance.error'));
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilter = () => {
    loadData();
  };

  const handleExportCSV = () => {
    if (!stats) return;

    const lines = [];
    lines.push('LAPORAN KEUANGAN');
    lines.push(`Periode,${startDate || '-'} sd ${endDate || '-'}`);
    lines.push('');
    
    lines.push('RINGKASAN KAS');
    lines.push(`Cash Received,${stats.cashReceived}`);
    lines.push(`Cash Refunded,${stats.cashRefunded}`);
    lines.push(`Net Cash Flow,${stats.netCashFlow}`);
    lines.push('');
    
    lines.push('RINGKASAN LABA/RUGI');
    lines.push(`Revenue,${stats.totalRevenue}`);
    lines.push(`HPP/COGS,${stats.totalHppCost}`);
    lines.push(`Gross Profit,${stats.grossProfit}`);
    lines.push(`Expenses,${stats.totalExpenses}`);
    lines.push(`Net Profit,${stats.netProfit}`);
    lines.push('');
    
    lines.push('LAIN-LAIN');
    lines.push(`Outstanding Payments,${stats.outstandingPayments}`);
    lines.push(`Other Income (Termasuk DP Non-Refundable),${stats.nonRefundableDpIncome + stats.otherIncome}`);
    lines.push('');

    if (stats.productProfitability && stats.productProfitability.length > 0) {
      lines.push('PROFITABILITAS PRODUK');
      lines.push('Nama Produk,Qty Terjual,Revenue,HPP,Gross Profit,Margin (%)');
      stats.productProfitability.forEach(p => {
        lines.push(`"${p.nama_produk}",${p.qty_sold},${p.total_revenue},${p.total_hpp},${p.gross_profit},${p.margin_percentage}`);
      });
      lines.push('');
    }

    if (stats.supplierSpending && stats.supplierSpending.length > 0) {
      lines.push('PENGELUARAN SUPPLIER');
      lines.push('Nama Supplier,Purchase Count,Total Spending');
      stats.supplierSpending.forEach(s => {
        lines.push(`"${s.nama_supplier}",${s.purchase_count},${s.total_spending}`);
      });
      lines.push('');
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan-Finance-${startDate || 'all'}-to-${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!expenseForm.kategori || !expenseForm.jumlah) return;

    try {
      setSubmittingExpense(true);
      await addExpense({
        kategori: expenseForm.kategori,
        jumlah: parseFloat(expenseForm.jumlah)
      });
      alert(t('finance.added_success'));
      setShowAddExpense(false);
      setExpenseForm({ kategori: '', jumlah: '' });
      loadData(); // Refresh all
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error?.response?.data?.detail || t('common.error'));
    } finally {
      setSubmittingExpense(false);
    }
  };

  if (!canViewFinance) {
    return <Navigate to={ROUTES.SELLER_DASHBOARD} replace />;
  }

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
        <span className="ml-3 text-sm text-gray-500">{t('finance.loading')}</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <p className="text-red-500">{error}</p>
        <button onClick={loadData} className="rounded bg-[#d85b30] px-4 py-2 text-white">
          {t('finance.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#4b2417]">{t('finance.title')}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{t('finance.start_date')}</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d85b30]"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{t('finance.end_date')}</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d85b30]"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button 
              onClick={handleApplyFilter}
              className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              {t('finance.apply_filter')}
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-md bg-[#d85b30] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#c04e28]"
              disabled={!stats}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* CASH FLOW CARDS */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#4b2417]">Cash Flow (Arus Kas)</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3 mb-6">
        <StatCard
          title="Cash Received"
          value={formatRupiah(stats?.cashReceived || 0)}
          icon={DollarSign}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title="Cash Refunded"
          value={formatRupiah(stats?.cashRefunded || 0)}
          icon={TrendingDown}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatRupiah(stats?.netCashFlow || 0)}
          icon={DollarSign}
          color="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* PROFIT & LOSS CARDS */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#4b2417]">Profit & Loss (Laba Rugi)</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard
          title="Revenue"
          value={formatRupiah(stats?.totalRevenue || 0)}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="HPP / COGS"
          value={formatRupiah(stats?.totalHppCost || 0)}
          icon={TrendingDown}
          color="bg-orange-50 text-orange-700"
        />
        <StatCard
          title="Gross Profit"
          value={formatRupiah(stats?.grossProfit || 0)}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Expenses"
          value={formatRupiah(stats?.totalExpenses || 0)}
          icon={TrendingDown}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="Net Profit"
          value={formatRupiah(stats?.netProfit || 0)}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-6">
        <StatCard
          title="Outstanding Payments"
          value={formatRupiah(stats?.outstandingPayments || 0)}
          icon={AlertCircle}
          color="bg-yellow-50 text-yellow-700"
        />
        <StatCard
          title="Other Income (DP Non-Refundable, etc)"
          value={formatRupiah((stats?.nonRefundableDpIncome || 0) + (stats?.otherIncome || 0))}
          icon={Plus}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <NotAvailableCard 
             title={t('finance.sales_chart')} 
             message={t('finance.feature_not_available')} 
           />
        </div>
        <div>
           <ExpenseCategoriesCard data={expenseCategories} t={t} />
        </div>
      </div>

      {/* PRODUCT PROFITABILITY & SUPPLIER SPENDING */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#4b2417] mb-4">Product Profitability</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                  <th className="pb-2 pr-4">Produk</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Revenue</th>
                  <th className="pb-2 pr-4 text-right">HPP</th>
                  <th className="pb-2 pr-4 text-right">Gross Profit</th>
                  <th className="pb-2 pr-4 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.productProfitability?.length ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-[#6f5448]">Belum ada data penjualan</td>
                  </tr>
                ) : (
                  stats.productProfitability.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-[#4b2417] truncate max-w-[120px]">{item.nama_produk}</td>
                      <td className="py-3 pr-4 text-right text-[#6f5448]">{item.qty_sold}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-[#d85b30]">{formatRupiah(item.total_revenue)}</td>
                      <td className="py-3 pr-4 text-right text-orange-600">{formatRupiah(item.total_hpp)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-blue-600">{formatRupiah(item.gross_profit)}</td>
                      <td className="py-3 pr-4 text-right text-emerald-600 font-medium">{item.margin_percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#4b2417] mb-4">Supplier Spending</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                  <th className="pb-2 pr-4">Supplier</th>
                  <th className="pb-2 pr-4 text-center">Trx</th>
                  <th className="pb-2 pr-4 text-right">Total Spending</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.supplierSpending?.length ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-[#6f5448]">Belum ada data supplier</td>
                  </tr>
                ) : (
                  stats.supplierSpending.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-[#4b2417] truncate max-w-[150px]">{item.nama_supplier}</td>
                      <td className="py-3 pr-4 text-center text-[#6f5448]">{item.purchase_count}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-red-600">{formatRupiah(item.total_spending)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EXPENSE MANAGEMENT SECTION */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#4b2417]">{t('finance.expense_list')}</h3>
          {canManageExpenses && (
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1 rounded-lg bg-[#d85b30] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c04e28]"
            >
              <Plus className="h-4 w-4" />
              {t('finance.add_expense')}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-[#6f5448]">
                <th className="pb-2 pr-4">{t('finance.date')}</th>
                <th className="pb-2 pr-4">{t('finance.category')}</th>
                <th className="pb-2 pr-4">Oleh</th>
                <th className="pb-2 pr-4 text-right">{t('finance.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-[#6f5448]">
                    {t('finance.empty')}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-[#6f5448]">
                      {new Date(exp.tanggal).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#4b2417]">{exp.kategori}</td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{exp.recorded_by_username}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-[#d85b30]">
                      {formatRupiah(exp.jumlah)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#4b2417]">{t('finance.add_expense')}</h2>
              <button onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.expense_category')}
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.kategori}
                  onChange={e => setExpenseForm(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d85b30] focus:outline-none"
                  placeholder="Contoh: Listrik, Gaji"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.amount')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={expenseForm.jumlah}
                  onChange={e => setExpenseForm(prev => ({ ...prev, jumlah: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d85b30] focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={submittingExpense}
                >
                  {t('finance.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="flex-1 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50"
                >
                  {submittingExpense ? t('common.loading') : t('finance.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}