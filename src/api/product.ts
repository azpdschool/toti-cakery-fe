// src/api/product.ts
import { apiClient } from './client';

// Sesuai schema ProductOut dari backend
export interface ProductOut {
  id: number;
  nama_produk: string;
  deskripsi: string | null;
  kategori: string | null;
  hpp_total: string;
  harga_jual: string | null;
  markup_percentage: string | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Ambil daftar produk dari backend
 */
export async function getAllProducts(
  onlyActive: boolean = true,
  kategori?: string
): Promise<ProductOut[]> {
  const params: Record<string, any> = { only_active: onlyActive };
  if (kategori) params.kategori = kategori;
  const response = await apiClient.get<ProductOut[]>('/products/', { params });
  return response.data;
}

/**
 * Ambil detail produk by ID
 */
export async function getProductById(id: number): Promise<ProductOut> {
  const response = await apiClient.get<ProductOut>(`/products/${id}`);
  return response.data;
}

/**
 * Format Rupiah
 */
export function formatRupiah(amount: number | string | null): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Parse harga dari string ke number
 */
export function parsePrice(price: string | null): number {
  if (!price) return 0;
  const num = parseFloat(price);
  return isNaN(num) ? 0 : num;
}