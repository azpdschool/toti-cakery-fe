// src/services/productService.ts

import { API_BASE_URL } from '@/api/client';
import {
  createProduct as createProductApi,
  getAllProducts as getAllProductsApi,
  getInternalProducts,
  getInternalProductById,
  getProductById,
  setProductPrice,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  uploadProductImage as uploadProductImageApi,
  getBackendCategories,
  type CategoryResponse,
  type ProductCreate,
  type ProductUpdate,
  type ProductOut,
  type SetPriceRequest,
  type SetPriceResponse,
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

// Re-export SetPriceRequest and SetPriceResponse for use in components
export type { SetPriceRequest, SetPriceResponse };

export interface ArchivedProduct extends SimpleProduct {
  archivedAt: string | null;
}

export const placeholderImage =
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

function normalizeCategoryName(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function makeDefaultVariant(product: ProductOut): ProductVariant {
  const price = parseNumber(product.harga_jual);
  const minOrder = product.minimum_order && product.minimum_order > 0
    ? product.minimum_order
    : 1;

  return {
    id: `${product.id}-default`,
    name: 'Default',
    price,
    options: {},
    minOrder,
    step: 1,
  };
}

export function mapProductOutToProduct(product: ProductOut): Product {
  const price = parseNumber(product.harga_jual ?? product.harga_jual_baru);
  const hppTotal = parseNumber(product.hpp_total);
  const cacheKey = product.updated_at ?? product.created_at;

  const warningBelowHpp = product.warning_below_hpp !== undefined
    ? product.warning_below_hpp
    : (price < hppTotal && hppTotal > 0);

  const marginPersen = product.margin_persen !== undefined && product.margin_persen !== null
    ? parseNumber(product.margin_persen)
    : (product.markup_percentage !== null && product.markup_percentage !== undefined
        ? parseNumber(product.markup_percentage)
        : (hppTotal > 0 ? ((price - hppTotal) / hppTotal) * 100 : null));

  let mappedImages: { id: number; productId?: number; imageUrl: string; isPrimary: boolean }[] = [];
  if (product.images && product.images.length > 0) {
    mappedImages = product.images.map((img) => ({
      id: img.id,
      productId: img.product_id ?? product.id,
      imageUrl: resolveImageUrl(img.image_url, cacheKey),
      isPrimary: img.is_primary,
    }));
  } else if (product.image_url) {
    mappedImages = [
      {
        id: -1,
        productId: product.id,
        imageUrl: resolveImageUrl(product.image_url, cacheKey),
        isPrimary: true,
      },
    ];
  }

  const descId = product.deskripsi_id ?? product.deskripsi ?? null;
  const descEn = product.deskripsi_en ?? null;

  return {
    id: String(product.id),
    backendId: product.id,

    slug: product.slug || makeSlug(product),
    name: product.nama_produk,
    category: normalizeCategoryName(product.category?.name || product.kategori),
    categoryId: product.category_id ?? product.category?.id ?? null,
    description: descId ?? '',
    descriptionId: descId,
    descriptionEn: descEn,

    /**
     * image = URL final untuk browser.
     * Kalau backend kirim "/static/products/12.jpg",
     * maka image jadi "http://localhost:8000/static/products/12.jpg?v=..."
     */
    image: resolveImageUrl(product.image_url, cacheKey),

    /**
     * imageUrlRaw = path asli dari backend.
     * Ini berguna kalau nanti perlu debug atau kirim balik image_url.
     */
    imageUrlRaw: product.image_url,
    images: mappedImages,

    price,
    hppTotal,
    warningBelowHpp,
    hargaJualBaru: product.harga_jual_baru !== undefined && product.harga_jual_baru !== null
      ? parseNumber(product.harga_jual_baru)
      : price,
    marginPersen,
    markupPercentage:
      product.markup_percentage === null || product.markup_percentage === undefined
        ? marginPersen
        : parseNumber(product.markup_percentage),

    rating: product.rating ?? 0,
    reviewCount: product.review_count ?? 0,
    soldCount: product.sold_count ?? 0,

    isFeatured: product.is_featured ?? false,
    featured: product.is_featured ?? false,

    isActive: product.is_active,
    isAvailable: product.is_available,
    stockQuantity: product.stock_quantity ?? 0,
    isInStock: product.is_in_stock ?? false,

    rasa: null,
    ukuranAtauIsi: null,
    parentCategory: normalizeCategoryName(product.parent_category ?? product.category?.name ?? product.kategori) || null,
    minimumOrder: product.minimum_order ?? 1,

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
    categoryId: mapped.categoryId ?? null,
    description: mapped.description,
    descriptionId: mapped.descriptionId ?? null,
    descriptionEn: mapped.descriptionEn ?? null,

    image: mapped.image,
    imageUrlRaw: mapped.imageUrlRaw,
    images: mapped.images,

    price: mapped.price,
    hppTotal: mapped.hppTotal,
    warningBelowHpp: mapped.warningBelowHpp,
    hargaJualBaru: mapped.hargaJualBaru,
    marginPersen: mapped.marginPersen,
    markupPercentage: mapped.markupPercentage,

    rating: mapped.rating,
    reviewCount: mapped.reviewCount,
    soldCount: mapped.soldCount,

    featured: mapped.featured,
    isFeatured: mapped.isFeatured,

    isActive: mapped.isActive,
    isAvailable: mapped.isAvailable,
    stockQuantity: mapped.stockQuantity,
    isInStock: mapped.isInStock,

    rasa: mapped.rasa,
    ukuranAtauIsi: mapped.ukuranAtauIsi,
    parentCategory: mapped.parentCategory,
    minimumOrder: mapped.minimumOrder ?? 1,

    status: mapped.isActive ? 'active' : 'archived',

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
export async function getAllProductsDetailed(forceRefresh: boolean = false): Promise<Product[]> {
  const products = await getAllProductsApi(true, undefined, forceRefresh);

  return products.map(mapProductOutToProduct);
}

/**
 * Mendapatkan produk berdasarkan kategori untuk rekomendasi.
 * Documenting backend requirement:
 * The backend needs to support a `limit` parameter or a dedicated `/products/{id}/recommendations`
 * endpoint so we don't have to download the entire category list just for 4 recommendations.
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getAllProductsApi(true, category);

  return products.map(mapProductOutToProduct);
}

/**
 * Ambil semua produk, aktif dan inactive.
 */
export async function getAllProducts(onlyActive: boolean = false): Promise<SimpleProduct[]> {
  const products = await getAllProductsApi(onlyActive, undefined);

  return products.map(mapProductOutToSimpleProduct);
}

/**
 * Seller products with full cost/HPP, recipes, and margin calculations.
 */
export async function getAllProductsInternal(onlyActive: boolean = false): Promise<SimpleProduct[]> {
  const products = await getInternalProducts(onlyActive, undefined);

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

  return inactiveProducts.map((product) => {
    const archivedAt = product.updated_at ?? product.created_at ?? null;
    return {
      ...mapProductOutToSimpleProduct(product),
      archivedAt,
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

/**
 * Seller product detail with full cost/HPP, recipes, and margin calculations.
 */
export async function getProductInternalById(id: number): Promise<Product> {
  const product = await getInternalProductById(id);

  return mapProductOutToProduct(product);
}

export interface MasterCategoryOption {
  id: number;
  name: string;
  count: number;
}

export async function getMasterCategoriesWithCounts(onlyActive: boolean = true): Promise<MasterCategoryOption[]> {
  try {
    const [backendCats, products] = await Promise.all([
      getBackendCategories().catch(() => [] as CategoryResponse[]),
      getAllProductsApi(onlyActive).catch(() => [] as ProductOut[]),
    ]);

    // Active product counts per category using category_id
    const countMap = new Map<number, number>();
    for (const product of products) {
      const catId = product.category_id ?? product.category?.id;
      if (product.is_active && catId) {
        countMap.set(catId, (countMap.get(catId) || 0) + 1);
      }
    }

    // Hide categories that have zero active products
    return backendCats
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: countMap.get(cat.id) || 0,
      }))
      .filter((cat) => cat.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Failed to get master categories with counts:', err);
    return [];
  }
}

export async function getCategories(onlyActive: boolean = true): Promise<CategorySummary[]> {
  const masterCats = await getMasterCategoriesWithCounts(onlyActive);
  return masterCats.map((c) => ({
    category: c.name,
    count: c.count,
  }));
}

import { getLatestReviewsAPI, ReviewImageOut } from '@/api/review';

export async function getProductReviews(
  limit: number = 10
): Promise<{ customerName: string; rating: number; comment: string; purchasedProductName: string; productId: string; productName: string; images: ReviewImageOut[] }[]> {
  try {
    const list = await getLatestReviewsAPI(limit);
    return list.map(item => ({
      customerName: item.customer?.nama || item.customer_name || 'Pelanggan Toti',
      rating: item.rating,
      comment: item.comment || '',
      purchasedProductName: item.product?.nama_produk || item.product_name || '',
      productId: String(item.product_id),
      productName: item.product?.nama_produk || item.product_name || '',
      images: item.images || [],
    }));
  } catch (err) {
    console.error('Failed to fetch latest reviews for testimonials:', err);
    return [];
  }
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
  productId: number,
  file: File
): Promise<SimpleProduct> {
  const updated = await uploadProductImageApi(productId, file);

  return mapProductOutToSimpleProduct(updated);
}

export async function createProductWithOptionalPrice(
  payload: ProductCreate,
  price?: number | string | null
): Promise<SimpleProduct> {
  const finalPayload: ProductCreate = {
    ...payload,
    harga_jual: payload.harga_jual ?? (price !== null && price !== undefined && price !== '' ? price : null),
  };

  const created = await createProductApi(finalPayload);

  return mapProductOutToSimpleProduct(created);
}

export async function createProductWithOptionalPriceAndImage(
  payload: ProductCreate,
  price?: number | string | null,
  imageFile?: File | null
): Promise<SimpleProduct> {
  const finalPayload: ProductCreate = {
    ...payload,
    harga_jual: payload.harga_jual ?? (price !== null && price !== undefined && price !== '' ? price : null),
  };

  const created = await createProductApi(finalPayload);

  if (imageFile) {
    await uploadProductImageApi(created.id, imageFile);
  }

  const refreshed = await getProductById(created.id);
  return mapProductOutToSimpleProduct(refreshed);
}

export async function updateProductPrice(
  id: number,
  price: number | string
): Promise<SetPriceResponse> {
  const response = await setProductPrice(id, {
    harga_jual: price,
  });
  return response;
}

export { 
  getBackendCategories, 
  createBackendCategory, 
  updateBackendCategory, 
  deleteBackendCategory,
  uploadProductImages,
  setPrimaryProductImage,
  deleteProductImage,
  getProductPricing,
  invalidateProductsCache,
  invalidateProductByIdCache,
} from '../api/product';
