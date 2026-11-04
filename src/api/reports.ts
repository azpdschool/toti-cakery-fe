// src/api/reports.ts
import { apiClient } from './client';
import type { FinancialReportDetail, AnalyticsReport, SalesTrendsResponse } from '../types/finance';
import { formatDateToLocalYYYYMMDD } from '../utils/date';

const activeFinancialRequests = new Map<string, Promise<FinancialReportDetail>>();

export async function fetchFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReportDetail> {
  const formattedStart = startDate ? formatDateToLocalYYYYMMDD(startDate) || startDate.split('T')[0] : undefined;
  const formattedEnd = endDate ? formatDateToLocalYYYYMMDD(endDate) || endDate.split('T')[0] : undefined;

  const key = JSON.stringify({ startDate: formattedStart, endDate: formattedEnd });
  if (activeFinancialRequests.has(key)) return activeFinancialRequests.get(key)!;

  const params: Record<string, string> = {};
  if (formattedStart) params.start_date = formattedStart;
  if (formattedEnd) params.end_date = formattedEnd;
  
  const promise = apiClient.get<FinancialReportDetail>('/reports/financial', { params })
    .then(response => response.data)
    .finally(() => activeFinancialRequests.delete(key));
    
  activeFinancialRequests.set(key, promise);
  return promise;
}

export async function fetchAnalyticsReport(startDate?: string, endDate?: string): Promise<AnalyticsReport> {
  const formattedStart = startDate ? formatDateToLocalYYYYMMDD(startDate) || startDate.split('T')[0] : undefined;
  const formattedEnd = endDate ? formatDateToLocalYYYYMMDD(endDate) || endDate.split('T')[0] : undefined;

  const params: Record<string, string> = {};
  if (formattedStart) params.start_date = formattedStart;
  if (formattedEnd) params.end_date = formattedEnd;
  
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
  const formattedStart = startDate ? formatDateToLocalYYYYMMDD(startDate) || startDate.split('T')[0] : undefined;
  const formattedEnd = endDate ? formatDateToLocalYYYYMMDD(endDate) || endDate.split('T')[0] : undefined;

  const key = JSON.stringify({ startDate: formattedStart, endDate: formattedEnd });
  if (activeSummaryRequests.has(key)) return activeSummaryRequests.get(key)!;

  const params: Record<string, string> = {};
  if (formattedStart) params.start_date = formattedStart;
  if (formattedEnd) params.end_date = formattedEnd;
  
  const promise = apiClient.get<ReportSummary>('/reports/summary', { params })
    .then(response => response.data)
    .finally(() => activeSummaryRequests.delete(key));
    
  activeSummaryRequests.set(key, promise);
  return promise;
}

const activeSalesTrendsRequests = new Map<string, Promise<SalesTrendsResponse>>();

export async function fetchSalesTrends(
  startDate?: string,
  endDate?: string,
  granularity: 'day' | 'week' | 'month' = 'day'
): Promise<SalesTrendsResponse> {
  const formattedStart = startDate ? formatDateToLocalYYYYMMDD(startDate) || startDate.split('T')[0] : undefined;
  const formattedEnd = endDate ? formatDateToLocalYYYYMMDD(endDate) || endDate.split('T')[0] : undefined;

  const key = JSON.stringify({ startDate: formattedStart, endDate: formattedEnd, granularity });
  if (activeSalesTrendsRequests.has(key)) return activeSalesTrendsRequests.get(key)!;

  const params: Record<string, string> = { granularity };
  if (formattedStart) params.start_date = formattedStart;
  if (formattedEnd) params.end_date = formattedEnd;

  const promise = apiClient
    .get<SalesTrendsResponse>('/reports/sales-trends', { params })
    .then((response) => response.data)
    .finally(() => activeSalesTrendsRequests.delete(key));

  activeSalesTrendsRequests.set(key, promise);
  return promise;
}

