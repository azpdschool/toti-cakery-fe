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
}

export interface StockUpdate {
  nama_item?: string;
  satuan?: StockUnitApi;
  kategori?: StockCategoryApi;
  alert_min_stok?: number | string;
}

export interface StockAdjustmentCreate {
  quantity_difference: number | string;
  reason: string;
  unit_cost?: number | string;
}

export interface StockMovementOut {
  id: number;
  stock_item_id: number;
  movement_type: string;
  quantity: ApiDecimal;
  unit_cost: ApiDecimal;
  reference_type: string | null;
  reference_id: number | null;
  created_by: number | null;
  reason: string | null;
  created_at: string | null;
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

export async function adjustStock(id: number, payload: StockAdjustmentCreate): Promise<StockOut> {
  invalidateStockCache();
  const response = await apiClient.post<StockOut>(`/stock/${id}/adjustments`, payload);
  return response.data;
}

export async function getStockMovements(id: number): Promise<StockMovementOut[]> {
  const response = await apiClient.get<StockMovementOut[]>(`/stock/${id}/movements`);
  return response.data;
}
