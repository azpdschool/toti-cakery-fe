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
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  BarChart2,
  Table as TableIcon
} from 'lucide-react';
import { formatRupiah } from '@/services/productService';
import {
  getFinanceStats,
  getExpenseCategories,
  getExpenseList,
  addExpense,
  updateExpense,
  cancelExpense,
  getExpenseAudit,
  fetchSalesTrends,
  type FinanceStats,
  type ExpenseCategory,
  type ExpenseAuditItem,
  type SalesTrendsResponse,
} from '@/services/sellerFinanceService';
import type { ExpenseDetailResponse, ExpensePaymentMethod } from '@/types/expense';
import { hasPermission } from '@/services/rbacService';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/services/sellerSettingsService';
import { ROUTES } from '@/constants';

// ============================================================
// HORIZONTAL SCROLL CONTAINER
// ============================================================

function HorizontalScrollContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useState<HTMLDivElement | null>(null);

  const scrollLeft = () => {
    if (containerRef[0]) {
      containerRef[0].scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef[0]) {
      containerRef[0].scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="group relative">
      <button 
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </button>
      
      <div 
        ref={(el) => containerRef[1](el)}
        className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      <button 
        onClick={scrollRight}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 -mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
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
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 shrink-0 min-w-[240px] snap-start animate-pulse">
        <div className="h-10 w-10 rounded-full bg-gray-200 mb-4"></div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 shrink-0 min-w-[240px] snap-start">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {subtitle && <span className="text-xs font-medium text-gray-500">{subtitle}</span>}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900 truncate" title={value}>{value}</p>
      <p className="mt-1 text-sm font-medium text-gray-500">{title}</p>
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

function ExpenseCategoriesCard({ data, isLoading }: { data: ExpenseCategory[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 h-full animate-pulse min-h-[300px]">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
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

  if (data.length === 0) {
    return (
      <NotAvailableCard 
        title="Expense Breakdown" 
        description="See how business expenses are distributed across categories." 
        message="Expense breakdown data is not available yet." 
      />
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 h-full">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
      <div className="space-y-5">
        {data.map(cat => (
          <div key={cat.category}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">{cat.category}</span>
              <span className="font-semibold text-gray-900">
                {formatRupiah(cat.amount)} <span className="text-gray-500 font-normal ml-1">({cat.percentage}%)</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color || '#4b5563' }}
              />
            </div>
          </div>
        ))}
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
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col h-full">
      {/* Header with Granularity & View Switchers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
        <div>
          <span className="text-gray-500 block">Total Revenue</span>
          <span className="text-sm font-bold text-gray-900">{formatRupiah(totals.revenue)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Total COGS (HPP)</span>
          <span className="text-sm font-bold text-amber-700">{formatRupiah(totals.hpp)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Gross Profit</span>
          <span className="text-sm font-bold text-emerald-700">{formatRupiah(totals.grossProfit)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Total Orders</span>
          <span className="text-sm font-bold text-blue-700">{totals.orderCount}</span>
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
        /* Table View */
        <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
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

interface TableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  isLoading: boolean;
  emptyMessage: string;
  
  // Search
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  
  // Filter
  filters?: FilterProps[];
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  
  // Pagination
  page: number;
  pageSize: number;
  totalRows: number;
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
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  onApplyFilters,
  onClearFilters,
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  headerAction
}: TableProps<T>) {
  const [showFilter, setShowFilter] = useState(false);
  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {headerAction}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {searchPlaceholder && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                aria-label="Search"
              />
            </div>
          )}
          
          {filters && filters.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={showFilter}
                aria-haspopup="true"
                aria-label="Filter"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
              
              {showFilter && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-20 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Filters</h4>
                  <div className="space-y-4 mb-6">
                    {filters.map((f, idx) => (
                      <div key={idx}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                        {f.type === 'date' ? (
                          <input
                            type="date"
                            value={f.value}
                            onChange={(e) => f.onChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : f.type === 'select' ? (
                          <select
                            value={f.value}
                            onChange={(e) => f.onChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">All</option>
                            {f.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => f.onChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onClearFilters?.();
                        setShowFilter(false);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => {
                        onApplyFilters?.();
                        setShowFilter(false);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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

      {/* Table */}
      <div className="overflow-x-auto">
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
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Rows per page:</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1 text-sm">
          <button 
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            &larr; Previous
          </button>
          <span className="px-3 py-1 font-medium text-gray-700">
            {page} of {totalPages}
          </span>
          <button 
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            Next &rarr;
          </button>
        </div>
      </div>
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
  const canManageExpenses = userRole === 'owner' || userRole === 'admin';

  const [statsLoading, setStatsLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Stats Data
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Tables Data (Client-side filtered for Product & Supplier)
      
  // Expenses (Server-side paginated)
  const [expenses, setExpenses] = useState<ExpenseDetailResponse[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0); // Optional if backend doesn't return it
  
  // Expenses State
  const [expPage, setExpPage] = useState(1);
  const [expPageSize, setExpPageSize] = useState(10);
  const [expSearch, setExpSearch] = useState('');
  const [expDebouncedSearch, setExpDebouncedSearch] = useState('');
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
  const [prodFilters, setProdFilters] = useState({ marginStatus: '' });
  
  // Supplier State
  const [supPage, setSupPage] = useState(1);
  const [supPageSize, setSupPageSize] = useState(10);
  const [supSearch, setSupSearch] = useState('');

  // Global Date Filter (for KPIs)
  const [globalStartDate, setGlobalStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [globalEndDate, setGlobalEndDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  });
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
    deskripsi: '',
    bukti_url: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [cancellingExpenseId, setCancellingExpenseId] = useState<number | null>(null);

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
    try {
      const sd = globalAppliedDates.start || undefined;
      const ed = globalAppliedDates.end || undefined;
      const [statsRes, categoriesRes] = await Promise.all([
        getFinanceStats(sd, ed),
        getExpenseCategories(sd, ed),
      ]);
      setStats(statsRes);
      setExpenseCategories(categoriesRes);
    } catch (err) {
      console.error('Failed to load finance stats:', err);
      setStatsError('Unable to load financial information right now.');
    } finally {
      setStatsLoading(false);
    }
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
        limit: expPageSize,
        kategori: expAppliedFilters.kategori || undefined,
        start_date: sd,
        end_date: ed
      });
      setExpenses(res);
      if (res.length === expPageSize) {
        setExpensesTotal(skip + expPageSize + 1);
      } else {
        setExpensesTotal(skip + res.length);
      }
    } catch (err) {
      console.error('Failed to load expenses list:', err);
      setExpenses([]);
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
    let result = stats.productProfitability;
    
    if (prodSearch) {
      const s = prodSearch.toLowerCase();
      result = result.filter(p => p.nama_produk.toLowerCase().includes(s));
    }
    
    if (prodFilters.marginStatus === 'high') {
      result = result.filter(p => p.margin_percentage >= 30);
    } else if (prodFilters.marginStatus === 'low') {
      result = result.filter(p => p.margin_percentage < 30);
    }
    
    return result;
  }, [stats?.productProfitability, prodSearch, prodFilters]);
  
  const paginatedProducts = useMemo(() => {
    const start = (prodPage - 1) * prodPageSize;
    return filteredProducts.slice(start, start + prodPageSize);
  }, [filteredProducts, prodPage, prodPageSize]);

  const filteredSuppliers = useMemo(() => {
    if (!stats?.supplierSpending) return [];
    let result = stats.supplierSpending;
    
    if (supSearch) {
      const s = supSearch.toLowerCase();
      result = result.filter(sup => sup.nama_supplier.toLowerCase().includes(s));
    }
    
    return result;
  }, [stats?.supplierSpending, supSearch]);
  
  const paginatedSuppliers = useMemo(() => {
    const start = (supPage - 1) * supPageSize;
    return filteredSuppliers.slice(start, start + supPageSize);
  }, [filteredSuppliers, supPage, supPageSize]);
  
  // Client-side search fallback for Expenses if search text is provided
  // (Since backend lacks search parameter)
  const displayExpenses = useMemo(() => {
    if (!expDebouncedSearch) return expenses;
    const s = expDebouncedSearch.toLowerCase();
    return expenses.filter(e => 
      e.kategori.toLowerCase().includes(s) || 
      e.recorded_by_username.toLowerCase().includes(s)
    );
  }, [expenses, expDebouncedSearch]);

  const handleGlobalFilterApply = () => {
    setGlobalAppliedDates({ start: globalStartDate, end: globalEndDate });
  };

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      kategori: '',
      jumlah: '',
      tanggal: new Date().toISOString().split('T')[0],
      metode_pembayaran: '',
      penerima: '',
      deskripsi: '',
      bukti_url: '',
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditModal = (expense: ExpenseDetailResponse) => {
    setEditingExpense(expense);
    let dateStr = '';
    if (expense.tanggal) {
      try {
        dateStr = new Date(expense.tanggal).toISOString().split('T')[0];
      } catch {
        dateStr = '';
      }
    }
    setExpenseForm({
      kategori: expense.kategori || '',
      jumlah: String(expense.jumlah ?? ''),
      tanggal: dateStr,
      metode_pembayaran: expense.metode_pembayaran || '',
      penerima: expense.penerima || '',
      deskripsi: expense.deskripsi || '',
      bukti_url: expense.bukti_url || '',
    });
    setShowExpenseModal(true);
  };

  const handleCancelExpense = async (id: number) => {
    const reason = window.prompt('Enter cancellation reason (at least 3 characters):');
    if (reason === null) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast.error('Cancellation reason must be at least 3 characters.');
      return;
    }

    try {
      setCancellingExpenseId(id);
      await cancelExpense(id, trimmed);
      toast.success('Expense cancelled successfully.');
      loadExpenses();
      loadStats();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail;
      const displayMsg = typeof errMsg === 'string' ? errMsg : 'Unable to cancel expense.';
      toast.error(displayMsg);
    } finally {
      setCancellingExpenseId(null);
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

        const origDateStr = editingExpense.tanggal ? editingExpense.tanggal.split('T')[0] : '';
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

  if (!canViewFinance) {
    return <Navigate to={ROUTES.SELLER_DASHBOARD} replace />;
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Finance</h1>
          <p className="text-gray-500 mt-1">Monitor cash flow, profitability, expenses, and financial performance.</p>
        </div>
        
        {/* Global Date Filter */}
        <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="date"
                value={globalStartDate}
                onChange={e => setGlobalStartDate(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="date"
                value={globalEndDate}
                onChange={e => setGlobalEndDate(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button 
            onClick={handleGlobalFilterApply}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Summary
          </button>
        </div>
      </div>

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
      <section>
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
      <section>
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
            value={formatRupiah((stats?.nonRefundableDpIncome || 0) + (stats?.otherIncome || 0))}
            icon={Plus}
            color="bg-purple-100 text-purple-700"
            isLoading={statsLoading}
          />
        </HorizontalScrollContainer>
      </section>

      {/* CHARTS / VISUALS */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
           <SalesTrendsCard 
             startDate={globalAppliedDates.start || undefined} 
             endDate={globalAppliedDates.end || undefined} 
           />
        </div>
        <div>
           <ExpenseCategoriesCard data={expenseCategories} isLoading={statsLoading} />
        </div>
      </div>

      {/* PRODUCT PROFITABILITY */}
      <DataTable
        title="Product Profitability"
        data={paginatedProducts}
        isLoading={statsLoading}
        emptyMessage="No product profitability data available."
        searchPlaceholder="Search product..."
        searchValue={prodSearch}
        onSearchChange={setProdSearch}
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
        searchPlaceholder="Search supplier..."
        searchValue={supSearch}
        onSearchChange={setSupSearch}
        page={supPage}
        pageSize={supPageSize}
        totalRows={filteredSuppliers.length}
        onPageChange={setSupPage}
        onPageSizeChange={(s) => { setSupPageSize(s); setSupPage(1); }}
        columns={[
          { header: 'Supplier', accessor: 'nama_supplier', render: (row: any) => <span className="font-medium text-gray-900">{row.nama_supplier}</span> },
          { header: 'Transactions', accessor: 'purchase_count', align: 'center' },
          { header: 'Total Spending', accessor: 'total_spending', align: 'right', render: (row: any) => <span className="font-semibold text-gray-900">{formatRupiah(row.total_spending)}</span> }
        ]}
      />

      {/* EXPENSE LIST */}
      <DataTable
        title="Expense List"
        data={displayExpenses}
        isLoading={expensesLoading}
        emptyMessage="No expenses found."
        searchPlaceholder="Search expense category or user..."
        searchValue={expSearch}
        onSearchChange={setExpSearch}
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
        totalRows={expensesTotal}
        onPageChange={setExpPage}
        onPageSizeChange={(s) => { setExpPageSize(s); setExpPage(1); }}
        headerAction={
          canManageExpenses && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
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
            header: 'Recipient / Vendor',
            accessor: 'penerima',
            render: (row: ExpenseDetailResponse) => (
              <span className="text-gray-600">{row.penerima || '-'}</span>
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
            render: (row: ExpenseDetailResponse) => {
              const isCancelling = cancellingExpenseId === row.id;
              return (
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
                        onClick={() => handleCancelExpense(row.id)}
                        disabled={isCancelling}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50 transition-colors"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </>
                  )}
                </div>
              );
            }
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
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={expenseForm.kategori}
                  onChange={e => setExpenseForm(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-shadow"
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
                    Amount (IDR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={expenseForm.jumlah}
                    onChange={e => setExpenseForm(prev => ({ ...prev, jumlah: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expenseForm.tanggal}
                    onChange={e => setExpenseForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expenseForm.metode_pembayaran}
                    onChange={e => setExpenseForm(prev => ({ ...prev, metode_pembayaran: e.target.value as ExpensePaymentMethod | '' }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-shadow"
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
                    Recipient / Vendor
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={expenseForm.penerima}
                    onChange={e => setExpenseForm(prev => ({ ...prev, penerima: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="e.g. Toko Sejahtera, PLN"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={expenseForm.deskripsi}
                  onChange={e => setExpenseForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                  placeholder="Optional description or notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt URL (HTTPS)
                </label>
                <input
                  type="url"
                  maxLength={2048}
                  value={expenseForm.bukti_url}
                  onChange={e => setExpenseForm(prev => ({ ...prev, bukti_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
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
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submittingExpense ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
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
