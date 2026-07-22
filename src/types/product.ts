// src/types/product.ts

export interface ProductVariantOptionGroup {
  key: string;
  label: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  options: Record<string, string>;
  minOrder: number;
  step: number;
}

export interface ProductReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  purchasedProductName: string;
  productId?: string;
  productName?: string;
}

export interface Product {
  /**
   * ID tetap string untuk kompatibilitas UI/cart lama.
   * backendId menyimpan ID numerik dari FastAPI.
   */
  id: string;
  backendId: number;

  slug: string;
  name: string;
  category: string;
  description: string;

  /**
   * URL final yang siap dipakai <img src={product.image} />
   * Contoh hasil di FE:
   * "http://localhost:8000/static/products/12.jpg?v=..."
   */
  image: string;

  /**
   * Path asli dari backend.
   * Contoh:
   * "/static/products/12.jpg"
   *
   * Ini jangan dipakai langsung untuk <img>.
   * Pakai image.
   */
  imageUrlRaw: string | null;

  price: number;
  hppTotal: number;
  markupPercentage: number | null;

  rating: number;
  reviewCount: number;
  soldCount: number;

  isFeatured: boolean;
  featured: boolean;

  isActive: boolean;
  isAvailable: boolean;

  rasa: string | null;
  ukuranAtauIsi: string | null;
  parentCategory: string | null;

  optionGroups: ProductVariantOptionGroup[];
  variants: ProductVariant[];
  reviews: ProductReview[];

  createdAt: string | null;
  updatedAt: string | null;
}

export interface SimpleProduct {
  id: string;
  backendId: number;

  slug: string;
  name: string;
  category: string;
  description: string;

  /**
   * URL final yang siap dipakai <img src={product.image} />
   */
  image: string;

  /**
   * Path asli dari backend.
   * Contoh:
   * "/static/products/12.jpg"
   */
  imageUrlRaw: string | null;

  price: number;
  hppTotal: number;
  markupPercentage: number | null;

  rating: number;
  reviewCount: number;
  soldCount: number;

  featured: boolean;
  isFeatured: boolean;

  isActive: boolean;
  isAvailable: boolean;

  rasa: string | null;
  ukuranAtauIsi: string | null;
  parentCategory: string | null;

  stock: number;
  status: 'active' | 'inactive';

  createdAt: string | null;
  updatedAt: string | null;
}

export interface CategorySummary {
  category: string;
  count: number;
}
