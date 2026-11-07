// src/api/product.ts
import { apiClient } from './client';

export type ApiDecimal = string | number;

export interface ProductImageOut {
  id: number;
  product_id?: number | null;
  image_url: string;
  is_primary: boolean;
  created_at?: string | null;
}

export interface ProductOut {
  id: number;
  nama_produk: string;
  deskripsi: string | null;
  deskripsi_id?: string | null;
  deskripsi_en?: string | null;
  kategori: string | null;
  category_id?: number | null;
  category?: CategoryResponse | null;
  hpp_total: ApiDecimal;
  harga_jual: ApiDecimal | null;
  warning_below_hpp?: boolean;
  harga_jual_baru?: ApiDecimal | null;
  margin_persen?: number | null;
  markup_percentage: ApiDecimal | null;
  is_active: boolean;
  is_available: boolean;
  stock_quantity?: number | null;
  is_in_stock?: boolean | null;

  /**
   * PENTING:
   * Backend menggunakan Cloudinary dan mengembalikan URL absolute HTTPS.
   * Contoh: "https://res.cloudinary.com/..."
   */
  image_url: string | null;
  images?: ProductImageOut[];

  // Field catalog dari backend
  slug?: string | null;
  rating?: number;
  review_count?: number;
  sold_count?: number;
  is_featured?: boolean;
  minimum_order?: number;
  parent_category?: string | null;

  // recipes embedded (nullable)
  recipes?: RecipeOutEmbedded[] | null;

  created_at: string | null;
  updated_at: string | null;
}

/** Minimal embedded RecipeOut inside ProductOut */
export interface RecipeOutEmbedded {
  id: number;
  product_id: number;
  stock_item_id: number;
  jumlah_dibutuhkan: ApiDecimal;
  quantity_required?: ApiDecimal | null;
  unit?: string | null;
  nama_bahan?: string | null;
  satuan?: string | null;
  harga_per_satuan?: ApiDecimal | null;
  biaya_bahan?: ApiDecimal | null;
  created_at?: string | null;
}

/**
 * ProductCreate — mirrors backend ProductCreate schema exactly.
 * Backend fields: nama_produk, deskripsi, kategori, harga_jual, is_active, is_available, minimum_order
 */
export interface ProductCreate {
  nama_produk: string;
  deskripsi?: string | null;
  deskripsi_id?: string | null;
  deskripsi_en?: string | null;
  kategori?: string | null;
  category_id?: number | null;
  harga_jual?: number | string | null;
  is_active?: boolean;
  is_available?: boolean;
  minimum_order?: number;
}

/**
 * ProductUpdate — mirrors backend ProductUpdate schema exactly.
 * Backend fields: deskripsi, deskripsi_id, deskripsi_en, category_id, harga_jual, is_active, is_available, image_url, minimum_order
 */
