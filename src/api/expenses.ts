// src/api/expenses.ts
import { apiClient } from './client';
import type {
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseCancelRequest,
  ExpenseDetailResponse,
  ExpensesSummary,
  ExpenseAuditItem,
} from '../types/expense';

function sanitizeExpenseCreatePayload(data: ExpenseCreate): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    kategori: data.kategori.trim(),
    jumlah: Number(data.jumlah),
  };
  if (data.tanggal) payload.tanggal = data.tanggal;
  if (data.deskripsi !== undefined) payload.deskripsi = data.deskripsi ? data.deskripsi.trim() : null;
  if (data.penerima !== undefined) payload.penerima = data.penerima ? data.penerima.trim() : null;
  if (data.metode_pembayaran !== undefined) payload.metode_pembayaran = data.metode_pembayaran || null;
  if (data.bukti_url !== undefined) {
    const trimmed = data.bukti_url ? data.bukti_url.trim() : null;
    payload.bukti_url = trimmed || null;
  }
  return payload;
}

function sanitizeExpenseUpdatePayload(data: ExpenseUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.kategori !== undefined) payload.kategori = data.kategori.trim();
  if (data.jumlah !== undefined) payload.jumlah = Number(data.jumlah);
  if (data.tanggal !== undefined && data.tanggal !== null) payload.tanggal = data.tanggal;
  if (data.deskripsi !== undefined) payload.deskripsi = data.deskripsi ? data.deskripsi.trim() : null;
  if (data.penerima !== undefined) payload.penerima = data.penerima ? data.penerima.trim() : null;
  if (data.metode_pembayaran !== undefined) payload.metode_pembayaran = data.metode_pembayaran || null;
  if (data.bukti_url !== undefined) {
    const trimmed = data.bukti_url ? data.bukti_url.trim() : null;
    payload.bukti_url = trimmed || null;
  }
  return payload;
}

export async function createExpense(data: ExpenseCreate): Promise<ExpenseDetailResponse> {
  const payload = sanitizeExpenseCreatePayload(data);
  const response = await apiClient.post<ExpenseDetailResponse>('/expenses', payload);
  return response.data;
}

export async function updateExpense(id: number, data: ExpenseUpdate): Promise<ExpenseDetailResponse> {
  const payload = sanitizeExpenseUpdatePayload(data);
  const response = await apiClient.patch<ExpenseDetailResponse>(`/expenses/${id}`, payload);
  return response.data;
}

export async function cancelExpense(id: number, reason: string): Promise<ExpenseDetailResponse> {
  const payload: ExpenseCancelRequest = { reason: reason.trim() };
  const response = await apiClient.post<ExpenseDetailResponse>(`/expenses/${id}/cancel`, payload);
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
  const queryParams = params ? { ...params } : undefined;
  if (queryParams?.start_date && !queryParams.start_date.includes('T')) {
    queryParams.start_date = `${queryParams.start_date}T00:00:00`;
  }
  if (queryParams?.end_date && !queryParams.end_date.includes('T')) {
    queryParams.end_date = `${queryParams.end_date}T23:59:59`;
  }

  const key = JSON.stringify(queryParams || {});
  if (activeExpensesRequests.has(key)) return activeExpensesRequests.get(key)!;

  const promise = apiClient.get<ExpenseDetailResponse[]>('/expenses', { params: queryParams })
    .then(response => response.data)
    .finally(() => activeExpensesRequests.delete(key));

  activeExpensesRequests.set(key, promise);
  return promise;
}

const activeSummaryRequests = new Map<string, Promise<ExpensesSummary>>();

export async function getExpensesSummary(startDate?: string, endDate?: string): Promise<ExpensesSummary> {
  let formattedStart = startDate;
  let formattedEnd = endDate;
  if (formattedStart && !formattedStart.includes('T')) {
    formattedStart = `${formattedStart}T00:00:00`;
  }
  if (formattedEnd && !formattedEnd.includes('T')) {
    formattedEnd = `${formattedEnd}T23:59:59`;
  }

  const key = JSON.stringify({ startDate: formattedStart, endDate: formattedEnd });
  if (activeSummaryRequests.has(key)) return activeSummaryRequests.get(key)!;

  const params: Record<string, string> = {};
  if (formattedStart) params.start_date = formattedStart;
  if (formattedEnd) params.end_date = formattedEnd;
  
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

export async function getExpenseAudit(id: number): Promise<ExpenseAuditItem[]> {
  const response = await apiClient.get<ExpenseAuditItem[]>(`/expenses/${id}/audit`);
  return response.data;
}

