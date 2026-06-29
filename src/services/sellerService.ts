// src/services/sellerService.ts

// ============================================================
// TYPES
// ============================================================

export interface DashboardStats {
  totalRevenue: string;
  revenueChange: string;
  totalOrders: number;
  ordersChange: string;
  totalCustomers: number;
  customersChange: string;
  totalSold: string;
  soldChange: string;
}

export interface SalesChartData {
  day: string;
  value: number;
}

export interface OrderSummaryItem {
  status: string;
  label: string;
  count: number;
}

export interface StockSummaryItem {
  label: string;
  count: number;
  type: 'safe' | 'low' | 'empty' | 'all';
}

// ============================================================
// DUMMY DATA (nanti bisa diganti dengan API)
// ============================================================

const dummyStats: DashboardStats = {
  totalRevenue: 'Rp 18.450.000',
  revenueChange: '+12% dari bulan lalu',
  totalOrders: 112,
  ordersChange: '+9% dari bulan lalu',
  totalCustomers: 87,
  customersChange: '+15% dari bulan lalu',
  totalSold: '456 pcs',
  soldChange: '+10% dari bulan lalu',
};

const dummySalesChart: SalesChartData[] = [
  { day: 'Sen', value: 180 },
  { day: 'Sel', value: 220 },
  { day: 'Rab', value: 160 },
  { day: 'Kam', value: 240 },
  { day: 'Jun', value: 200 },
  { day: 'Sab', value: 280 },
  { day: 'Min', value: 150 },
];

const dummyOrderSummary: OrderSummaryItem[] = [
  { status: 'selesai', label: 'Selesai', count: 69 },
  { status: 'diproses', label: 'Diproses', count: 25 },
  { status: 'menunggu', label: 'Menunggu', count: 12 },
  { status: 'dibatalkan', label: 'Dibatalkan', count: 6 },
  { status: 'dibayar', label: 'Dibayar', count: 5 },
];

const dummyStockSummary: StockSummaryItem[] = [
  { label: 'Stok Aman', count: 24, type: 'safe' },
  { label: 'Stok Menipis', count: 8, type: 'low' },
  { label: 'Stok Habis', count: 6, type: 'empty' },
  { label: 'Semua Bahan', count: 38, type: 'all' },
];

// ============================================================
// FUNGSI SERVICE (dengan simulasi delay)
// ============================================================

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay();
  return dummyStats;
}

export async function getSalesChartData(): Promise<SalesChartData[]> {
  await delay();
  return dummySalesChart;
}

export async function getOrderSummary(): Promise<OrderSummaryItem[]> {
  await delay();
  return dummyOrderSummary;
}

export async function getStockSummary(): Promise<StockSummaryItem[]> {
  await delay();
  return dummyStockSummary;
}