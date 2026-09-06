// src/types/finance.ts

export interface FinancialReportDetail {
  total_revenue: number;
  total_expenses: number;
  total_hpp_cost: number;
  gross_profit: number;
  net_profit: number;
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
