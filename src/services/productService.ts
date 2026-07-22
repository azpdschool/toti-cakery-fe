// src/services/productService.ts

import { API_BASE_URL } from '@/api/client';
import {
  createProduct as createProductApi,
  getAllProducts as getAllProductsApi,
  getProductById,
  setProductPrice,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  uploadProductImage as uploadProductImageApi,
  type ProductCreate,
  type ProductUpdate,
  type ProductOut,
  type SetPriceRequest,
} from '@/api/product';
import type {
  CategorySummary,
  Product,
  ProductVariant,
  ProductVariantOptionGroup,
  ProductReview,
  SimpleProduct,
} from '@/types/product';

export type {
  CategorySummary,
  Product,
  ProductVariant,
  ProductVariantOptionGroup,
  ProductReview,
  SimpleProduct,
};

export type {
  ProductCreate,
  ProductUpdate,
  ProductOut,
};

export interface ArchivedProduct extends SimpleProduct {
  archivedAt: string | null;
  daysUntilPermanentDelete: number;
}

const placeholderImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f8eee5"/>
      <circle cx="200" cy="155" r="55" fill="#e7c7b3"/>
      <rect x="105" y="230" width="190" height="28" rx="14" fill="#d85b30"/>
      <rect x="135" y="270" width="130" height="18" rx="9" fill="#b9876f"/>
      <text x="200" y="340" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#6f5448">
        Toti Cakery
      </text>
    </svg>
  `);

const ARCHIVE_RETENTION_DAYS = 30;

function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatRupiah(amount: number | string | null): string {
  const value = parseNumber(amount);

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Ubah path relatif dari backend menjadi URL final untuk browser.
 *
 * Backend harus menyimpan:
 * "/static/products/12.jpg"
 *
 * FE akan render:
 * "http://localhost:8000/static/products/12.jpg"
 *
 * Cache bust:
 * Karena backend menyimpan nama file sama untuk replace gambar,
 * misalnya 12.jpg ditimpa gambar baru, browser bisa masih nampilin cache lama.
 * Jadi FE menambahkan ?v=updated_at.
 */
function resolveImageUrl(
  imageUrl: string | null | undefined,
  cacheKey?: string | null
): string {
  if (!imageUrl) return placeholderImage;

  const normalizedCacheKey = cacheKey ? encodeURIComponent(cacheKey) : '';

  let finalUrl = imageUrl;

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    finalUrl = imageUrl;
  } else if (imageUrl.startsWith('/')) {
    finalUrl = `${API_BASE_URL}${imageUrl}`;
  } else {
    finalUrl = `${API_BASE_URL}/${imageUrl}`;
  }

  if (!normalizedCacheKey) return finalUrl;

  const separator = finalUrl.includes('?') ? '&' : '?';
  return `${finalUrl}${separator}v=${normalizedCacheKey}`;
}

function daysSince(dateString: string | null | undefined): number {
  if (!dateString) return 0;

  const then = new Date(dateString).getTime();
  if (!Number.isFinite(then)) return 0;

  const now = Date.now();
  const diffMs = now - then;

  if (diffMs <= 0) return 0;

  return diffMs / (1000 * 60 * 60 * 24);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeSlug(product: Pick<ProductOut, 'id' | 'nama_produk'>): string {
  return `${product.id}-${slugify(product.nama_produk)}`;
}

function makeDefaultVariant(product: ProductOut): ProductVariant {
  const price = parseNumber(product.harga_jual);

  return {
    id: `${product.id}-default`,
    name: 'Default',
    price,
    options: {},
    minOrder: 1,
    step: 1,
  };
}

export function mapProductOutToProduct(product: ProductOut): Product {
  const price = parseNumber(product.harga_jual);

  return {
    id: String(product.id),
    backendId: product.id,

    slug: product.slug || makeSlug(product),
    name: product.nama_produk,
    category: product.kategori ?? '',
    description: product.deskripsi ?? '',

    /**
     * image = URL final untuk browser.
     * Kalau backend kirim "/static/products/12.jpg",
     * maka image jadi "http://localhost:8000/static/products/12.jpg?v=..."
     */
    image: resolveImageUrl(product.image_url, product.updated_at ?? product.created_at),

    /**
     * imageUrlRaw = path asli dari backend.
     * Ini berguna kalau nanti perlu debug atau kirim balik image_url.
     */
    imageUrlRaw: product.image_url,

    price,
    hppTotal: parseNumber(product.hpp_total),
    markupPercentage:
      product.markup_percentage === null || product.markup_percentage === undefined
        ? null
        : parseNumber(product.markup_percentage),

    rating: product.rating ?? 0,
    reviewCount: product.review_count ?? 0,
    soldCount: product.sold_count ?? 0,

    isFeatured: product.is_featured ?? false,
    featured: product.is_featured ?? false,

    isActive: product.is_active,
    isAvailable: product.is_available,

    rasa: product.rasa ?? null,
    ukuranAtauIsi: product.ukuran_atau_isi ?? null,
    parentCategory: product.parent_category ?? product.kategori ?? null,

    optionGroups: [],
    variants: [makeDefaultVariant(product)],
    reviews: [],

    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export function mapProductOutToSimpleProduct(product: ProductOut): SimpleProduct {
  const mapped = mapProductOutToProduct(product);

  return {
    id: mapped.id,
    backendId: mapped.backendId,

    slug: mapped.slug,
    name: mapped.name,
    category: mapped.category,
    description: mapped.description,

    image: mapped.image,
    imageUrlRaw: mapped.imageUrlRaw,

    price: mapped.price,
    hppTotal: mapped.hppTotal,
    markupPercentage: mapped.markupPercentage,

    rating: mapped.rating,
    reviewCount: mapped.reviewCount,
    soldCount: mapped.soldCount,

    featured: mapped.featured,
    isFeatured: mapped.isFeatured,

    isActive: mapped.isActive,
    isAvailable: mapped.isAvailable,

    rasa: mapped.rasa,
    ukuranAtauIsi: mapped.ukuranAtauIsi,
    parentCategory: mapped.parentCategory,

    /**
     * Backend product belum punya stok numerik produk.
     * Untuk sementara UI stok produk pakai ketersediaan recipe.
     */
    stock: mapped.isAvailable ? 999 : 0,

    status: mapped.isActive ? 'active' : 'inactive',

    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
  };
}

export function getLowestPrice(
  variantsOrProduct: ProductVariant[] | Product
): number {
  const variants = Array.isArray(variantsOrProduct)
    ? variantsOrProduct
    : variantsOrProduct.variants;

  if (!variants.length) {
    return Array.isArray(variantsOrProduct) ? 0 : variantsOrProduct.price;
  }

  return Math.min(...variants.map((variant) => variant.price));
}

/**
 * Buyer catalog.
 * Hanya produk aktif.
 */
export async function getAllProductsDetailed(): Promise<Product[]> {
  const products = await getAllProductsApi(true);

  return products.map(mapProductOutToProduct);
}

/**
 * Ambil semua produk, aktif dan inactive.
 */
export async function getAllProducts(): Promise<SimpleProduct[]> {
  const products = await getAllProductsApi(false);

  return products.map(mapProductOutToSimpleProduct);
}

/**
 * Seller main products.
 * Hanya produk aktif.
 */
export async function getActiveProducts(): Promise<SimpleProduct[]> {
  const products = await getAllProductsApi(true);

  return products.map(mapProductOutToSimpleProduct);
}

/**
 * Produk archived = produk is_active false.
 *
 * Catatan:
 * Karena backend belum punya kolom archived_at khusus, kita pakai updated_at
 * sebagai perkiraan tanggal archive.
 */
export async function getArchivedProducts(): Promise<ArchivedProduct[]> {
  const allProducts = await getAllProductsApi(false);
  const inactiveProducts = allProducts.filter((product) => !product.is_active);

  const expired: ProductOut[] = [];
  const stillValid: ProductOut[] = [];

  for (const product of inactiveProducts) {
    const archivedAt = product.updated_at ?? product.created_at ?? null;
    const age = Math.floor(daysSince(archivedAt));

    if (age >= ARCHIVE_RETENTION_DAYS) {
      expired.push(product);
    } else {
      stillValid.push(product);
    }
  }

  /**
   * Auto hard-delete produk yang sudah lewat masa retensi.
   * Kalau salah satu gagal, jangan gagalkan render tab archived.
   */
  if (expired.length > 0) {
    const results = await Promise.allSettled(
      expired.map((product) => deleteProductApi(product.id))
    );

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(
          `Gagal auto hard-delete produk id=${expired[idx].id}:`,
          result.reason
        );
      }
    });
  }

  return stillValid.map((product) => {
    const archivedAt = product.updated_at ?? product.created_at ?? null;
    const age = Math.floor(daysSince(archivedAt));
    const daysUntilPermanentDelete = Math.max(ARCHIVE_RETENTION_DAYS - age, 0);

    return {
      ...mapProductOutToSimpleProduct(product),
      archivedAt,
      daysUntilPermanentDelete,
    };
  });
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const idFromSlug = Number(slug.split('-')[0]);

  if (Number.isFinite(idFromSlug) && idFromSlug > 0) {
    const detail = await getProductById(idFromSlug);

    return mapProductOutToProduct(detail);
  }

  const products = await getAllProductsApi(true);
  const matched = products.find(
    (product) => product.slug === slug || makeSlug(product) === slug
  );

  if (!matched) return undefined;

  const detail = await getProductById(matched.id);

  return mapProductOutToProduct(detail);
}

export async function getProductByBackendId(id: number): Promise<Product> {
  const product = await getProductById(id);

  return mapProductOutToProduct(product);
}

export async function getCategories(): Promise<CategorySummary[]> {
  const products = await getAllProductsApi(false);
  const map = new Map<string, number>();

  for (const product of products) {
    const category = product.kategori?.trim();

    if (!category) continue;

    map.set(category, (map.get(category) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, count]) => ({
      category,
      count,
    }));
}

export async function getProductReviews(
  _limit?: number
): Promise<(ProductReview & { productId: string; productName: string })[]> {
  // Backend review produk belum tersedia.
  return [];
}

export async function createProduct(
  payload: ProductCreate
): Promise<SimpleProduct> {
  const created = await createProductApi(payload);

  return mapProductOutToSimpleProduct(created);
}

export async function updateProduct(
  id: number,
  payload: ProductUpdate
): Promise<SimpleProduct> {
  const updated = await updateProductApi(id, payload);

  return mapProductOutToSimpleProduct(updated);
}

/**
 * Soft delete / archive product.
 * Produk tidak tampil di buyer catalog karena is_active false.
 */
export async function archiveProduct(id: number): Promise<SimpleProduct> {
  const updated = await updateProductApi(id, {
    is_active: false,
  });

  return mapProductOutToSimpleProduct(updated);
}

/**
 * Restore product dari arsip.
 */
export async function restoreProduct(id: number): Promise<SimpleProduct> {
  const updated = await updateProductApi(id, {
    is_active: true,
  });

  return mapProductOutToSimpleProduct(updated);
}

/**
 * Hard delete product.
 * Hanya dipakai dari tab archived.
 */
export async function deleteProduct(id: number): Promise<void> {
  await deleteProductApi(id);
}

/**
 * Upload/ganti foto produk.
 *
 * Dipakai dari SellerProductsPage:
 * - tambah produk dengan gambar
 * - edit produk ganti gambar
 *
 * Backend menyimpan image_url relatif, contoh:
 * "/static/products/12.jpg"
 *
 * Service ini mengembalikan SimpleProduct dengan product.image
 * yang sudah menjadi URL final untuk browser.
 */
export async function uploadProductImage(
  id: number,
  file: File
): Promise<SimpleProduct> {
  const updated = await uploadProductImageApi(id, file);

  return mapProductOutToSimpleProduct(updated);
}

export async function createProductWithOptionalPrice(
  payload: ProductCreate,
  price?: number | string | null
): Promise<SimpleProduct> {
  const created = await createProductApi(payload);

  if (price !== null && price !== undefined && price !== '') {
    const request: SetPriceRequest = {
      harga_jual: price,
    };

    await setProductPrice(created.id, request);

    const refreshed = await getProductById(created.id);

    return mapProductOutToSimpleProduct(refreshed);
  }

  return mapProductOutToSimpleProduct(created);
}

export async function createProductWithOptionalPriceAndImage(
  payload: ProductCreate,
  price?: number | string | null,
  imageFile?: File | null
): Promise<SimpleProduct> {
  const created = await createProductApi(payload);

  if (price !== null && price !== undefined && price !== '') {
    const request: SetPriceRequest = {
      harga_jual: price,
    };

    await setProductPrice(created.id, request);
  }

  if (imageFile) {
    await uploadProductImageApi(created.id, imageFile);
  }

  const refreshed = await getProductById(created.id);

  return mapProductOutToSimpleProduct(refreshed);
}

export async function updateProductPrice(
  id: number,
  price: number | string
): Promise<void> {
  await setProductPrice(id, {
    harga_jual: price,
  });
}
