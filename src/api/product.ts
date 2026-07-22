// src/api/product.ts
import { apiClient } from './client';

export type ApiDecimal = string | number;

export interface ProductOut {
  id: number;
  nama_produk: string;
  deskripsi: string | null;
  kategori: string | null;
  hpp_total: ApiDecimal;
  harga_jual: ApiDecimal | null;
  markup_percentage: ApiDecimal | null;
  is_active: boolean;
  is_available: boolean;

  /**
   * PENTING:
   * Backend harus mengirim path relatif, contoh:
   * "/static/products/12.jpg"
   *
   * Jangan simpan URL absolute seperti:
   * "http://localhost:8000/static/products/12.jpg"
   */
  image_url: string | null;

  // Field catalog dari backend
  slug?: string | null;
  rating?: number;
  review_count?: number;
  sold_count?: number;
  is_featured?: boolean;
  rasa?: string | null;
  ukuran_atau_isi?: string | null;
  parent_category?: string | null;

  created_at: string | null;
  updated_at: string | null;
}

export interface ProductCreate {
  nama_produk: string;
  deskripsi?: string | null;
  kategori?: string | null;
  markup_percentage?: number | string | null;
  is_active?: boolean;
}

export interface ProductUpdate {
  nama_produk?: string;
  deskripsi?: string | null;
  kategori?: string | null;
  markup_percentage?: number | string | null;
  is_active?: boolean;

  /**
   * Optional dari request BE:
   * Bisa dipakai kalau backend support set null untuk hapus foto.
   * Untuk upload/ganti foto normal, FE tetap pakai POST /products/{id}/image.
   */
  image_url?: string | null;

  slug?: string | null;
  is_featured?: boolean;
  rasa?: string | null;
  ukuran_atau_isi?: string | null;
}

export interface SetPriceRequest {
  harga_jual: number | string;
  changed_by?: string | null;
}

export interface SetPriceResponse {
  product_id: number;
  nama_produk: string;
  hpp_total: ApiDecimal;
  harga_jual_baru: ApiDecimal;
  margin_persen: number | null;
  warning_below_hpp: boolean;
}

export interface PricingCostDetail {
  bahan: string;
  satuan: string;
  qty: number;
  unit_price: number;
  cost: number;
}

export interface PricingResponse {
  product_id: number;
  nama_produk: string;
  hpp: ApiDecimal;
  harga_jual: ApiDecimal | null;
  margin_persen: number | null;
  warning_below_hpp: boolean;
  breakdown: PricingCostDetail[];
}

export interface PriceHistoryOut {
  id: number;
  product_id: number;
  harga_jual_lama: ApiDecimal | null;
  harga_jual_baru: ApiDecimal;
  hpp_saat_itu: ApiDecimal;
  changed_by: string | null;
  created_at: string | null;
}

export async function getAllProducts(
  onlyActive: boolean = true,
  kategori?: string
): Promise<ProductOut[]> {
  const params: Record<string, boolean | string> = {
    only_active: onlyActive,
  };

  if (kategori) {
    params.kategori = kategori;
  }

  const response = await apiClient.get<ProductOut[]>('/products/', {
    params,
  });

  return response.data;
}

export async function getProductById(id: number): Promise<ProductOut> {
  const response = await apiClient.get<ProductOut>(`/products/${id}`);
  return response.data;
}

export async function createProduct(payload: ProductCreate): Promise<ProductOut> {
  const response = await apiClient.post<ProductOut>('/products/', payload);
  return response.data;
}

export async function updateProduct(
  id: number,
  payload: ProductUpdate
): Promise<ProductOut> {
  const response = await apiClient.put<ProductOut>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(
  id: number
): Promise<{ deleted: boolean; product_id: number }> {
  const response = await apiClient.delete<{
    deleted: boolean;
    product_id: number;
  }>(`/products/${id}`);

  return response.data;
}

/**
 * Upload/ganti foto produk.
 *
 * Contract dari BE:
 * POST /products/{product_id}/image
 * Content-Type: multipart/form-data
 * field name: "file"
 *
 * BE akan:
 * - validasi jpeg/png/webp <= 5MB
 * - simpan ke static/products/{product_id}.{ext}
 * - set products.image_url = "/static/products/{product_id}.{ext}"
 * - return ProductOut terbaru
 */
export async function uploadProductImage(
  id: number,
  file: File
): Promise<ProductOut> {
  const formData = new FormData();
  formData.append('file', file);

  /**
   * Jangan set Content-Type manual.
   * Axios akan otomatis set:
   * multipart/form-data; boundary=...
   *
   * Kalau boundary hilang, FastAPI kadang gagal baca file.
   */
  const response = await apiClient.post<ProductOut>(
    `/products/${id}/image`,
    formData
  );

  return response.data;
}

export async function setProductPrice(
  id: number,
  payload: SetPriceRequest
): Promise<SetPriceResponse> {
  const response = await apiClient.patch<SetPriceResponse>(
    `/products/${id}/price`,
    payload
  );

  return response.data;
}

export async function getProductPricing(id: number): Promise<PricingResponse> {
  const response = await apiClient.get<PricingResponse>(
    `/products/${id}/pricing`
  );

  return response.data;
}

export async function getProductPriceHistory(
  id: number
): Promise<PriceHistoryOut[]> {
  const response = await apiClient.get<PriceHistoryOut[]>(
    `/products/${id}/price-history`
  );

  return response.data;
}

export function parsePrice(price: string | number | null): number {
  if (price === null || price === undefined) return 0;

  const num = typeof price === 'string' ? parseFloat(price) : Number(price);

  return Number.isFinite(num) ? num : 0;
}

export function formatRupiah(amount: number | string | null): string {
  if (amount === null || amount === undefined) return 'Rp 0';

  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (!Number.isFinite(num)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
