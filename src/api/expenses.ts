// src/api/expenses.ts
import { apiClient } from './client';
import type { ExpenseCreate, ExpenseDetailResponse, ExpensesSummary } from '../types/expense';

export async function createExpense(data: ExpenseCreate): Promise<ExpenseDetailResponse> {
  const response = await apiClient.post<ExpenseDetailResponse>('/expenses', data);
  return response.data;
}

export async function getExpenses(params?: {
  skip?: number;
  limit?: number;
  kategori?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ExpenseDetailResponse[]> {
  const response = await apiClient.get<ExpenseDetailResponse[]>('/expenses', { params });
  return response.data;
}

export async function getExpensesSummary(startDate?: string, endDate?: string): Promise<ExpensesSummary> {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await apiClient.get<ExpensesSummary>('/expenses/summary/dashboard', { params });
  return response.data;
}

export async function getExpenseDetail(id: number): Promise<ExpenseDetailResponse> {
  const response = await apiClient.get<ExpenseDetailResponse>(`/expenses/${id}`);
  return response.data;
}
