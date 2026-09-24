// src/api/reports.ts
import { apiClient } from './client';
import type { FinancialReportDetail, AnalyticsReport } from '../types/finance';

const activeFinancialRequests = new Map<string, Promise<FinancialReportDetail>>();

export async function fetchFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReportDetail> {
  const key = JSON.stringify({ startDate, endDate });
  if (activeFinancialRequests.has(key)) return activeFinancialRequests.get(key)!;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const promise = apiClient.get<FinancialReportDetail>('/reports/financial', { params })
    .then(response => response.data)
    .finally(() => activeFinancialRequests.delete(key));
    
  activeFinancialRequests.set(key, promise);
  return promise;
}

export async function fetchAnalyticsReport(startDate?: string, endDate?: string): Promise<AnalyticsReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await apiClient.get<AnalyticsReport>('/reports/analytics', { params });
  return response.data;
}

export interface RecentOrderSummary {
  id: number;
  customer_name?: string;
  total_price?: number;
  status: string;
  created_at?: string;
  order_date?: string;
}

export interface ReportSummary {
  total_products: number;
  active_products: number;
  total_revenue: number;
  total_sales?: number;
  total_orders: number;
  recent_orders: RecentOrderSummary[];
}

const activeSummaryRequests = new Map<string, Promise<ReportSummary>>();

export async function fetchReportSummary(startDate?: string, endDate?: string): Promise<ReportSummary> {
  const key = JSON.stringify({ startDate, endDate });
  if (activeSummaryRequests.has(key)) return activeSummaryRequests.get(key)!;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const promise = apiClient.get<ReportSummary>('/reports/summary', { params })
    .then(response => response.data)
    .finally(() => activeSummaryRequests.delete(key));
    
  activeSummaryRequests.set(key, promise);
  return promise;
}
