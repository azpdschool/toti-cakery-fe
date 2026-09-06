// src/api/reports.ts
import { apiClient } from './client';
import type { FinancialReportDetail, AnalyticsReport } from '../types/finance';

export async function fetchFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReportDetail> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await apiClient.get<FinancialReportDetail>('/reports/financial', { params });
  return response.data;
}

export async function fetchAnalyticsReport(startDate?: string, endDate?: string): Promise<AnalyticsReport> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await apiClient.get<AnalyticsReport>('/reports/analytics', { params });
  return response.data;
}
