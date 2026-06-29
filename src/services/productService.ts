// src/services/productService.ts

import {
  formatRupiah as formatRupiahRaw,
  getLowestPrice as getLowestPriceRaw,
  getProductBySlug as getProductBySlugRaw,
  getCategories as getCategoriesRaw,
  getProductReviews as getProductReviewsRaw,
  getAllProducts as getAllProductsRaw,
  type Product,
  type ProductVariant,
  type ProductVariantOptionGroup,
  type ProductReview,
} from '@/data/products'

// Re-export types agar bisa dipakai di halaman
export type { Product, ProductVariant, ProductVariantOptionGroup, ProductReview }

export const formatRupiah = formatRupiahRaw
export const getLowestPrice = getLowestPriceRaw

// Tipe sederhana untuk HomePage
export interface SimpleProduct {
  id: string
  slug: string
  name: string
  category: string
  description: string
  image: string
  price: number
  rating: number
  soldCount: number
  featured: boolean
}

// Untuk halaman yang butuh data lengkap (variants) seperti CatalogPage
export async function getAllProductsDetailed(): Promise<Product[]> {
  return getAllProductsRaw()
}

export async function getAllProducts(): Promise<SimpleProduct[]> {
  const raw = await getAllProductsRaw()
  return raw.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    description: p.description,
    image: p.image,
    price: getLowestPriceRaw(p.variants),
    rating: p.rating,
    soldCount: p.soldCount,
    featured: p.isFeatured,
  }))
}

export async function getProductBySlug(slug: string) {
  return getProductBySlugRaw(slug)
}

export async function getCategories() {
  return getCategoriesRaw()
}

export async function getProductReviews(limit?: number) {
  return getProductReviewsRaw(limit)
}