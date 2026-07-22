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
}

export interface StockUpdate {
  nama_item?: string;
  satuan?: StockUnitApi;
  kategori?: StockCategoryApi;
  harga_per_satuan?: number | string;
  stok_tersedia?: number | string;
}

export async function getStockItems(
  kategori?: StockCategoryApi
): Promise<StockOut[]> {
  const response = await apiClient.get<StockOut[]>('/stock/', {
    params: kategori ? { kategori } : undefined,
  });

  return response.data;
}

export async function getStockItemById(id: number): Promise<StockOut> {
  const response = await apiClient.get<StockOut>(`/stock/${id}`);

  return response.data;
}

export async function createStockItem(payload: StockCreate): Promise<StockOut> {
  const response = await apiClient.post<StockOut>('/stock/', payload);

  return response.data;
}

export async function updateStockItem(
  id: number,
  payload: StockUpdate
): Promise<StockOut> {
  const response = await apiClient.put<StockOut>(`/stock/${id}`, payload);

  return response.data;
}

export async function deleteStockItem(id: number): Promise<boolean> {
  const response = await apiClient.delete<boolean>(`/stock/${id}`);

  return response.data;
}
