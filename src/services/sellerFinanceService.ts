// src/services/sellerFinanceService.ts

import { formatRupiah } from './productService';
import { getInvoices, type Invoice } from './sellerOrderService';

// ============================================================
// TYPES
// ============================================================

export interface FinanceStats {
  totalRevenue: number;
  revenueChange: string;
  totalExpenses: number;
  expensesChange: string;
  netProfit: number;
  profitChange: string;
  unpaidInvoices: number; // total tagihan belum lunas
  unpaidCount: number; // jumlah invoice belum lunas
}

export interface SalesChartData {
  day: string;
  value: number;
}

export interface PaymentSummary {
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

export interface FinanceInvoice extends Invoice {
  // tambahan untuk tampilan
}

// ============================================================
// DUMMY DATA
// ============================================================

const dummyStats: FinanceStats = {
  totalRevenue: 18450000,
  revenueChange: '+12% dari bulan lalu',
  totalExpenses: 6230000,
  expensesChange: '+8% dari bulan lalu',
  netProfit: 12220000,
  profitChange: '+15% dari bulan lalu',
  unpaidInvoices: 3150000,
  unpaidCount: 5,
};

const dummySalesChart: SalesChartData[] = [
  { day: 'Sen', value: 180 },
  { day: 'Sel', value: 220 },
  { day: 'Rab', value: 160 },
  { day: 'Kam', value: 240 },
  { day: 'Jum', value: 200 },
  { day: 'Sab', value: 280 },
  { day: 'Min', value: 150 },
];

const dummyPaymentSummary: PaymentSummary = {
  lunas: 18,
  sebagian: 5,
  belumLunas: 7,
};

const dummyExpenseCategories: ExpenseCategory[] = [
  { category: 'Bahan Baku', amount: 3450000, percentage: 55, color: '#d85b30' },
  { category: 'Kemasan', amount: 1250000, percentage: 20, color: '#e0a04e' },
  { category: 'Operasional', amount: 950000, percentage: 15, color: '#6f5448' },
  { category: 'Lain-lain', amount: 580000, percentage: 10, color: '#8b7166' },
];

// ============================================================
// FUNGSI SERVICE
// ============================================================

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function getFinanceStats(): Promise<FinanceStats> {
  await delay();
  return dummyStats;
}

export async function getSalesChart(): Promise<SalesChartData[]> {
  await delay();
  return dummySalesChart;
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  await delay();
  // Bisa juga dihitung dari invoice riil
  return dummyPaymentSummary;
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  await delay();
  return dummyExpenseCategories;
}

// Gabungkan invoice dari orderService dengan data tambahan (jika perlu)
export async function getFinanceInvoices(): Promise<Invoice[]> {
  await delay();
  return getInvoices();
}

// Export PDF (simulasi)
export function exportFinancePdf(invoiceIds: string[]): void {
  console.log(`Export finance data for invoices: ${invoiceIds.join(', ')}`);
  alert(`Export ${invoiceIds.length} invoice ke PDF (simulasi)`);
}

export function exportSingleInvoicePdf(invoiceId: string): void {
  console.log(`Export single invoice ${invoiceId} to PDF`);
  alert(`Invoice ${invoiceId} akan di-export ke PDF (simulasi)`);
}