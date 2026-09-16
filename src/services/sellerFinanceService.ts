import { fetchFinancialReport, fetchAnalyticsReport } from '@/api/reports';
import { getExpensesSummary, getExpenses, createExpense } from '@/api/expenses';
import type { ExpenseDetailResponse, ExpenseCreate } from '@/types/expense';
import type { ProductProfitabilityItem, SupplierSpendingItem } from '@/types/finance';

// ============================================================
// TYPES
// ============================================================

export interface FinanceStats {
  revenue: number;
  totalRevenue: number;
  cashReceived: number;
  cashRefunded: number;
  netCashFlow: number;
  totalHppCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  outstandingPayments: number;
  nonRefundableDpIncome: number;
  otherIncome: number;
  productProfitability: ProductProfitabilityItem[];
  supplierSpending: SupplierSpendingItem[];
}

export interface PaymentSummary {
  // Fallback structure, will be empty/0
  lunas: number;
  sebagian: number;
  belumLunas: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface AnalyticsSummary {
  totalCustomers: number;
  conversionRate: number;
  mostReviewedProduct: string | null;
  avgRating: number | null;
}

// ============================================================
// FUNGSI SERVICE
// ============================================================

export async function getFinanceStats(startDate?: string, endDate?: string): Promise<FinanceStats> {
  const data = await fetchFinancialReport(startDate, endDate);
  return {
    revenue: Number(data.revenue || 0),
    totalRevenue: Number(data.total_revenue || 0),
    cashReceived: Number(data.cash_received || 0),
    cashRefunded: Number(data.cash_refunded || 0),
    netCashFlow: Number(data.net_cash_flow || 0),
    totalHppCost: Number(data.total_hpp_cost || 0),
    grossProfit: Number(data.gross_profit || 0),
    totalExpenses: Number(data.total_expenses || 0),
    netProfit: Number(data.net_profit || 0),
    outstandingPayments: Number(data.outstanding_payments || 0),
    nonRefundableDpIncome: Number(data.non_refundable_dp_income || 0),
    otherIncome: Number(data.other_income || 0),
    productProfitability: data.product_profitability || [],
    supplierSpending: data.supplier_spending || [],
  };
}

export async function getAnalyticsSummary(startDate?: string, endDate?: string): Promise<AnalyticsSummary> {
  const data = await fetchAnalyticsReport(startDate, endDate);
  return {
    totalCustomers: data.total_customers,
    conversionRate: data.conversion_rate_via_chatbot,
    mostReviewedProduct: data.most_reviewed_product?.nama_produk || null,
    avgRating: data.most_reviewed_product?.avg_rating || null,
  };
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  // Backend endpoint for overall payment summary is not available.
  // Returning empty state.
  return {
    lunas: 0,
    sebagian: 0,
    belumLunas: 0,
  };
}

const COLORS = ['#d85b30', '#e0a04e', '#6f5448', '#8b7166', '#a38475', '#c89f8d'];

export async function getExpenseCategories(startDate?: string, endDate?: string): Promise<ExpenseCategory[]> {
  const data = await getExpensesSummary(startDate, endDate);
  
  if (!data.by_category || Object.keys(data.by_category).length === 0) {
    return [];
  }

  const total = Number(data.total_expenses);
  
  return Object.entries(data.by_category).map(([catKategori, catTotal], index) => {
    const amount = Number(catTotal);
    return {
      category: catKategori,
      amount: amount,
      percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      color: COLORS[index % COLORS.length],
    };
  });
}

export async function getExpenseList(params?: {
  skip?: number;
  limit?: number;
  kategori?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ExpenseDetailResponse[]> {
  return getExpenses(params);
}

export async function addExpense(data: ExpenseCreate): Promise<ExpenseDetailResponse> {
  return createExpense(data);
}

// ============================================================
// FUNGSI INVOICE & EXPORT (TIDAK TERSEDIA DI BACKEND)
// ============================================================

export async function getFinanceInvoices(): Promise<unknown[]> {
  // Backend tidak menyediakan endpoint daftar invoice umum.
  // Mengembalikan array kosong.
  return [];
}

export function exportFinancePdf(): void {
  // Tidak ada endpoint backend untuk export pdf bulk
  console.warn('Export PDF belum didukung oleh backend.');
}

export function exportSingleInvoicePdf(): void {
  // Tidak ada endpoint backend untuk export pdf
  console.warn('Export PDF single invoice belum didukung oleh backend.');
}
