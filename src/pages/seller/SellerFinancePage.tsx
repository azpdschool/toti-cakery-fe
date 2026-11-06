// src/pages/seller/SellerFinancePage.tsx

import {
  useState,
  useEffect,
  FormEvent,
  useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Calendar,
  X,
  Filter,
  Search,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
import { SellerSortDropdown } from '@/components/ui/SellerSortDropdown';
import { SellerFilterSelect } from '@/components/ui/SellerFilterSelect';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { HorizontalCardScroller } from '@/components/common/HorizontalCardScroller';
import { formatRupiah } from '@/services/productService';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import {
  getFinanceStats,
  getExpenseSummaryDashboard,
  getExpenseList,
  addExpense,
  updateExpense,
  cancelExpense,
  getExpenseAudit,
  fetchSalesTrends,
  type FinanceStats,
  type ExpenseDashboardSummary,
  type ExpenseAuditItem,
  type SalesTrendsResponse,
} from '@/services/sellerFinanceService';
import {
  formatDateToLocalYYYYMMDD,
  getTodayLocal,
  getStartOfMonthLocal,
  getEndOfMonthLocal,
} from '@/utils/date';
import type { ExpenseDetailResponse, ExpensePaymentMethod } from '@/types/expense';
import type { ProductProfitabilityItem, SupplierSpendingItem } from '@/types/finance';
import { supplierService } from '@/services/supplierService';
import type { SupplierOut } from '@/api/supplier';
import { PageHeader } from '@/components/ui/PageHeader';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/services/sellerSettingsService';
import { ROUTES } from '@/constants';

const EXPENSE_PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  e_wallet: 'E-Wallet',
  card: 'Card',
  other: 'Other'
};

// ============================================================
// HORIZONTAL SCROLL CONTAINER
// ============================================================

function HorizontalScrollContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 max-w-full">
      <HorizontalCardScroller scrollContainerClassName="gap-3 sm:gap-4 pb-3 sm:pb-4 snap-x">
        {children}
      </HorizontalCardScroller>
    </div>
  );
}

// ============================================================
// COMPONENT STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, subtitle, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-3.5 sm:p-5 shadow-sm border border-gray-100 shrink-0 min-w-[160px] sm:min-w-[240px] snap-start animate-pulse">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 mb-2 sm:mb-4"></div>
        <div className="h-6 sm:h-8 w-24 sm:w-32 bg-gray-200 rounded mb-1.5 sm:mb-2"></div>
        <div className="h-3.5 sm:h-4 w-16 sm:w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-3.5 sm:p-5 shadow-sm border border-gray-100 shrink-0 min-w-[160px] sm:min-w-[240px] snap-start">
      <div className="flex items-start justify-between">
        <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        {subtitle && <span className="text-[10px] sm:text-xs font-medium text-gray-500">{subtitle}</span>}
      </div>
      <p className="mt-2 sm:mt-4 text-lg sm:text-2xl font-bold text-gray-900 truncate" title={value}>{value}</p>
      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-gray-500">{title}</p>
    </div>
  );
}

// ============================================================
// COMPONENT EMPTY STATE
// ============================================================

