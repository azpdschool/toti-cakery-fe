// src/api/expenses.ts
import { apiClient } from './client';
import type { ExpenseCreate, ExpenseDetailResponse, ExpensesSummary } from '../types/expense';

export async function createExpense(data: ExpenseCreate): Promise<ExpenseDetailResponse> {
  const response = await apiClient.post<ExpenseDetailResponse>('/expenses', data);
  return response.data;
}

const activeExpensesRequests = new Map<string, Promise<ExpenseDetailResponse[]>>();

export async function getExpenses(params?: {
  skip?: number;
  limit?: number;
  kategori?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ExpenseDetailResponse[]> {
  const key = JSON.stringify(params || {});
  if (activeExpensesRequests.has(key)) return activeExpensesRequests.get(key)!;

  const promise = apiClient.get<ExpenseDetailResponse[]>('/expenses', { params })
    .then(response => response.data)
    .finally(() => activeExpensesRequests.delete(key));

  activeExpensesRequests.set(key, promise);
  return promise;
}

const activeSummaryRequests = new Map<string, Promise<ExpensesSummary>>();

export async function getExpensesSummary(startDate?: string, endDate?: string): Promise<ExpensesSummary> {
  const key = JSON.stringify({ startDate, endDate });
  if (activeSummaryRequests.has(key)) return activeSummaryRequests.get(key)!;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const promise = apiClient.get<ExpensesSummary>('/expenses/summary/dashboard', { params })
    .then(response => response.data)
    .finally(() => activeSummaryRequests.delete(key));

  activeSummaryRequests.set(key, promise);
  return promise;
}

export async function getExpenseDetail(id: number): Promise<ExpenseDetailResponse> {
  const response = await apiClient.get<ExpenseDetailResponse>(`/expenses/${id}`);
  return response.data;
}
