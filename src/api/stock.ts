// src/api/stock.ts

import { apiClient } from './client';

export type ApiDecimal = string | number;

export type StockUnitApi = 'gram' | 'ml' | 'pcs' | 'kg' | 'liter';
export type StockCategoryApi = 'bahan_baku' | 'kemasan';

export interface StockOut {
  id: number;
  nama_item: string;
  satuan: StockUnitApi;
  kategori: StockCategoryApi;
  harga_per_satuan: ApiDecimal;
  stok_tersedia: ApiDecimal;
  alert_min_stok: ApiDecimal;
  supplier_id: number | null;
  version: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface StockCreate {
  nama_item: string;
  satuan: StockUnitApi;
  kategori: StockCategoryApi;
  harga_per_satuan: number | string;
  stok_tersedia: number | string;
  alert_min_stok?: number | string;
  supplier_id: number | null;
}

export interface StockUpdate {
  nama_item?: string;
  satuan?: StockUnitApi;
  kategori?: StockCategoryApi;
  harga_per_satuan?: number | string;
  stok_tersedia?: number | string;
  alert_min_stok?: number | string;
  supplier_id?: number | null;
}

const stockItemsPromises = new Map<string, Promise<StockOut[]>>();

export function invalidateStockCache(): void {
  stockItemsPromises.clear();
}

export async function getStockItems(
  kategori?: StockCategoryApi,
  signal?: AbortSignal
): Promise<StockOut[]> {
  const key = kategori || 'ALL';
  
  if (stockItemsPromises.has(key)) {
    // Return existing in-flight request unless the signal is already aborted
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    return stockItemsPromises.get(key)!;
  }

  const promise = apiClient
    .get<StockOut[]>('/stock/', {
      params: kategori ? { kategori } : undefined,
      signal,
    })
    .then((res) => {
      stockItemsPromises.delete(key);
      return res.data;
    })
    .catch((err) => {
      stockItemsPromises.delete(key);
      throw err;
    });

  // If the caller aborts the request, we must eagerly remove it from the cache
  // so subsequent callers don't reuse the aborted promise before the catch block runs.
  signal?.addEventListener('abort', () => {
    if (stockItemsPromises.get(key) === promise) {
      stockItemsPromises.delete(key);
    }
  });

  stockItemsPromises.set(key, promise);
  
  return promise;
}

export async function getStockItemById(id: number): Promise<StockOut> {
  const response = await apiClient.get<StockOut>(`/stock/${id}`);

  return response.data;
}

export async function createStockItem(payload: StockCreate): Promise<StockOut> {
  invalidateStockCache();
  const response = await apiClient.post<StockOut>('/stock/', payload);

  return response.data;
}

export async function updateStockItem(
  id: number,
  payload: StockUpdate
): Promise<StockOut> {
  invalidateStockCache();
  const response = await apiClient.put<StockOut>(`/stock/${id}`, payload);

  return response.data;
}

export async function deleteStockItem(id: number): Promise<boolean> {
  invalidateStockCache();
  const response = await apiClient.delete<boolean>(`/stock/${id}`);

  return response.data;
}