function NotAvailableCard({ title, description, message }: { title: string; description: string; message: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
      <AlertCircle className="h-10 w-10 text-gray-300 mb-4" />
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-100">
        <p className="text-xs font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT EXPENSE CATEGORY
// ============================================================

function ExpenseCategoriesCard({
  summary,
  isLoading,
  error,
  onRetry,
}: {
  summary: ExpenseDashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 h-full animate-pulse min-h-[300px]">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-red-100 h-full flex flex-col items-center justify-center text-center p-6 min-h-[300px]">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Failed to load Expense Breakdown</h4>
        <p className="text-xs text-gray-500 max-w-xs mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const periodText = summary?.period?.start_date && summary?.period?.end_date
    ? `${summary.period.start_date.split('T')[0]} - ${summary.period.end_date.split('T')[0]}`
    : summary?.period?.start_date
    ? `From ${summary.period.start_date.split('T')[0]}`
    : '';

  if (!summary || summary.count === 0 || summary.categories.length === 0) {
    return (
      <NotAvailableCard 
        title="Expense Breakdown" 
        description={periodText ? `Period: ${periodText}` : "See how business expenses are distributed across categories."} 
        message="No expenses recorded for this period." 
      />
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Expense Breakdown</h3>
            {periodText && (
              <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                {periodText}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-gray-900">{formatRupiah(summary.total_expenses)}</div>
            <div className="text-xs text-gray-500 font-medium">
              {summary.count} {summary.count === 1 ? 'transaction' : 'transactions'}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {summary.categories.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">{cat.category}</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(cat.amount)} <span className="text-gray-500 font-normal ml-1">({cat.percentage}%)</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color || '#4b5563' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const PRESET_EXPENSE_CATEGORIES = [
  'Raw Materials',
  'Packaging',
  'Electricity & Utilities',
  'Kitchen & Gas',
  'Salaries & Wages',
  'Rent',
  'Equipment & Maintenance',
  'Delivery & Transport',
  'Marketing',
  'Other Operational',
] as const;

function formatAuditFieldValue(key: string, val: any): string {
  if (val === null || val === undefined || val === '') return 'None';
  if (key === 'jumlah') return formatRupiah(val);
  if (key === 'tanggal' || key === 'voided_at') {
    try {
      return new Date(val).toLocaleString();
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function renderAuditChanges(log: ExpenseAuditItem) {
  if (!log.changes || Object.keys(log.changes).length === 0) {
    return <span className="text-gray-400 italic">No field details recorded.</span>;
  }

  if (log.action === 'created') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {Object.entries(log.changes).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-1 border-b border-gray-50 pb-1">
            <span className="font-medium text-gray-600 capitalize">{k.replace(/_/g, ' ')}:</span>
            <span className="text-gray-900 truncate max-w-[160px]" title={String(v)}>
              {formatAuditFieldValue(k, v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-xs">
      {Object.entries(log.changes).map(([k, change]: [string, any]) => {
        const isDiff = change && typeof change === 'object' && ('before' in change || 'after' in change);
        if (isDiff) {
          return (
            <div key={k} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-50 pb-1">
              <span className="font-medium text-gray-600 capitalize">{k.replace(/_/g, ' ')}:</span>
              <div className="flex items-center gap-1.5 text-gray-900">
                <span className="text-red-600 line-through">
                  {formatAuditFieldValue(k, change.before)}
                </span>
                <span className="text-gray-400">&rarr;</span>
                <span className="font-semibold text-emerald-700">
                  {formatAuditFieldValue(k, change.after)}
                </span>
              </div>
            </div>
          );
        }
        return (
          <div key={k} className="flex justify-between gap-1 border-b border-gray-50 pb-1">
            <span className="font-medium text-gray-600 capitalize">{k.replace(/_/g, ' ')}:</span>
            <span className="text-gray-900 truncate max-w-[160px]">{formatAuditFieldValue(k, change)}</span>
          </div>
        );
      })}
    </div>
  );
}

function SalesTrendsCard({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [data, setData] = useState<SalesTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTrends = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchSalesTrends(startDate, endDate, granularity);
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load sales trends:', err);
          const msg = err?.response?.data?.detail;
          setError(typeof msg === 'string' ? msg : 'Unable to load sales trends.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrends();
    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, granularity]);

  const totals = useMemo(() => {
    if (!data?.points || data.points.length === 0) {
      return { revenue: 0, hpp: 0, grossProfit: 0, orderCount: 0 };
    }
    return data.points.reduce(
      (acc, p) => ({
        revenue: acc.revenue + Number(p.revenue || 0),
        hpp: acc.hpp + Number(p.hpp || 0),
        grossProfit: acc.grossProfit + Number(p.gross_profit || 0),
        orderCount: acc.orderCount + Number(p.order_count || 0),
      }),
      { revenue: 0, hpp: 0, grossProfit: 0, orderCount: 0 }
    );
  }, [data]);

  const maxVal = useMemo(() => {
    if (!data?.points || data.points.length === 0) return 1;
    return Math.max(
      ...data.points.map((p) => Math.max(Number(p.revenue || 0), Number(p.hpp || 0), Number(p.gross_profit || 0))),
      1
    );
  }, [data]);

  return (
    <div className="rounded-xl bg-white p-3.5 sm:p-5 shadow-sm border border-gray-100 flex flex-col h-full min-w-0 max-w-full">
      {/* Header with Granularity & View Switchers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 min-w-0 max-w-full">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Sales Trends</h3>
          <p className="text-xs text-gray-500 mt-0.5">Revenue, COGS, and gross profit by settlement period.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Granularity Buttons */}
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`rounded-md px-3 py-1 capitalize transition-all ${
                  granularity === g
                    ? 'bg-white text-gray-900 font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                viewMode === 'chart'
                  ? 'bg-white text-gray-900 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Chart View"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Chart
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5 p-2.5 sm:p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs min-w-0 max-w-full">
        <div className="min-w-0">
          <span className="text-gray-500 block truncate">Total Revenue</span>
          <span className="text-sm font-bold text-gray-900 break-words">{formatRupiah(totals.revenue)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500 block truncate">Total COGS (HPP)</span>
          <span className="text-sm font-bold text-amber-700 break-words">{formatRupiah(totals.hpp)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500 block truncate">Gross Profit</span>
          <span className="text-sm font-bold text-emerald-700 break-words">{formatRupiah(totals.grossProfit)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500 block truncate">Total Orders</span>
          <span className="text-sm font-bold text-blue-700 break-words">{totals.orderCount}</span>
        </div>
      </div>

      {/* Main Content: Chart or Table */}
      {isLoading ? (
        <div className="flex-1 min-h-[220px] flex items-center justify-center animate-pulse">
          <div className="w-full space-y-3">
            <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto"></div>
            <div className="h-36 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">{error}</p>
        </div>
      ) : !data?.points || data.points.length === 0 ? (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No sales trend data found for the selected period.</p>
        </div>
      ) : viewMode === 'chart' ? (
        <div className="flex-1 flex flex-col justify-end">
          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Gross Profit</span>
            </div>
          </div>

          {/* Bar Chart Bars */}
          <div className="overflow-x-auto pb-2">
            <div
              className="flex items-end gap-3 h-48 pt-4 px-2 border-b border-gray-100"
              style={{ minWidth: `${Math.max(data.points.length * 48, 320)}px` }}
            >
              {data.points.map((pt) => {
                const revNum = Number(pt.revenue || 0);
                const profNum = Number(pt.gross_profit || 0);
                const revHeight = maxVal > 0 ? Math.max((revNum / maxVal) * 100, 2) : 2;
                const profHeight = maxVal > 0 ? Math.max((Math.max(profNum, 0) / maxVal) * 100, 2) : 2;

                const dateLabel = (() => {
                  try {
                    const d = new Date(pt.period_start);
                    if (granularity === 'month') {
                      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  } catch {
                    return pt.period_start;
                  }
                })();

                return (
                  <div
                    key={pt.period_start}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-20 bg-gray-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl whitespace-nowrap pointer-events-none">
                      <span className="font-semibold border-b border-gray-700 pb-1 mb-1">{pt.period_start}</span>
                      <span>Revenue: {formatRupiah(revNum)}</span>
                      <span>COGS: {formatRupiah(pt.hpp)}</span>
                      <span>Gross Profit: {formatRupiah(profNum)}</span>
                      <span>Orders: {pt.order_count}</span>
                      <span>Margin: {revNum > 0 ? ((profNum / revNum) * 100).toFixed(1) : '0'}%</span>
                    </div>

                    {/* Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Revenue Bar */}
                      <div
                        className="w-1/2 max-w-[14px] bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-600"
                        style={{ height: `${revHeight}%` }}
                        title={`Revenue: ${formatRupiah(revNum)}`}
                      />
                      {/* Gross Profit Bar */}
                      <div
                        className="w-1/2 max-w-[14px] bg-emerald-500 rounded-t transition-all duration-300 group-hover:bg-emerald-600"
                        style={{ height: `${profHeight}%` }}
                        title={`Gross Profit: ${formatRupiah(profNum)}`}
                      />
                    </div>

                    {/* X-axis Label */}
                    <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center" title={pt.period_start}>
                      {dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Table / Card View */
        <div className="border border-gray-100 rounded-lg overflow-hidden min-w-0 max-w-full">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0">
                <tr>
                  <th className="p-2.5">Period</th>
                  <th className="p-2.5 text-center">Orders</th>
                  <th className="p-2.5 text-right">Revenue</th>
                  <th className="p-2.5 text-right">COGS (HPP)</th>
                  <th className="p-2.5 text-right">Gross Profit</th>
                  <th className="p-2.5 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.points.map((pt) => {
                  const revNum = Number(pt.revenue || 0);
                  const profNum = Number(pt.gross_profit || 0);
                  const margin = revNum > 0 ? ((profNum / revNum) * 100).toFixed(1) + '%' : '0%';
                  return (
                    <tr key={pt.period_start} className="hover:bg-gray-50/60">
                      <td className="p-2.5 font-medium text-gray-800">{pt.period_start}</td>
                      <td className="p-2.5 text-center text-gray-600">{pt.order_count}</td>
                      <td className="p-2.5 text-right font-medium text-gray-900">{formatRupiah(revNum)}</td>
                      <td className="p-2.5 text-right text-gray-600">{formatRupiah(pt.hpp)}</td>
                      <td className="p-2.5 text-right font-semibold text-emerald-700">{formatRupiah(profNum)}</td>
                      <td className="p-2.5 text-right text-gray-600">{margin}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="block md:hidden max-h-64 overflow-y-auto p-2 space-y-2.5 min-w-0 max-w-full">
            {data.points.map((pt) => {
              const revNum = Number(pt.revenue || 0);
              const profNum = Number(pt.gross_profit || 0);
              const marginNum = revNum > 0 ? (profNum / revNum) * 100 : 0;
              const margin = revNum > 0 ? marginNum.toFixed(1) + '%' : '0%';
              return (
                <div key={pt.period_start} className="p-3 bg-white border border-gray-100 rounded-xl space-y-2 text-xs min-w-0 max-w-full shadow-xs">
                  <div className="flex items-center justify-between gap-2 min-w-0 pb-1.5 border-b border-gray-50">
                    <span className="font-semibold text-gray-900 break-words flex-1 min-w-0">{pt.period_start}</span>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full font-medium text-[11px] whitespace-nowrap ${
                        marginNum >= 30
                          ? 'bg-emerald-100 text-emerald-800'
                          : marginNum >= 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {margin}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1 min-w-0">
                    <div className="min-w-0">
                      <span className="text-gray-400 text-[10px] block uppercase font-medium">Orders</span>
                      <span className="font-medium text-gray-800 break-words">{pt.order_count}</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="text-gray-400 text-[10px] block uppercase font-medium">Revenue</span>
                      <span className="font-semibold text-gray-900 break-words">{formatRupiah(revNum)}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-400 text-[10px] block uppercase font-medium">COGS (HPP)</span>
                      <span className="font-medium text-gray-700 break-words">{formatRupiah(pt.hpp)}</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="text-gray-400 text-[10px] block uppercase font-medium">Gross Profit</span>
                      <span className="font-semibold text-emerald-700 break-words">{formatRupiah(profNum)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DATA TABLE COMPONENT
// ============================================================

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface FilterProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: 'text' | 'date' | 'select';
  options?: { label: string; value: string }[];
}

interface SortOption {
  label: string;
  value: string;
}

interface TableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  isLoading: boolean;
  emptyMessage: string;
  emptySubtext?: string;
  renderMobileCard?: (row: T, idx: number) => React.ReactNode;
  
  // Search
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  
  // Sort
  sortOptions?: SortOption[];
  sortBy?: string;
  onSortChange?: (val: string) => void;

  // Filter
  filters?: FilterProps[];
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  
  // Pagination
  page: number;
  pageSize: number;
  totalRows?: number;
  hasNextPage?: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  
  headerAction?: React.ReactNode;
}

function DataTable<T>({
  title,
  data,
  columns,
  isLoading,
  emptyMessage,
  emptySubtext,
  renderMobileCard,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sortOptions,
  sortBy,
  onSortChange,
  filters,
  onApplyFilters,
  onClearFilters,
  page,
  pageSize,
  totalRows,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
  headerAction
}: TableProps<T>) {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {/* Standalone Toolbar Card (NO overflow-hidden — identical to SellerInventoryPage) */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-3 sm:p-5 min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {headerAction}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {searchPlaceholder && (
            <div className="relative flex-1 min-w-[140px] sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 sm:pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d85b30]/30 focus:border-[#d85b30] transition-shadow"
                aria-label="Search"
              />
            </div>
          )}
          
          {sortOptions && sortOptions.length > 0 && onSortChange && (
            <SellerSortDropdown
              id={`sort-${title.replace(/\s+/g, '-').toLowerCase()}`}
              value={sortBy || sortOptions[0].value}
              onChange={onSortChange}
              options={sortOptions}
              ariaLabel={`Sort ${title}`}
            />
          )}

          {filters && filters.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#d85b30] cursor-pointer shrink-0"
                aria-expanded={showFilter}
                aria-haspopup="true"
                aria-label={`Filter ${title}`}
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 shrink-0" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-[min(300px,calc(100vw-2rem))] sm:w-80 rounded-2xl border border-[#e6d5c5] bg-white p-3.5 sm:p-5 shadow-xl max-h-[75dvh] overflow-y-auto overscroll-contain z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <h4 className="text-sm font-bold text-[#4b2417]">Filters</h4>
                    <button
                      type="button"
                      onClick={() => setShowFilter(false)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                      aria-label="Close filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filters.map((f, idx) => (
                      <div key={idx}>
                        {f.type === 'date' ? (
                          <div>
                            <label className="block text-xs font-semibold text-[#4b2417] mb-1">{f.label}</label>
                            <input
                              type="date"
                              value={f.value}
                              onChange={(e) => f.onChange(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs sm:text-sm text-gray-800 outline-none focus:border-[#d85b30] bg-white"
                            />
                          </div>
                        ) : f.type === 'select' ? (
                          <SellerFilterSelect
                            label={f.label}
                            value={f.value}
                            onChange={(val) => f.onChange(val)}
                            options={f.options || []}
                            placeholder="All"
                          />
                        ) : (
                          <div>
                            <label className="block text-xs font-semibold text-[#4b2417] mb-1">{f.label}</label>
                            <input
                              type="text"
                              value={f.value}
                              onChange={(e) => f.onChange(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs sm:text-sm text-gray-800 outline-none focus:border-[#d85b30] bg-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        onClearFilters?.();
                        setShowFilter(false);
                      }}
                      className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFilters?.();
                        setShowFilter(false);
                      }}
                      className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-[#d85b30] hover:bg-[#c04e28] transition-colors cursor-pointer"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Standalone Table Card (overflow-hidden safely confined to table rounding) */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden min-w-0 max-w-full">
        {/* Table: Desktop View */}
        <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3 font-semibold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, idx) => (
                <tr key={idx} className="border-b border-gray-50 animate-pulse">
                  {columns.map((col, i) => (
                    <td key={i} className="px-5 py-4">
                      <div className={`h-4 bg-gray-100 rounded ${col.align === 'right' ? 'ml-auto' : ''} ${i === 0 ? 'w-3/4' : 'w-1/2'}`}></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-500">
                  <p className="font-medium text-gray-700">{emptyMessage}</p>
                  {emptySubtext && (
                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">{emptySubtext}</p>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={(row as any).id ?? (row as any).supplier_id ?? (row as any).product_id ?? rowIdx} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                      {col.render ? col.render(row) : String(row[col.accessor as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards: Mobile View */}
      <div className="block md:hidden p-3 space-y-3 min-w-0 max-w-full">
        {isLoading ? (
          Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-3 bg-gray-100 rounded"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-700">{emptyMessage}</p>
            {emptySubtext && (
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{emptySubtext}</p>
            )}
          </div>
        ) : (
          data.map((row, rowIdx) => (
            renderMobileCard ? (
              renderMobileCard(row, rowIdx)
            ) : (
              <div
                key={(row as any).id ?? (row as any).supplier_id ?? (row as any).product_id ?? rowIdx}
                className="p-3.5 bg-white border border-gray-100 rounded-xl space-y-2.5 shadow-xs"
              >
                {/* Header Row: Column 0 and Status/Margin if present */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="font-semibold text-gray-900 text-sm min-w-0 flex-1">
                    {columns[0].render ? columns[0].render(row) : String(row[columns[0].accessor as keyof T] ?? '-')}
                  </div>
                  {columns.some(c => c.header === 'Margin') && (
                    <div className="shrink-0">
                      {columns.find(c => c.header === 'Margin')?.render?.(row) ?? String(row[columns.find(c => c.header === 'Margin')?.accessor as keyof T] ?? '')}
                    </div>
                  )}
                  {columns.some(c => c.header === 'Status') && (
                    <div className="shrink-0">
                      {columns.find(c => c.header === 'Status')?.render?.(row) ?? String(row[columns.find(c => c.header === 'Status')?.accessor as keyof T] ?? '')}
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {columns.slice(1).map((col, cIdx) => {
                    if (col.header === 'Actions' || col.header === 'Margin' || col.header === 'Status') return null;
                    return (
                      <div key={cIdx} className={col.align === 'right' ? 'text-right' : 'text-left'}>
                        <span className="text-[10px] text-gray-400 block uppercase font-medium">{col.header}</span>
                        <div className="text-gray-800 mt-0.5 font-medium">
                          {col.render ? col.render(row) : String(row[col.accessor as keyof T] ?? '-')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions Row */}
                {columns.some(c => c.header === 'Actions') && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                    {columns.find(c => c.header === 'Actions')?.render?.(row)}
                  </div>
                )}
              </div>
            )
          ))
        )}
      </div>

      {/* Pagination */}
      <PaginationControls
        currentPage={page}
        limit={pageSize}
        totalItems={totalRows}
        hasNextPage={hasNextPage}
        onPageChange={onPageChange}
        onLimitChange={onPageSizeChange}
      />
    </div>
  </div>
);
}

const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { label: 'Revenue: High to Low', value: 'revenue_desc' },
  { label: 'Revenue: Low to High', value: 'revenue_asc' },
  { label: 'Gross Profit: High to Low', value: 'profit_desc' },
  { label: 'Gross Profit: Low to High', value: 'profit_asc' },
  { label: 'Margin: High to Low', value: 'margin_desc' },
  { label: 'Margin: Low to High', value: 'margin_asc' },
  { label: 'Qty Sold: High to Low', value: 'qty_desc' },
  { label: 'Qty Sold: Low to High', value: 'qty_asc' },
  { label: 'Product Name: A to Z', value: 'name_asc' },
  { label: 'Product Name: Z to A', value: 'name_desc' },
];

const SUPPLIER_SORT_OPTIONS: SortOption[] = [
  { label: 'Total Spending: High to Low', value: 'spending_desc' },
  { label: 'Total Spending: Low to High', value: 'spending_asc' },
  { label: 'PO Spending: High to Low', value: 'po_spending_desc' },
  { label: 'Expense Spending: High to Low', value: 'expense_spending_desc' },
  { label: 'Transactions: High to Low', value: 'transactions_desc' },
  { label: 'Transactions: Low to High', value: 'transactions_asc' },
  { label: 'Supplier Name: A to Z', value: 'name_asc' },
  { label: 'Supplier Name: Z to A', value: 'name_desc' },
];

const EXPENSE_SORT_OPTIONS: SortOption[] = [
  { label: 'Date: Newest First', value: 'date_desc' },
  { label: 'Date: Oldest First', value: 'date_asc' },
  { label: 'Amount: High to Low', value: 'amount_desc' },
  { label: 'Amount: Low to High', value: 'amount_asc' },
  { label: 'Category: A to Z', value: 'category_asc' },
  { label: 'Category: Z to A', value: 'category_desc' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SellerFinancePage() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;
  const canViewFinance = hasPermission(userRole, 'view_financial_reports');
  const canManageExpenses = userRole === 'owner' || userRole === 'admin';

  const [statsLoading, setStatsLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Stats Data
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseDashboardSummary | null>(null);
  const [expenseSummaryLoading, setExpenseSummaryLoading] = useState(false);
  const [expenseSummaryError, setExpenseSummaryError] = useState<string | null>(null);

  // Tables Data (Client-side filtered for Product & Supplier)
      
  // Expenses (Server-side paginated)
  const [expenses, setExpenses] = useState<ExpenseDetailResponse[]>([]);
  const [expHasNextPage, setExpHasNextPage] = useState(false);
  
  // Expenses State
  const [expPage, setExpPage] = useState(1);
  const [expPageSize, setExpPageSize] = useState(10);
  const [expSearch, setExpSearch] = useState('');
  const [expDebouncedSearch, setExpDebouncedSearch] = useState('');
  const [expSortBy, setExpSortBy] = useState('date_desc');
  const [expFilters, setExpFilters] = useState({
    kategori: '',
    startDate: '',
    endDate: ''
  });
  const [expAppliedFilters, setExpAppliedFilters] = useState(expFilters);

  // Product State
  const [prodPage, setProdPage] = useState(1);
  const [prodPageSize, setProdPageSize] = useState(10);
  const [prodSearch, setProdSearch] = useState('');
  const [prodSortBy, setProdSortBy] = useState('revenue_desc');
  const [prodFilters, setProdFilters] = useState({ marginStatus: '' });
  
  // Supplier State
  const [supPage, setSupPage] = useState(1);
  const [supPageSize, setSupPageSize] = useState(10);
  const [supSearch, setSupSearch] = useState('');
  const [supSortBy, setSupSortBy] = useState('spending_desc');

  useEffect(() => {
    setProdPage(1);
  }, [prodSearch, prodFilters, prodSortBy]);

  useEffect(() => {
    setSupPage(1);
  }, [supSearch, supSortBy]);

  useEffect(() => {
    setExpPage(1);
  }, [expDebouncedSearch, expSortBy]);

  // Global Date Filter (for KPIs)
  const [globalStartDate, setGlobalStartDate] = useState(() => getStartOfMonthLocal());
  const [globalEndDate, setGlobalEndDate] = useState(() => getEndOfMonthLocal());
  const [globalAppliedDates, setGlobalAppliedDates] = useState({
    start: globalStartDate,
    end: globalEndDate
  });

  // Modal Expense (Create & Edit)
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDetailResponse | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    kategori: '',
    jumlah: '',
    tanggal: '',
    metode_pembayaran: '' as ExpensePaymentMethod | '',
    penerima: '',
    supplier_id: '',
    deskripsi: '',
    bukti_url: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [cancellingExpense, setCancellingExpense] = useState<ExpenseDetailResponse | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Active Suppliers for Expense Linking
  const [activeSuppliers, setActiveSuppliers] = useState<SupplierOut[]>([]);

  const loadSuppliers = async () => {
    if (!canViewFinance) return;
    try {
      const data = await supplierService.fetchSuppliers(true);
      setActiveSuppliers(data);
    } catch (err) {
      console.error('Failed to load active suppliers:', err);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [canViewFinance]);

  const supplierDropdownOptions = useMemo(() => {
    const list = [...activeSuppliers];
    if (
      editingExpense?.supplier_id &&
      !list.some(s => s.id === editingExpense.supplier_id)
    ) {
      list.push({
        id: editingExpense.supplier_id,
        nama_supplier: editingExpense.supplier_name || `Supplier #${editingExpense.supplier_id}`,
        is_active: false,
      });
    }
    return list;
  }, [activeSuppliers, editingExpense]);

  // Audit Modal State
  const [auditExpense, setAuditExpense] = useState<ExpenseDetailResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<ExpenseAuditItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const handleOpenAuditModal = async (expense: ExpenseDetailResponse) => {
    setAuditExpense(expense);
    setAuditLogs([]);
    setAuditError(null);
    setAuditLoading(true);
    try {
      const logs = await getExpenseAudit(expense.id);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Failed to load expense audit:', err);
      const msg = err?.response?.data?.detail;
      setAuditError(typeof msg === 'string' ? msg : 'Unable to load audit history for this expense.');
    } finally {
      setAuditLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const list: string[] = [...PRESET_EXPENSE_CATEGORIES];
    if (editingExpense?.kategori && !list.includes(editingExpense.kategori)) {
      list.push(editingExpense.kategori);
    }
    return list;
  }, [editingExpense]);

  // Handle Debounce Search for Expenses (even if client-side fallback)
  useEffect(() => {
    const timer = setTimeout(() => setExpDebouncedSearch(expSearch), 500);
    return () => clearTimeout(timer);
  }, [expSearch]);


  const loadStats = async () => {
    if (!canViewFinance) return;
    setStatsLoading(true);
    setStatsError(null);
    setExpenseSummaryLoading(true);
    setExpenseSummaryError(null);

    const sd = globalAppliedDates.start || undefined;
    const ed = globalAppliedDates.end || undefined;

    const statsPromise = getFinanceStats(sd, ed)
      .then((res) => {
        setStats(res);
      })
      .catch((err) => {
        console.error('Failed to load finance stats:', err);
        setStatsError('Unable to load financial information right now.');
      })
      .finally(() => {
        setStatsLoading(false);
      });

    const summaryPromise = getExpenseSummaryDashboard(sd, ed)
      .then((res) => {
        setExpenseSummary(res);
      })
      .catch((err) => {
        console.error('Failed to load expense summary:', err);
        setExpenseSummaryError('Failed to load expense breakdown. Please try again.');
        setExpenseSummary(null);
      })
      .finally(() => {
        setExpenseSummaryLoading(false);
      });

    await Promise.allSettled([statsPromise, summaryPromise]);
  };

  useEffect(() => {
    loadStats();
  }, [canViewFinance, globalAppliedDates]);

  const loadExpenses = async () => {
    if (!canViewFinance) return;
    setExpensesLoading(true);
    try {
      const sd = expAppliedFilters.startDate || undefined;
      const ed = expAppliedFilters.endDate || undefined;
      const skip = (expPage - 1) * expPageSize;
      const res = await getExpenseList({
        skip,
        limit: expPageSize + 1,
        kategori: expAppliedFilters.kategori || undefined,
        start_date: sd,
        end_date: ed
      });
      const hasMore = res.length > expPageSize;
      setExpHasNextPage(hasMore);
      setExpenses(hasMore ? res.slice(0, expPageSize) : res);
    } catch (err) {
      console.error('Failed to load expenses list:', err);
      setExpenses([]);
      setExpHasNextPage(false);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [canViewFinance, expPage, expPageSize, expAppliedFilters]);

  // Product & Supplier Client-side filtering logic
  const filteredProducts = useMemo(() => {
    if (!stats?.productProfitability) return [];
    let result = [...stats.productProfitability];
    
    if (prodSearch) {
      const s = prodSearch.toLowerCase();
      result = result.filter(p => p.nama_produk.toLowerCase().includes(s));
    }
    
    if (prodFilters.marginStatus === 'high') {
      result = result.filter(p => p.margin_percentage >= 30);
    } else if (prodFilters.marginStatus === 'low') {
      result = result.filter(p => p.margin_percentage < 30);
    }

    switch (prodSortBy) {
      case 'revenue_desc':
        result.sort((a, b) => b.total_revenue - a.total_revenue);
        break;
      case 'revenue_asc':
        result.sort((a, b) => a.total_revenue - b.total_revenue);
        break;
      case 'profit_desc':
        result.sort((a, b) => b.gross_profit - a.gross_profit);
        break;
      case 'profit_asc':
        result.sort((a, b) => a.gross_profit - b.gross_profit);
        break;
      case 'margin_desc':
        result.sort((a, b) => b.margin_percentage - a.margin_percentage);
        break;
      case 'margin_asc':
        result.sort((a, b) => a.margin_percentage - b.margin_percentage);
        break;
      case 'qty_desc':
        result.sort((a, b) => b.qty_sold - a.qty_sold);
        break;
      case 'qty_asc':
        result.sort((a, b) => a.qty_sold - b.qty_sold);
        break;
      case 'name_asc':
        result.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
        break;
      case 'name_desc':
        result.sort((a, b) => b.nama_produk.localeCompare(a.nama_produk));
        break;
      default:
        break;
    }
    
    return result;
  }, [stats?.productProfitability, prodSearch, prodFilters, prodSortBy]);
  
  const paginatedProducts = useMemo(() => {
    const start = (prodPage - 1) * prodPageSize;
    return filteredProducts.slice(start, start + prodPageSize);
  }, [filteredProducts, prodPage, prodPageSize]);

  const filteredSuppliers = useMemo(() => {
    if (!stats?.supplierSpending) return [];
    let result = [...stats.supplierSpending];
    
    if (supSearch) {
      const s = supSearch.toLowerCase().trim();
      result = result.filter(sup =>
        sup.nama_supplier.toLowerCase().includes(s) ||
        String(sup.supplier_id).includes(s)
      );
    }

    switch (supSortBy) {
      case 'spending_desc':
        result.sort((a, b) => b.total_spending - a.total_spending);
        break;
      case 'spending_asc':
        result.sort((a, b) => a.total_spending - b.total_spending);
        break;
      case 'po_spending_desc':
        result.sort((a, b) => b.po_spending - a.po_spending);
        break;
      case 'expense_spending_desc':
        result.sort((a, b) => b.expense_spending - a.expense_spending);
        break;
      case 'transactions_desc':
        result.sort((a, b) => (b.purchase_count + b.expense_count) - (a.purchase_count + a.expense_count));
        break;
      case 'transactions_asc':
        result.sort((a, b) => (a.purchase_count + a.expense_count) - (b.purchase_count + b.expense_count));
        break;
      case 'name_asc':
        result.sort((a, b) => a.nama_supplier.localeCompare(b.nama_supplier));
        break;
      case 'name_desc':
        result.sort((a, b) => b.nama_supplier.localeCompare(a.nama_supplier));
        break;
      default:
        break;
    }
    
    return result;
  }, [stats?.supplierSpending, supSearch, supSortBy]);
  
  const paginatedSuppliers = useMemo(() => {
    const start = (supPage - 1) * supPageSize;
    return filteredSuppliers.slice(start, start + supPageSize);
  }, [filteredSuppliers, supPage, supPageSize]);
  
  // Client-side search and sort fallback for Expenses
  const displayExpenses = useMemo(() => {
    let result = [...expenses];
    if (expDebouncedSearch) {
      const s = expDebouncedSearch.toLowerCase();
      result = result.filter(e => 
        e.kategori.toLowerCase().includes(s) || 
        (e.penerima && e.penerima.toLowerCase().includes(s)) ||
        (e.supplier_name && e.supplier_name.toLowerCase().includes(s)) ||
        (e.deskripsi && e.deskripsi.toLowerCase().includes(s)) ||
        e.recorded_by_username.toLowerCase().includes(s)
      );
    }

    switch (expSortBy) {
      case 'date_asc':
        result.sort((a, b) => new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime());
        break;
      case 'date_desc':
        result.sort((a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime());
        break;
      case 'amount_desc':
        result.sort((a, b) => b.jumlah - a.jumlah);
        break;
      case 'amount_asc':
        result.sort((a, b) => a.jumlah - b.jumlah);
        break;
      case 'category_asc':
        result.sort((a, b) => a.kategori.localeCompare(b.kategori));
        break;
      case 'category_desc':
        result.sort((a, b) => b.kategori.localeCompare(a.kategori));
        break;
      default:
        break;
    }

    return result;
  }, [expenses, expDebouncedSearch, expSortBy]);

  const handleGlobalFilterApply = () => {
    setGlobalAppliedDates({ start: globalStartDate, end: globalEndDate });
  };

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      kategori: '',
      jumlah: '',
      tanggal: getTodayLocal(),
      metode_pembayaran: '',
      penerima: '',
      supplier_id: '',
      deskripsi: '',
      bukti_url: '',
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditModal = (expense: ExpenseDetailResponse) => {
    setEditingExpense(expense);
    const dateStr = expense.tanggal ? formatDateToLocalYYYYMMDD(expense.tanggal) : '';
    setExpenseForm({
      kategori: expense.kategori || '',
      jumlah: String(expense.jumlah ?? ''),
      tanggal: dateStr,
      metode_pembayaran: expense.metode_pembayaran || '',
      penerima: expense.penerima || '',
      supplier_id: expense.supplier_id ? String(expense.supplier_id) : '',
      deskripsi: expense.deskripsi || '',
      bukti_url: expense.bukti_url || '',
    });
    setShowExpenseModal(true);
  };

  const handleOpenCancelModal = (expense: ExpenseDetailResponse) => {
    setCancellingExpense(expense);
    setCancelReason('');
  };

  const handleConfirmCancelExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingExpense) return;
    const trimmed = cancelReason.trim();
    if (trimmed.length < 3) {
      toast.error('Cancellation reason must be at least 3 characters.');
      return;
    }

    try {
      setIsSubmittingCancel(true);
      await cancelExpense(cancellingExpense.id, trimmed);
      toast.success('Expense cancelled successfully.');
      setCancellingExpense(null);
      setCancelReason('');
      loadExpenses();
      loadStats();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail;
      const displayMsg = typeof errMsg === 'string' ? errMsg : 'Unable to cancel expense.';
      toast.error(displayMsg);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleSaveExpense = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedKategori = expenseForm.kategori.trim();
    if (!trimmedKategori) {
      toast.error('Category is required.');
      return;
    }
    if (trimmedKategori.length < 3) {
      toast.error('Category must be at least 3 characters.');
      return;
    }

    const numAmount = parseFloat(expenseForm.jumlah);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Amount must be a positive number.');
      return;
    }

    const trimmedReceipt = expenseForm.bukti_url.trim();
    if (trimmedReceipt) {
      try {
        const parsed = new URL(trimmedReceipt);
        if (parsed.protocol !== 'https:') {
          toast.error('Receipt URL must be a valid HTTPS URL.');
          return;
        }
      } catch {
        toast.error('Receipt URL must be a valid HTTPS URL.');
        return;
      }
    }

    try {
      setSubmittingExpense(true);

      if (editingExpense) {
        const updatePayload: Record<string, any> = {};
        let hasChanges = false;

        if (trimmedKategori !== editingExpense.kategori) {
          updatePayload.kategori = trimmedKategori;
          hasChanges = true;
        }

        if (numAmount !== Number(editingExpense.jumlah)) {
          updatePayload.jumlah = numAmount;
          hasChanges = true;
        }

        const origDateStr = editingExpense.tanggal ? formatDateToLocalYYYYMMDD(editingExpense.tanggal) : '';
        if (expenseForm.tanggal && expenseForm.tanggal !== origDateStr) {
          updatePayload.tanggal = `${expenseForm.tanggal}T00:00:00`;
          hasChanges = true;
        }

        const cleanedPenerima = expenseForm.penerima.trim() || null;
        if (cleanedPenerima !== (editingExpense.penerima || null)) {
          updatePayload.penerima = cleanedPenerima;
          hasChanges = true;
        }

        const cleanedDeskripsi = expenseForm.deskripsi.trim() || null;
        if (cleanedDeskripsi !== (editingExpense.deskripsi || null)) {
          updatePayload.deskripsi = cleanedDeskripsi;
          hasChanges = true;
        }

        const cleanedMetode = (expenseForm.metode_pembayaran || null) as ExpensePaymentMethod | null;
        if (cleanedMetode !== (editingExpense.metode_pembayaran || null)) {
          updatePayload.metode_pembayaran = cleanedMetode;
          hasChanges = true;
        }

        const cleanedBukti = trimmedReceipt || null;
        if (cleanedBukti !== (editingExpense.bukti_url || null)) {
          updatePayload.bukti_url = cleanedBukti;
          hasChanges = true;
        }

        const formSupplierId = expenseForm.supplier_id ? Number(expenseForm.supplier_id) : null;
        const origSupplierId = editingExpense.supplier_id ?? null;
        if (formSupplierId !== origSupplierId) {
          updatePayload.supplier_id = formSupplierId;
          hasChanges = true;
        }

        if (!hasChanges) {
          toast('No changes detected.');
          setShowExpenseModal(false);
          setEditingExpense(null);
          return;
        }

        await updateExpense(editingExpense.id, updatePayload);
        toast.success('Expense updated successfully.');
      } else {
        await addExpense({
          kategori: trimmedKategori,
          jumlah: numAmount,
          tanggal: expenseForm.tanggal ? `${expenseForm.tanggal}T00:00:00` : undefined,
          penerima: expenseForm.penerima.trim() || null,
          supplier_id: expenseForm.supplier_id ? Number(expenseForm.supplier_id) : null,
          deskripsi: expenseForm.deskripsi.trim() || null,
          metode_pembayaran: (expenseForm.metode_pembayaran || null) as ExpensePaymentMethod | null,
          bukti_url: trimmedReceipt || null,
        });
        toast.success('Expense added successfully.');
      }

      setShowExpenseModal(false);
      setEditingExpense(null);
      loadStats();
      loadExpenses();
      loadSuppliers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail;
      const displayMsg = Array.isArray(errMsg)
        ? errMsg.map((e: any) => e.msg || e.message).join(', ')
        : (typeof errMsg === 'string' ? errMsg : (editingExpense ? 'Unable to update expense.' : 'Unable to add expense.'));
      toast.error(displayMsg);
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Mobile Card Renderers for Finance Tables
  const renderProductMobileCard = (row: ProductProfitabilityItem, idx: number) => {
    const isHighMargin = row.margin_percentage >= 30;
    return (
      <div
        key={row.product_id ?? idx}
        className="p-3.5 bg-white border border-gray-100 rounded-xl space-y-2.5 shadow-xs min-w-0 max-w-full"
      >
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100 min-w-0">
          <div className="font-semibold text-gray-900 text-sm min-w-0 flex-1 break-words">
            {row.nama_produk}
          </div>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              isHighMargin ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}
          >
            {row.margin_percentage}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Qty Terjual</span>
            <div className="text-gray-800 mt-0.5 font-medium break-words">
              {row.qty_sold}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Revenue</span>
            <div className="text-gray-900 mt-0.5 font-semibold break-words">
              {formatRupiah(row.total_revenue)}
            </div>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">HPP</span>
            <div className="text-gray-700 mt-0.5 font-medium break-words">
              {formatRupiah(row.total_hpp)}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Gross Profit</span>
            <div className="text-emerald-700 mt-0.5 font-semibold break-words">
              {formatRupiah(row.gross_profit)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSupplierMobileCard = (row: SupplierSpendingItem, idx: number) => {
    const totalTransactions = row.purchase_count + row.expense_count;
    return (
      <div
        key={row.supplier_id ?? idx}
        className="p-3.5 bg-white border border-gray-100 rounded-xl space-y-2.5 shadow-xs min-w-0 max-w-full"
      >
        <div className="flex items-start justify-between pb-2 border-b border-gray-100 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Nama Supplier</span>
            <div className="font-semibold text-gray-900 text-sm mt-0.5 break-words">
              {row.nama_supplier}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium whitespace-nowrap">
            ID #{row.supplier_id}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">PO Spending</span>
            <div className="text-gray-800 mt-0.5 font-medium break-words">
              {formatRupiah(row.po_spending)}
            </div>
            <div className="text-[11px] text-gray-400">
              {row.purchase_count} {row.purchase_count === 1 ? 'PO' : 'POs'}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Expense Spending</span>
            <div className="text-gray-800 mt-0.5 font-medium break-words">
              {formatRupiah(row.expense_spending)}
            </div>
            <div className="text-[11px] text-gray-400">
              {row.expense_count} {row.expense_count === 1 ? 'expense' : 'expenses'}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Total Transaksi</span>
            <span className="text-gray-700 font-medium">{totalTransactions} transaksi</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Total Spending</span>
            <span className="text-gray-900 font-bold text-sm">{formatRupiah(row.total_spending)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExpenseMobileCard = (row: ExpenseDetailResponse, idx: number) => {
    const paymentMethodText = row.metode_pembayaran
      ? (EXPENSE_PAYMENT_LABELS[row.metode_pembayaran] || row.metode_pembayaran)
      : '-';

    return (
      <div
        key={row.id ?? idx}
        className={`p-3.5 bg-white border rounded-xl space-y-3 shadow-xs min-w-0 max-w-full ${
          row.is_voided ? 'border-red-100 bg-red-50/10' : 'border-gray-100'
        }`}
      >
        {/* Header: Kategori + Badge Status */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100 min-w-0">
          <span className={`font-semibold text-sm break-words flex-1 min-w-0 ${row.is_voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {row.kategori}
          </span>
          {row.is_voided ? (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 whitespace-nowrap">
              Voided
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 whitespace-nowrap">
              Active
            </span>
          )}
        </div>

        {/* Nominal (bold) + Link Bukti Struk */}
        <div className="flex items-baseline justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Nominal</span>
            <span className={`text-base font-bold break-words ${row.is_voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {formatRupiah(row.jumlah)}
            </span>
          </div>
          {row.bukti_url && (
            <a
              href={row.bukti_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5 font-medium shrink-0"
            >
              Receipt
            </a>
          )}
        </div>

        {/* Tanggal, Metode Pembayaran, Supplier, Penerima/Vendor, Dicatat Oleh */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-50 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Tanggal</span>
            <span className="text-gray-700 font-medium break-words">
              {new Date(row.tanggal).toLocaleDateString()}
            </span>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Metode Pembayaran</span>
            <span className="text-gray-700 font-medium break-words">
              {paymentMethodText}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Linked Supplier</span>
            <span className="text-gray-700 font-medium break-words">
              {row.supplier_name ? (
                <span className="text-blue-700 font-semibold">{row.supplier_name}</span>
              ) : (
                <span className="text-gray-400 italic">No supplier linked</span>
              )}
            </span>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Penerima / Vendor</span>
            <span className="text-gray-700 font-medium break-words">
              {row.penerima || '-'}
            </span>
          </div>
          <div className="min-w-0 col-span-2">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Dicatat Oleh</span>
            <span className="text-gray-600 font-medium break-words">
              {row.recorded_by_username || '-'}
            </span>
          </div>
        </div>

        {/* Deskripsi lengkap (wrap, no truncate) */}
        {row.deskripsi && (
          <div className="pt-2 border-t border-gray-50 text-xs min-w-0">
            <span className="text-[10px] text-gray-400 block uppercase font-medium mb-0.5">Deskripsi</span>
            <p className="text-gray-600 break-words whitespace-pre-wrap">
              {row.deskripsi}
            </p>
          </div>
        )}

        {/* Jika voided: Alasan void dan waktu void */}
        {row.is_voided && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs space-y-1 min-w-0">
            {row.void_reason && (
              <div className="min-w-0">
                <span className="text-[10px] text-red-500 block uppercase font-semibold">Alasan Void</span>
                <p className="text-red-700 break-words">{row.void_reason}</p>
              </div>
            )}
            {row.voided_at && (
              <div className="min-w-0">
                <span className="text-[10px] text-red-500 block uppercase font-semibold">Waktu Void</span>
                <p className="text-red-600 break-words">
                  {new Date(row.voided_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tombol aksi: History, Edit, Cancel */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2 flex-wrap min-w-0">
          <button
            type="button"
            onClick={() => handleOpenAuditModal(row)}
            className="px-2.5 py-1 text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
            title="View Audit History"
          >
            History
          </button>
          {!row.is_voided && canManageExpenses && (
            <>
              <button
                type="button"
                onClick={() => handleOpenEditModal(row)}
                className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleOpenCancelModal(row)}
                className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!canViewFinance) {
    return <Navigate to={ROUTES.SELLER_DASHBOARD} replace />;
  }

  return (
    <div className="space-y-4 sm:space-y-8 max-w-[1600px] mx-auto pb-6 sm:pb-12 min-w-0 max-w-full">
      {/* HEADER */}
      <PageHeader
        title="Finance"
        description="Monitor cash flow, profitability, expenses, and financial performance."
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-6 min-w-0 max-w-full"
        actions={
          /* Global Date Filter */
          <div className="flex items-center gap-1.5 sm:gap-3 bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-100 w-full lg:w-auto min-w-0 max-w-full">
            <div className="flex-1 min-w-0">
              <label className="hidden sm:block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                <input 
                  type="date"
                  value={globalStartDate}
                  onChange={e => setGlobalStartDate(e.target.value)}
                  className="w-full pl-7 sm:pl-9 pr-1 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d85b30]/30 focus:border-[#d85b30]"
                  aria-label="Start Date"
                />
              </div>
            </div>
            <span className="text-gray-400 text-xs sm:hidden self-center">-</span>
            <div className="flex-1 min-w-0">
              <label className="hidden sm:block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                <input 
                  type="date"
                  value={globalEndDate}
                  onChange={e => setGlobalEndDate(e.target.value)}
                  className="w-full pl-7 sm:pl-9 pr-1 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d85b30]/30 focus:border-[#d85b30]"
                  aria-label="End Date"
                />
              </div>
            </div>
            <button 
              onClick={handleGlobalFilterApply}
              className="shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#d85b30] rounded-lg hover:bg-[#c04e28] transition-colors sm:self-end"
            >
              <span className="inline sm:hidden">Update</span>
              <span className="hidden sm:inline">Update Summary</span>
            </button>
          </div>
        }
      />

      {statsError && !stats && (
        <div className="rounded-xl bg-red-50 p-6 flex flex-col items-center justify-center text-center border border-red-100">
          <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
          <p className="text-sm font-medium text-red-800 mb-4">{statsError}</p>
          <button onClick={loadStats} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      {/* CASH FLOW */}
      <section className="min-w-0 max-w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cash Flow</h2>
        <HorizontalScrollContainer>
          <StatCard
            title="Cash Received"
            value={formatRupiah(stats?.cashReceived || 0)}
            icon={TrendingUp}
            color="bg-green-100 text-green-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Cash Refunded"
            value={formatRupiah(stats?.cashRefunded || 0)}
            icon={TrendingDown}
            color="bg-red-100 text-red-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Net Cash Flow"
            value={formatRupiah(stats?.netCashFlow || 0)}
            icon={DollarSign}
            color="bg-blue-100 text-blue-700"
            isLoading={statsLoading}
          />
        </HorizontalScrollContainer>
      </section>

      {/* PROFIT & LOSS */}
      <section className="min-w-0 max-w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profit & Loss</h2>
        <HorizontalScrollContainer>
          <StatCard
            title="Revenue"
            value={formatRupiah(stats?.totalRevenue || 0)}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="HPP / COGS"
            value={formatRupiah(stats?.totalHppCost || 0)}
            icon={TrendingDown}
            color="bg-orange-100 text-orange-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Gross Profit"
            value={formatRupiah(stats?.grossProfit || 0)}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Expenses"
            value={formatRupiah(stats?.totalExpenses || 0)}
            icon={TrendingDown}
            color="bg-red-100 text-red-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Net Profit"
            value={formatRupiah(stats?.netProfit || 0)}
            icon={DollarSign}
            color="bg-blue-100 text-blue-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Outstanding Payments"
            value={formatRupiah(stats?.outstandingPayments || 0)}
            icon={AlertCircle}
            color="bg-amber-100 text-amber-700"
            isLoading={statsLoading}
          />
          <StatCard
            title="Other Income"
            value={formatRupiah(stats?.otherIncome ?? stats?.nonRefundableDpIncome ?? 0)}
            icon={Plus}
            color="bg-purple-100 text-purple-700"
            isLoading={statsLoading}
          />
        </HorizontalScrollContainer>
      </section>

      {/* CHARTS / VISUALS */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 min-w-0 max-w-full">
        <div className="xl:col-span-2 min-w-0 max-w-full">
           <SalesTrendsCard 
             startDate={globalAppliedDates.start || undefined} 
             endDate={globalAppliedDates.end || undefined} 
           />
        </div>
        <div className="min-w-0 max-w-full">
           <ExpenseCategoriesCard
             summary={expenseSummary}
             isLoading={expenseSummaryLoading}
             error={expenseSummaryError}
             onRetry={loadStats}
           />
        </div>
      </div>

      {/* PRODUCT PROFITABILITY */}
      <DataTable
        title="Product Profitability"
        data={paginatedProducts}
        isLoading={statsLoading}
        emptyMessage="No product profitability data available."
        renderMobileCard={renderProductMobileCard}
        searchPlaceholder="Search product..."
        searchValue={prodSearch}
        onSearchChange={setProdSearch}
        sortOptions={PRODUCT_SORT_OPTIONS}
        sortBy={prodSortBy}
        onSortChange={setProdSortBy}
        filters={[
          {
            label: 'Margin Status',
            value: prodFilters.marginStatus,
            onChange: (val) => setProdFilters({ marginStatus: val }),
            type: 'select',
            options: [
              { label: 'High Margin (>= 30%)', value: 'high' },
              { label: 'Low Margin (< 30%)', value: 'low' }
            ]
          }
        ]}
        onClearFilters={() => setProdFilters({ marginStatus: '' })}
        page={prodPage}
        pageSize={prodPageSize}
        totalRows={filteredProducts.length}
        onPageChange={setProdPage}
        onPageSizeChange={(s) => { setProdPageSize(s); setProdPage(1); }}
        columns={[
          { header: 'Product', accessor: 'nama_produk', render: (row: any) => <span className="font-medium text-gray-900">{row.nama_produk}</span> },
          { header: 'Qty', accessor: 'qty_sold', align: 'center' },
          { header: 'Revenue', accessor: 'total_revenue', align: 'right', render: (row: any) => formatRupiah(row.total_revenue) },
          { header: 'HPP', accessor: 'total_hpp', align: 'right', render: (row: any) => formatRupiah(row.total_hpp) },
          { header: 'Gross Profit', accessor: 'gross_profit', align: 'right', render: (row: any) => formatRupiah(row.gross_profit) },
          { header: 'Margin', accessor: 'margin_percentage', align: 'right', render: (row: any) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.margin_percentage >= 30 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {row.margin_percentage}%
            </span>
          )}
        ]}
      />

      {/* SUPPLIER SPENDING */}
      <DataTable
        title="Supplier Spending"
        data={paginatedSuppliers}
        isLoading={statsLoading}
        emptyMessage="No supplier spending data available."
        emptySubtext="Supplier spending records are automatically aggregated from completed Purchase Orders (PO) and linked operational expenses."
        renderMobileCard={renderSupplierMobileCard}
        searchPlaceholder="Search supplier..."
        searchValue={supSearch}
        onSearchChange={setSupSearch}
        sortOptions={SUPPLIER_SORT_OPTIONS}
        sortBy={supSortBy}
        onSortChange={setSupSortBy}
        page={supPage}
        pageSize={supPageSize}
        totalRows={filteredSuppliers.length}
        onPageChange={setSupPage}
        onPageSizeChange={(s) => { setSupPageSize(s); setSupPage(1); }}
        columns={[
          {
            header: 'Supplier',
            accessor: 'nama_supplier',
            render: (row: any) => (
              <div>
                <span className="font-medium text-gray-900">{row.nama_supplier}</span>
                <p className="text-xs text-gray-400">ID #{row.supplier_id}</p>
              </div>
            )
          },
          {
            header: 'PO Spending',
            accessor: 'po_spending',
            align: 'right',
            render: (row: any) => (
              <div className="text-right">
                <div className="font-medium text-gray-900">{formatRupiah(row.po_spending)}</div>
                <div className="text-xs text-gray-500">{row.purchase_count} {row.purchase_count === 1 ? 'PO' : 'POs'}</div>
              </div>
            )
          },
          {
            header: 'Expense Spending',
            accessor: 'expense_spending',
            align: 'right',
            render: (row: any) => (
              <div className="text-right">
                <div className="font-medium text-gray-900">{formatRupiah(row.expense_spending)}</div>
                <div className="text-xs text-gray-500">{row.expense_count} {row.expense_count === 1 ? 'expense' : 'expenses'}</div>
              </div>
            )
          },
          {
            header: 'Total Combined Spending',
            accessor: 'total_spending',
            align: 'right',
            render: (row: any) => (
              <div className="text-right">
                <span className="font-semibold text-gray-900">{formatRupiah(row.total_spending)}</span>
                <div className="text-xs text-gray-500">{row.purchase_count + row.expense_count} total tx</div>
              </div>
            )
          }
        ]}
      />

      {/* EXPENSE LIST */}
      <DataTable
        title="Expense List"
        data={displayExpenses}
        isLoading={expensesLoading}
        emptyMessage="No expenses found."
        renderMobileCard={renderExpenseMobileCard}
        searchPlaceholder="Search expense category, vendor, supplier..."
        searchValue={expSearch}
        onSearchChange={setExpSearch}
        sortOptions={EXPENSE_SORT_OPTIONS}
        sortBy={expSortBy}
        onSortChange={setExpSortBy}
        filters={[
          {
            label: 'Category',
            type: 'select',
            value: expFilters.kategori,
            onChange: (val) => setExpFilters(prev => ({ ...prev, kategori: val })),
            options: PRESET_EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat })),
          },
          {
            label: 'Start Date',
            type: 'date',
            value: expFilters.startDate,
            onChange: (val) => setExpFilters(prev => ({ ...prev, startDate: val }))
          },
          {
            label: 'End Date',
            type: 'date',
            value: expFilters.endDate,
            onChange: (val) => setExpFilters(prev => ({ ...prev, endDate: val }))
          }
        ]}
        onApplyFilters={() => {
          setExpAppliedFilters(expFilters);
          setExpPage(1);
        }}
        onClearFilters={() => {
          const empty = { kategori: '', startDate: '', endDate: '' };
          setExpFilters(empty);
          setExpAppliedFilters(empty);
          setExpPage(1);
        }}
        page={expPage}
        pageSize={expPageSize}
        hasNextPage={expHasNextPage}
        onPageChange={setExpPage}
        onPageSizeChange={(s) => { setExpPageSize(s); setExpPage(1); }}
        headerAction={
          canManageExpenses && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-lg bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28] transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          )
        }
        columns={[
          {
            header: 'Date',
            accessor: 'tanggal',
            render: (row: ExpenseDetailResponse) => (
              <span className="text-gray-700 whitespace-nowrap">
                {new Date(row.tanggal).toLocaleDateString()}
              </span>
            )
          },
          {
            header: 'Category',
            accessor: 'kategori',
            render: (row: ExpenseDetailResponse) => (
              <div>
                <span className={`font-medium ${row.is_voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {row.kategori}
                </span>
                {row.deskripsi && (
                  <p className="text-xs text-gray-500 truncate max-w-[200px]" title={row.deskripsi}>
                    {row.deskripsi}
                  </p>
                )}
              </div>
            )
          },
          {
            header: 'Recipient / Supplier',
            accessor: 'penerima',
            render: (row: ExpenseDetailResponse) => (
              <div className="text-xs space-y-0.5">
                {row.supplier_name ? (
                  <div className="font-medium text-stone-900 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-gray-900 font-semibold">{row.supplier_name}</span>
                  </div>
                ) : (
                  <span className="text-stone-400 italic text-[11px]">No supplier linked</span>
                )}
                {row.penerima && row.penerima !== row.supplier_name && (
                  <div className="text-stone-500 font-normal">{row.penerima}</div>
                )}
              </div>
            )
          },
          {
            header: 'Payment Method',
            accessor: 'metode_pembayaran',
            render: (row: ExpenseDetailResponse) => {
              if (!row.metode_pembayaran) return <span className="text-gray-400">-</span>;
              const labels: Record<string, string> = {
                cash: 'Cash',
                bank_transfer: 'Bank Transfer',
                e_wallet: 'E-Wallet',
                card: 'Card',
                other: 'Other'
              };
              return <span className="text-gray-600">{labels[row.metode_pembayaran] || row.metode_pembayaran}</span>;
            }
          },
          {
            header: 'Amount',
            accessor: 'jumlah',
            align: 'right',
            render: (row: ExpenseDetailResponse) => (
              <div className="text-right">
                <span className={`font-semibold ${row.is_voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {formatRupiah(row.jumlah)}
                </span>
                {row.bukti_url && (
                  <div>
                    <a
                      href={row.bukti_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5 mt-0.5"
                    >
                      Receipt
                    </a>
                  </div>
                )}
              </div>
            )
          },
          {
            header: 'Status',
            align: 'center',
            render: (row: ExpenseDetailResponse) => (
              <div className="text-center">
                {row.is_voided ? (
                  <div className="flex flex-col items-center">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"
                    >
                      Voided
                    </span>
                    {row.void_reason && (
                      <p className="text-xs text-gray-500 mt-0.5 max-w-[140px] truncate" title={`Reason: ${row.void_reason}`}>
                        {row.void_reason}
                      </p>
                    )}
                    {row.voided_at && (
                      <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                        {new Date(row.voided_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                )}
              </div>
            )
          },
          {
            header: 'Recorded By',
            accessor: 'recorded_by_username',
            render: (row: ExpenseDetailResponse) => <span className="text-gray-500">{row.recorded_by_username}</span>
          },
          ...(canManageExpenses ? [{
            header: 'Actions',
            align: 'center' as const,
            render: (row: ExpenseDetailResponse) => (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => handleOpenAuditModal(row)}
                  className="px-2.5 py-1 text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                  title="View Audit History"
                >
                  History
                </button>
                {!row.is_voided && (
                  <>
                    <button
                      onClick={() => handleOpenEditModal(row)}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenCancelModal(row)}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )
          }] : [])
        ]}
      />

      {/* EXPENSE MODAL (CREATE / EDIT) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingExpense
                    ? 'Update operational expense details.'
                    : 'Record a new operational expense.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                }}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  required
                  value={expenseForm.kategori}
                  onChange={e => setExpenseForm(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none bg-white transition-shadow"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (IDR) <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <CurrencyInput
                    required
                    value={expenseForm.jumlah}
                    onChange={(val, raw) => setExpenseForm(prev => ({ ...prev, jumlah: raw ? String(val) : '' }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none transition-shadow"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={expenseForm.tanggal}
                    onChange={e => setExpenseForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                  </label>
                  <select
                    value={expenseForm.metode_pembayaran}
                    onChange={e => setExpenseForm(prev => ({ ...prev, metode_pembayaran: e.target.value as ExpensePaymentMethod | '' }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none bg-white transition-shadow"
                  >
                    <option value="">Select payment method (optional)</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="e_wallet">E-Wallet</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                  </label>
                  <select
                    value={expenseForm.supplier_id}
                    onChange={e => {
                      const selectedId = e.target.value;
                      setExpenseForm(prev => {
                        const selectedSup = supplierDropdownOptions.find(s => String(s.id) === selectedId);
                        const shouldAutoFillRecipient = !prev.penerima.trim() && selectedSup;
                        return {
                          ...prev,
                          supplier_id: selectedId,
                          penerima: shouldAutoFillRecipient ? selectedSup.nama_supplier : prev.penerima,
                        };
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none bg-white transition-shadow"
                  >
                    <option value="">None / Optional</option>
                    {supplierDropdownOptions.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.nama_supplier}{sup.is_active === false ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient / Vendor <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={expenseForm.penerima}
                  onChange={e => setExpenseForm(prev => ({ ...prev, penerima: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none transition-shadow"
                  placeholder="e.g. Toko Sejahtera, PLN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={expenseForm.deskripsi}
                  onChange={e => setExpenseForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none transition-shadow"
                  placeholder="Optional description or notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt URL (HTTPS) <span className="text-xs font-normal text-stone-400 ml-1">(Optional)</span>
                </label>
                <input
                  type="url"
                  maxLength={2048}
                  value={expenseForm.bukti_url}
                  onChange={e => setExpenseForm(prev => ({ ...prev, bukti_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]/20 outline-none transition-shadow"
                  placeholder="https://example.com/receipt.pdf"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Only valid https:// receipt links are accepted.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submittingExpense}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="flex-1 rounded-lg bg-[#d85b30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c04e28] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submittingExpense ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL / VOID EXPENSE MODAL */}
      {cancellingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-lg font-bold text-gray-900">Cancel Expense</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCancellingExpense(null);
                  setCancelReason('');
                }}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to void this expense for{' '}
              <strong className="text-gray-900">{cancellingExpense.kategori}</strong> ({formatRupiah(cancellingExpense.jumlah)})? This action cannot be undone.
            </p>

            <form onSubmit={handleConfirmCancelExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={255}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none transition-shadow"
                  placeholder="Provide a detailed reason (minimum 3 characters)..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  {cancelReason.trim().length}/255 characters (minimum 3 characters required)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingExpense(null);
                    setCancelReason('');
                  }}
                  disabled={isSubmittingCancel}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Keep Expense
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel || cancelReason.trim().length < 3}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE AUDIT MODAL */}
      {auditExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    Expense Audit History
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                    #{auditExpense.id}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Immutable audit trail for {auditExpense.kategori} &bull; {formatRupiah(auditExpense.jumlah)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditExpense(null)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {auditLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              ) : auditError ? (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{auditError}</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No audit history records available.
                </p>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
                  {auditLogs.map((log) => {
                    const actionBadge = {
                      created: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      updated: 'bg-blue-100 text-blue-800 border-blue-200',
                      voided: 'bg-red-100 text-red-800 border-red-200',
                    }[log.action] || 'bg-gray-100 text-gray-800 border-gray-200';

                    return (
                      <div key={log.id} className="relative flex items-start gap-4 pl-8">
                        {/* Dot */}
                        <div
                          className={`absolute left-2 top-2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white shadow-sm ${
                            log.action === 'created'
                              ? 'bg-emerald-500'
                              : log.action === 'voided'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                        />

                        {/* Card */}
                        <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${actionBadge}`}>
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mb-3">
                            Actor: {log.actor_id ? `User #${log.actor_id}` : 'System'}
                          </p>

                          {/* Changes breakdown */}
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            {renderAuditChanges(log)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setAuditExpense(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
