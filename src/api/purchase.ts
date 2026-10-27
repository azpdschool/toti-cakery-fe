import { apiClient } from './client';

export interface PurchaseItemCreate {
  stock_item_id: number;
  jumlah: number | string;
  harga_satuan?: number | string;
  harga_total?: number | string;
  confirm_cost_deviation?: boolean;
}

export interface PurchaseCreate {
  supplier_id: number;
  nomor_po?: string;
  catatan?: string;
  items: PurchaseItemCreate[];
}

export interface PurchaseUpdate {
  supplier_id?: number;
  nomor_po?: string;
  catatan?: string;
  items?: PurchaseItemCreate[];
  is_received?: boolean;
}

export interface PurchaseItemOut {
  id: number;
  purchase_id: number;
  stock_item_id: number;
  jumlah: number | string;
  harga_satuan: number | string;
  harga_total: number | string;
  cost_deviation_confirmed?: boolean;
  created_at?: string;
}

export interface PurchaseOut {
  id: number;
  supplier_id: number;
  nomor_po?: string;
  tanggal_pemesanan: string;
  tanggal_diterima?: string;
  total_harga: number | string;
  catatan?: string;
  is_received: boolean;
  is_cancelled?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseDetailOut extends PurchaseOut {
  items: PurchaseItemOut[];
}

export async function createPurchase(payload: PurchaseCreate): Promise<PurchaseOut> {
  const response = await apiClient.post<PurchaseOut>('/purchases/purchases', payload);
  return response.data;
}

export async function getPurchases(
  only_received?: boolean,
  supplier_id?: number,
  only_cancelled?: boolean
): Promise<PurchaseOut[]> {
  const params: any = {};
  if (only_received !== undefined) params.only_received = only_received;
  if (supplier_id !== undefined) params.supplier_id = supplier_id;
  if (only_cancelled !== undefined) params.only_cancelled = only_cancelled;
  
  const response = await apiClient.get<PurchaseOut[]>('/purchases/purchases', { params });
  return response.data;
}

export async function getPurchase(id: number): Promise<PurchaseDetailOut> {
  const response = await apiClient.get<PurchaseDetailOut>(`/purchases/purchases/${id}`);
  return response.data;
}

export async function updatePurchase(id: number, payload: PurchaseUpdate): Promise<PurchaseOut> {
  const response = await apiClient.put<PurchaseOut>(`/purchases/purchases/${id}`, payload);
  return response.data;
}

export async function cancelPurchase(id: number, reason: string): Promise<PurchaseOut> {
  const response = await apiClient.post<PurchaseOut>(`/purchases/purchases/${id}/cancel`, { reason });
  return response.data;
}
