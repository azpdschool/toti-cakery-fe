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
  Search
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

  // Modal Add Expense
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    kategori: '',
    jumlah: ''
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

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

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!expenseForm.kategori || !expenseForm.jumlah) return;

    try {
      setSubmittingExpense(true);
      await addExpense({
        kategori: expenseForm.kategori,
        jumlah: parseFloat(expenseForm.jumlah)
      });
      setShowAddExpense(false);
      setExpenseForm({ kategori: '', jumlah: '' });
      loadStats(); 
      loadExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Unable to add expense.');
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
           <NotAvailableCard 
             title="Sales Trends" 
             description="Track sales performance over time."
             message="Sales trend reporting is not available yet." 
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
            value: expFilters.kategori,
            onChange: (val) => setExpFilters(prev => ({ ...prev, kategori: val }))
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
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          )
        }
        columns={[
          { header: 'Date', accessor: 'tanggal', render: (row: any) => new Date(row.tanggal).toLocaleDateString() },
          { header: 'Category', accessor: 'kategori', render: (row: any) => <span className="font-medium text-gray-900">{row.kategori}</span> },
          { header: 'Recorded By', accessor: 'recorded_by_username', render: (row: any) => <span className="text-gray-500">{row.recorded_by_username}</span> },
          { header: 'Amount', accessor: 'jumlah', align: 'right', render: (row: any) => <span className="font-semibold text-gray-900">{formatRupiah(row.jumlah)}</span> }
        ]}
      />

      {/* ADD EXPENSE MODAL */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
              <button onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expense Category
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.kategori}
                  onChange={e => setExpenseForm(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                  placeholder="e.g. Electricity, Salary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={expenseForm.jumlah}
                  onChange={e => setExpenseForm(prev => ({ ...prev, jumlah: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
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
                  {submittingExpense ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
