// src/types/finance.ts

export interface ProductProfitabilityItem {
  product_id: number;
  nama_produk: string;
  qty_sold: number;
  total_revenue: number;
  total_hpp: number;
  gross_profit: number;
  margin_percentage: number;
}

export interface SupplierSpendingItem {
  supplier_id: number;
  nama_supplier: string;
  total_spending: number;
  purchase_count: number;
}

export interface FinancialReportDetail {
  revenue: number;
  total_revenue: number;
  cash_received: number;
  cash_refunded: number;
  net_cash_flow: number;
  hpp_total: number;
  total_hpp_cost: number;
  gross_profit: number;
  expenses_total: number;
  total_expenses: number;
  net_profit: number;
  outstanding_payments: number;
  non_refundable_dp_income: number;
  other_income: number;
  product_profitability: ProductProfitabilityItem[];
  full_product_profitability: ProductProfitabilityItem[];
  supplier_spending: SupplierSpendingItem[];
}

export interface MostReviewedProduct {
  nama_produk: string;
  avg_rating: number;
  review_count: number;
}

export interface AnalyticsReport {
  total_customers: number;
  conversion_rate_via_chatbot: number;
  most_reviewed_product: MostReviewedProduct | null;
}