export interface ProductUpdate {
  deskripsi?: string | null;
  deskripsi_id?: string | null;
  deskripsi_en?: string | null;
  kategori?: string | null;
  category_id?: number | null;
  harga_jual?: number | string | null;
  is_active?: boolean | null;
  is_available?: boolean | null;
  image_url?: string | null;
  minimum_order?: number | null;
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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const PRODUCT_CACHE_TTL = 10_000; // 10s short TTL

const productsCache = new Map<string, CacheEntry<ProductOut[]>>();
const activeProductsRequests = new Map<string, Promise<ProductOut[]>>();

const productByIdCache = new Map<number, CacheEntry<ProductOut>>();
const productByIdInFlight = new Map<number, Promise<ProductOut>>();

const internalProductsCache = new Map<string, CacheEntry<ProductOut[]>>();
const activeInternalProductsRequests = new Map<string, Promise<ProductOut[]>>();

const internalProductByIdCache = new Map<number, CacheEntry<ProductOut>>();
const internalProductByIdInFlight = new Map<number, Promise<ProductOut>>();

export function invalidateProductsCache(): void {
  productsCache.clear();
  activeProductsRequests.clear();
  productByIdCache.clear();
  productByIdInFlight.clear();
  internalProductsCache.clear();
  activeInternalProductsRequests.clear();
  internalProductByIdCache.clear();
  internalProductByIdInFlight.clear();
}

export function invalidateProductByIdCache(id?: number): void {
  if (id !== undefined) {
    productByIdCache.delete(id);
    productByIdInFlight.delete(id);
    internalProductByIdCache.delete(id);
    internalProductByIdInFlight.delete(id);
  } else {
    productByIdCache.clear();
    productByIdInFlight.clear();
    internalProductByIdCache.clear();
    internalProductByIdInFlight.clear();
  }
}

export async function getAllProducts(
  onlyActive: boolean = true,
  kategori?: string,
  forceRefresh: boolean = false
): Promise<ProductOut[]> {
  const key = JSON.stringify({ onlyActive, kategori });
  const now = Date.now();

  if (!forceRefresh) {
    const cached = productsCache.get(key);
    if (cached && now - cached.timestamp < PRODUCT_CACHE_TTL) {
      return cached.data;
    }
    if (activeProductsRequests.has(key)) {
      return activeProductsRequests.get(key)!;
    }
  }

  const params: Record<string, boolean | string> = {
    only_active: onlyActive,
  };

  if (kategori) {
    params.kategori = kategori;
  }

  // We omit the signal from the actual network call to prevent StrictMode
  // unmounts from aborting the shared Promise for the other concurrent caller.
  const promise = apiClient.get<ProductOut[]>('/products/', { params })
    .then(response => {
      const data = response.data;
      productsCache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      activeProductsRequests.delete(key);
    });

  activeProductsRequests.set(key, promise);
  return promise;
}

export async function getProductById(id: number, forceRefresh: boolean = false): Promise<ProductOut> {
  const now = Date.now();
  if (!forceRefresh) {
    const cached = productByIdCache.get(id);
    if (cached && now - cached.timestamp < PRODUCT_CACHE_TTL) {
      return cached.data;
    }
    if (productByIdInFlight.has(id)) {
      return productByIdInFlight.get(id)!;
    }
  }

  const promise = apiClient.get<ProductOut>(`/products/${id}`)
    .then(response => {
      const data = response.data;
      productByIdCache.set(id, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      productByIdInFlight.delete(id);
    });

  productByIdInFlight.set(id, promise);
  return promise;
}

export async function getInternalProducts(
  onlyActive: boolean = false,
  kategori?: string,
  forceRefresh: boolean = false
): Promise<ProductOut[]> {
  const key = JSON.stringify({ onlyActive, kategori });
  const now = Date.now();

  if (!forceRefresh) {
    const cached = internalProductsCache.get(key);
    if (cached && now - cached.timestamp < PRODUCT_CACHE_TTL) {
      return cached.data;
    }
    if (activeInternalProductsRequests.has(key)) {
      return activeInternalProductsRequests.get(key)!;
    }
  }

  const params: Record<string, boolean | string> = {
    only_active: onlyActive,
  };

  if (kategori) {
    params.kategori = kategori;
  }

  const promise = apiClient.get<ProductOut[]>('/products/internal', { params })
    .then(response => {
      const data = response.data;
      internalProductsCache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      activeInternalProductsRequests.delete(key);
    });

  activeInternalProductsRequests.set(key, promise);
  return promise;
}

export async function getInternalProductById(id: number, forceRefresh: boolean = false): Promise<ProductOut> {
  const now = Date.now();
  if (!forceRefresh) {
    const cached = internalProductByIdCache.get(id);
    if (cached && now - cached.timestamp < PRODUCT_CACHE_TTL) {
      return cached.data;
    }
    if (internalProductByIdInFlight.has(id)) {
      return internalProductByIdInFlight.get(id)!;
    }
  }

  const promise = apiClient.get<ProductOut>(`/products/internal/${id}`)
    .then(response => {
      const data = response.data;
      internalProductByIdCache.set(id, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      internalProductByIdInFlight.delete(id);
    });

  internalProductByIdInFlight.set(id, promise);
  return promise;
}

export async function createProduct(payload: ProductCreate): Promise<ProductOut> {
  invalidateProductsCache();
  const response = await apiClient.post<ProductOut>('/products/', payload);
  return response.data;
}

export async function updateProduct(
  id: number,
  payload: ProductUpdate
): Promise<ProductOut> {
  invalidateProductsCache();
  const response = await apiClient.put<ProductOut>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(
  id: number
): Promise<{ deleted: boolean; product_id: number }> {
  invalidateProductsCache();
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
 * - simpan ke Cloudinary
 * - set products.image_url = "https://res.cloudinary.com/..."
 * - return ProductOut terbaru
 */
export async function uploadProductImage(
  id: number,
  file: File
): Promise<ProductOut> {
  invalidateProductsCache();
  const formData = new FormData();
  formData.append('file', file);

  /**
   * Mengatur Content-Type: undefined agar Axios tidak menggunakan default
   * 'application/json' dan membiarkan browser mengeset header multipart/form-data
   * lengkap beserta boundary wajib (misal: multipart/form-data; boundary=...).
   */
  const response = await apiClient.post<ProductOut>(
    `/products/${id}/image`,
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  );

  return response.data;
}

/**
 * Upload multiple foto produk sekaligus.
 * POST /products/{id}/images
 * Form parameters: files (multiple), primary_index (optional)
 */
export async function uploadProductImages(
  id: number,
  files: File[],
  primaryIndex: number = 0
): Promise<ProductOut> {
  invalidateProductsCache();
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('primary_index', String(primaryIndex));

  const response = await apiClient.post<ProductOut>(
    `/products/${id}/images`,
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  );

  return response.data;
}

/**
 * Set salah satu gambar sebagai primary image produk.
 * PATCH /products/{product_id}/images/{image_id}/primary
 */
export async function setPrimaryProductImage(
  productId: number,
  imageId: number
): Promise<ProductOut> {
  invalidateProductsCache();
  const response = await apiClient.patch<ProductOut>(
    `/products/${productId}/images/${imageId}/primary`
  );
  return response.data;
}

/**
 * Hapus salah satu gambar produk.
 * DELETE /products/{product_id}/images/{image_id}
 */
export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<{ deleted: boolean; product_id: number; image_id: number }> {
  invalidateProductsCache();
  const response = await apiClient.delete<{
    deleted: boolean;
    product_id: number;
    image_id: number;
  }>(`/products/${productId}/images/${imageId}`);
  return response.data;
}

export async function setProductPrice(
  id: number,
  payload: SetPriceRequest
): Promise<SetPriceResponse> {
  invalidateProductsCache();
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

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface CategoryCreate {
  name: string;
  description?: string | null;
}

export interface CategoryUpdate {
  name?: string | null;
  description?: string | null;
}

let categoriesPromise: Promise<CategoryResponse[]> | null = null;

export function invalidateCategoriesCache(): void {
  categoriesPromise = null;
}

export async function getBackendCategories(signal?: AbortSignal): Promise<CategoryResponse[]> {
  if (!categoriesPromise) {
    categoriesPromise = apiClient
      .get<CategoryResponse[]>('/products/categories', { signal })
      .then((res) => res.data)
      .catch((err) => {
        categoriesPromise = null;
        throw err;
      });
  }
  return categoriesPromise;
}

export async function createBackendCategory(data: CategoryCreate): Promise<CategoryResponse> {
  invalidateCategoriesCache();
  const response = await apiClient.post<CategoryResponse>('/products/categories', data);
  return response.data;
}

export async function updateBackendCategory(id: number, data: CategoryUpdate): Promise<CategoryResponse> {
  invalidateCategoriesCache();
  const response = await apiClient.patch<CategoryResponse>(`/products/categories/${id}`, data);
  return response.data;
}

export async function deleteBackendCategory(id: number): Promise<void> {
  invalidateCategoriesCache();
  await apiClient.delete(`/products/categories/${id}`);
}
