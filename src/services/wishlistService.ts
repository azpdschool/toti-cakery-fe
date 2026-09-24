import { getBuyerWishlistApi, addToWishlistApi, removeFromWishlistApi } from '@/api/wishlist';
import { mapProductOutToProduct, type Product } from './productService';

export async function getBuyerWishlist(): Promise<Product[]> {
  const products = await getBuyerWishlistApi();
  return products.map(mapProductOutToProduct);
}

export async function addToWishlist(productId: number): Promise<void> {
  await addToWishlistApi(productId);
}

export async function removeFromWishlist(productId: number): Promise<void> {
  await removeFromWishlistApi(productId);
}
