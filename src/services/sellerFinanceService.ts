import { apiClient } from '@/api/client';
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

export interface FinanceInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  date: string;
  time: string;
  total: number;
  paid: number;
  amountDue: number;
  status: 'paid' | 'partial' | 'unpaid';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  orderMethod: string;
  dueDate: string;
  notes?: string;
  items?: any[];
  createdAt?: string;
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
    productProfitability: data.full_product_profitability || data.product_profitability || [],
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

function resolvePaymentStatus(o: any): 'paid' | 'partial' | 'unpaid' {
  const raw = String(o.payment_status || o.invoice?.status || '').toLowerCase();
  if (['paid', 'lunas'].includes(raw)) return 'paid';
  if (['partial', 'sebagian', 'dp'].includes(raw)) return 'partial';
  if (['unpaid', 'belum', 'belum_dibayar'].includes(raw)) return 'unpaid';

  const total = parseFloat(o.total_harga_pesanan || o.total) || 0;
  const paid = parseFloat(o.amount_paid || o.paid) || 0;
  if (total > 0 && paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

async function fetchFilteredOrders(startDate?: string, endDate?: string): Promise<any[]> {
  try {
    const response = await apiClient.get('/orders', { params: { limit: 500 } });
    let orders: any[] = response.data || [];

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      orders = orders.filter((o: any) => {
        const d = new Date(o.created_at || o.date);
        return !isNaN(d.getTime()) && d >= s;
      });
    }

    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      orders = orders.filter((o: any) => {
        const d = new Date(o.created_at || o.date);
        return !isNaN(d.getTime()) && d <= e;
      });
    }

    return orders;
  } catch (error) {
    console.error('Failed to fetch orders for finance:', error);
    return [];
  }
}

export async function getPaymentSummary(startDate?: string, endDate?: string): Promise<PaymentSummary> {
  const orders = await fetchFilteredOrders(startDate, endDate);
  let lunas = 0;
  let sebagian = 0;
  let belumLunas = 0;

  for (const o of orders) {
    const status = resolvePaymentStatus(o);
    if (status === 'paid') {
      lunas++;
    } else if (status === 'partial') {
      sebagian++;
    } else {
      belumLunas++;
    }
  }

  return {
    lunas,
    sebagian,
    belumLunas,
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
// FUNGSI INVOICE & EXPORT
// ============================================================

export async function getFinanceInvoices(startDate?: string, endDate?: string): Promise<FinanceInvoice[]> {
  const orders = await fetchFilteredOrders(startDate, endDate);
  return orders.map((o: any) => {
    const total = parseFloat(o.total_harga_pesanan || o.total) || 0;
    const paid = parseFloat(o.amount_paid || o.paid) || 0;
    const amountDue = o.amount_due !== undefined && o.amount_due !== null
      ? parseFloat(o.amount_due)
      : Math.max(0, total - paid);
    const paymentStatus = resolvePaymentStatus(o);

    const createdAtDate = o.created_at ? new Date(o.created_at) : null;
    const dateFormatted = createdAtDate && !isNaN(createdAtDate.getTime())
      ? createdAtDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : (o.date || '-');
    const timeFormatted = createdAtDate && !isNaN(createdAtDate.getTime())
      ? createdAtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : (o.time || '-');

    return {
      id: o.invoice?.id ? String(o.invoice.id) : (o.id ? String(o.id) : ''),
      invoiceNumber: o.invoice?.nomor_invoice || (o.id ? `#${o.id}` : '-'),
      orderId: String(o.id),
      customerName: o.customer?.nama || o.customerName || 'Customer',
      customerPhone: o.customer?.nomor_wa || o.customerPhone || '-',
      orderNumber: `#${o.id}`,
      date: dateFormatted,
      time: timeFormatted,
      total,
      paid,
      amountDue,
      status: paymentStatus,
      paymentStatus,
      orderMethod: o.metode_pengiriman === 'pickup' ? 'Pickup' : 'Delivery Toko',
      dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString('id-ID') : (o.dueDate || '-'),
      notes: o.notes || '',
      items: o.order_items || o.items || [],
      createdAt: o.created_at,
    };
  });
}

export function exportFinancePdf(): void {
  // Tidak ada endpoint backend untuk export pdf bulk
  console.warn('Export PDF belum didukung oleh backend.');
}

export function exportSingleInvoicePdf(): void {
  // Tidak ada endpoint backend untuk export pdf
  console.warn('Export PDF single invoice belum didukung oleh backend.');
}
